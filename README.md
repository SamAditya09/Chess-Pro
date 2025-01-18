# Multiplayer Chess Application

This project is a real-time multiplayer chess application built with Node.js, Express, Socket.IO, and Chess.js. It allows players to join rooms, play chess, chat, and spectate games. The application supports various features, including role assignment, game state management, and player notifications.

## Features

1. **Real-Time Multiplayer**
   - Players can join rooms and play against each other.
   - Spectators can watch games in progress.

2. **Drag-and-Drop Chessboard**
   - Chessboard interactions are intuitive and visually appealing.

3. **Game Rules Enforcement**
   - Legal moves are validated using the Chess.js library.
   - Players are notified when a king is in check or the game is over.

4. **Dynamic Role Assignment**
   - The first two players to join a room are assigned roles as White and Black.
   - Additional players join as spectators.

5. **Game Controls**
   - Players can request to reset or flip the board with mutual agreement.
   - The game can restart with a new state when both players agree.

6. **In-Game Chat**
   - Players and spectators can communicate via chat, with roles and usernames displayed.

7. **Game Notifications**
   - Alerts for moves, checks, and disconnections keep players informed.

8. **Responsive Design**
   - The UI dynamically updates to reflect the game state and player actions.

---

## Project Structure

### Server-Side

- **Technologies Used**:
  - `Node.js`
  - `Express`
  - `Socket.IO`
  - `Chess.js`

- **File**: `server.js`
  - Handles room creation and management.
  - Manages game state using the `Chess.js` library.
  - Broadcasts updates to clients in real-time.
  - Handles chat messages and player disconnections.

### Client-Side

- **Technologies Used**:
  - `HTML`, `CSS`, `JavaScript`
  - `React Chessboard` (for chessboard rendering and interactions)

- **Features**:
  - Intuitive drag-and-drop interface for moving pieces.
  - Visual indicators for possible moves, last move, and check status.
  - Player usernames and roles displayed on the board.
  - Responsive chat interface.

---

## Usage

1. **Join a Room**:
   - Enter a room ID and username to join or create a room.

2. **Play Chess**:
   - Players assigned the roles of White and Black can move pieces.
   - Moves are validated in real time.

3. **Spectate**:
   - Additional users can join as spectators to watch the game.

4. **Chat**:
   - Use the chat interface to communicate with other players and spectators.

5. **Game Actions**:
   - Request to reset the game or flip the board using the controls.

---

## Future Enhancements

- **Spectator Management**:
  - Display a list of active spectators.
- **Game Persistence**:
  - Save game states to a database for resumption.
- **Reconnection Support**:
  - Allow players to reconnect to ongoing games.
- **Player Ratings**:
  - Implement an Elo rating system.
- **Game History**:
  - Show move history for completed games.

---
