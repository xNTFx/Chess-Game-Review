import { Chess } from "chess.js";
import { useAtomValue } from "jotai";

import { boardAtom, gameAtom } from "../../stores/states";

enum Color {
  White = "w",
  Black = "b",
}

interface FenWithTime {
  fen: string;
  comment: string;
}

interface ClockProps {
  boardOrientation: Color;
}

export default function Clock({ boardOrientation }: ClockProps) {
  const game = useAtomValue(gameAtom);
  const currentBoardPosition = useAtomValue(boardAtom);

  let currentBoardPositionFen: string;
  let allFenWithTimeArray: FenWithTime[];

  if (Array.isArray(currentBoardPosition)) {
    const chess = new Chess();
    chess.load(currentBoardPosition.toString());
    currentBoardPositionFen = chess.fen();
    allFenWithTimeArray = [];
  } else {
    currentBoardPositionFen = currentBoardPosition.fen();
    allFenWithTimeArray = game.getComments();
  }

  if (allFenWithTimeArray.length === 0) {
    return null;
  }

  const startTime = extractClockTime(allFenWithTimeArray[0].comment);

  function ReturnTimesBasedOnFen(
    allFenWithTimeArray: FenWithTime[],
    currentBoardPositionFen: string,
    currentBoardPosition: Chess,
    startTime: string | null,
  ) {
    const foundFen = allFenWithTimeArray.find(
      (allFenWithTime) => allFenWithTime.fen === currentBoardPositionFen,
    );

    if (!foundFen) {
      if (!startTime) return [null, null];
      return [startTime, startTime];
    }

    const index = allFenWithTimeArray.indexOf(foundFen);
    const nextPlayerTurn = currentBoardPosition.turn();

    const whiteTime =
      nextPlayerTurn === "b"
        ? extractClockTime(allFenWithTimeArray[index].comment)
        : index > 0
          ? extractClockTime(allFenWithTimeArray[index - 1].comment)
          : startTime;

    const blackTime =
      nextPlayerTurn === "w"
        ? extractClockTime(allFenWithTimeArray[index].comment)
        : index > 0
          ? extractClockTime(allFenWithTimeArray[index - 1].comment)
          : null;

    return [whiteTime, blackTime];
  }

  function extractClockTime(clockString: string | null) {
    if (!clockString) return null;

    const regex = /\[%clk (\d{1,2}:\d{2}:\d{2})([.:]\d{1,3})?\]/;
    const match = clockString.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  }

  function convertTimeFormat(
    startTime: string | null,
    timeToConvert: string | null,
  ) {
    if (!startTime || !timeToConvert) return null;
    if (startTime.startsWith("0:")) {
      if (timeToConvert.startsWith("0:")) {
        return timeToConvert.slice(2);
      }
    }
    return timeToConvert;
  }

  const [whiteTime, blackTime] = ReturnTimesBasedOnFen(
    allFenWithTimeArray,
    currentBoardPositionFen,
    currentBoardPosition,
    startTime,
  );

  const formatedWhiteTime = convertTimeFormat(startTime, whiteTime) || null;

  const formatedBlackTime =
    convertTimeFormat(startTime, blackTime || startTime) || null;

  return (
    <>
      {formatedWhiteTime && formatedBlackTime ? (
        <div className="rounded-sm bg-gray-600 p-1 text-xl font-bold text-white">
          {boardOrientation === Color.White ? (
            <div>{formatedWhiteTime}</div>
          ) : (
            <div>{formatedBlackTime}</div>
          )}
        </div>
      ) : null}
    </>
  );
}
