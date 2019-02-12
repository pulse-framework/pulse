export const mapCollection = (collection, properties) => {
  const res = {};
  properties.forEach(key => {
    res[key] = function dataItem() {
      let collections = this.$pulse._globalDataRefence;
      return collections[collection][key];
    };
  });
  return res;
};

// export const mapState = normalizeNamespace((namespace, states) => {
//   const res = {}
//   normalizeMap(states).forEach(({ key, val }) => {
//     res[key] = function mappedState () {
//       let state = this.$store.state
//       let getters = this.$store.getters
//       if (namespace) {
//         const module = getModuleByNamespace(this.$store, 'mapState', namespace)
//         if (!module) {
//           return
//         }
//         state = module.context.state
//         getters = module.context.getters
//       }
//       return typeof val === 'function'
//         ? val.call(this, state, getters)
//         : state[val]
//     }
//     // mark vuex getter for devtools
//     res[key].vuex = true
//   })
//   return res
// })
