interface Props {
  pgn: string;
  setPgn: (pgn: string) => void;
}

export default function GamePgnInput({ setPgn }: Props) {
  return (
    <div className="h-full pt-4">
      <label htmlFor="pgn-input" className="mb-2 block text-sm font-medium">
        Enter PGN here...
      </label>
      <textarea
        id="pgn-input"
        name="pgn"
        autoComplete="off"
        onChange={(e) => setPgn(e.target.value)}
        rows={6}
        className="block w-full rounded-lg border border-gray-300 bg-black px-3 py-2 text-white shadow-sm focus:ring focus:ring-blue-200"
        placeholder="Enter PGN here..."
      />
    </div>
  );
}
