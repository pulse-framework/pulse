import Pulse from '../';

export default {
  name: 'vue',
  bind(pulseConstructor) {
    pulseConstructor.install = Vue => {
      const pulse = globalThis.__pulse;
      const global = pulse._private.global;
      const config = pulse._private.global.config;
      Vue.mixin({
        beforeCreate() {
          // bind root properties
          Object.keys(global.contextRef).forEach(moduleInstance => {
            this['$' + moduleInstance] = global.contextRef[moduleInstance];
          });

          // register component with Pulse
          global.subs.registerComponent(this);

          // alias map
          const mapData = global.subs.mapData.bind(global.subs);

          this.mapData = properties => mapData(properties, this);
        },
        mounted() {
          if (this.__pulseUniqueIdentifier && config.waitForMount) pulse.mount(this);
        },
        beforeDestroy() {
          if (this.__pulseUniqueIdentifier && config.autoUnmount) global.subs.unmount(this);
        }
      });
    };
  },
  updateMethod(componentInstance: any, updatedData: Object) {
    for (let dataKey in updatedData) {
      componentInstance.$set(componentInstance, dataKey, updatedData[dataKey]);
    }
  },
  onReady(pulseConstructor: Pulse) {
    const Vue = pulseConstructor.intergration.frameworkConstructor;
    Vue.use(pulseConstructor);
  }
};
