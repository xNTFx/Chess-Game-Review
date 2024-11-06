import { useAtomValue } from "jotai";
import { useState } from "react";

import { evaluationProgressAtom } from "../../../stores/states";
import LoadGame from "../../LoadGame/LoadGame";
import GamePanel from "./components/GamePanel";
import LinearProgressBar from "./components/LinearProgressBar";
import useAnalyze from "./hooks/useAnalyze";

export default function PanelHeader() {
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const [openDialog, setOpenDialog] = useState(false);
  const { canAnalyze, handleAnalyzeClick, evalResult } = useAnalyze();

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-center space-x-2">
        <h1 className="text-center text-xl">
          <b>Game Review</b>
        </h1>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-2 p-2">
        <div>
          <GamePanel />
        </div>
        <div className="flex flex-row justify-center gap-5">
          <button
            onClick={() => setOpenDialog(true)}
            className="w-32 rounded bg-blue-500 p-1 font-bold text-white hover:bg-blue-600"
          >
            Load game
          </button>
          <LoadGame openDialog={openDialog} setOpenDialog={setOpenDialog} />
          <button
            className={`flex w-32 flex-row items-center justify-center gap-1 rounded bg-blue-500 p-1 font-bold text-white hover:bg-blue-600 ${!canAnalyze ? "cursor-not-allowed opacity-50" : "hover:bg-blue-600"}`}
            onClick={handleAnalyzeClick}
            disabled={!canAnalyze}
          >
            <span>{evalResult ? "Analyze again" : "Analyze"}</span>
          </button>
        </div>
        <LinearProgressBar
          value={evaluationProgress}
          label="Evaluating positions..."
        />
      </div>
    </div>
  );
}
