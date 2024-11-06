import { Move } from "chess.js";

import { getWhoIsCheckmated, isCheck } from "./chessUtils";

let audio: HTMLAudioElement | null = null;

const soundUrls = {
  capture: "/sounds/capture.webm",
  castle: "/sounds/castle.webm",
  gameEnd: "/sounds/game-end.webm",
  gameStart: "/sounds/game-start.webm",
  illegalMove: "/sounds/illegal-move.webm",
  moveCheck: "/sounds/move-check.webm",
  move: "/sounds/move.webm",
  promote: "/sounds/promote.webm",
  completed: "/sounds/completed.webm",
};

const playSound = async (type: keyof typeof soundUrls) => {
  if (!audio) audio = new Audio();

  if (!audio.paused && !audio.ended) return;

  audio.src = soundUrls[type];
  await audio.play();
};

export const playGameEndSound = () => playSound("gameEnd");
export const playIllegalMoveSound = () => playSound("illegalMove");
export const gameAnalysisCompleted = () => playSound("completed");

export const playSoundFromMove = (move: Move | null) => {
  if (!move) return playIllegalMoveSound();

  let soundType: keyof typeof soundUrls;

  switch (true) {
    case !!getWhoIsCheckmated(move.after):
      soundType = "gameEnd";
      break;
    case isCheck(move.after):
      soundType = "moveCheck";
      break;
    case !!move.promotion:
      soundType = "promote";
      break;
    case !!move.captured:
      soundType = "capture";
      break;
    case move.flags.includes("k") || move.flags.includes("q"):
      soundType = "castle";
      break;
    default:
      soundType = "move";
      break;
  }

  playSound(soundType);
};
