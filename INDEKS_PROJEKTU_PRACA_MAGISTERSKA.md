# Indeks projektu do pracy magisterskiej

Temat pracy w jezyku polskim: **System do analizy partii szachowych**  
Temat pracy w jezyku angielskim: **Chess Game Analysis System**

Ten plik jest roboczym indeksem projektu. Ma sluzyc jako jedno miejsce, do ktorego mozna zagladac podczas pisania pracy magisterskiej, bez koniecznosci ciaglego przeszukiwania kodu.

## 1. Krotki opis projektu

Projekt jest hostowana aplikacja webowa do analizy partii szachowych. Aplikacja dziala po stronie klienta w przegladarce i umozliwia:

- import partii szachowej,
- prezentacje przebiegu gry na interaktywnej szachownicy,
- analize pozycji przy pomocy silnikow szachowych,
- klasyfikacje jakosci ruchow,
- obliczanie dokladnosci graczy,
- wizualizacje zmian przewagi na wykresie i pasku ewaluacji,
- porownanie dzialania silnika Stockfish z autorskim silnikiem szachowym.

Glowne zalozenie pracy: system ma wspierac uzytkownika w nauce gry w szachy poprzez wskazywanie bledow, dobrych ruchow, najlepszych wariantow oraz kluczowych momentow partii.

## 2. Metryka projektu

Orientacyjne dane z repozytorium:

- liczba plikow w katalogu `src`: ok. 85,
- liczba linii kodu TypeScript/TSX w `src`: ok. 23 400,
- liczba linii kodu w autorskim silniku `src/engine/custom`: ok. 4 600,
- aplikacja frontendowa: React + TypeScript + Vite,
- analiza po stronie klienta: Stockfish WASM oraz autorski silnik w Web Workerach,
- wdrozenie: build Vite, Docker, nginx.

## 3. Technologie wykorzystane w projekcie

### 3.1. React

React odpowiada za budowe interfejsu uzytkownika. Glowny widok aplikacji sklada sie z szachownicy, panelu analizy, listy ruchow, wykresu przewagi, paska ewaluacji oraz ustawien silnika.

Najwazniejsze pliki:

- `src/main.tsx` - punkt startowy aplikacji,
- `src/App.tsx` - konfiguracja providerow i routera,
- `src/pages/GameReview.tsx` - glowny ekran aplikacji.

### 3.2. TypeScript

TypeScript zapewnia typowanie struktur danych, wynikow analizy, ustawien silnika, klasyfikacji ruchow oraz interfejsow komunikacji z silnikami.

Najwazniejsze pliki:

- `src/types/eval.ts` - typy zwiazane z ewaluacja pozycji i partii,
- `src/types/enums.ts` - typy wyliczeniowe, m.in. silniki i klasyfikacje ruchow,
- `src/engine/types.ts` - wspolny interfejs silnika szachowego.

### 3.3. Tailwind CSS

Tailwind CSS odpowiada za stylowanie interfejsu i responsywny uklad aplikacji.

Najwazniejsze pliki:

- `src/index.css`,
- `tailwind.config.js`,
- komponenty TSX zawierajace klasy Tailwind.

### 3.4. Vite

Vite odpowiada za uruchamianie aplikacji w trybie developerskim oraz budowanie wersji produkcyjnej.

Najwazniejsze pliki:

- `vite.config.ts`,
- `package.json`,
- `index.html`.

### 3.5. Stockfish WASM

Stockfish jest uzywany jako referencyjny silnik szachowy. Aplikacja obsluguje:

- Stockfish 16.1 Lite w wersji WebAssembly,
- Stockfish 11 jako starsza wersja/fallback.

Najwazniejsze pliki:

- `public/engines/stockfish-16.1/stockfish-16.1-lite.js`,
- `public/engines/stockfish-16.1/stockfish-16.1-lite.wasm`,
- `public/engines/stockfish-11.js`,
- `src/hooks/useChessEngine.ts`.

### 3.6. Autorski silnik szachowy

W projekcie znajduje sie wlasny silnik szachowy, ktory pozwala omowic algorytmy analizy partii szachowych od strony implementacyjnej.

Najwazniejsze elementy:

- reprezentacja planszy,
- bitboardy,
- generowanie ruchow,
- wykonywanie i cofanie ruchow,
- parsowanie FEN,
- funkcja oceny pozycji,
- wyszukiwanie najlepszego ruchu,
- quiescence search,
- tablica transpozycji,
- sortowanie ruchow,
- Web Workery,
- rownolegla analiza pozycji.

Najwazniejsze pliki:

- `src/engine/custom/createCustomChessEngine.ts`,
- `src/engine/custom/customEngine.worker.ts`,
- `src/engine/custom/core/board.ts`,
- `src/engine/custom/core/bitboard.ts`,
- `src/engine/custom/core/movegen.ts`,
- `src/engine/custom/core/makeMove.ts`,
- `src/engine/custom/core/fen.ts`,
- `src/engine/custom/core/evaluate.ts`,
- `src/engine/custom/core/perft.ts`,
- `src/engine/custom/core/zobrist.ts`,
- `src/engine/custom/search/search.ts`,
- `src/engine/custom/search/quiescence.ts`,
- `src/engine/custom/search/moveOrdering.ts`,
- `src/engine/custom/search/transpositionTable.ts`.

### 3.7. Biblioteki pomocnicze

Najwazniejsze biblioteki:

- `chess.js` - obsluga zasad gry, PGN, FEN i historii ruchow,
- `react-chessboard` - interaktywna szachownica,
- `jotai` - zarzadzanie stanem aplikacji,
- `@tanstack/react-query` - pobieranie danych z zewnetrznych API,
- `recharts` - wykres przewagi pozycyjnej,
- `lodash` - funkcje pomocnicze,
- `react-icons` - ikony interfejsu.

## 4. Glowny przeplyw dzialania aplikacji

Podstawowy przeplyw danych w systemie:

1. Uzytkownik importuje partie.
2. System parsuje partie i tworzy historie ruchow.
3. Z historii ruchow generowane sa kolejne pozycje FEN.
4. Pozycje FEN sa przekazywane do wybranego silnika.
5. Silnik zwraca oceny pozycji, najlepsze ruchy i warianty.
6. System klasyfikuje ruchy na podstawie wynikow analizy.
7. System oblicza dokladnosc graczy.
8. Wyniki sa prezentowane na szachownicy, wykresie, pasku ewaluacji i liscie ruchow.

Schemat do pracy:

```text
PGN -> historia ruchow -> pozycje FEN -> silnik szachowy
    -> ewaluacje pozycji -> klasyfikacja ruchow
    -> accuracy -> wykres, pasek ewaluacji, lista ruchow, panel analizy
```

## 5. Struktura katalogow i plikow

### 5.1. Pliki konfiguracyjne projektu

- `package.json` - zaleznosci, skrypty `dev`, `build`, `lint`, `preview`.
- `vite.config.ts` - konfiguracja Vite.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - konfiguracja TypeScript.
- `eslint.config.js` - konfiguracja lintera.
- `tailwind.config.js` - konfiguracja Tailwind CSS.
- `postcss.config.js` - konfiguracja PostCSS.
- `Dockerfile` - budowanie kontenera aplikacji.
- `nginx.conf` - konfiguracja serwera nginx.
- `README.md` - podstawowy opis projektu i instrukcja uruchomienia.

