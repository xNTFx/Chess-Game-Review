import { Chess } from "chess.js";
import { Atom, PrimitiveAtom, atom, useAtomValue } from "jotai";
import { useMemo } from "react";
import React from "react";
import { SquareRenderer } from "react-chessboard";

import { boardAtom } from "../../stores/states";
import { CurrentPosition } from "../../types/eval";
import { moveClassificationColors } from "../../utils/chessUtils";

export interface Props {
  currentPositionAtom: Atom<CurrentPosition>;
  clickedSquaresAtom: PrimitiveAtom<string[]>;
  playableSquaresAtom: PrimitiveAtom<string[]>;
  isShowMoveClassificationEnabledAtom?: PrimitiveAtom<boolean>;
}

function getGameOutcomeIcons(game: Chess) {
  const result = game.header()["Result"];
  if (result === "1-0") {
    return { whiteIcon: "winner.png", blackIcon: "checkmate_black.png" };
  } else if (result === "0-1") {
    return { whiteIcon: "checkmate_white.png", blackIcon: "winner.png" };
  } else if (result === "1/2-1/2") {
    return { whiteIcon: "draw_white.png", blackIcon: "draw_black.png" };
  }
  return { whiteIcon: "", blackIcon: "" };
}

function findKingPositions(game: Chess) {
  const board = game.board();
  let whiteKingSquare = "";
  let blackKingSquare = "";

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (piece && piece.type === "k") {
        if (piece.color === "w") {
          whiteKingSquare = `${String.fromCharCode(97 + colIndex)}${
            8 - rowIndex
          }`;
        } else if (piece.color === "b") {
          blackKingSquare = `${String.fromCharCode(97 + colIndex)}${
            8 - rowIndex
          }`;
        }
      }
    });
  });

  return { whiteKingSquare, blackKingSquare };
}

export function getSquareRenderer({
  currentPositionAtom,
  clickedSquaresAtom,
  playableSquaresAtom,
  isShowMoveClassificationEnabledAtom = atom(false),
}: Props): SquareRenderer {
  const squareRenderer = (({
    children,
    square,
  }: {
    children?: React.ReactNode;
    square: string;
    piece: import("react-chessboard").PieceDataType | null;
  }): React.JSX.Element => {
    const isShowMoveClassificationEnabled = useAtomValue(
      isShowMoveClassificationEnabledAtom,
    );
    const position = useAtomValue(currentPositionAtom);
    const clickedSquares = useAtomValue(clickedSquaresAtom);
    const playableSquares = useAtomValue(playableSquaresAtom);
    const game = useAtomValue(boardAtom);

    const { whiteIcon, blackIcon } = getGameOutcomeIcons(game);
    const { whiteKingSquare, blackKingSquare } = findKingPositions(game);

    const fromSquare = position.lastMove?.from;
    const toSquare = position.lastMove?.to;
    const moveClassification = position?.eval?.moveClassification;

    const highlightClass = useMemo(() => {
      return clickedSquares.includes(square)
        ? "absolute inset-0 bg-red-500"
        : "absolute inset-0";
    }, [clickedSquares, square]);

    const hexToRgba = (hex: string, opacity: number) => {
      if (!hex || !/^#([0-9A-Fa-f]{3}){1,2}$/.test(hex)) {
        return "rgba(0, 0, 0, 0)";
      }
      const normalizedHex =
        hex.length === 4
          ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
          : hex;

      const [r, g, b] = normalizedHex
        .match(/\w\w/g)!
        .map((x) => parseInt(x, 16));
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const iconSrc = useMemo(() => {
      if (game.isGameOver()) {
        if (square === whiteKingSquare) {
          return whiteIcon;
        } else if (square === blackKingSquare) {
          return blackIcon;
        }
      }
      return "";
    }, [game, square, whiteKingSquare, blackKingSquare, whiteIcon, blackIcon]);

    const getHighlightStyle = useMemo(() => {
      if (iconSrc || clickedSquares.includes(square)) return {};
      if (fromSquare === square || toSquare === square) {
        if (moveClassification && isShowMoveClassificationEnabled) {
          return {
            backgroundColor: hexToRgba(
              moveClassificationColors[moveClassification],
              0.3,
            ),
          };
        } else {
          return { backgroundColor: "rgba(255, 255, 0, 0.5)" };
        }
      }
      return {};
    }, [
      iconSrc,
      square,
      moveClassification,
      fromSquare,
      toSquare,
      clickedSquares,
      isShowMoveClassificationEnabled,
    ]);

    const playableClass = playableSquares.includes(square)
      ? "flex items-center justify-center absolute inset-0 bg-green-400 opacity-30 rounded-full w-[25%] h-[25%] m-auto"
      : "";

    return (
      <div className={`relative ${highlightClass}`} style={getHighlightStyle}>
        {children}
        {playableClass && <div className={playableClass} />}
        {iconSrc && (
          <img
            src={`/icons/${iconSrc}`}
            alt="king-icon"
            className="absolute top-[-2vw] right-[-2vw] z-10 w-[5vw] sm:top-[-12px] sm:right-[-12px] sm:w-[30px] lg:w-[30px] xl:w-[40px]"
          />
        )}
        {moveClassification &&
          isShowMoveClassificationEnabled &&
          square === toSquare && (
            <img
              src={`/icons/${moveClassification}.png`}
              alt="move-icon"
              className="absolute top-[-2vw] right-[-2vw] z-10 w-[5vw] sm:top-[-12px] sm:right-[-12px] sm:w-[30px] lg:w-[30px] xl:w-[40px]"
            />
          )}
      </div>
    );
  }) as SquareRenderer;

  return squareRenderer;
}
