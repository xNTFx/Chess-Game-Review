import { useInfiniteQuery } from "@tanstack/react-query";

import { LichessGame } from "../../../types/chessWebsites";

const fetchLichessUserRecentGames = async (
  username: string | null,
  until: number,
): Promise<LichessGame[]> => {
  const res = await fetch(
    `https://lichess.org/api/games/user/${username}?until=${until}&max=50&pgnInJson=true&tags=true&sort=dateDesc&clocks=1`,
    { method: "GET", headers: { accept: "application/x-ndjson" } },
  );

  if (res.status === 404) return [];

  const rawData = await res.text();
  const games = rawData
    .split("\n")
    .filter((game) => game.length > 0)
    .map((game) => JSON.parse(game));

  return games;
};

export const useLichessUserRecentGames = (username: string | null) => {
  return useInfiniteQuery({
    queryKey: ["lichessUserRecentGames", username],
    queryFn: ({ pageParam = Date.now() }) =>
      fetchLichessUserRecentGames(username, pageParam),
    enabled: !!username,
    getNextPageParam: (lastPage) => {
      return lastPage.length === 50
        ? lastPage[lastPage.length - 1].lastMoveAt
        : undefined;
    },
    initialPageParam: Date.now(),
  });
};
