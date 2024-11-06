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

    if (value > displayValue) {
      const interval = setInterval(() => {
        setDisplayValue((prevValue) => {
          const increment = (value - prevValue) / 10;
          if (Math.abs(value - prevValue) < 0.1) {
            clearInterval(interval);
            return value;
          }
          return prevValue + increment;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [value, displayValue]);

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
