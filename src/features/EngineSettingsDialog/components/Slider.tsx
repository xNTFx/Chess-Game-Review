interface Props {
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  label: string;
  xs?: number;
  marksFilter?: number;
}

export default function Slider({
  min,
  max,
  label,
  value,
  setValue,
  marksFilter = 1,
}: Props) {
  const marks = Array.from({ length: max - min + 1 }, (_, i) => i + min).filter(
    (_, i) => i % marksFilter === 0,
  );

  return (
    <div className={`flex w-full flex-col items-center`}>
      <label
        htmlFor={`input-${label}`}
        className="mb-2 w-full text-left text-sm font-semibold"
      >
        {label}
      </label>
      <div className="relative flex w-full items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-500"
          id={`input-${label}`}
        />
        <div className="absolute top-6 flex w-full justify-between text-xs">
          {marks.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
