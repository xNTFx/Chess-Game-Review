# Autorski silnik szachowy

Silnik znajduje się w `src/engine/custom`. Warstwa `core` przechowuje stan
planszy w tablicach bitowych 64-bitowych reprezentowanych przez pary
`Uint32`, natomiast warstwa `search` odpowiada za decyzję o ruchu. Rozdzielenie
tych warstw umożliwia niezależne testowanie generatora ruchów, funkcji oceny i
algorytmu wyszukiwania.

## Algorytmy

- `generateLegalMoves` tworzy ruchy pseudolegalne, wykonuje je i odrzuca ruchy
  pozostawiające własnego króla pod szachem. Koszt pojedynczego generowania jest
  proporcjonalny do liczby ruchów kandydackich i kosztu `make/undo`.
- Wyszukiwanie wykorzystuje negamax z Principal Variation Search i alfa-beta.
  W najgorszym przypadku ma złożoność `O(b^d)`, a przy dobrym porządku ruchów
  alfa-beta zbliża się do `O(b^(d/2))`.
- Iteracyjne pogłębianie zachowuje ostatni ukończony wynik, dzięki czemu limit
  czasu nie zwraca niepełnej głównej wariacji.
- Quiescence Search analizuje bicia, promocje i obrony w szachu. Ograniczenie
  głębokości oraz delta pruning ograniczają eksplozję drzewa, ale mogą pomijać
  odległe konsekwencje taktyczne.
- Tablica transpozycji korzysta z 64-bitowego hasha Zobrista i przechowuje
  głębokość, wynik, typ granicy oraz najlepszy ruch. Hash jest aktualizowany
  inkrementalnie przy `makeMove`.
- Sortowanie wykorzystuje ruch z TT, MVV-LVA, promocje, ruchy killer i historię.
  Nie zmienia wyniku minimax, ale istotnie wpływa na liczbę odcięć.

## Funkcja oceny

Profil pozycyjny łączy materiał, tablice wartości pól, parę gońców, strukturę
pionów (izolowane, zdublowane i wolne piony), mobilność, rozwój, centrum oraz
osłonę króla. Profil `material` jest kontrolą eksperymentalną, przydatną do
oceny wpływu heurystyk pozycyjnych.

## Eksperymenty i testy

`runEngineExperiments` w `src/engine/custom/experiments.ts` uruchamia te same
pozycje z wyłączonym alfa-beta, sortowaniem, TT, quiescence oraz z oceną
materialną. Wyniki można przekonwertować do CSV przez
`experimentResultsToCsv` i przedstawić w tabeli lub wykresie. Każdy wynik
zawiera czas, liczbę węzłów, NPS, odcięcia, trafienia TT i węzły quiescence.

`runPerftSuite` w `src/engine/custom/core/perft.ts` zawiera klasyczne pozycje
testowe (w tym roszady, en passant, promocje i związania). Perft służy do
walidacji generatora legalnych ruchów niezależnie od siły oceny.

## Ograniczenia

Silnik nie jest konkurentem dla Stockfisha: nie ma tabel końcówek Syzygy,
otwarciowej książki binarnej ani wyspecjalizowanych magic bitboards. Obecna
obsługa faz partii jest realizowana przez tablice pozycyjne i heurystyki
struktury pionów; jest to świadomy, łatwy do opisania punkt wyjścia do dalszych
eksperymentów.
