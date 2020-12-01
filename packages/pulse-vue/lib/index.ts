import Pulse, { Integration, State } from '@pulsejs/core';
import Vue from 'vue';


declare module 'vue/types/vue' {
  interface VueConstructor {
    mapCore: <C extends Pulse["Core"]>(...args: any) => any; 
    <C extends Pulse["Core"]>($core: C): C;
  }
}

let PulseIntegrationConfig;
if(Vue.version.startsWith('2.')){
  PulseIntegrationConfig = {
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
  }
}
else if(Vue.version.startsWith('3.')){
  // for pulse 3
  PulseIntegrationConfig = {
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
  }  
}
else{
    console.log('%cPulse Does Not Support Current Vue Version!', "background: #41B883; color: white;")
}
const VuePulse = new Integration(PulseIntegrationConfig);

Pulse.initialIntegrations.push(VuePulse);

export * from '@pulsejs/core';
export default Pulse;
