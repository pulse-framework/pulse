import * as React from 'react';
import Pulse, { Integration } from '@pulsejs/core';

export { PulseHOC } from './pulseHOC';
export { usePulse } from './usePulse';
export { useEvent } from './useEvent';
export { useWatcher } from './useWatcher';

export * from '@pulsejs/core';
export default Pulse;

// declare pulse plugin
export const PulseReact = new Integration({
  name: 'react',
  foreignInstance: React,
  // used by the pulseHOC
  updateMethod(component, payload) {
    // UpdatedData will be empty if the PulseHOC doesn't get an object as deps
    if (Object.keys(payload).length !== 0) {
      // Update Props
      component.updatedProps = { ...component.updatedProps, ...payload };

      // Set State (Rerender)
      component.setState(payload);
    } else {
      // Force Update (Rerender)
      component.forceUpdate();
    }
  }
});

Pulse.initialIntegrations.push(PulseReact);
