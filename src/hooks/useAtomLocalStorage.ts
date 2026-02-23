import { PrimitiveAtom, SetStateAction, useAtom } from "jotai";
import { useEffect, useRef } from "react";

export function useAtomLocalStorage<T>(
  storageKey: string,
  atomInstance: PrimitiveAtom<T>,
): [T, (update: SetStateAction<T>) => void] {
  const initializedKeyRef = useRef<string | null>(null);
  const [value, setValue] = useAtom(atomInstance);

  useEffect(() => {
    const storedItem = window.localStorage.getItem(storageKey);
    if (storedItem) {
      setValue(parseLocalStorageValue<T>(storedItem));
    }
    initializedKeyRef.current = storageKey;
  }, [storageKey, setValue]);

  useEffect(() => {
    if (initializedKeyRef.current !== storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue];
}

function parseLocalStorageValue<T>(item: string): T {
  return (item === "undefined" ? undefined : JSON.parse(item)) as T;
}
