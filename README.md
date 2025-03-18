# Chess Game Review

## Tech Stack

- **React**
- **Typescript**
- **Tailwind**
- **Vite**

## Link to Website

[https://www.chessgamereview.pawelsobon.pl/](https://www.chessgamereview.pawelsobon.pl/)

## Example Image

![cgr](https://github.com/user-attachments/assets/89ddd3ea-4092-4cd4-a363-a5e05a075a49)

## Features

- Uses the **Stockfish Chess Engine** for move analysis and game evaluation.
- Real-time evaluation bar showing the advantage for either side throughout the game.
- Move classification, such as **Brilliant**, **Great**, **Blunder**, etc., to provide detailed feedback on each move.
- Player accuracy calculation to show how well each side played compared to optimal moves.
- Line evaluations to explore alternative sequences for moves, helping understand the reasoning behind certain choices.
- Graphical evaluation chart that visualizes the evaluation changes across the entire game.
- Ability to upload games from **`Chess.com`**, **`Lichess`**, or **`PGN`** files.

## Installation

To install and run the project locally, follow these steps:

1. Install Node.js: [Download here](https://nodejs.org/en/download)
2. Clone the repository: `git clone https://github.com/xNTFx/Chess-Game-Review.git`
3. Navigate to the directory: `cd Chess-Game-Review`
4. Install frontend dependencies: `npm install`
5. Start the frontend development server: `npm run dev`

## Running with Docker

To run the project using Docker, follow these steps:

### Prerequisite

- Install **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop) (required for Windows & macOS users)
- Ensure that Docker is running before proceeding.

### Steps:

1. **Build the Docker image:**

   ```sh
   docker build -t chess-game-review .
   ```

2. **Run the Docker container:**

   ```sh
   docker run -d -p 3000:80 --name chess-game-review chess-game-review
   ```

3. **Access the application:**
   Open a browser and go to: [http://localhost:3000](http://localhost:3000)
