import React from 'react';
import Pulse, { Integration } from '@pulsejs/core';
import { loadServerState } from './loader';

export { preserveServerState, loadServerState } from './loader';

// declare pulse plugin
export default new Integration({
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
  },
  onCoreReady: loadServerState
});
