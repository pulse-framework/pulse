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

export function preserveServerState(nextProps: { [key: string]: any }, instance?: Pulse): any {
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
  if (collections) {
    for (const collection of collections) {
      if (collection.config?.name) {
        const collectionData = { data: [], groups: {}, selectors: {}, name: collection.config.name };

        for (let key in collection.data) if (collection.data[key]._value !== undefined) collectionData.data.push(collection.data[key]._value);

        for (let key in collection.groups as any)
          if (collection.groups[key]._value.length > 0) collectionData.groups[key] = collection.groups[key]._value;

        for (let key in collection.selectors) if (collection.selectors[key].isSet) collectionData.selectors[key] = collection.selectors[key]._value;

        PULSE_DATA.collections.push(collectionData);
      }
    }
  }

  nextProps.props.PULSE_DATA = PULSE_DATA;

  return nextProps;
}

export function loadServerState(pulse?: Pulse, pulseData: PulseData = globalThis?.__NEXT_DATA__?.props?.pageProps?.PULSE_DATA) {
  if (isServer()) return;

  if (!pulse) pulse = getPulseInstance();

  if (pulseData) {

    for (const state of pulse._state.values()) {
      if (state.name && pulseData.state[state.name] && !(state instanceof Computed)) state.set(pulseData.state[state.name]);
    }

    for (const collection of pulse._collections.values()) {
      if (collection && collection.config.name) {
        const fromSSR = pulseData.collections.find(c => c.name === collection.config.name);
        if (fromSSR) {
          if (fromSSR.groups) {
            for (const key in fromSSR.groups) {
              const groupKeys = fromSSR.groups[key];
              if (groupKeys && groupKeys.length > 0) {
                if (!collection.groups[key]) collection.createGroup(key, groupKeys);
                else collection.groups[key].add(groupKeys);
                const toCol = fromSSR.data.filter(d => groupKeys.includes(d[collection.config.primaryKey]));
                for (const data of toCol) collection.collect(data, key);
              }
            }
          }

          if (fromSSR.data?.length > 0) collection.collect(fromSSR.data);

          for (const key in fromSSR.selectors) if (collection.selectors[key].name) collection.selectors[key].set(fromSSR.selectors[key]);
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
