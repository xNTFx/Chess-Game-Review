import { useAtom } from "jotai";

import { currentPositionAtom } from "../../../../stores/states";

export default function OpeningInfo() {
  const [currentPosition] = useAtom(currentPositionAtom);

  const opening = currentPosition?.eval?.opening;
  if (!opening) return null;

  return (
    <div className="w-full">
      <p className="text-center text-sm">
        <b>{opening}</b>
      </p>
    </div>
  );
}
