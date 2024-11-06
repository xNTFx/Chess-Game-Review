import { useAtomValue } from "jotai";

import { gameEvalAtom } from "../../../../stores/states";

export default function AccuraciesInfo() {
  const evaluation = useAtomValue(gameEvalAtom);

  if (!evaluation) return null;

  return (
    <div className="flex w-full items-center justify-center gap-10">
      <div
        className="rounded-md bg-white p-2 text-center font-bold text-black"
        style={{ border: "1px solid #424242", lineHeight: "1" }}
      >
        {`${evaluation.accuracy.white.toFixed(1)}%`}
      </div>

      <div className="text-center">
        <span>Accuracies</span>
      </div>

      <div
        className="rounded-md bg-black p-2 text-center font-bold text-white"
        style={{ border: "1px solid #424242", lineHeight: "1" }}
      >
        {`${evaluation.accuracy.black.toFixed(1)}%`}
      </div>
    </div>
  );
}
