import Vue from 'vue';
import Pulse, { Integration } from '@pulsejs/core';

export * from '@pulsejs/core';
export default Pulse;

export {mapCore} from './mapCore';

// declare pulse plugin
export const PulseVue = new Integration({
  name: 'vue',
  foreignInstance: Vue,
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

Pulse.initialIntegrations.push(PulseVue);