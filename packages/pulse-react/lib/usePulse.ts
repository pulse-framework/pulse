import { Pulse, State, normalizeDeps, getPulseInstance } from '@pulsejs/core';
import * as React from 'react';

export type PulseHookArray<T> = { [K in keyof T]: T[K] extends State<infer U> ? U : never };
export type PulseHookResult<T> = T extends State<infer U> ? U : never;

// array-argument syntax
export function usePulse<X extends State<any>[]>(deps: X | [], pulseInstance?: Pulse): PulseHookArray<X>;
// single-argument syntax
export function usePulse<X extends State<any>>(deps: X, pulseInstance?: Pulse): PulseHookResult<X>;

export function usePulse<X extends Array<State<any>>>(deps: X | [] | State, pulseInstance?: Pulse): PulseHookArray<X> | PulseHookResult<X> {
  // Normalize Dependencies
  let depsArray = normalizeDeps(deps) as PulseHookArray<X>;

  // Get Pulse Instance
  if (!pulseInstance) {
    const tempPulseInstance = getPulseInstance(depsArray[0]);
    if (!tempPulseInstance) {
      console.error('Pulse: Failed to get Pulse Instance');
      return undefined;
    }
    pulseInstance = tempPulseInstance;
  }
  /* TODO: depsArrayFinal doesn't get used so idk if its necessary
	let depsArrayFinal: Array<State> = [];
	// this allows you to pass in a keyed object of States and subscribe to all  State within the first level of the object. Useful if you wish to subscribe a component to several State instances at the same time.
	depsArray.forEach(dep => {
		if (dep instanceof State) depsArrayFinal.push(dep);
		else if (typeof dep === 'object')
			for (let d in dep as keyedState) {
				if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
			}
	});
	 */

  // this is a trigger state used to force the component to re-render
  const [_, set_] = React.useState({});

  React.useEffect(function () {
    // Create a callback base subscription, Callback invokes re-render Trigger
    const subscriptionContainer = pulseInstance?.subController.subscribeWithSubsArray(() => {
      set_({});
    }, depsArray);

    // Unsubscribe on Unmount
    return () => pulseInstance?.subController.unsubscribe(subscriptionContainer);
  }, []);

  // Return Public Value of State
  if (!Array.isArray(deps) && depsArray.length === 1) return depsArray[0].getPublicValue();

  // Return Public Value of State in Array
  return depsArray.map(dep => {
    return dep.getPublicValue();
  }) as PulseHookArray<X>;
}
