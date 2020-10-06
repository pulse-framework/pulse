import {Pulse, State, Core, getPulseInstance} from '@pulsejs/core';
import Vue from 'vue';

export type PulseCoreArray<T> = { [K in keyof T]: T[K] extends State<infer U> ? U : never };

interface VueMapConfig {
    [key: string]: Pulse["State"]
}
const pulsePlugin = {
    name: 'pulse',
    install: null,
}

if(Vue.version.startsWith('2.')){
    // for pulse 2
    pulsePlugin.install = function<>(vue, options){
        // Get Pulse Instance
        
        vue.prototype.mapCore = function <X extends Array<State<any>>>(mapfn: (core: ICore) => VueMapConfig ) {
            const tempPulseInstance = getPulseInstance(core[0]);
            if (!tempPulseInstance) {
                console.error('Pulse: Failed to get Pulse Instance');
                return undefined;
            }
            let pulseInstance = tempPulseInstance;

            mapfn(core);
        } 
        
    }

}
else if(Vue.version.startsWith('3.')){
    // for pulse 3
    
}
else{
    console.log('%cPulse Does Not Support Current Vue Version!', "background: #41B883; color: white;")
}
 
Vue.use(pulsePlugin)

export function nuxtPlugin ({app}, inject) {
    inject('mapCore', (mapfn: (any: ICore) => VueMapConfig ) => mapfn(core))
}
