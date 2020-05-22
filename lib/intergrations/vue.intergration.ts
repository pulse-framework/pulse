import Pulse from '..';
import State from '../state';
import {ComponentContainer, SubscriptionContainer} from '../sub';
import {normalizeDeps, getInstance} from '../utils';
import Group from '../collection/group';

type keyedState = {
	[key: string]: State
};

export default {
	name: 'vue',
	bind(pulseConstructor) {
		pulseConstructor.install = (Vue, options: any) => {
			const pulse = globalThis.__pulse;
			Vue.mixin({
				beforeCreate() {
					// bind root properties
					if (pulseConstructor.State) this.State = pulseConstructor.State;
					if (pulseConstructor.Collection) this.Collection = pulseConstructor.Collection;
					if (pulseConstructor.API) this.API = pulseConstructor.API;
					if (pulseConstructor.Computed) this.Computed = pulseConstructor.Computed;
					if (usePulse) usePulse.bind(this);
					
					Object.keys(options).forEach((key, i) => {
						this[`$${key}`] = options[key];
					})
					
					// if (pulse.utils) this.$utils = pulse.utils;
					// if (pulse.services) this.$services = pulse.services;

					// // register component with Pulse
					// global.subs.registerComponent(this);

					// // alias map
					// const mapData = global.subs.mapData.bind(global.subs);

					// this.mapData = properties => mapData(properties, this);
				},
				mounted() {
					// if (this.__pulseUniqueIdentifier && config.waitForMount)
					// 	pulse.mount(this);
				},
				beforeDestroy() {
					// if (this.__pulseUniqueIdentifier && config.autoUnmount)
					// 	global.subs.unmount(this);
				}
			});
		};
	},
	updateMethod(componentInstance: any, updatedData: Object) {
		for (let dataKey in updatedData) {
			componentInstance.$set(componentInstance, dataKey, updatedData[dataKey]);
		}
	},
	onReady(pulseInstance: any | Pulse) {
		const Vue = pulseInstance.intergration.frameworkConstructor;
		pulseInstance.usePulse = (deps: Array<State> | State) => usePulse(deps, pulseInstance);
		Vue.use(pulseInstance);
	}
};

export function usePulse(deps: Array<State | keyedState> | State, pulseInstance?: Pulse) {
	let depsArray = normalizeDeps(deps as Array<State>);
	if (!pulseInstance) pulseInstance = getInstance(depsArray[0]);

	// The final list of states and dependancies 
	let depsArrayFinal: Array<State> = [];

	// this allows you to pass in a keyed object of States and subscribe to all  State within the first level of the object. Useful if you wish to subscribe a component to several State instances at the same time.
	depsArray.forEach(dep => {
		if (dep instanceof State) depsArrayFinal.push(dep);
		else if (typeof dep === 'object')
			for (let d in dep as keyedState) {
				if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
			}
	});

	// get Vue constructor
	const Vue = pulseInstance.intergration.frameworkConstructor;
	if (!Vue) return;

	// return depsArray.map(dep => {
	// 	if (dep instanceof State) return dep.getPublicValue();
	// 	return dep;
	// });
	return depsArrayFinal;
}
