import { useEffect, useRef, useState } from "react";
import { FaGear } from "react-icons/fa6";

import { useAtomLocalStorage } from "../../hooks/useAtomLocalStorage";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  isShowArrowBestMoveEnabledAtom,
  isShowMoveClassificationEnabledAtom,
} from "../../stores/states";
import Slider from "./components/Slider";

export default function EngineSettingsDialog() {
  const [openDialog, setOpenDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useAtomLocalStorage(
    "engine-depth",
    engineDepthAtom,
  );
  const [multiPv, setMultiPv] = useAtomLocalStorage(
    "engine-multi-pv",
    engineMultiPvAtom,
  );
  const [isShowArrowBestMoveEnabled, setIsShowArrowBestMoveEnabled] =
    useAtomLocalStorage(
      "is-show-arrow-best-move-enabled",
      isShowArrowBestMoveEnabledAtom,
    );
  const [isShowMoveClassificationEnabled, setIsShowMoveClassificationEnabled] =
    useAtomLocalStorage(
      "is-show-move-classification-enabled",
      isShowMoveClassificationEnabledAtom,
    );

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
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDialog]);

  return (
    <>
      <button
        className="rounded p-2 text-white transition-colors hover:bg-gray-500"
        onClick={() => setOpenDialog(true)}
        title="Engine settings"
      >
        <FaGear height={20} />
      </button>

      {openDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div
            ref={dialogRef}
            className="w-full max-w-3xl rounded-lg bg-slate-900 p-6"
          >
            <div className="flex justify-end">
              <button
                onClick={() => setOpenDialog(false)}
                className="size-8 rounded p-1 font-bold hover:bg-gray-500"
              >
                X
              </button>
            </div>
            <h2 className="mb-4 text-2xl">
              <b>Set engine parameters</b>
            </h2>

            <div className="grid grid-cols-1 gap-10">
              <Slider
                label="Maximum depth"
                value={depth}
                setValue={setDepth}
                min={10}
                max={30}
                marksFilter={2}
              />
              <p className="mb-2 text-sm text-white">
                Increasing the depth will drastically increase the time needed
                to evaluate but may also improve accuracy.
              </p>

              <Slider
                label="Number of lines"
                value={multiPv}
                setValue={setMultiPv}
                min={2}
                max={6}
              />

              <div className="flex flex-col items-center justify-evenly space-y-3 md:flex-row md:space-x-6 md:space-y-0">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isShowArrowBestMoveEnabled}
                    onChange={(e) =>
                      setIsShowArrowBestMoveEnabled(e.target.checked)
                    }
                    className="cursor-pointer"
                  />
                  <span>Display the arrow for the engine's best move</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isShowMoveClassificationEnabled}
                    onChange={(e) =>
                      setIsShowMoveClassificationEnabled(e.target.checked)
                    }
                    className="cursor-pointer"
                  />
                  <span>Show move classification</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpenDialog(false)}
                className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