### 5.2. Wejscie aplikacji

- `src/main.tsx` - montuje aplikacje React.
- `src/App.tsx` - dodaje `QueryClientProvider` i `BrowserRouter`.
- `src/pages/GameReview.tsx` - glowny widok aplikacji, laczy szachownice z panelem analizy.

Do pracy:

- opisac jako warstwe frontendowa,
- pokazac, ze aplikacja jest jedna glowna strona analizy partii,
- podkreslic dzialanie w przegladarce.

### 5.3. Stan aplikacji

Najwazniejszy plik:

- `src/stores/states.ts`

Przechowywane dane:

- aktualna partia,
- aktualna pozycja na szachownicy,
- wynik analizy partii,
- indeks aktualnego ruchu,
- cache ewaluacji,
- orientacja szachownicy,
- ustawienia silnika,
- postep analizy,
- aktywna zakladka panelu.

Najwazniejsze atomy:

- `gameAtom` - pelna partia,
- `boardAtom` - aktualny stan szachownicy,
- `gameEvalAtom` - wynik analizy partii,
- `currentMoveIdxAtom` - aktualny ruch,
- `currentPositionAtom` - pochodny stan aktualnej pozycji,
- `engineNameAtom` - wybrany silnik,
- `engineDepthAtom` - glebokosc analizy,
- `engineMultiPvAtom` - liczba wariantow,
- `evaluationProgressAtom` - postep analizy,
- `savedEvalsAtom` - zapisane ewaluacje.

Do pracy:

- opisac zarzadzanie stanem aplikacji,
- dodac diagram modelu danych,
- pokazac zaleznosc `game -> board -> currentPosition -> UI`.

### 5.4. Szachownica

Folder:

- `src/features/Board`

Najwazniejsze pliki:

- `Board.tsx` - interaktywna szachownica,
- `EvaluationBar.tsx` - pasek oceny pozycji,
- `SquareRenderer.tsx` - renderowanie pol i oznaczen,
- `CapturedPieces.tsx` - zbite figury,
- `Clock.tsx` - zegar graczy.

Funkcje:

- wyswietlanie pozycji,
- wykonywanie ruchow,
- klikanie i przeciaganie figur,
- podswietlanie mozliwych ruchow,
- wyswietlanie strzalki najlepszego ruchu,
- wyswietlanie klasyfikacji ruchu na polu,
- pasek przewagi pozycyjnej.

Do pracy:

- opisac interaktywny interfejs uzytkownika,
- dac zrzut ekranu szachownicy,
- opisac powiazanie szachownicy z aktualna ewaluacja.

### 5.5. Ladowanie partii

Folder:

- `src/features/LoadGame`

Najwazniejsze pliki:

- `LoadGame.tsx` - okno wczytywania partii,
- `components/GamePgnInput.tsx` - wprowadzanie PGN,
- `components/ChessPlatformInput.tsx` - wybor partii z platform,
- `hooks/useLichessUserRecentGames.ts` - pobieranie partii z Lichess,
- `hooks/useChessComUserRecentGames .ts` - pobieranie partii z Chess.com.

Funkcje:

- import PGN,
- pobieranie partii z Lichess,
- pobieranie partii z Chess.com,
- walidacja PGN,
- reset aktualnej partii i wczytanie nowej.

Do pracy:

- podstawowy zakres pracy mowi o imporcie PGN,
- integracje Chess.com i Lichess mozna opisac jako rozszerzenie systemu,
- dac diagram `PGN -> parser -> Chess object -> historia ruchow`.

### 5.6. Panel analizy

Folder:

- `src/features/ReviewPanel`

Najwazniejsze pliki:

- `ReviewPanel.tsx` - glowny panel analizy,
- `GameAnalysisTab/GameAnalysisTab.tsx` - zakladka analizy,
- `MovesTab/MovesTab.tsx` - lista ruchow,
- `PanelHeader/PanelHeader.tsx` - naglowek panelu,
- `PanelHeader/hooks/useAnalyze.ts` - uruchamianie analizy partii.

Komponenty zakladki analizy:

- `AccuraciesInfo.tsx` - dokladnosc graczy,
- `BenchmarkInfo.tsx` - dane wydajnosci analizy,
- `ClassificationCount.tsx` - liczba ruchow w kategoriach,
- `Graph.tsx` - wykres oceny pozycji,
- `OpeningInfo.tsx` - informacja o debiucie,
- `MoveInfo.tsx` - opis aktualnego ruchu,
- `LineEvaluation.tsx` - warianty silnika.

Funkcje:

- uruchomienie analizy,
- prezentacja wynikow,
- prezentacja najlepszych wariantow,
- prezentacja accuracy,
- prezentacja benchmarkow,
- lista ruchow z ikonami klasyfikacji,
- wykres przewagi.

Do pracy:

- opisac jako centralny modul prezentacji wynikow,
- dac zrzuty ekranu panelu analizy, listy ruchow i wykresu,
- pokazac diagram mapowania ewaluacji na elementy UI.

### 5.7. Pasek narzedzi

Folder:

- `src/features/PanelToolBar`

Najwazniejsze pliki:

- `PanelToolBar.tsx`,
- `NextMoveButton.tsx`,
- `GoToLastPositionButton.tsx`,
- `FlipBoardButton.tsx`.

Funkcje:

- przechodzenie po ruchach,
- cofanie/przechodzenie do ostatniej pozycji,
- obracanie szachownicy,
- otwieranie ladowania partii,
- ustawienia silnika.

Do pracy:

- opisac jako czesc interfejsu do nawigacji po partii.

### 5.8. Ustawienia silnika

Folder:

- `src/features/EngineSettingsDialog`

Najwazniejsze pliki:

- `EngineSettingsDialog.tsx`,
- `components/Slider.tsx`.

Ustawienia:

- wybor silnika: Stockfish 16.1 Lite, Stockfish 11, Custom engine,
- maksymalna glebokosc analizy,
- liczba wariantow MultiPV,
- pokazywanie strzalki najlepszego ruchu,
- pokazywanie klasyfikacji ruchow.

Do pracy:

- opisac jako mechanizm eksperymentowania z analiza,
- powiazac z badaniami dotyczacymi wplywu glebokosci i MultiPV.

### 5.9. Hooki

Folder:

- `src/hooks`

Najwazniejsze pliki:

- `useChessEngine.ts` - tworzenie i obsluga silnika,
- `useChessActions.ts` - wykonywanie ruchow i nawigacja po partii,
- `useEvaluateCurrentPosition.ts` - analiza aktualnej pozycji,
- `useGetPlayersNamesAndElo.ts` - dane graczy,
- `useResetAndLoadGamePgn.ts` - reset i wczytanie PGN,
- `useLocalStorage.ts` - local storage,
- `useAtomLocalStorage.ts` - powiazanie atomow Jotai z local storage.

Do pracy:

