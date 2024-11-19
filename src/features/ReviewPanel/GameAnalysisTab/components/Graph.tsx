import { useAtomValue } from "jotai";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CategoricalChartState } from "recharts/types/chart/types";

import { useChessActions } from "../../../../hooks/useChessActions";
import {
  boardAtom,
  currentPositionAtom,
  gameAtom,
  gameEvalAtom,
} from "../../../../stores/states";
import { MoveClassification } from "../../../../types/enums";
import { PositionEval } from "../../../../types/eval";
import {
  getLineEvalLabel,
  moveClassificationColors,
  moveClassificationIcons,
} from "../../../../utils/chessUtils";

export interface ChartItemData {
  moveNb: number;
  value: number;
  cp?: number;
  mate?: number;
  moveClassification?: MoveClassification;
}

export default function Graph() {
  const gameEvaluations = useAtomValue(gameEvalAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const { goToMove } = useChessActions(boardAtom);
  const currentGame = useAtomValue(gameAtom);

  const chartItems: ChartItemData[] = useMemo(
    () => gameEvaluations?.positions.map(convertPositionToChartData) ?? [],
    [gameEvaluations],
  );

  const boardHighlightColor = currentPosition.eval?.moveClassification
    ? moveClassificationColors[currentPosition.eval.moveClassification]
    : "grey";

  if (!gameEvaluations || !chartItems.length) return null;

  const handleChartClick = (event: CategoricalChartState) => {
    if (!event || !event.activeLabel) return;
    goToMove(Number(event.activeLabel), currentGame);
  };

  const CustomDot = ({
    cx,
    cy,
    r,
    payload,
  }: {
    cx?: number;
    cy?: number;
    r?: number;
    payload?: ChartItemData;
  }) => {
    if (!payload) return null;

    const circleColor = payload.moveClassification
      ? moveClassificationColors[payload.moveClassification]
      : "gray";

    const handleCircleClick = () => goToMove(payload.moveNb, currentGame);

    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={circleColor}
        strokeWidth={5}
        fill={circleColor}
        fillOpacity={1}
        onClick={handleCircleClick}
        className="cursor-pointer"
      />
    );
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: ChartItemData }[];
  }) => {
    if (!active || !payload || !payload.length) return null;

    const tooltipContent = payload[0].payload;

    const imageSrc = tooltipContent.moveClassification
      ? moveClassificationIcons[tooltipContent.moveClassification]
      : "";

    return (
      <div className="flex items-center justify-center gap-1 rounded border border-white bg-slate-700 p-1 text-white opacity-90">
        <img src={imageSrc} className="size-6" />
        {getLineEvalLabel(tooltipContent)}
      </div>
    );
  };

  return (
    <div className="my-1 grid w-full pb-2">
      <div className="w-full rounded-xl border-4 bg-black">
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart
            data={chartItems}
            onClick={handleChartClick}
            margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            style={{ cursor: "pointer" }}
          >
            <XAxis dataKey="moveNb" hide />
            <YAxis domain={[0, 20]} hide />
            <Tooltip
              content={<CustomTooltip />}
              isAnimationActive={false}
              cursor={{ stroke: "grey", strokeWidth: 2, strokeOpacity: 0.3 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              fill="#ffffff"
              fillOpacity={1}
              activeDot={<CustomDot />}
              isAnimationActive={false}
              className="cursor-pointer"
            />
            <ReferenceLine
              y={10}
              stroke="grey"
              strokeWidth={2}
              strokeOpacity={0.4}
            />
            <ReferenceLine
              x={currentPosition.currentMoveIdx}
              stroke={boardHighlightColor}
              strokeWidth={4}
              strokeOpacity={0.6}
              ifOverflow="extendDomain"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const convertPositionToChartData = (
  boardPosition: PositionEval,
  index: number,
): ChartItemData => {
  const currentLine = boardPosition.lines[0];
  const chartItem: ChartItemData = {
    moveNb: index,
    value: 10,
    cp: currentLine.cp,
    mate: currentLine.mate,
    moveClassification: boardPosition.moveClassification,
  };

  if (currentLine.mate) {
    return { ...chartItem, value: currentLine.mate > 0 ? 20 : 0 };
  }
  if (currentLine.cp) {
    return {
      ...chartItem,
      value: Math.max(Math.min(currentLine.cp / 100, 10), -10) + 10,
    };
  }
  return chartItem;
};
