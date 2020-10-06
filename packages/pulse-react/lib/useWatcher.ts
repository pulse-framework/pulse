import * as React from 'react';
import { State } from '@pulsejs/core';

export function useWatcher<T = any>(state: State<T>, callback: (value: T) => void) {
  React.useEffect(() => {
    const key = Math.floor(Math.random() * 1000);
    state.watch(key, callback);
    return () => state.removeWatcher(key);
  }, []);
}