- opisac jako warstwe logiki aplikacji,
- wskazac oddzielenie UI od logiki analizy i stanu.

### 5.10. Narzedzia i algorytmy pomocnicze

Folder:

- `src/utils`

Najwazniejsze pliki:

- `chessUtils.ts` - funkcje PGN, FEN, UCI, etykiety ewaluacji, kolory klasyfikacji,
- `parseEvaluationResults.ts` - parsowanie wynikow Stockfisha,
- `computeAccuracy.ts` - obliczanie dokladnosci graczy,
- `winProbability.ts` - przeliczanie centipawnow/mata na prawdopodobienstwo wygranej,
- `soundEffects.ts` - efekty dzwiekowe,
- `MoveClassification/moveClassification.ts` - klasyfikacja ruchow,
- `MoveClassification/moveClassificationFunctions.ts` - funkcje pomocnicze klasyfikacji.

Do pracy:

- opisac algorytmy klasyfikacji,
- opisac obliczanie accuracy,
- dodac diagram decyzyjny klasyfikacji ruchu.

### 5.11. Dane

Folder:

- `src/data`

Pliki:

- `openings.ts` - baza rozpoznawanych debiutow,
- `exampleGames.ts` - przykladowe partie.

Do pracy:

- opisac wykorzystanie bazy debiutow do klasyfikacji ruchow jako `book`,
- opisac partie testowe/przykladowe.

### 5.12. Zasoby publiczne

Folder:

- `public`

Najwazniejsze zasoby:

- `public/engines` - Stockfish,
- `public/icons` - ikony klasyfikacji ruchow i figur,
- `public/sounds` - efekty dzwiekowe.

Do pracy:

- pokazac ikony klasyfikacji ruchow na zrzucie ekranu,
- opisac Stockfish jako zasob uruchamiany po stronie klienta.

## 6. Silniki szachowe w projekcie

### 6.1. Wspolny interfejs silnika

Plik:

- `src/engine/types.ts`

Interfejs `ChessEngine` zawiera:

- `init()` - inicjalizacja silnika,
- `shutdown()` - zamkniecie silnika,
- `stopSearch()` - zatrzymanie wyszukiwania,
- `isReady()` - sprawdzenie gotowosci,
- `getName()` - nazwa silnika,
- `evaluateGame()` - analiza calej partii,
- `evaluatePositionWithUpdate()` - analiza pojedynczej pozycji z aktualizacjami,
- `setSkillLevel()` - ustawienie poziomu umiejetnosci.

Do pracy:

- opisac jako abstrakcje pozwalajaca uzywac Stockfisha i autorskiego silnika przez wspolny interfejs.

### 6.2. Stockfish

Plik:

- `src/hooks/useChessEngine.ts`

Wazne elementy:

- sprawdzanie wsparcia WebAssembly,
- sprawdzanie wsparcia wielowatkowosci przez `SharedArrayBuffer`,
- wybor Stockfish 16.1 Lite lub Stockfish 11,
- komunikacja z workerem przez komendy UCI,
- ustawianie MultiPV,
- ustawianie poziomu umiejetnosci,
- analiza pozycji i partii,
- parsowanie wynikow przez `parseEvaluationResults`.

Komendy UCI wykorzystywane koncepcyjnie:

- `uci`,
- `isready`,
- `ucinewgame`,
- `position fen ...`,
- `go depth ...`,
- `bestmove`.

Do pracy:

- opisac Stockfish jako silnik referencyjny,
- dodac diagram sekwencji komunikacji UCI,
- dodac fragment opisu: aplikacja nie wysyla pozycji na serwer, tylko analizuje lokalnie w przegladarce.

### 6.3. Autorski silnik

Najwazniejsze pliki:

- `src/engine/custom/createCustomChessEngine.ts` - tworzenie silnika i puli workerow,
- `src/engine/custom/customEngine.worker.ts` - obsluga zadan w workerze,
- `src/engine/custom/customEngineWorkerMessages.ts` - typy komunikatow,
- `src/engine/custom/search/search.ts` - nowe wyszukiwanie,
- `src/engine/custom/search.ts` - starsze wyszukiwanie/fallback.

Wazne cechy:

- dziala po stronie klienta,
- korzysta z Web Workerow,
- potrafi analizowac wiele pozycji rownolegle,
- dzieli zadania miedzy workerami,
- sortuje pozycje wedlug szacowanej zlozonosci,
- zwraca wynik w tym samym formacie co Stockfish.

Do pracy:

- opisac jako glowny element wlasny pracy,
- porownac ze Stockfishem,
- wykorzystac w rozdziale o badaniach.

## 7. Typy danych do opisania w pracy

Plik:

- `src/types/eval.ts`

Najwazniejsze typy:

### 7.1. `PositionEval`

Opisuje wynik analizy pojedynczej pozycji.

Pola:

- `bestMove` - najlepszy ruch w formacie UCI,
- `moveClassification` - klasyfikacja ruchu,
- `opening` - rozpoznany debiut,
- `benchmark` - dane wydajnosci,
- `lines` - warianty analizy.

### 7.2. `LineEval`

Opisuje pojedynczy wariant silnika.

Pola:

- `pv` - principal variation, czyli sekwencja ruchow,
- `cp` - ocena w centipawnach,
- `mate` - informacja o macie,
- `depth` - glebokosc analizy,
- `multiPv` - numer wariantu.

### 7.3. `Accuracy`

Opisuje dokladnosc graczy.

Pola:

- `white` - dokladnosc bialych,
- `black` - dokladnosc czarnych.

### 7.4. `GameEval`

Opisuje wynik analizy calej partii.

Pola:

- `positions` - lista ocen pozycji,
- `accuracy` - dokladnosc graczy,
- `settings` - ustawienia analizy,
- `benchmark` - dane wydajnosci calej analizy.

### 7.5. `EvaluationBenchmark`

Opisuje dane do badan wydajnosci.

Pola:

- uzyty silnik,
- liczba analizowanych pozycji,
- zadana glebokosc,
- efektywna glebokosc,
- MultiPV,
- czas analizy,
- liczba wezlow,
- wezly na sekunde,
- sredni czas na pozycje,
- liczba klasyfikacji ruchow.

Do pracy:

- dodac diagram modelu danych,
- pokazac relacje `GameEval -> PositionEval -> LineEval`,
- uzyc `EvaluationBenchmark` w rozdziale badawczym.

## 8. Klasyfikacja ruchow

Najwazniejsze pliki:

- `src/types/enums.ts`,
- `src/utils/MoveClassification/moveClassification.ts`,
- `src/utils/MoveClassification/moveClassificationFunctions.ts`,
- `src/utils/chessUtils.ts`,
- `src/utils/winProbability.ts`.

Kategorie ruchow:

- `book` - ruch debiutowy,
- `brilliant` - bardzo dobry ruch, czesto zwiazany z poswieceniem,
- `great` - bardzo dobry ruch strategiczny,
- `best` - najlepszy ruch wskazany przez silnik,
- `excellent` - bardzo dobry ruch,
- `good` - dobry ruch,
- `inaccuracy` - niedokladnosc,
- `mistake` - blad,
- `blunder` - powazny blad,
- `missed_win` - przegapiona wygrana.

