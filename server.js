const { log } = require("console");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Chess = require("chess.js").Chess;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const games = {};
const players = {};
const playerAgreedToReset = {};
const playerAgreedToFlip = {};

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // Handle joining a room
  socket.on("joinRoom", ({ roomId, username }) => {
    socket.join(roomId);

    
    socket.username = username;

    
    if (!games[roomId]) {
      games[roomId] = new Chess();
      players[roomId] = { white: null, black: null };
      playerAgreedToReset[roomId] = { white: false, black: false };
      playerAgreedToFlip[roomId] = { white: false, black: false };
    }

    // Assign role (White or Black) to the player
    const roomPlayers = players[roomId];
    let role;
    if (!roomPlayers.white) {
      roomPlayers.white = { id: socket.id, username };
      role = "white";
    } else if (!roomPlayers.black) {
      roomPlayers.black = { id: socket.id, username };
      role = "black";
    } else {
      
      if (!roomPlayers.spectators) {
        roomPlayers.spectators = {}; 
      }
      roomPlayers.spectators[socket.id] = { username };
      role = "spectator"; 
    }

    socket.emit("role", role);
    console.log(
      `Player ${username} with ${socket.id} joined room ${roomId} as ${role}`
    );

    // Broadcast updated player information to all clients in the room
    io.to(roomId).emit("updatePlayers", {
      white: players[roomId].white,
      black: players[roomId].black,
    });

    // Send the current game state
    io.to(roomId).emit("gameState", games[roomId].fen());
  });

  // Handle makeMove event
  socket.on("makeMove", ({ roomId, move }) => {
    const game = games[roomId];
    if (!game) {
      socket.emit("error", "Game not found.");
      return;
    }

    const result = game.move({ from: move.from, to: move.to, promotion: "q" }); 
    if (result) {
      
      io.to(roomId).emit("gameState", game.fen());

      
      io.to(roomId).emit(
        "gameActionAlert",
        `Player moved ${move.from} to ${move.to}`
      );
    } else {
      socket.emit("error", "Invalid move.");
    }
  });

  socket.on("playerCheck", ({ roomId, playerInCheck }) => {
    // Notify the specific player in check
    io.to(roomId).emit("inCheckAlert", {
      playerInCheck,
      message: `${playerInCheck} King is in check.`,
    });
  });

  // Handle flip board request
  socket.on("flipBoardRequest", (roomId) => {
    console.log(
      `Flip board request received for room ${roomId} from player ${socket.id}`
    );
    if (!players[roomId]) {
      socket.emit("error", "Invalid room ID.");
      return;
    }

    const roomPlayers = players[roomId];
    console.log("Room players:", roomPlayers);

    if (!roomPlayers.white || !roomPlayers.black) {
      socket.emit("error", "Both players need to join the game first.");
      return;
    }

    const requestingPlayer =
      socket.id === roomPlayers.white.id
        ? "white"
        : socket.id === roomPlayers.black.id
        ? "black"
        : null;

    console.log("Requesting player:", requestingPlayer);

    if (!requestingPlayer) {
      socket.emit(
        "error",
        "Only active players can request to flip the board."
      );
      return;
    }

    // Notify the other player about the flip request
    const opponent =
      requestingPlayer === "white"
        ? roomPlayers.black.id
        : roomPlayers.white.id;

    console.log("Flip request sent by:", opponent);

    // Track the flip request
    if (!playerAgreedToFlip[roomId]) {
      playerAgreedToFlip[roomId] = { white: false, black: false };
    }

    // Mark the requesting player as agreed
    playerAgreedToFlip[roomId][requestingPlayer] = true;

    io.to(opponent).emit("flipBoardRequest"); // Notify the opponent
  });

  socket.on("flipBoardConfirm", (roomId) => {
    if (!players[roomId]) {
      socket.emit("error", "Invalid room ID.");
      return;
    }

    const roomPlayers = players[roomId];

    if (!roomPlayers.white || !roomPlayers.black) {
      socket.emit("error", "Both players need to join the game first.");
      return;
    }

    const confirmingPlayer =
      socket.id === roomPlayers.white.id
        ? "white"
        : socket.id === roomPlayers.black.id
        ? "black"
        : null;

    if (!confirmingPlayer) {
      socket.emit("error", "Only active players can confirm the board flip.");
      return;
    }

    // Mark the confirming player as agreed
    playerAgreedToFlip[roomId][confirmingPlayer] = true;

    // Check if both players agree
    if (playerAgreedToFlip[roomId].white && playerAgreedToFlip[roomId].black) {
      
      const tempWhite = roomPlayers.white;
      roomPlayers.white = roomPlayers.black;
      roomPlayers.black = tempWhite;

      games[roomId] = new Chess(); // Reset the game after switching sides

      
      playerAgreedToFlip[roomId] = { white: false, black: false };

      // Notify players of their new roles and update the board
      io.to(roomPlayers.white.id).emit("role", "white");
      io.to(roomPlayers.black.id).emit("role", "black");
      io.to(roomId).emit("gameState", games[roomId].fen());
      io.to(roomId).emit(
        "gameActionAlert",
        "The board has been flipped and roles have been switched."
      );
    }
  });

  // Handle reset game button
  socket.on("resetGameRequest", (roomId) => {
    socket.to(roomId).emit("resetGameRequest"); 
  });

  // Handle restart game confirmation
  socket.on("resetGameConfirm", (roomId) => {
    
    if (games[roomId]) {
      games[roomId] = new Chess();
    }
    io.to(roomId).emit("resetGameConfirmed"); 
  });

  // Handle restart game decline
  socket.on("resetGameDecline", (roomId) => {
    socket.to(roomId).emit("resetGameDeclined");
  });


  // Handle chat message from clients
  socket.on("chatMessage", ({ roomId, message }) => {
    const roomPlayers = players[roomId];
    let playerName = "Spectator";

    if (socket.id === roomPlayers.white?.id) {
      playerName = roomPlayers.white.username || "White";
    } else if (socket.id === roomPlayers.black?.id) {
      playerName = roomPlayers.black.username || "Black";
    } else if (roomPlayers.spectators && roomPlayers.spectators[socket.id]) {
      playerName = roomPlayers.spectators[socket.id].username || "Spectator";
    }
    // Emit the chat message to everyone in the room (including spectators)
    io.to(roomId).emit("chatMessage", { message, playerName });
  });

  socket.on("gameOver", ({ winner, roomId }) => {
    const roomPlayers = players[roomId];
    if (!roomPlayers || !roomPlayers.white || !roomPlayers.black) {
      return; 
    }

    const winnerRole =
      roomPlayers.white.username === winner ? "white" : "black";
    const loserRole = winnerRole === "white" ? "black" : "white";

    const winnerSocketId = roomPlayers[winnerRole].id;
    const loserSocketId = roomPlayers[loserRole].id;

    // Notify the winner
    io.to(winnerSocketId).emit("gameOverMessage", "You win!");

    // Notify the loser
    io.to(loserSocketId).emit("gameOverMessage", `${winner} wins the game!`);
  });

  socket.on("kingInCheck", ({ roomId, player }) => {
    // Broadcast to both players in the room
    io.to(roomId).emit("kingInCheckAlert", `${player}'s King is in Check!`);
  });

  socket.on("disconnect", () => {
    console.log("A player disconnected:", socket.id);

    // Remove the player from any room they were in
    for (const roomId in players) {
      const room = players[roomId];

      if (room.white && room.white.id === socket.id) {
        // Notify the opponent
        io.to(roomId).emit("chatMessage", {
          message: `${room.white.username} (white) has disconnected.`,
          playerName: "System",
        });
        room.white = null;
      } else if (room.black && room.black.id === socket.id) {
        io.to(roomId).emit("chatMessage", {
          message: `${room.black.username} (black) has disconnected.`,
          playerName: "System",
        });
        room.black = null;
      } else if (room.spectators && room.spectators[socket.id]) {
        const spectatorName = room.spectators[socket.id].username;
        io.to(roomId).emit("chatMessage", {
          message: `${spectatorName} (spectator) has disconnected.`,
          playerName: "System",
        });
        delete room.spectators[socket.id];
      }

      // If the room is empty, delete it
      if (
        !room.white &&
        !room.black &&
        (!room.spectators || Object.keys(room.spectators).length === 0)
      ) {
        delete players[roomId];
        console.log(`Room ${roomId} deleted as it is now empty.`);
      }

      break;
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
