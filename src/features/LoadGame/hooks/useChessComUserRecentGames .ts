import { useInfiniteQuery } from "@tanstack/react-query";
import _ from "lodash";

import { ChessComGame } from "../../../types/chessCom";

const fetchChessComUserRecentGames = async (
  username: string | null,
  page: number,
): Promise<ChessComGame[]> => {
  if (!username) return [];

  const games: ChessComGame[] = [];
  const date = new Date();
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const offset = page * 50;

  while (games.length < offset + 50) {
    const paddedMonth = _.padStart(String(month), 2, "0");
    const res = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${year}/${paddedMonth}`,
    );

    if (res.status === 404) break;

    const data = await res.json();
    games.push(...(data?.games ?? []));

    if (games.length >= offset + 50) break;

    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return games
    .sort((a, b) => b.end_time - a.end_time)
    .slice(offset, offset + 50);
};

export const useChessComUserRecentGames = (username: string | null) => {
  return useInfiniteQuery({
    queryKey: ["chessComUserRecentGames", username],
    queryFn: ({ pageParam = 0 }) =>
      fetchChessComUserRecentGames(username, pageParam),
    enabled: !!username,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 50 ? pages.length : undefined;
    },
    initialPageParam: 0,
  });
};
