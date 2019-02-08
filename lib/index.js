import Pulse from "./Pulse";

export default {
  // basic export for custom use
  Pulse,
  // React support

  // Vue support (plugin)
  install(Vue, config) {
    const pulse = new Pulse(config);
    Vue.mixin({
      beforeCreate() {
        this.$pulse = pulse;
        let collectionKeys = Object.keys(pulse._collections);
        for (let collection of collectionKeys) {
          this["$" + collection] = pulse._collections[collection];
        }
        pulse.subscribe(this);
      }
    });
  }
};
