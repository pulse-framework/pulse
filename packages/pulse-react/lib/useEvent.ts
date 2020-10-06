import { Event, EventCallbackFunc, Pulse } from '@pulsejs/core';
import * as React from 'react';
// useEvent helper for using Events inside React components as hooks
export function useEvent<E extends Event>(event: E, callback: EventCallbackFunc<E['payload']>, pulseInstance?: Pulse) {
  // get the instance of Pulse
  if (!pulseInstance) pulseInstance = event.instance();
  React.useEffect(() => {
    // call the event on component mount
    const unsub = event.on(callback);
    // remove the event on component unmount
    return () => unsub();
  }, []);
}
