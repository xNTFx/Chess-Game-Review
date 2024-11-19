import { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number | null;
  label: string;
}

const LinearProgressBar = ({ value, label }: ProgressBarProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === null) {
      setDisplayValue(0);
      return;
    }

    let animationFrame: number;
    const updateValue = () => {
      setDisplayValue((prevValue) => {
        if (Math.abs(value - prevValue) < 0.1) {
          return value;
        }
        const increment = (value - prevValue) / 10;
        const newValue = prevValue + increment;

        return Math.max(newValue, prevValue);
      });

      animationFrame = requestAnimationFrame(updateValue);
    };

    updateValue();

    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  if (value === null) return null;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mt-1 flex w-[90%] items-center space-x-2">
        <div className="w-full">
          <div className="relative h-6 rounded bg-gray-200">
            <span className="absolute z-10 flex h-6 w-full items-center justify-center text-center text-xs text-black">
              <b>
                {label} {displayValue.toFixed()}%
              </b>
            </span>
            <div
              className="absolute left-0 top-0 flex h-6 items-center justify-center rounded font-semibold text-white transition-all duration-500 ease-out"
              style={{
                width: `${displayValue}%`,
                background: "linear-gradient(to right, #16a34a, #4ade80)",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinearProgressBar;
