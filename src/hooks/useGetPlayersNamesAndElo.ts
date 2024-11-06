import { Chess } from "chess.js";
import { PrimitiveAtom, useAtomValue } from "jotai";

export const useGetPlayersNamesAndElo = (gameAtom: PrimitiveAtom<Chess>) => {
  const game = useAtomValue(gameAtom);

  const whiteName = game.header()["White"] || "White Player";
  const blackName = game.header()["Black"] || "Black Player";

  const whiteElo = game.header()["WhiteElo"] || undefined;

  const blackElo = game.header()["BlackElo"] || undefined;

  return {
    whiteName,
    blackName,
    whiteElo,
    blackElo,
  };
};
