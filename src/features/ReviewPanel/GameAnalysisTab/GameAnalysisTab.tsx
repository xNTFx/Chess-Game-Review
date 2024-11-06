import { useAtomValue } from "jotai";
import {
  boardAtom,
  engineMultiPvAtom,
  gameAtom,
  gameEvalAtom,
} from "../../../stores/states";
import LineEvaluation from "./components/LineEvaluation";
import { CurrentPosition, LineEval } from "../../../types/eval";
import AccuraciesInfo from "./components/AccuraciesInfo";
import MoveInfo from "./components/MoveInfo";
import OpeningInfo from "./components/OpeningInfo";
import { Chess } from "chess.js";

function getGameOutcome(game: Chess) {
  const result = game.header()["Result"];
  const termination = game.header()["Termination"];

  if (result === "1-0") {
    return "Game ended by checkmate - White wins";
  } else if (result === "0-1") {
    return "Game ended by checkmate - Black wins";
  } else if (result === "1/2-1/2") {
    return "Game ended in a draw";
  } else if (termination === "Resignation") {
    return result === "1-0"
      ? "Game ended by resignation - White wins"
      : "Game ended by resignation - Black wins";
  } else if (termination) {
    return termination;
  }
  return "Game is over";
}

interface Props {
  position: CurrentPosition;
}

export default function GameAnalysisTab({ position }: Props) {
  const linesNumber = useAtomValue(engineMultiPvAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const boardHistory = board.history();
  const gameHistory = game.history();
  const gameEvaluations = useAtomValue(gameEvalAtom);

  const isGameOver =
    boardHistory.length > 0 &&
    (board.isCheckmate() ||
      board.isDraw() ||
      boardHistory.join() === gameHistory.join());

  const linesSkeleton: LineEval[] = Array.from({ length: linesNumber }).map(
    (_, i) => ({ pv: [`${i}`], depth: 0, multiPv: i + 1 })
  );

  const engineLines = position?.eval?.lines?.length
    ? position.eval.lines
    : linesSkeleton;

  const gameResult = isGameOver ? getGameOutcome(game) : "Game in progress";

  return (
    <div className="flex flex-col items-start justify-center w-full gap-2">
      {isGameOver && (
        <div className="w-full">
          <p className="text-center text-sm text-red-500 font-bold">
            {gameResult}
          </p>
        </div>
      )}

      <AccuraciesInfo />
      <MoveInfo />
      <OpeningInfo />
      {!board.isCheckmate() ? (
        <div className="flex justify-center items-center w-full">
          <ul className="max-w-[95%] p-0">
            {gameEvaluations &&
              engineLines.map((line) => (
                <LineEvaluation key={line.multiPv} line={line} />
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
