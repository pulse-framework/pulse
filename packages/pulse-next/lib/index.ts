import Pulse, { Integration } from '@pulsejs/core';
import { loadServerState } from './loader';

export { preserveServerState, loadServerState } from './loader';

// declare pulse plugin
export const PulseNext = new Integration({
  name: 'next',
  onCoreReady: loadServerState
});

Pulse.initialIntegrations.push(PulseNext);
