import { PrimitiveAtom, SetStateAction, useAtom } from "jotai";
import { useEffect, useState } from "react";

export function useAtomLocalStorage<T>(
  storageKey: string,
  atomInstance: PrimitiveAtom<T>,
): [T, (update: SetStateAction<T>) => void] {
  const [currentKey, setCurrentKey] = useState("");
  const [value, setValue] = useAtom(atomInstance);

  useEffect(() => {
    const storedItem = window.localStorage.getItem(storageKey);
    if (storedItem) {
      setValue(parseLocalStorageValue<T>(storedItem));
    }
    setCurrentKey(storageKey);
  }, [storageKey, setValue]);

  useEffect(() => {
    if (currentKey !== storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, currentKey, value]);

  return [value, setValue];
}

function parseLocalStorageValue<T>(item: string): T {
  return item === "undefined" ? undefined : JSON.parse(item);
}
