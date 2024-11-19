import { useAtom, useAtomValue } from "jotai";

import { useEvaluateCurrentPosition } from "../../hooks/useEvaluateCurrentPosition";
import {
  currentTabAtom,
  engineNameAtom,
  gameEvalAtom,
} from "../../stores/states";
import PanelToolBar from "../PanelToolBar/PanelToolBar";
import GameAnalysisTab from "./GameAnalysisTab/GameAnalysisTab";
import ClassificationCount from "./GameAnalysisTab/components/ClassificationCount";
import Graph from "./GameAnalysisTab/components/Graph";
import MovesTab from "./MovesTab/MovesTab";
import PanelHeader from "./PanelHeader/PanelHeader";
import ExampleGames from "./components/ExampleGames";

interface Props {
  isGameDataLoaded: boolean;
}

export default function ReviewPanel({ isGameDataLoaded }: Props) {
  const [currentTab, setCurrentTab] = useAtom(currentTabAtom);
  const engineName = useAtomValue(engineNameAtom);
  const position = useEvaluateCurrentPosition(engineName);
  const [evalResult] = useAtom(gameEvalAtom);

  return (
    <div className="lx:w-[35rem] getPieceValue h-full w-full flex-col items-center bg-slate-700 p-0 xl:p-6">
      <div className="mb-[3.5rem] flex w-full flex-col items-center gap-2 overflow-auto rounded-t-lg border-2 shadow-lg xl:mb-0 xl:h-[50rem]">
        <PanelHeader />
        <div className="border-divider w-full border-b">
          {isGameDataLoaded ? (
            <div className="flex justify-evenly border-y-2 border-white">
              <button
                className={`flex w-full items-center justify-center ${
                  currentTab === 0 ? "bg-slate-900" : "hover:bg-slate-500"
                }`}
                onClick={() => setCurrentTab(0)}
              >
                <span>Game Analysis</span>
              </button>

              <div className="w-1 bg-white"></div>

              <button
                className={`flex w-full items-center justify-center ${
                  currentTab === 1 ? "bg-slate-900" : "hover:bg-slate-500"
                }`}
                onClick={() => setCurrentTab(1)}
              >
                <span>Moves</span>
              </button>
            </div>
          ) : null}
        </div>
        {!isGameDataLoaded ? (
          <div className="flex flex-col gap-8">
            <p className="text-center text-xl">
              <b>
                Press the 'Load Game' button to import a game from Lichess,
                Chess.com, or a PGN.
              </b>
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-xl">
                <b>Example games</b>
              </p>
              <div className="w-full">
                <ExampleGames />
              </div>
            </div>
          </div>
        ) : null}
        {!evalResult && isGameDataLoaded && currentTab === 0 ? (
          <div className="p-2">
            <p className="text-center text-xl">
              <b>Press the 'Analyze' button to unlock game analysis.</b>
            </p>
          </div>
        ) : null}

        <div className="flex w-full flex-col items-center justify-center p-2">
          {currentTab === 0 ? (
            <>
              <GameAnalysisTab position={position} />
              <ClassificationCount />
              <Graph />
            </>
          ) : null}
          {currentTab === 1 ? <MovesTab /> : null}
        </div>
      </div>
      <div className="fixed bottom-0 z-[100] w-screen bg-slate-900 p-1 xl:static xl:h-auto xl:w-full xl:rounded-b-lg">
        <PanelToolBar />
      </div>
    </div>
  );
}
