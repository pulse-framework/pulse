import Pulse from "./Pulse";
import { assert } from "./Utils";
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
          if (collection === "root") return;
          if (this.hasOwnProperty("$" + collection))
            return assert(
              `Error binding collection "${collection}" to Vue instance, "$${collection}" already exists.`
            );
          this["$" + collection] = pulse._collections[collection];
        }
        pulse.subscribe(this);
      }
    });
  }
};
