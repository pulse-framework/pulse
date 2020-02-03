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
  return (
    value != null &&
    type == 'object' &&
    !isHTMLElement(value) &&
    !Array.isArray(value)
  );
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

export function validateNumber(mutable, amount) {
  if (typeof amount !== 'number' || typeof mutable !== 'number') {
    return false;
  }
  return true;
}