Glowne zalozenia algorytmu:

- system porownuje ocene pozycji przed i po ruchu,
- ocena jest przeliczana na prawdopodobienstwo wygranej,
- roznica prawdopodobienstwa wygranej wplywa na klasyfikacje,
- ruch zgodny z najlepszym ruchem silnika moze byc oznaczony jako `best`,
- ruchy z bazy debiutowej moga byc oznaczone jako `book`,
- specjalne warunki wykrywaja ruchy typu `brilliant`, `great` i `missed_win`.

Najwazniejsze funkcje:

- `getMovesClassification()` - glowna klasyfikacja ruchow,
- `getMoveBasicClassification()` - podstawowa klasyfikacja na podstawie zmiany win percentage,
- `isBrilliantMove()` - wykrywanie ruchow brilliant,
- `isGreatMove()` - wykrywanie ruchow great,
- `isMissedMate()` - wykrywanie przegapionego mata,
- `getPositionWinPercentage()` - prawdopodobienstwo wygranej z pozycji,
- `getLineWinPercentage()` - prawdopodobienstwo wygranej z wariantu.

Do pracy:

- koniecznie dodac flowchart klasyfikacji ruchow,
- opisac klasyfikacje jako mechanizm wspierajacy nauke uzytkownika,
- zaznaczyc, ze jakosc klasyfikacji zalezy od jakosci ewaluacji silnika.

Przykladowy diagram:

```text
Ruch -> czy pozycja jest z debiutu?
     -> tak: book
     -> nie: czy ruch jest najlepszym ruchem silnika?
          -> tak: best
          -> nie: czy przegapiono mata?
               -> tak: missed_win
               -> nie: czy ruch spelnia warunki brilliant/great?
                    -> tak: brilliant/great
                    -> nie: klasyfikacja na podstawie zmiany win percentage
```

## 9. Dokladnosc graczy

Najwazniejsze pliki:

- `src/utils/computeAccuracy.ts`,
- `src/utils/winProbability.ts`.

Mechanizm:

1. Dla kazdej pozycji system wyznacza prawdopodobienstwo wygranej.
2. Dla kazdego ruchu liczona jest zmiana prawdopodobienstwa.
3. Zmiana prawdopodobienstwa jest przeliczana na dokladnosc ruchu.
4. Dokladnosci sa rozdzielane na biale i czarne.
5. Wynik koncowy jest liczony z wykorzystaniem sredniej wazonej i harmonicznej.

Do pracy:

- opisac wzor przeliczenia centipawnow na win percentage,
- opisac sens accuracy jako miary jakosci gry,
- dodac schemat obliczen.

Diagram:

```text
oceny pozycji -> win percentage -> roznice po ruchach
              -> dokladnosc pojedynczych ruchow
              -> accuracy bialych i czarnych
```

## 10. Wykres przewagi i pasek ewaluacji

Najwazniejsze pliki:

- `src/features/ReviewPanel/GameAnalysisTab/components/Graph.tsx`,
- `src/features/Board/EvaluationBar.tsx`,
- `src/utils/chessUtils.ts`,
- `src/utils/winProbability.ts`.

Wykres:

- pokazuje zmiane oceny pozycji w czasie,
- kazdy punkt odpowiada pozycji po ruchu,
- klikniecie na wykres moze przeniesc do danej pozycji,
- punkty moga byc powiazane z klasyfikacja ruchow.

Pasek ewaluacji:

- pokazuje aktualna przewage bialych lub czarnych,
- korzysta z oceny pozycji albo informacji o macie,
- pomaga szybko zrozumiec stan partii.

Do pracy:

- opisac wizualizacje jako element edukacyjny,
- dodac zrzut ekranu wykresu,
- dodac zrzut ekranu paska ewaluacji.

## 11. Autorski silnik - indeks techniczny

### 11.1. Reprezentacja planszy

Plik:

- `src/engine/custom/core/board.ts`

Najwazniejsze struktury:

- `ChessBoard` - caly stan planszy,
- `PieceBitboards` - bitboardy figur,
- `UndoState` - dane potrzebne do cofniecia ruchu.

Stan planszy obejmuje:

- figury wedlug koloru i typu,
- zajetosc pol,
- tablice figur na polach,
- strone wykonujaca ruch,
- prawa do roszady,
- pole en passant,
- licznik polruchow,
- numer pelnego ruchu,
- pola krolow,
- hash Zobrista,
- stan ewaluacji,
- stos cofania ruchow.

Do pracy:

- dodac diagram reprezentacji planszy,
- opisac, dlaczego stan musi zawierac nie tylko figury, ale tez prawa do roszady, en passant i liczniki.

### 11.2. Bitboardy

Plik:

- `src/engine/custom/core/bitboard.ts`

Funkcje:

- ustawianie bitu,
- czyszczenie bitu,
- sprawdzanie bitu,
- iteracja po ustawionych bitach,
- liczenie figur.

Do pracy:

- dodac diagram planszy 8x8 i odpowiadajacych jej bitow,
- wyjasnic, ze bitboard pozwala efektywnie przechowywac pozycje figur.

### 11.3. Generowanie ruchow

Plik:

- `src/engine/custom/core/movegen.ts`

Funkcje:

- `generatePseudoLegalMoves()` - ruchy pseudo-legalne,
- `generateLegalMoves()` - ruchy legalne,
- generowanie ruchow pionow,
- generowanie ruchow skoczkow i kroli,
- generowanie ruchow figur dalekiego zasiegu,
- promocje,
- roszady,
- en passant.

Do pracy:

- opisac roznice miedzy ruchami pseudo-legalnymi i legalnymi,
- dodac diagram `ruchy pseudo-legalne -> makeMove -> test szacha -> undoMove -> ruchy legalne`.

### 11.4. Ataki i szach

Plik:

- `src/engine/custom/core/attacks.ts`

Zastosowanie:

- sprawdzanie, czy pole jest atakowane,
- sprawdzanie, czy krol jest w szachu,
- tablice atakow skoczka i krola,
- potrzebne do generowania legalnych ruchow i roszady.

Do pracy:

- opisac jako element kontroli legalnosci ruchow.

### 11.5. Wykonywanie i cofanie ruchow

Plik:

- `src/engine/custom/core/makeMove.ts`

Zastosowanie:

- wykonanie ruchu,
- cofniecie ruchu,
- obsluga promocji,
- obsluga bicia,
- obsluga en passant,
- obsluga roszady,
- aktualizacja praw do roszady,
- aktualizacja hasha,
- aktualizacja ewaluacji.

Do pracy:

- dodac diagram `UndoState`,
- opisac, ze cofanie ruchow jest konieczne w przeszukiwaniu drzewa gry.

### 11.6. FEN

Plik:

- `src/engine/custom/core/fen.ts`

Zastosowanie:

- parsowanie pozycji FEN,
- tworzenie pozycji startowej,
- ustawianie figur i praw pozycji.

Do pracy:

- opisac FEN jako format wymiany pozycji miedzy aplikacja a silnikiem.

