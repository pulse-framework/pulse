import { extractAll } from '../utils';
import { Collection, State } from '..';

export function preserveServerState(
  nextProps: { [key: string]: any },
  core: { [key: string]: any }
) {
  const collections = extractAll<Collection>(core, Collection);
  const state = extractAll<State>(core, State);

  const PULSE_DATA = {
    collections: [],
    state: {}
  };

  state.forEach(stateItem => {
    if (stateItem.name && stateItem.isSet)
      PULSE_DATA.state[stateItem.name] = stateItem._masterValue;
  });

  collections.forEach(collection => {
    const collectionData = { data: {}, groups: {} };

    for (let key in collection.data)
      if (collection.data[key].isSet) collectionData.data[key] = collection.data[key]._masterValue;

    for (let key in collection.groups)
      if (collection.groups[key].isSet)
        collectionData.groups[key] = collection.groups[key]._masterValue;

    PULSE_DATA.collections.push(collectionData);
  });

  nextProps.props.PULSE_DATA = PULSE_DATA;
  return nextProps;
}

export function loadServerState(core: { [key: string]: any }) {
  if (isServer()) return;
  if (globalThis?.__NEXT_DATA__?.props?.pageProps?.PULSE_DATA) {
    const pulseData = globalThis.__NEXT_DATA__.props.pageProps.PULSE_DATA

    const state = extractAll<State>(core, State);

    state.forEach(item => {
      if (item.name && pulseData.state[item.name]) 
        item.set(pulseData.state[item.name])    
    })
  }

}

export function isServer() {
  return typeof process !== 'undefined' && process?.release?.name === 'node';
}
