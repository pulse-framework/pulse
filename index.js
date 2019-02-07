import Pulse from "./lib";
import VueMixin from "./lib/Vue";

export default {
  pulse: null,
  // Vue.use() will call this install function
  install(Vue, config) {
    this.pulse = new Pulse(config);
    VueMixin(Vue, this.pulse);
  }
};