### 11.7. Kodowanie ruchow

Plik:

- `src/engine/custom/core/move.ts`

Zastosowanie:

- kodowanie ruchu jako liczby,
- odczyt pola startowego,
- odczyt pola docelowego,
- odczyt figury,
- odczyt promocji,
- odczyt flag ruchu,
- konwersja do UCI.

Do pracy:

- opisac jako optymalizacje reprezentacji ruchu.

### 11.8. Funkcja oceny

Plik:

- `src/engine/custom/core/evaluate.ts`

Skladniki oceny:

- material,
- piece-square tables,
- para goncow,
- struktura pionow,
- piony izolowane,
- piony zdwojone,
- piony wolne,
- mobilnosc,
- rozwoj figur,
- kontrola centrum,
- bezpieczenstwo krola.

Do pracy:

- dodac diagram: `material + PST + mobilnosc + piony + centrum + krol = ocena`,
- opisac, ze ocena dodatnia oznacza przewage bialych, a ujemna przewage czarnych.

### 11.9. Perft

Plik:

- `src/engine/custom/core/perft.ts`

Zastosowanie:

- testowanie poprawnosci generatora ruchow,
- porownywanie liczby pozycji z wartosciami referencyjnymi,
- wykrywanie bledow w roszadzie, promocji, biciu en passant i szachach.

Zawarte przypadki:

- pozycja startowa,
- pozycje z roszadami,
- pozycje z promocjami,
- pozycje testujace zlozone przypadki.

Do pracy:

- uzyc w rozdziale testow,
- dodac tabele: FEN, glebokosc, wynik oczekiwany, wynik silnika, status.

### 11.10. Zobrist hashing

Plik:

- `src/engine/custom/core/zobrist.ts`

Zastosowanie:

- tworzenie hasha pozycji,
- identyfikacja pozycji w tablicy transpozycji,
- szybkie porownywanie stanow planszy.

Do pracy:

- opisac razem z tablica transpozycji,
- dodac diagram `pozycja -> hash -> lookup w tabeli`.

### 11.11. Wyszukiwanie

Plik:

- `src/engine/custom/search/search.ts`

Glowne elementy:

- iterative deepening,
- Principal Variation Search,
- alfa-beta pruning,
- aspiration window,
- MultiPV,
- null move pruning,
- late move reductions,
- quiescence search,
- sortowanie ruchow,
- wykrywanie mata,
- budowanie wynikow `PositionEval`,
- statystyki benchmarkowe.

Do pracy:

- opisac jako glowny algorytm silnika,
- dodac drzewo alfa-beta,
- dodac schemat iterative deepening.

### 11.12. Quiescence search

Plik:

- `src/engine/custom/search/quiescence.ts`

Zastosowanie:

- dodatkowe przeszukiwanie pozycji taktycznych,
- ograniczenie efektu horyzontu,
- analiza bic i pozycji niestabilnych.

Do pracy:

- opisac po minimax/alfa-beta,
- pokazac, ze silnik nie konczy analizy w oczywistej wymianie materialu.

### 11.13. Sortowanie ruchow

Plik:

- `src/engine/custom/search/moveOrdering.ts`

Techniki:

- ruch z tablicy transpozycji,
- bicie,
- promocja,
- killer moves,
- history heuristic,
- preferencja centrum.

Do pracy:

- opisac, ze dobre sortowanie ruchow zwieksza skutecznosc alfa-beta pruning.

### 11.14. Tablica transpozycji

Plik:

- `src/engine/custom/search/transpositionTable.ts`

Przechowywane dane:

- klucz pozycji,
- glebokosc,
- ocena,
- typ wpisu: exact, lower, upper,
- najlepszy ruch,
- generacja.

Do pracy:

- dodac schemat tablicy transpozycji,
- opisac, ze ten sam stan moze powstac rozna kolejnoscia ruchow.

### 11.15. Zarzadzanie czasem

Plik:

- `src/engine/custom/search/timeManager.ts`

Zastosowanie:

- limitowanie czasu analizy,
- sprawdzanie, czy wyszukiwanie powinno zostac przerwane,
- oddawanie sterowania workerowi.

Do pracy:

- opisac jako praktyczny element dzialania w przegladarce.

## 12. Web Workery i analiza po stronie klienta

Najwazniejsze pliki:

- `src/engine/custom/createCustomChessEngine.ts`,
- `src/engine/custom/customEngine.worker.ts`,
- `src/hooks/useChessEngine.ts`.

Zastosowanie:

- analiza pozycji w tle,
- brak blokowania UI,
- rownolegla analiza pozycji,
- obsluga postepu analizy,
- zatrzymywanie wyszukiwania.

Do pracy:

- dodac diagram: glowny watek UI + workery,
- podkreslic, ze aplikacja nie wymaga serwera obliczeniowego.

Schemat:

```text
React UI -> zadanie analizy -> Web Worker
         <- postep/wynik    <- silnik szachowy
```

## 13. Integracje z platformami szachowymi

Najwazniejsze pliki:

- `src/features/LoadGame/hooks/useLichessUserRecentGames.ts`,
- `src/features/LoadGame/hooks/useChessComUserRecentGames .ts`,
- `src/types/chessWebsites.ts`,
- `src/features/LoadGame/components/ChessPlatformInput.tsx`.

Zastosowanie:

- pobieranie ostatnich partii uzytkownika,
- wybor partii do analizy,
- alternatywa dla recznego wklejania PGN.

Do pracy:

- jezeli zakres oficjalny ma tylko PGN, opisac to jako rozszerzenie,
- nie robic z tego glownego tematu pracy.

## 14. Cache i local storage

Najwazniejsze pliki:

- `src/hooks/useLocalStorage.ts`,
- `src/hooks/useAtomLocalStorage.ts`,
- `src/stores/states.ts`,
- `src/features/ReviewPanel/PanelHeader/hooks/useAnalyze.ts`.

Zastosowanie:

- zapisywanie ustawien silnika,
- zapisywanie preferencji uzytkownika,
- zapisywanie ewaluacji pozycji,
- ograniczanie ponownego liczenia tych samych pozycji.

Do pracy:

- opisac jako lokalne przechowywanie danych po stronie klienta,
- powiazac z wymaganiem aplikacji webowej dzialajacej lokalnie.

## 15. Elementy do opisania w rozdziale "Analiza wymagan"

### 15.1. Wymagania funkcjonalne

System powinien umozliwiac:

- import partii w formacie PGN,
- prezentacje partii na interaktywnej szachownicy,
- przechodzenie po ruchach partii,
- analize pozycji silnikiem szachowym,
- wybor silnika analizy,
- ustawienie glebokosci analizy,
- ustawienie liczby wariantow MultiPV,
- klasyfikacje ruchow,
- obliczanie dokladnosci graczy,
- wyswietlanie wykresu przewagi,
- wyswietlanie paska ewaluacji,
- wyswietlanie najlepszych wariantow,
- prezentacje liczby ruchow w poszczegolnych kategoriach,
- zapisywanie ustawien po stronie klienta.

### 15.2. Wymagania niefunkcjonalne

