import { useAtomValue } from "jotai";

import { gameAtom } from "../../../../stores/states";

export default function GamePanel() {
  const currentGame = useAtomValue(gameAtom);
  const chessGame = useAtomValue(gameAtom);

  const isGameDataLoaded = chessGame.history().length > 0;

  if (!isGameDataLoaded) return;

  const terminationReason = currentGame.header().Termination || "?";
  const gameResult =
    terminationReason.split(" ").length > 2
      ? terminationReason
      : currentGame.header().Result || "?";

  const gameSite = currentGame.header().Site;

  return (
    <div className="grid grid-cols-1 items-center justify-center gap-1 md:grid-cols-3">
      <div className="flex items-center justify-center">
        <p className="overflow-auto whitespace-nowrap text-sm">
          Game:{" "}
          {gameSite?.startsWith("http") || gameSite?.startsWith("www.") ? (
            <a href={gameSite}>{gameSite}</a>
          ) : (
            <span>{gameSite || "?"}</span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-center">
        <p className="whitespace-nowrap text-sm">
          Date: {currentGame.header().Date || "????-??-??"}
        </p>
      </div>

      <div className="flex items-center justify-center">
        <p className="overflow-auto whitespace-nowrap text-sm">
          Result: {gameResult}
        </p>
      </div>
    </div>
  );
}
