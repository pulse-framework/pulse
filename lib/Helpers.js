module.exports = mapCollection = (collection, properties) => {
  const res = {};
  normalizeMap(properties).forEach(({ key, val }) => {
    // this will bind a function to the component instance by either the name of the property or the given name from the component
    // if bound to a computed property within Vue, the function will only run if accessed.
    res[key] = function dataItem() {
      let dataKey = `${collection}/${key}`;
      if (!this.$pulse._mappedProperties.hasOwnProperty(dataKey)) {
        this.$pulse._mappedProperties[dataKey] = [];
      }
      let collections = this.$pulse._global.dataRef;
      let property = collections[collection][val];

      // register
      this.$pulse._mappedProperties[dataKey].push({
        componentID: this.$vnode.tag,
        propertyGivenName: false,
        collection,
        property: val
      });

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
