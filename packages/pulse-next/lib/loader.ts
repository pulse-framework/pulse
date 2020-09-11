import { Pulse, Collection, State, Computed, PrimaryKey } from '@pulsejs/core';

interface PulseData {
  state: { [key: string]: any };
  collections: Array<{ data: any; groups: { [key: string]: Array<PrimaryKey> } }>;
}

export function preserveServerState(nextProps: { [key: string]: any }, instance?: Pulse) {
  if (!instance) instance = getPulseInstance();
  const { _collections: collections, _state: state } = instance;

  const PULSE_DATA: PulseData = {
    collections: [],
    state: {}
  };
  if (state)
    state.forEach(stateItem => {
      if (stateItem.name && stateItem.isSet && !(stateItem instanceof Computed)) PULSE_DATA.state[stateItem.name] = stateItem._value;
    });
  if (collections)
    collections.forEach(collection => {
      const collectionData = { data: {}, groups: {} };

      for (let key in collection.data) if (collection.data[key].isSet) collectionData.data[key] = collection.data[key]._value;

      for (let key in collection.groups as any) if (collection.groups[key].isSet) collectionData.groups[key] = collection.groups[key]._value;

      PULSE_DATA.collections.push(collectionData);
    });

  nextProps.props.PULSE_DATA = PULSE_DATA;

  return nextProps;
}

export function loadServerState(pulse: Pulse) {
  if (isServer()) return;

  console.log(globalThis?.__NEXT_DATA__?.props?.pageProps?.PULSE_DATA);

  if (globalThis?.__NEXT_DATA__?.props?.pageProps?.PULSE_DATA) {
    const pulseData: PulseData = globalThis.__NEXT_DATA__.props.pageProps.PULSE_DATA;

    for (const state of pulse._state.values()) {
      if (state.name && pulseData.state[state.name] && !(state instanceof Computed)) state.set(pulseData.state[state.name]);
    }

    for (const collection of pulse._collections.values()) {
      //   if (collection.groups)
    }
  }
}

export function isServer() {
  return typeof process !== 'undefined' && process?.release?.name === 'node';
}
export function getPulseInstance(): Pulse {
  return globalThis['__pulse__app'] || false;
}
