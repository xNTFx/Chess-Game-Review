import { Chess } from "chess.js";
import { PrimitiveAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { Color } from "../../types/enums";
import {
  getCapturedPieces,
  getMaterialDifference,
} from "../../utils/chessUtils";
import Bishop from "/icons/B.svg";
import King from "/icons/K.svg";
import Knight from "/icons/N.svg";
import Pawn from "/icons/P.svg";
import Queen from "/icons/Q.svg";
import Rook from "/icons/R.svg";

export interface Props {
  gameAtom: PrimitiveAtom<Chess>;
  color: Color;
}

const pieceConfig: Record<string, string> = {
  P: Pawn,
  B: Bishop,
  N: Knight,
  R: Rook,
  Q: Queen,
  K: King,
};

const pieceColorFilter = {
  [Color.Black]: "brightness(0) saturate(100%)",
  [Color.White]: "none",
};

const pieceOrder: Array<keyof typeof pieceLimits> = ["Q", "R", "B", "N", "P"];

const pieceLimits: Record<string, number> = {
  Q: 1,
  R: 2,
  B: 2,
  N: 2,
  P: 8,
};

export default function CapturedPieces({ gameAtom, color }: Props) {
  const chessGame = useAtomValue(gameAtom);

  const capturedPieces = useMemo(() => {
    const pieces = getCapturedPieces(chessGame.fen(), color);
    if (color === Color.White) {
      return {
        Q: pieces["q"] || 0,
        R: pieces["r"] || 0,
        B: pieces["b"] || 0,
        N: pieces["n"] || 0,
        P: pieces["p"] || 0,
      };
    } else {
      return {
        Q: pieces["Q"] || 0,
        R: pieces["R"] || 0,
        B: pieces["B"] || 0,
        N: pieces["N"] || 0,
        P: pieces["P"] || 0,
      };
    }
  }, [chessGame, color]);

  const materialDifference = useMemo(() => {
    const difference = getMaterialDifference(chessGame.fen());
    return color === Color.White ? difference : -difference;
  }, [chessGame, color]);

  return (
    <div className="flex h-[1.5rem] items-end bg-slate-700">
      {pieceOrder.map((piece) => {
        let capturedCount = Math.max(
          capturedPieces[piece as keyof typeof capturedPieces] || 0,
          0,
        );
        const SvgIcon = pieceConfig[piece];
        if (!SvgIcon || capturedCount === 0) return null;

        capturedCount = Math.min(capturedCount, pieceLimits[piece]);

        return (
          <div key={piece} className="flex select-none">
            {[...Array(capturedCount)].map((_, i) => (
              <img
                key={i}
                src={SvgIcon}
                alt={piece}
                className="h-6 min-h-6 w-6 min-w-6"
                style={{
                  filter: pieceColorFilter[color],
                  objectFit: "contain",
                  marginLeft: i === 0 ? "0" : "-0.7rem",
                }}
              />
            ))}
          </div>
        );
      })}

      {materialDifference > 0 && <span>+{materialDifference}</span>}
    </div>
  );
}
