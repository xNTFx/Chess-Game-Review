export const exampleGames: { title: string; pgn: string }[] = [
  {
    title: "Donald Byrne vs Bobby Fischer (1956)",
    pgn: `[Event "Third Rosenwald Trophy"]
    [Site "New York, NY USA"]
    [Date "1956.10.17."]
    [Round "8"]
    [White "Donald Byrne"]
    [Black "Bobby Fischer"]
    [Result "0-1"]
    [WhiteElo "-"]
    [WhiteTitle "GM"]
    [BlackElo "-"]
    [BlackTitle "GM"]
    [BlackTeam "America"]
    [TimeControl "-"]
    [Termination "Normal"]
    [Variant "Standard"]
    [ECO "A15"]
    [Opening "English Opening: Anglo-Indian Defense, King's Indian Formation"]

    1. Nf3 { [%eval 0.17] } 1... Nf6 { [%eval 0.25] } 2. c4 { [%eval 0.0] } 2... g6 { [%eval 0.44] } 3. Nc3 { [%eval 0.25] } 3... Bg7?! { [%eval 0.85] } { Inaccuracy. d5 was best. } (3... d5 4. cxd5 Nxd5 5. h4 Bg7 6. e4 Nxc3 7. dxc3 Qxd1+ 8. Kxd1) 4. d4?! { [%eval 0.0] } { Inaccuracy. e4 was best. } (4. e4 c5 5. d4 cxd4 6. Nxd4 Nc6 7. Be3 Ng4 8. Qxg4 Nxd4) 4... O-O { [%eval 0.29] } 5. Bf4 { [%eval -0.05] } 5... d5 { [%eval 0.13] } 6. Qb3 { [%eval -0.31] } 6... dxc4 { [%eval 0.13] } 7. Qxc4 { [%eval 0.0] } 7... c6 { [%eval 0.4] } 8. e4 { [%eval 0.46] } 8... Nbd7 { [%eval 0.65] } 9. Rd1 { [%eval 0.66] } 9... Nb6 { [%eval 1.12] } 10. Qc5?! { [%eval 0.41] } { Inaccuracy. Qb3 was best. } { [%csl Rc5] } (10. Qb3) 10... Bg4 { [%eval 0.3] } 11. Bg5?? { [%eval -2.56] } { Blunder. Be2 was best. } (11. Be2) 11... Na4 { [%eval -2.67] } 12. Qa3 { [%eval -2.74] } (12. Nxa4 Nxe4 13. Bxe7 (13. Qa3 Nxg5 14. Nxg5 Bxd1 15. Kxd1 Qxd4+ 16. Bd3) 13... Qc7 14. Bxf8 Nxc5 15. Bxc5) 12... Nxc3 { [%eval -2.46] } 13. bxc3 { [%eval -2.65] } 13... Nxe4 { [%eval -2.59] } 14. Bxe7?! { [%eval -3.44] } { Inaccuracy. Be3 was best. } (14. Be3) 14... Qb6?! { [%eval -2.61] } { Inaccuracy. Qd5 was best. } (14... Qd5 15. Bxf8 Bxf8 16. Qb3 Qxb3 17. axb3 Re8 18. Bc4 b5 19. Ne5 Rxe5 20. dxe5 Bxd1 21. Bd3) 15. Bc4 { [%eval -2.67] } 15... Nxc3 { [%eval -2.17] } 16. Bc5 { [%eval -3.06] } 16... Rfe8+ { [%eval -2.73] } 17. Kf1 { [%eval -2.37] } 17... Be6!! { [%eval -2.5] } 18. Bxb6?? { [%eval -7.09] } { Blunder. Qxc3 was best. } (18. Qxc3 Qxc5) 18... Bxc4+ { [%eval -7.01] } 19. Kg1 { [%eval -7.33] } 19... Ne2+ { [%eval -7.23] } 20. Kf1 { [%eval -7.22] } 20... Nxd4+ { [%eval -7.01] } 21. Kg1 { [%eval -7.34] } 21... Ne2+ { [%eval -7.43] } 22. Kf1 { [%eval -7.44] } 22... Nc3+ { [%eval -7.61] } 23. Kg1 { [%eval -7.36] } 23... axb6 { [%eval -7.44] } 24. Qb4 { [%eval -8.01] } 24... Ra4 { [%eval -7.08] } 25. Qxb6 { [%eval -7.06] } 25... Nxd1 { [%eval -7.66] } 26. h3 { [%eval -7.56] } 26... Rxa2 { [%eval -8.01] } 27. Kh2 { [%eval -7.92] } 27... Nxf2 { [%eval -7.9] } 28. Re1 { [%eval -8.19] } 28... Rxe1 { [%eval -8.59] } 29. Qd8+ { [%eval -8.73] } 29... Bf8 { [%eval -8.33] } 30. Nxe1 { [%eval -8.64] } 30... Bd5 { [%eval -8.63] } 31. Nf3 { [%eval -9.04] } 31... Ne4 { [%eval -10.41] } 32. Qb8 { [%eval -13.71] } 32... b5 { [%eval -8.58] } 33. h4 { [%eval -9.02] } 33... h5 { [%eval -10.02] } 34. Ne5 { [%eval -13.4] } 34... Kg7 { [%eval -15.25] } 35. Kg1 { [%eval -59.66] } 35... Bc5+ { [%eval -77.22] } 36. Kf1?! { [%eval #-5] } { Checkmate is now unavoidable. Kh2 was best. } (36. Kh2 Bd6) 36... Ng3+ { [%eval #-4] } 37. Ke1 { [%eval #-4] } 37... Bb4+ { [%eval #-4] } 38. Kd1 { [%eval #-4] } 38... Bb3+ { [%eval #-3] } 39. Kc1 { [%eval #-3] } 39... Ne2+ { [%eval #-2] } 40. Kb1 { [%eval #-2] } 40... Nc3+ { [%eval #-1] } 41. Kc1 { [%eval #-1] } 41... Rc2# 0-1
    `,
  },
  {
    title: "Milko Bobotsov vs Mikhail Tal (1958)",
    pgn: `[Event "Milko Bobotsov vs Mikhail Tal (1958)"]
    [Site "Milko Bobotsov vs Mikhail Tal (1958)"]
    [Result "0-1"]
    [White "Milko Bobotsov"]
    [Black "Mikhail Tal"]
    [Variant "Standard"]
    [ECO "E81"]
    [Opening "King's Indian Defense: Sämisch Variation, Bobotsov-Korchnoi-Petrosian Variation"]

    1. d4 1... Nf6 2. c4 2... g6 3. Nc3 3... Bg7 4. e4 4... d6 5. f3 5... O-O 6. Nge2 6... c5 7. Be3 7... Nbd7 8. Qd2 8... a6 9. O-O-O 9... Qa5 10. Kb1 10... b5 11. Nd5 11... Nxd5 12. Qxa5 12... Nxe3 13. Rc1 13... Nxc4 14. Rxc4 14... bxc4 15. Nc1 15... Rb8 16. Bxc4 16... Nb6 17. Bb3 17... Bxd4 18. Qd2 18... Bg7 19. Ne2 19... c4 20. Bc2 20... c3 21. Qd3 21... cxb2 22. Nd4 22... Bd7 23. Rd1 23... Rfc8 24. Bb3 24... Na4 25. Bxa4 25... Bxa4 26. Nb3 26... Rc3 27. Qxa6 27... Bxb3 28. axb3 28... Rbc8 29. Qa3 29... Rc1+ 30. Rxc1 30... Rxc1+ 31. Ka2 b1=B# *
    `,
  },
  {
    title: "Akiba Rubinstein vs Georg Rotlewi (1907)",
    pgn: `[Event "Akiba Rubinstein vs Georg Rotlewi (1907)"]
    [Site "Akiba Rubinstein vs Georg Rotlewi (1907)"]
    [Date "1907.12.26"]
    [Round "6"]
    [White "Georg Rotlewi"]
    [Black "Akiba Rubinstein"]
    [Result "0-1"]
    [Variant "Standard"]
    [ECO "D32"]
    [Opening "Tarrasch Defense: Symmetrical Variation"]

    1. d4 1... d5 2. Nf3 e6 3. e3 c5 4. c4 4... Nc6 5. Nc3 Nf6 6. dxc5 6... Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 10... Qe7 11. Bd3 11... dxc4 12. Bxc4 b5 13. Bd3 13... Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 16... Bxe5 17. f4 17... Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 20... Ng4 21. Be4 21... Qh4 22. g3 22... Rxc3 23. gxh4 23... Rd2 24. Qxd2 24... Bxe4+ 25. Qg2 25... Rh3 26. Bd4 26... Bxd4 0-1
    `,
  },
];
