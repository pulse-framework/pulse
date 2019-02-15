export const mapCollection = (collection, properties) => {
  const res = {};
  normalizeMap(properties).forEach(({ key, val }) => {
    res[key] = function dataItem() {
      let collections = this.$pulse._global.dataRef;
      let property = collections[collection][val];
      return property;
    };
  });
  return res;
};

/**
 * Normalize the map
 * normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }, { key: 3, val: 3 } ]
 * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
 * @param {Array|Object} map
 * @return {Object}
 */
function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }));
}
// From VueX
