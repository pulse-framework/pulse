import Pulse, { Collection } from '.';
import State from './state';
export function cleanState(state: State): any {
  return {
    value: state.value,
    previousState: state.previousState,
    isSet: state.isSet,
    dependents: state.dep.deps.size,
    subscribers: state.dep.subs.size,
    name: state.name
  };
}

export function resetState(items: Array<State | Collection | any>) {
  items.forEach(item => {
    if (item instanceof Collection) item.reset();
    if (item instanceof State) return item.reset();
    const stateSet = extractAll(item, State);
    stateSet.forEach(state => state.reset());
  });
}

export function extractAll<I = any>(obj, instance: any): Set<I> {
  if (obj instanceof instance) return new Set(obj);
  const found: Set<I> = new Set();
  let next = [obj];
  function look() {
    let _next = [...next];
    next = [];
    _next.forEach(o => {
      for (let property in o) {
        if (o[property] instanceof instance) found.add(o[property]);
        else if (isWatchableObject(o[property])) next.push(o[property]);
      }
    });
    if (next.length > 0) look();
  }
  look();
  return found;
}

export function getInstance(state: State): Pulse {
  try {
    if (state.instance) return state.instance();
    else return globalThis.__pulse;
  } catch (e) {}
}
export function normalizeDeps(deps: Array<State> | State) {
  return Array.isArray(deps) ? (deps as Array<State>) : [deps as State];
}

export const collectionFunctions = [
  'collect',
  'collectByKeys',
  'replaceIndex',
  'getGroup',
  'newGroup',
  'deleteGroup',
  'removeFromGroup',
  'update',
  'increment',
  'decrement',
  'delete',
  'purge',
  'findById',
  'put',
  'move',
  'watchData',
  'cleanse',
  // 'unsubscribe',
  // deprecated
  'remove'
];

export const copy = val => {
  if (isWatchableObject(val)) val = { ...val };
  else if (Array.isArray(val)) val = [...val];

  return val;
};

// groups are defined by the user as an array of strings, this converts them into object/keys
export function normalizeGroups(groupsAsArray: any = []) {
  const groups: object = {};
  for (let i = 0; i < groupsAsArray.length; i++) {
    const groupName = groupsAsArray[i];
    groups[groupName] = [];
  }
  return groups;
}

export function shallowmerge(source, changes) {
  let keys = Object.keys(changes);
  keys.forEach(property => {
    source[property] = changes[property];
  });

  return source;
}

export function defineConfig(config, defaults) {
  return { ...defaults, ...config };
}

export function genId(): string {
  return (
    Math.random()
      .toString()
      .split('.')[1] + Date.now()
  );
}

export function isWatchableObject(value) {
  function isHTMLElement(obj) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return (
        typeof obj === 'object' &&
        obj.nodeType === 1 &&
        typeof obj.style === 'object' &&
        typeof obj.ownerDocument === 'object'
      );
    }
  }
  let type = typeof value;
  return value != null && type == 'object' && !isHTMLElement(value) && !Array.isArray(value);
}

export function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }));
}

export const arrayFunctions = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

export function cleanse(object: any) {
  if (!isWatchableObject(object)) return object;
  const clean = Object.assign({}, object);
  const properties = Object.keys(clean);

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];

    if (isWatchableObject(clean[property])) {
      clean[property] = cleanse(clean[property]);
    }
  }
  return clean;
}

export function validateNumber(mutable, amount) {
  if (typeof amount !== 'number' || typeof mutable !== 'number') {
    return false;
  }
  return true;
}
