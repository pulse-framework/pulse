import { Pulse, State, normalizeDeps, getPulseInstance, Group } from '@pulsejs/core';
import React from 'react';

globalThis.React1 = React;

// usePulse returns the State value, or an array of State values, not the instances themselves.
// This type will extract the inferred value of State
// We use a TypeScript ternary to detect which type of Pulse class we're working with.
export type PulseValue<T> = T extends Group<infer U> ? U[] : T extends State<infer U> ? U : never;
export type PulseValueArray<T> = { [K in keyof T]: T[K] extends Group<infer U> ? U[] : T[K] extends State<infer U> ? U : never };

// We use function overloads to describe specific use cases of usePulse, that have different return formats

// single-argument syntax
export function usePulse<X extends State<any>>(deps: X, pulseInstance?: Pulse): PulseValue<X>;
// array-argument syntax
export function usePulse<X extends State<any>[]>(deps: X | [], pulseInstance?: Pulse): PulseValueArray<X>;

export function usePulse<X extends Array<State<any>>>(deps: X | [] | State, pulseInstance?: Pulse): PulseValueArray<X> | PulseValue<X> {
  const depsArray = normalizeDeps(deps) as PulseValueArray<X>;

  // Get Pulse Instance
  if (!pulseInstance) {
    const extractedPulseInstance = getPulseInstance(depsArray[0]);
    if (!extractedPulseInstance) {
      console.error('Pulse: Failed to get Pulse Instance. It is likely you provided a value that is not a valid State instance to usePulse().');
      return undefined;
    }
    pulseInstance = extractedPulseInstance;
  }

  // This is a trigger state used to force the component to re-render
  const [_, set_] = React.useState({});

  React.useEffect(function () {
    // Create a callback base subscription, Callback invokes re-render Trigger
    const subscriptionContainer = pulseInstance?.subController.subscribeWithSubsArray(() => {
      set_({});
    }, depsArray);

    // Unsubscribe on Unmount
    return () => pulseInstance?.subController.unsubscribe(subscriptionContainer);
  }, []);

  // Return public value of state
  if (!Array.isArray(deps) && depsArray.length === 1) return depsArray[0].getPublicValue();

  // Return public value of state
  return depsArray.map(dep => dep.getPublicValue()) as PulseValueArray<X>;
}
