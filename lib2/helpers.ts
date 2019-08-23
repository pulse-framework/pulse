export const protectedNames = [
  'data',
  'indexes',
  'groups',
  'computed',
  'actions',
  'routes'
];

export const collectionFunctions = [
  'collect',
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
  'watch',
  'findById',
  'put',
  'move',
  'throttle',
  // deprecated
  'remove'
];

export function defineConfig(config, defaults) {
  return { ...defaults, ...config };
}

export function uuid() {
  return (
    Math.random()
      .toString()
      .split('.')[1] + Date.now()
  );
}

export function objectLoop(object, callback, keys?: Array<any>) {
  const objectKeys = keys ? keys : Object.keys(object);
  for (let i = 0; i < objectKeys.length; i++) {
    const key: string = objectKeys[i];
    const value: any = object[key];
    callback(key, value, objectKeys);
  }
}

// const thing = {}
// objectLoop(thing, (thingKey, thingItem) => {

// })

export function log(value: any, payload?: any) {
  // console.log(`Pulse / ${value}`, payload ? payload : ' ');
}

export function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }));
}

export const arrayFunctions = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

export function assert(
  func: (warnings: { [key: string]: any }) => any,
  funcName?: string
) {
  function warn(message) {
    // if (funcName) console.log(`PULSE // "${funcName}()" :: ${message}`);
    // else console.warn(`PULSE :: ${message}`);
    return false;
  }
  const warnings = {
    NO_PRIMARY_KEY: () => warn('No primary $1 key found! $2'),
    INVALID_PARAMETER: () => warn('Invalid parameter supplied to function.'),
    INDEX_NOT_FOUND: () => warn('Index was not found on collection.'),
    INTERNAL_DATA_NOT_FOUND: () => warn('Data was not found on collection.'),
    PROPERTY_NOT_A_NUMBER: () => warn('Property is not a number!')
  };
  return func(warnings)();
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
  return (
    value != null &&
    type == 'object' &&
    !isHTMLElement(value) &&
    !Array.isArray(value)
  );
}

export function validateNumber(mutable, amount) {
  if (typeof amount !== 'number' || typeof mutable !== 'number') {
    return false;
  }
  return true;
}
