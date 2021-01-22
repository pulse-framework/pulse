import { Pulse, Computed, PrimaryKey } from '@pulsejs/core';

interface PulseData {
  state: { [key: string]: any };
  collections: Array<{
    data: any;
    groups: {
      [key: string]: Array<PrimaryKey>;
    };
    selectors: {
      [key: string]: any;
    };
    name: string;
  }>;
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
    for (const collection of collections) {
      if (collection.config?.name) {
        const collectionData = { data: {}, groups: {}, selectors: {}, name: collection.config.name };

        for (let key in collection.data) if (collection.data[key].value !== undefined) collectionData.data[key] = collection.data[key]._value;

        for (let key in collection.groups as any) if (collection.groups[key].size > 0) collectionData.groups[key] = collection.groups[key]._value;

        for (let key in collection.selectors) if (collection.selectors[key].isSet) collectionData.selectors[key] = collection.selectors[key]._value;

        PULSE_DATA.collections.push(collectionData);
      }
    }

  nextProps.props.PULSE_DATA = PULSE_DATA;

  return nextProps;
}

export function loadServerState(pulse: Pulse) {
  if (isServer()) return;

  if (globalThis?.__NEXT_DATA__?.props?.pageProps?.PULSE_DATA) {
    const pulseData: PulseData = globalThis.__NEXT_DATA__.props.pageProps.PULSE_DATA;

    for (const state of pulse._state.values()) {
      if (state.name && pulseData.state[state.name] && !(state instanceof Computed)) state.set(pulseData.state[state.name]);
    }

    for (const collection of pulse._collections.values()) {
      if (collection && collection.config.name) {
        const local = pulseData.collections.find(c => c.name === collection.config.name);
        if (local) {
          if (local.groups) {
            for (const key in local.groups) {
              const groupKeys = local.groups[key];
              if (groupKeys && groupKeys.length > 0) {
                if (!collection.groups[key]) collection.createGroup(key, groupKeys);
                else collection.groups[key].add(groupKeys);
              }
            }
          }
          collection.collect(local.data);

          for (const key in local.selectors) if (collection.selectors[key].name) collection.selectors[key].set(local.selectors[key]);
        }
      }
    }
  }
}

export function isServer() {
  return typeof process !== 'undefined' && process?.release?.name === 'node';
}
export function getPulseInstance(): Pulse {
  return globalThis['__pulse__app'] || false;
}