System powinien:

- dzialac jako aplikacja webowa,
- dzialac po stronie klienta,
- nie wymagac serwera obliczeniowego,
- miec responsywny interfejs,
- zachowywac plynnosc UI podczas analizy,
- umozliwiac uruchomienie lokalne,
- umozliwiac wdrozenie jako statyczna aplikacja,
- dzialac w nowoczesnych przegladarkach.

### 15.3. Przypadki uzycia

Glowne przypadki uzycia:

- wczytanie partii PGN,
- wybor partii z platformy,
- uruchomienie analizy,
- wybor silnika,
- zmiana parametrow analizy,
- przejscie do wybranego ruchu,
- sprawdzenie klasyfikacji ruchu,
- sprawdzenie accuracy,
- analiza wykresu przewagi,
- odczyt najlepszego wariantu.

Diagram:

- diagram przypadkow uzycia UML z aktorem `Uzytkownik`.

## 16. Elementy do opisania w rozdziale "Projekt architektury"

### 16.1. Warstwy systemu

Proponowany opis warstw:

- warstwa interfejsu uzytkownika,
- warstwa stanu aplikacji,
- warstwa importu partii,
- warstwa analizy silnikowej,
- warstwa klasyfikacji ruchow,
- warstwa wizualizacji wynikow,
- warstwa przechowywania lokalnego.

### 16.2. Diagram architektury

Diagram powinien pokazywac:

- przegladarke uzytkownika,
- React UI,
- Jotai state,
- modul importu PGN,
- modul analizy,
- Stockfish WASM,
- autorski silnik,
- Web Workery,
- local storage,
- komponenty wizualizacji.

### 16.3. Diagram przeplywu danych

Diagram powinien pokazywac:

```text
PGN -> chess.js -> historia ruchow -> FEN-y
    -> silnik -> PositionEval -> klasyfikacja
    -> GameEval -> UI
```

### 16.4. Diagram sekwencji analizy

Diagram powinien pokazywac:

1. Uzytkownik klika `Analyze`.
2. UI pobiera liste pozycji FEN.
3. Aplikacja wysyla zadania do silnika.
4. Silnik zwraca wyniki.
5. System klasyfikuje ruchy.
6. System zapisuje wynik.
7. UI aktualizuje wykres, accuracy i liste ruchow.

## 17. Elementy do opisania w rozdziale "Implementacja systemu"

W tym rozdziale warto opisac:

- strukture projektu,
- import partii,
- szachownice,
- panel analizy,
- wykres,
- pasek ewaluacji,
- liste ruchow,
- klasyfikacje ruchow,
- accuracy,
- integracje Stockfisha,
- ustawienia silnika,
- cache/local storage.

Najwazniejsze zrzuty ekranu:

- ekran startowy z przyciskiem ladowania partii,
- okno importu PGN,
- szachownica z paskiem ewaluacji,
- panel analizy,
- lista ruchow z ikonami klasyfikacji,
- wykres przewagi,
- ustawienia silnika.

## 18. Elementy do opisania w rozdziale "Implementacja autorskiego silnika"

W tym rozdziale warto opisac:

- cel implementacji wlasnego silnika,
- reprezentacje planszy,
- bitboardy,
- generowanie ruchow,
- wykonywanie i cofanie ruchow,
- parsowanie FEN,
- funkcje oceny,
- minimax/alfa-beta/PVS,
- quiescence search,
- tablice transpozycji,
- move ordering,
- Web Workery,
- benchmarki.

Najwazniejsze diagramy:

- schemat bitboardu,
- diagram generowania ruchow,
- diagram undo stack,
- diagram funkcji oceny,
- drzewo alfa-beta,
- schemat tablicy transpozycji,
- diagram podzialu zadan na workery.

## 19. Elementy do opisania w rozdziale "Badania i testy"

### 19.1. Testy perft

Cel:

- sprawdzic poprawnosc generatora ruchow.

Dane do tabeli:

- FEN,
- glebokosc,
- wynik oczekiwany,
- wynik uzyskany,
- status.

Plik z kodem:

- `src/engine/custom/core/perft.ts`.

### 19.2. Testy importu PGN/FEN

Cel:

- sprawdzic, czy partie sa poprawnie wczytywane,
- sprawdzic, czy generowane sa poprawne pozycje FEN.

Pliki:

- `src/utils/chessUtils.ts`,
- `src/features/LoadGame/LoadGame.tsx`.

### 19.3. Porownanie Stockfish vs autorski silnik

Metryki:

- najlepszy ruch,
- ocena pozycji,
- czas analizy,
- liczba wezlow,
- wezly na sekunde,
- zgodnosc najlepszego ruchu,
- roznica oceny w centipawnach.

Wykresy:

- zgodnosc najlepszych ruchow,
- srednia roznica oceny,
- czas analizy.

### 19.4. Wplyw glebokosci analizy

Badanie:

- uruchomic analize na roznych glebokosciach,
- porownac czas,
- porownac stabilnosc oceny,
- porownac klasyfikacje ruchow.

### 19.5. Wplyw MultiPV

Badanie:

- porownac MultiPV 2, 3, 4, 5, 6,
- sprawdzic wplyw na alternatywne warianty,
- sprawdzic wplyw na klasyfikacje ruchow.

### 19.6. Testy UI

Scenariusze:

- import PGN,
- uruchomienie analizy,
- przechodzenie po ruchach,
- zmiana orientacji planszy,
- wybor silnika,
- zmiana glebokosci,
- odczyt wykresu,
- odczyt accuracy.

## 20. Proponowany spis tresci pracy

### 1. Wstep - okolo 4-5 stron

1.1. Wprowadzenie  
1.2. Cel pracy  
1.3. Zakres pracy  
1.4. Uzasadnienie wyboru tematu  
1.5. Struktura pracy

### 2. Analiza istniejacych rozwiazan - okolo 6-8 stron

2.1. Charakterystyka systemow do analizy partii szachowych  
2.2. Chess.com Game Review  
2.3. Lichess Analysis Board  
2.4. Stockfish jako referencyjny silnik szachowy  
2.5. Porownanie funkcjonalnosci istniejacych rozwiazan  
2.6. Wnioski z analizy i luka projektowa

### 3. Podstawy teoretyczne analizy szachowej - okolo 10-13 stron

3.1. Reprezentacja pozycji szachowej  
3.2. Notacja PGN  
3.3. Notacja FEN  
3.4. Protokol UCI  
3.5. Ocena pozycji szachowej  
3.6. Generowanie legalnych ruchow  
3.7. Algorytm minimax i alfa-beta pruning  
3.8. Principal Variation Search  
3.9. Quiescence search  
3.10. Tablice transpozycji i haszowanie Zobrista  
3.11. MultiPV i analiza wielu wariantow

### 4. Zalozenia i wymagania systemu - okolo 6-8 stron

4.1. Zalozenia projektowe  
4.2. Wymagania funkcjonalne  
4.3. Wymagania niefunkcjonalne  
4.4. Przypadki uzycia  
4.5. Scenariusz analizy partii przez uzytkownika

### 5. Projekt architektury aplikacji - okolo 8-10 stron

