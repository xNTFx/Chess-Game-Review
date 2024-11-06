import { Chess } from "chess.js";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

import { useLocalStorage } from "../../hooks/useLocalStorage";
import useResetAndLoadGamePgn from "../../hooks/useResetAndLoadGamePgn";
import { evaluationProgressAtom } from "../../stores/states";
import { GameOrigin } from "../../types/enums";
import { getGameFromPgn } from "../../utils/chessUtils";
import ChessPlatformInput from "./components/ChessPlatformInput";
import GamePgnInput from "./components/GamePgnInput";

interface Props {
  openDialog: boolean;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function LoadGame({ openDialog, setOpenDialog }: Props) {
  const [pgn, setPgn] = useState("");
  const [gameOrigin, setGameOrigin] = useLocalStorage(
    "preferred-game-origin",
    GameOrigin.Pgn,
  );
  const [parsingError, setParsingError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useLocalStorage(`${gameOrigin}-username`, "");
  const evaluationInProgress = useAtomValue(evaluationProgressAtom);

  const resetAndLoadGamePgn = useResetAndLoadGamePgn();

  const handleAddGame = () => {
    if (!pgn) return;
    setParsingError("");

    try {
      const gameToAdd = getGameFromPgn(pgn);
      resetAndLoadGamePgn(gameToAdd.pgn());
      setOpenDialog(false);
    } catch (error) {
      console.error(error);
      setParsingError(
        error instanceof Error
          ? `${error.message} !`
          : "Unknown error while parsing PGN !",
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setOpenDialog(false);
      }
    };

    if (openDialog) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDialog, setOpenDialog]);

  if (evaluationInProgress) return null;

  return (
    <div>
      {openDialog && (
        <div className="pver fixed inset-0 z-50 flex w-screen items-center justify-center bg-gray-900 bg-opacity-75">
          <div>
            <div
              ref={dialogRef}
              className="sticky top-0 z-50 flex h-screen w-screen flex-col rounded-lg bg-slate-900 p-6 py-1 xl:w-[80rem]"
            >
              <div className="sticky top-0 z-50 flex w-full justify-end bg-slate-900">
                <button
                  onClick={() => setOpenDialog(false)}
                  className="size-8 rounded-lg p-1 text-center font-bold hover:bg-gray-400"
                >
                  X
                </button>
              </div>

              <div className="sticky top-12 z-50 bg-slate-900">
                <h2 className="mb-4 text-2xl">Load a game</h2>
                <div className="mb-4 flex w-40 flex-col">
                  <label htmlFor="game-origin-select" className="mb-2 text-sm">
                    Game origin
                  </label>
                  <select
                    id="game-origin-select"
                    name="game-origin"
                    autoComplete="organization"
                    value={gameOrigin ?? ""}
                    onChange={(e) =>
                      setGameOrigin(e.target.value as GameOrigin)
                    }
                    className="cursor-pointer rounded-lg border-2 border-gray-300 bg-black p-2 text-white"
                  >
                    {Object.values(GameOrigin).map((origin) => (
                      <option key={origin} value={origin}>
                        {gameOriginLabel[origin]}
                      </option>
                    ))}
                  </select>
                </div>
                {gameOrigin !== GameOrigin.Pgn ? (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">
                      Enter your{" "}
                      {gameOrigin === GameOrigin.ChessCom
                        ? "Chess.com"
                        : "Lichess"}{" "}
                      username...
                      <input
                        type="text"
                        id="username"
                        name="username"
                        autoComplete="username"
                        value={username ?? ""}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-black shadow-sm focus:ring focus:ring-blue-200"
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="grid flex-grow gap-4 overflow-y-auto">
                {gameOrigin === GameOrigin.Pgn && (
                  <GamePgnInput pgn={pgn} setPgn={setPgn} />
                )}
                {(gameOrigin === GameOrigin.ChessCom ||
                  gameOrigin === GameOrigin.Lichess) && (
                  <ChessPlatformInput
                    pgn={pgn}
                    setPgn={setPgn}
                    setGame={(game: Chess) => resetAndLoadGamePgn(game.pgn())}
                    setParsingError={setParsingError}
                    onClose={() => setOpenDialog(false)}
                    gameOrigin={gameOrigin}
                    username={username}
                  />
                )}
                {parsingError && (
                  <p className="mt-4 text-center text-red-600">
                    {parsingError}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 flex justify-end bg-slate-900 p-2 py-4">
                <button
                  onClick={() => setOpenDialog(false)}
                  className="mr-2 rounded bg-gray-500 px-4 py-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
                {gameOrigin !== GameOrigin.ChessCom &&
                gameOrigin !== GameOrigin.Lichess ? (
                  <button
                    onClick={handleAddGame}
                    className="rounded bg-blue-500 px-4 py-2 hover:bg-blue-600"
                  >
                    Add
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const gameOriginLabel: Record<GameOrigin, string> = {
  [GameOrigin.Pgn]: "PGN",
  [GameOrigin.ChessCom]: "Chess.com",
  [GameOrigin.Lichess]: "Lichess.org",
};
