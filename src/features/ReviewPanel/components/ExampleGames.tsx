import { exampleGames } from "../../../data/exampleGames";
import useResetAndLoadGamePgn from "../../../hooks/useResetAndLoadGamePgn";

export default function ExampleGames() {
  const resetAndLoadGamePgn = useResetAndLoadGamePgn();

  return (
    <div className="flex flex-col gap-4">
      {exampleGames.map((game, index) => {
        return (
          <div
            key={index}
            className="flex flex-col items-center justify-center gap-1"
          >
            <p>
              <b>{game.title}</b>
            </p>
            <button
              onClick={() => resetAndLoadGamePgn(game.pgn)}
              className="rounded-lg bg-blue-500 p-1 font-bold hover:bg-blue-600"
            >
              Load Game
            </button>
          </div>
        );
      })}
    </div>
  );
}