5.1. Ogolna architektura systemu  
5.2. Architektura frontendowa  
5.3. Zarzadzanie stanem aplikacji  
5.4. Komunikacja z silnikiem szachowym  
5.5. Web Workery i analiza w tle  
5.6. Model danych aplikacji  
5.7. Przeplyw danych w systemie

### 6. Implementacja systemu analizy partii - okolo 14-18 stron

6.1. Struktura projektu  
6.2. Import i parsowanie partii PGN  
6.3. Interaktywna szachownica  
6.4. Panel analizy partii  
6.5. Wykres przewagi pozycyjnej  
6.6. Pasek ewaluacji  
6.7. Klasyfikacja ruchow  
6.8. Obliczanie dokladnosci graczy  
6.9. Obsluga Stockfish WASM  
6.10. Ustawienia analizy  
6.11. Zapisywanie wynikow po stronie klienta

### 7. Implementacja autorskiego silnika szachowego - okolo 18-22 strony

7.1. Cel implementacji wlasnego silnika  
7.2. Reprezentacja planszy i figur  
7.3. Bitboardy  
7.4. Generowanie ruchow pseudo-legalnych  
7.5. Generowanie ruchow legalnych  
7.6. Wykonywanie i cofanie ruchow  
7.7. Parsowanie FEN  
7.8. Funkcja oceny pozycji  
7.9. Wyszukiwanie najlepszego ruchu  
7.10. Quiescence search  
7.11. Optymalizacje wyszukiwania  
7.12. Tablica transpozycji  
7.13. Rownolegla analiza pozycji

### 8. Badania, testy i ewaluacja dzialania systemu - okolo 14-18 stron

8.1. Cel i zakres testow  
8.2. Testy poprawnosci generatora ruchow - perft  
8.3. Testy importu PGN i obslugi pozycji FEN  
8.4. Porownanie autorskiego silnika ze Stockfishem  
8.5. Pomiar czasu analizy partii  
8.6. Wplyw glebokosci analizy na wyniki  
8.7. Wplyw MultiPV na klasyfikacje ruchow  
8.8. Testy interfejsu uzytkownika  
8.9. Wnioski z testow

### 9. Wdrozenie i uruchomienie aplikacji - okolo 3-5 stron

9.1. Srodowisko uruchomieniowe  
9.2. Uruchomienie lokalne  
9.3. Budowanie aplikacji produkcyjnej  
9.4. Docker i konfiguracja serwera  
9.5. Ograniczenia aplikacji webowej dzialajacej po stronie klienta

### 10. Podsumowanie i kierunki dalszego rozwoju - okolo 4-6 stron

10.1. Podsumowanie wykonanej pracy  
10.2. Realizacja celu pracy  
10.3. Ocena jakosci systemu  
10.4. Ograniczenia rozwiazania  
10.5. Mozliwosci dalszego rozwoju  
10.6. Wnioski koncowe

### 11. Bibliografia - okolo 3-5 stron

### 12. Zalaczniki - opcjonalnie 5-10 stron

## 21. Lista diagramow do wykonania

### Diagram 1. Przypadki uzycia

Rozdzial: 4.4  
Typ: UML use case  
Pokazuje:

- uzytkownika,
- import PGN,
- uruchomienie analizy,
- wybor silnika,
- zmiane parametrow,
- przeglad ruchow,
- odczyt klasyfikacji,
- odczyt accuracy,
- analize wykresu.

### Diagram 2. Diagram aktywnosci analizy partii

Rozdzial: 4.5  
Typ: UML activity diagram  
Pokazuje:

- wczytanie PGN,
- walidacje,
- generowanie FEN,
- uruchomienie silnika,
- klasyfikacje,
- prezentacje wynikow.

### Diagram 3. Architektura aplikacji

Rozdzial: 5.1  
Typ: diagram architektury  
Pokazuje:

- przegladarke,
- React UI,
- Jotai,
- modul importu,
- modul analizy,
- Stockfish WASM,
- Custom engine,
- Web Workery,
- local storage.

### Diagram 4. Przeplyw danych

Rozdzial: 5.7  
Typ: data flow diagram  
Pokazuje:

- PGN,
- ruchy,
- FEN-y,
- silnik,
- ewaluacje,
- klasyfikacje,
- UI.

### Diagram 5. Sekwencja uruchomienia analizy

Rozdzial: 5.4 albo 6.9  
Typ: sequence diagram  
Pokazuje:

- klikniecie `Analyze`,
- pobranie FEN-ow,
- wyslanie zadan do silnika,
- zwrot wynikow,
- aktualizacje postepu,
- zapis wyniku,
- odswiezenie UI.

### Diagram 6. Komunikacja UCI ze Stockfishem

Rozdzial: 6.9  
Typ: sequence diagram  
Pokazuje:

- `uci`,
- `uciok`,
- `isready`,
- `readyok`,
- `position fen`,
- `go depth`,
- `info depth score pv`,
- `bestmove`.

### Diagram 7. Flowchart klasyfikacji ruchow

Rozdzial: 6.7  
Typ: flowchart  
Pokazuje:

- book,
- best,
- missed win,
- brilliant,
- great,
- klasyfikacje na podstawie win percentage.

### Diagram 8. Model danych ewaluacji

Rozdzial: 5.6  
Typ: diagram modelu danych  
Pokazuje:

- `GameEval`,
- `PositionEval`,
- `LineEval`,
- `Accuracy`,
- `EvaluationBenchmark`,
- `EngineSettings`.

### Diagram 9. Bitboardy

Rozdzial: 7.3  
Typ: schemat techniczny  
Pokazuje:

- plansze 8x8,
- indeksy pol,
- bity odpowiadajace polom,
- osobny bitboard dla figur.

### Diagram 10. Generowanie ruchow legalnych

Rozdzial: 7.5  
Typ: flowchart  
Pokazuje:

- pozycja,
- ruchy pseudo-legalne,
- wykonanie ruchu,
- sprawdzenie szacha,
- cofniecie ruchu,
- lista ruchow legalnych.

### Diagram 11. Undo stack

Rozdzial: 7.6  
Typ: schemat danych  
Pokazuje:

- ruch,
- zbita figura,
- prawa roszady,
- en passant,
- liczniki,
- hash,
- eval state,
- pozycje krolow.

### Diagram 12. Funkcja oceny pozycji

Rozdzial: 7.8  
Typ: diagram skladnikow  
Pokazuje:

- material,
- piece-square tables,
- piony,
- mobilnosc,
- centrum,
- rozwoj,
- bezpieczenstwo krola,
- koncowa ocena.

### Diagram 13. Alfa-beta / PVS

Rozdzial: 7.9  
Typ: drzewo wyszukiwania  
Pokazuje:

- warianty,
- alfa,
- beta,
- odciecia,
- principal variation.

### Diagram 14. Tablica transpozycji

Rozdzial: 7.12  
Typ: schemat  
Pokazuje:

- pozycja,
- hash Zobrista,
- wpis w tabeli,
- depth,
- score,
- flag,
- bestMove.

### Diagram 15. Rownolegla analiza pozycji

