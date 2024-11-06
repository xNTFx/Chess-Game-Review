import { PrimitiveAtom, atom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { Color } from "../../types/enums";
import { CurrentPosition } from "../../types/eval";
import { getEvaluationBarValue } from "../../utils/chessUtils";

interface Props {
  boardOrientation?: Color;
  currentPositionAtom?: PrimitiveAtom<CurrentPosition>;
}

export default function EvaluationBar({
  boardOrientation,
  currentPositionAtom = atom({}),
}: Props) {
  const [barState, setBarState] = useState({
    whiteBarPercentage: 50,
    label: "0.0",
  });
  const boardPosition = useAtomValue(currentPositionAtom);

  useEffect(() => {
    const topLine = boardPosition?.eval?.lines[0];
    if (!boardPosition.eval || !topLine || topLine.depth < 6) return;

    const barEval = getEvaluationBarValue(boardPosition.eval);
    setBarState(barEval);
  }, [boardPosition.lastMove?.before, boardPosition.eval]);

  return (
    <div className="flex h-full w-[5vw] flex-col items-center justify-center rounded-md border-2 border-black sm:w-8">
      <div
        className="w-full rounded-t-sm transition-all duration-1000"
        style={{
          backgroundColor:
            boardOrientation === Color.White ? "#424242" : "white",
          height: `${
            boardOrientation === Color.White
              ? 100 - barState.whiteBarPercentage
              : barState.whiteBarPercentage
          }%`,
        }}
      >
        <p
          className={`w-full text-center text-[2vw] sm:text-sm ${
            boardOrientation === Color.White ? "text-white" : "text-black"
          }`}
        >
          {(barState.whiteBarPercentage < 50 &&
            boardOrientation === Color.White) ||
          (barState.whiteBarPercentage >= 50 &&
            boardOrientation === Color.Black)
            ? barState.label
            : ""}
        </p>
      </div>

      <div
        className="flex w-full items-end rounded-b-sm transition-all duration-1000"
        style={{
          backgroundColor:
            boardOrientation === Color.White ? "white" : "#424242",
          height: `${
            boardOrientation === Color.White
              ? barState.whiteBarPercentage
              : 100 - barState.whiteBarPercentage
          }%`,
        }}
      >
        <p
          className={`w-full text-center text-[2vw] sm:text-sm ${
            boardOrientation === Color.White ? "text-black" : "text-white"
          }`}
        >
          {(barState.whiteBarPercentage >= 50 &&
            boardOrientation === Color.White) ||
          (barState.whiteBarPercentage < 50 && boardOrientation === Color.Black)
            ? barState.label
            : ""}
        </p>
      </div>
    </div>
  );
}
