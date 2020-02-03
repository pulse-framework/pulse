export const protectedNames = [
  'data',
  'indexes',
  'groups',
  'computed',
  'actions',
  'routes'
];

export const moduleFunctions = [
  'watch',
  'throttle',
  'addStaticData',
  'debounce',
  'forceUpdate'
];

export const collectionFunctions = [
  ...moduleFunctions,
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

export function defineConfig(config, defaults) {
  return { ...defaults, ...config };
}

export function parse(key: string) {
  let primaryKey: string | number = key.split('/')[1];

  let canBeNumber = Number(primaryKey);
  if (canBeNumber !== NaN) primaryKey = canBeNumber;

  return {
    collection: key.split('/')[0],
    primaryKey
  };
}

export function genId(): string {
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

// const thing = {}
// objectLoop(thing, (thingKey, thingItem) => {

// })

export function log(value: any, payload?: any) {
  // console.log(`Pulse / ${value}`, payload ? payload : ' ');
}
export function key(collection: string, property?: string | number) {
  return `${collection}/${property}`;
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

export function validateNumber(mutable, amount) {
  if (typeof amount !== 'number' || typeof mutable !== 'number') {
    return false;
  }
  return true;
}

export function createObj(
  array: Array<any> = [],
  sourceObject: Object = {}
): Object {
  let newObj = {};
  for (let i = 0; i < array.length; i++) {
    let property = array[i];
    if (sourceObject[property]) newObj[property] = sourceObject[property];
  }
  return newObj;
}
// groups are defined by the user as an array of strings, this converts them into object/keys
export function normalizeGroups(groupsAsArray: any = []) {
  const groups: object = {};
  for (let i = 0; i < groupsAsArray.length; i++) {
    const groupName = groupsAsArray[i];
    groups[groupName] = [];
  }
  return groups;
}