Rozdzial: 7.13  
Typ: diagram przeplywu  
Pokazuje:

- lista FEN,
- sortowanie wedlug zlozonosci,
- worker 1,
- worker 2,
- worker 3,
- scalanie wynikow.

### Diagram 16. Wykresy badawcze

Rozdzial: 8  
Typ: wykresy/tabele  
Pokazuje:

- czas analizy wzgledem glebokosci,
- czas analizy wzgledem liczby pozycji,
- zgodnosc najlepszego ruchu ze Stockfishem,
- roznice ocen w centipawnach,
- wyniki perft.

## 22. Proponowane tabele do pracy

### Tabela 1. Porownanie istniejacych rozwiazan

Kolumny:

- funkcja,
- Chess.com,
- Lichess,
- projektowany system.

Wiersze:

- import PGN,
- analiza silnikowa,
- klasyfikacja ruchow,
- accuracy,
- wykres przewagi,
- Stockfish,
- wlasny silnik,
- analiza po stronie klienta,
- MultiPV.

### Tabela 2. Wymagania funkcjonalne

Kolumny:

- identyfikator,
- wymaganie,
- opis,
- priorytet,
- status realizacji.

### Tabela 3. Wymagania niefunkcjonalne

Kolumny:

- identyfikator,
- wymaganie,
- opis,
- sposob realizacji.

### Tabela 4. Kategorie klasyfikacji ruchow

Kolumny:

- kategoria,
- opis,
- znaczenie edukacyjne,
- przyklad interpretacji.

### Tabela 5. Testy perft

Kolumny:

- FEN,
- glebokosc,
- wynik oczekiwany,
- wynik uzyskany,
- status.

### Tabela 6. Porownanie silnikow

Kolumny:

- pozycja,
- najlepszy ruch Stockfish,
- najlepszy ruch custom engine,
- zgodnosc,
- ocena Stockfish,
- ocena custom engine,
- roznica,
- czas Stockfish,
- czas custom engine.

### Tabela 7. Wplyw glebokosci analizy

Kolumny:

- silnik,
- glebokosc,
- czas,
- liczba wezlow,
- nodes/s,
- zgodnosc z referencja.

### Tabela 8. Wplyw MultiPV

Kolumny:

- MultiPV,
- czas analizy,
- liczba wariantow,
- zmiana klasyfikacji,
- uwagi.

## 23. Proponowane zrzuty ekranu

Do pracy warto przygotowac:

1. Ekran startowy aplikacji.
2. Okno importu PGN.
3. Wybor partii z Lichess/Chess.com, jezeli bedzie opisany jako rozszerzenie.
4. Szachownica z paskiem ewaluacji.
5. Panel analizy z accuracy.
6. Lista wariantow silnika.
7. Lista ruchow z ikonami klasyfikacji.
8. Wykres przewagi.
9. Ustawienia silnika.
10. Benchmark analizy.

## 24. Ograniczenia projektu do opisania

W pracy warto uczciwie opisac:

- autorski silnik jest slabszy od Stockfisha,
- jakosc klasyfikacji zalezy od jakosci ewaluacji,
- analiza po stronie klienta zalezy od sprzetu uzytkownika,
- bardzo gleboka analiza moze byc czasochlonna,
- WebAssembly i SharedArrayBuffer moga zalezec od przegladarki i konfiguracji,
- klasyfikacje typu `brilliant` i `great` sa heurystyczne,
- system nie przechowuje centralnej bazy analiz uzytkownikow.

## 25. Kierunki dalszego rozwoju

Mozliwe kierunki rozwoju:

- rozbudowa autorskiego silnika,
- ulepszenie funkcji oceny pozycji,
- ulepszenie algorytmow klasyfikacji ruchow,
- dodanie ksiazki debiutowej,
- dodanie tablebase do koncowek,
- rozpoznawanie motywow taktycznych,
- historia analiz uzytkownika,
- konta uzytkownikow,
- eksport raportu z analizy,
- bardziej rozbudowany tryb treningowy,
- rekomendacje cwiczen na podstawie bledow,
- testy E2E,
- porownanie z wieksza baza partii testowych.

## 26. Bibliografia - czego szukac

Kategorie zrodel:

- dokumentacja Stockfish,
- dokumentacja protokolu UCI,
- specyfikacja PGN,
- opis FEN,
- Chess Programming Wiki,
- minimax,
- alfa-beta pruning,
- Principal Variation Search,
- quiescence search,
- Zobrist hashing,
- transposition tables,
- Web Workers,
- WebAssembly,
- React,
- TypeScript,
- Vite,
- Lichess API,
- Chess.com public API.

## 27. Najwazniejsze pliki do cytowania/opisywania

Jezeli podczas pisania pracy trzeba szybko znalezc implementacje, zaczac od tych plikow:

- `src/pages/GameReview.tsx` - glowny widok.
- `src/features/Board/Board.tsx` - szachownica.
- `src/features/ReviewPanel/ReviewPanel.tsx` - panel analizy.
- `src/features/ReviewPanel/PanelHeader/hooks/useAnalyze.ts` - analiza partii.
- `src/hooks/useChessEngine.ts` - Stockfish i wybor silnika.
- `src/engine/custom/createCustomChessEngine.ts` - autorski silnik jako usluga.
- `src/engine/custom/customEngine.worker.ts` - worker autorskiego silnika.
- `src/engine/custom/core/board.ts` - stan planszy.
- `src/engine/custom/core/movegen.ts` - generowanie ruchow.
- `src/engine/custom/core/makeMove.ts` - wykonywanie/cofanie ruchow.
- `src/engine/custom/core/evaluate.ts` - funkcja oceny.
- `src/engine/custom/search/search.ts` - wyszukiwanie.
- `src/engine/custom/search/quiescence.ts` - quiescence.
- `src/engine/custom/search/transpositionTable.ts` - tablica transpozycji.
- `src/engine/custom/core/perft.ts` - testy generatora ruchow.
- `src/utils/MoveClassification/moveClassification.ts` - klasyfikacja ruchow.
- `src/utils/computeAccuracy.ts` - accuracy.
- `src/utils/winProbability.ts` - win percentage.
- `src/utils/parseEvaluationResults.ts` - parser wynikow Stockfisha.
- `src/stores/states.ts` - stan aplikacji.
- `src/types/eval.ts` - model danych ewaluacji.
- `src/types/enums.ts` - klasyfikacje, silniki, zrodla partii.

## 28. Jednozdaniowy opis projektu do streszczenia

Praca przedstawia projekt i implementacje webowego systemu do analizy partii szachowych, ktory dziala po stronie klienta, wykorzystuje silnik Stockfish oraz autorski silnik szachowy, a wyniki analizy prezentuje w formie klasyfikacji ruchow, dokladnosci graczy, wariantow silnikowych oraz wizualizacji zmian przewagi pozycyjnej.

## 29. Krotki opis po angielsku

The thesis presents the design and implementation of a web-based chess game analysis system that runs on the client side, uses the Stockfish engine and a custom chess engine, and presents analysis results through move classification, player accuracy, engine lines, and visualizations of positional advantage changes.

