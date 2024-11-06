import { Dispatch, SetStateAction, useEffect, useState } from "react";

type UpdateState<T> = Dispatch<SetStateAction<T>>;

export function useLocalStorage<T = string | number | boolean | undefined>(
  storageKey: string,
  defaultValue: T,
): [T | null, UpdateState<T>] {
  const [storedItem, setStoredItem] = useState<T | null>(null);

  useEffect(() => {
    const localStorageItem = window.localStorage.getItem(storageKey);
    if (localStorageItem) {
      setStoredItem(parseLocalStorageValue<T>(localStorageItem));
    } else {
      setStoredItem(defaultValue);
    }
  }, [storageKey, defaultValue]);

  const updateStoredItem: UpdateState<T> = (value) => {
    if (storedItem === null) {
      throw new Error("LocalStorage value isn't initialized yet.");
    }
    const newValue = value instanceof Function ? value(storedItem) : value;
    window.localStorage.setItem(storageKey, JSON.stringify(newValue));
    setStoredItem(newValue);
  };

  return [storedItem, updateStoredItem];
}

function parseLocalStorageValue<T>(item: string): T {
  return item === "undefined" ? undefined : JSON.parse(item);
}
