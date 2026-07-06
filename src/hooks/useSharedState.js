import { useEffect, useRef, useState } from 'react';
import { onSnapshot, setDoc } from 'firebase/firestore';
import { sharedStateDoc } from '../lib/firebase';

const WRITE_DEBOUNCE_MS = 500;

export function useSharedState(defaults) {
  const [state, setState] = useState(defaults);
  const [isLoaded, setIsLoaded] = useState(false);
  const writeTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(sharedStateDoc, (snapshot) => {
      if (snapshot.exists()) {
        setState((prev) => ({ ...prev, ...snapshot.data() }));
      } else {
        setDoc(sharedStateDoc, defaults);
      }
      setIsLoaded(true);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateState = (partial) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      clearTimeout(writeTimeoutRef.current);
      writeTimeoutRef.current = setTimeout(() => {
        setDoc(sharedStateDoc, next);
      }, WRITE_DEBOUNCE_MS);
      return next;
    });
  };

  return [state, updateState, isLoaded];
}
