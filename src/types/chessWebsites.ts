export interface LichessGame {
  id: string;
  speed: string;
  lastMoveAt: number;
  players: {
    white: LichessGameUser;
    black: LichessGameUser;
  };
  pgn: string;
}

interface LichessGameUser {
  user?: { id: string; name: string };
  rating?: number;
}

export interface ChessComGame {
  uuid: string;
  white: ChessComUser;
  black: ChessComUser;
  end_time: number;
  pgn: string;
  time_class: string;
}

export interface ChessComUser {
  username: string;
  rating: number;
  ["@id"]: string;
}
