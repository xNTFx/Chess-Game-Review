import { Chess } from "chess.js";
import { capitalize } from "lodash";
import { useInView } from "react-intersection-observer";

import LoadingDivComponent from "../../../components/LoadingComponents/LoadingDivComponent";
import { ChessComGame, LichessGame } from "../../../types/chessWebsites";
import { GameOrigin } from "../../../types/enums";
import { getGameFromPgn } from "../../../utils/chessUtils";
import { useChessComUserRecentGames } from "../hooks/useChessComUserRecentGames ";
import { useLichessUserRecentGames } from "../hooks/useLichessUserRecentGames";

interface Props {
  pgn: string;
  setPgn: (pgn: string) => void;
  setGame: (game: Chess) => void;
  setParsingError: (error: string) => void;
  onClose: () => void;
  gameOrigin: GameOrigin;
  username: string | null;
}

export default function ChessPlatformInput({
  pgn,
  setPgn,
  setGame,
  setParsingError,
  onClose,
  gameOrigin,
  username,
}: Props) {
  const {
    data: chessComData,
    isFetchingNextPage: isFetchingNextChessCom,
    error: chessComError,
    fetchNextPage: fetchNextChessComPage,
    hasNextPage: hasNextChessComPage,
  } = useChessComUserRecentGames(
    gameOrigin === GameOrigin.ChessCom ? username : null,
  );

  const {
    data: lichessData,
    isFetchingNextPage: isFetchingNextLichess,
    error: lichessError,
    fetchNextPage: fetchNextLichessPage,
    hasNextPage: hasNextLichessPage,
  } = useLichessUserRecentGames(
    gameOrigin === GameOrigin.Lichess ? username : null,
  );

  const data = gameOrigin === GameOrigin.ChessCom ? chessComData : lichessData;
  const isFetchingNextPage =
    gameOrigin === GameOrigin.ChessCom
      ? isFetchingNextChessCom
      : isFetchingNextLichess;
  const error =
    gameOrigin === GameOrigin.ChessCom ? chessComError : lichessError;
  const fetchNextPage =
    gameOrigin === GameOrigin.ChessCom
      ? fetchNextChessComPage
      : fetchNextLichessPage;
  const hasNextPage =
    gameOrigin === GameOrigin.ChessCom
      ? hasNextChessComPage
      : hasNextLichessPage;

  const games = data?.pages?.flat() || [];

  const { ref } = useInView({
    triggerOnce: false,
    onChange: (inView) => {
      if (inView && hasNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleAddGame = (pgn: string) => {
    if (!pgn) return;
    setParsingError("");
    try {
      const gameToAdd = getGameFromPgn(pgn);
      setGame(gameToAdd);
      onClose();
    } catch (error) {
      console.error(error);
      setParsingError(
        error instanceof Error
          ? `${error.message} !`
          : "Unknown error while parsing PGN !",
      );
    }
  };

  return (
    <>
      {username && (
        <div className="relative grid h-full grid-cols-1 gap-4 overflow-y-auto rounded bg-slate-950 p-1 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {!data ? (
            <div className="flex max-h-[500px] min-h-[100px] items-center justify-center">
              <LoadingDivComponent />
            </div>
          ) : error ? (
            <p className="text-red-500">Error loading games</p>
          ) : games.length === 0 ? (
            <p className="p-2 text-lg">No available games</p>
          ) : (
            games.map((game: LichessGame | ChessComGame, index) => (
              <div
                key={`${
                  gameOrigin === GameOrigin.ChessCom
                    ? (game as ChessComGame).uuid
                    : (game as LichessGame).id
                }-${index}`}
              >
                <button
                  onClick={() => {
                    const gamePgn = game.pgn;
                    setPgn(gamePgn);
                    handleAddGame(gamePgn);
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    pgn === game.pgn ? "bg-blue-500" : "hover:bg-gray-600"
                  }`}
                >
                  <p className="truncate font-bold">
                    {`${capitalize(
                      gameOrigin === GameOrigin.ChessCom
                        ? (game as ChessComGame).white.username
                        : (game as LichessGame).players.white.user?.name ||
                            "white",
                    )} (${
                      gameOrigin === GameOrigin.ChessCom
                        ? (game as ChessComGame).white.rating
                        : (game as LichessGame).players.white.rating || "?"
                    }) vs ${capitalize(
                      gameOrigin === GameOrigin.ChessCom
                        ? (game as ChessComGame).black.username
                        : (game as LichessGame).players.black.user?.name ||
                            "black",
                    )} (${
                      gameOrigin === GameOrigin.ChessCom
                        ? (game as ChessComGame).black.rating
                        : (game as LichessGame).players.black.rating || "?"
                    })`}
                  </p>
                  <p className="truncate text-sm text-gray-300">
                    {`${capitalize(
                      gameOrigin === GameOrigin.ChessCom
                        ? (game as ChessComGame).time_class
                        : (game as LichessGame).speed,
                    )} played at ${new Date(
                      gameOrigin === GameOrigin.ChessCom
                        ? (game as ChessComGame).end_time * 1000
                        : (game as LichessGame).lastMoveAt,
                    )
                      .toLocaleString()
                      .slice(0, -3)}`}
                  </p>
                </button>
              </div>
            ))
          )}
          <div ref={ref} />
          {isFetchingNextPage && (
            <div className="mt-4 flex w-full items-center justify-start">
              <p className="text-white">Loading...</p>
              <LoadingDivComponent />
            </div>
          )}
        </div>
      )}
    </>
  );
}
