import Pulse, { Integration } from '@pulsejs/core';
import Vue from 'vue';

declare module 'vue/types/vue' {
  interface VueConstructor {
    mapCore: (...args: any) => any; // define real typings here if you want
    $core: any;
  }
}

const VuePulse = new Integration({
  name: 'vue',
  foreignInstance: Vue,
  onPulseReady: pulse => {
    Vue.use({
      install: vue => {
        vue.mixin({
          created: function () {
            pulse.subController.registerSubscription(this);
            this.$core = pulse.core;
            this.mapCore = (mapObj: <T = { [key: string]: any }>(core: ReturnType<Pulse['Core']>) => T) => {
              const stateObj = mapObj(pulse.core);
              return pulse.subController.subscribeWithSubsObject(this, stateObj).props;
            };
          }
        });
      }
    });
  }
});

Pulse.initialIntegrations.push(VuePulse);

export * from '@pulsejs/core';
export default Pulse;
