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
		pulseConstructor.install = Vue => {
			const pulse = globalThis.__pulse;
			// const global = pulse._private.global;
			// const config = pulse._private.global.config;
			Vue.mixin({
				beforeCreate() {
					// bind root properties
					console.log(pulseConstructor);
					if (pulseConstructor.State) this.State = pulseConstructor.State;
					if (pulseConstructor.Collection) this.Collection = pulseConstructor.Collection;
					if (pulseConstructor.API) this.API = pulseConstructor.API;
					if (pulseConstructor.Computed) this.Computed = pulseConstructor.Computed;
					if (usePulse) this.usePulse = usePulse;

					// Object.keys(global.contextRef).forEach(moduleInstance => {
					// 	this['$' + moduleInstance] = global.contextRef[moduleInstance];
					// });
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
		console.log('PULSE READY')
		console.log(pulseInstance);
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

	// this is a trigger state used to force the component to re-render
	// const [_, set_] = Vue.useState({});

	// Vue.useEffect(function () {
	// 	// create a callback based subscription, callback invokes re-render trigger
	// 	const cC = pulseInstance.subController.subscribe(() => {
	// 		set_({});
	// 	}, depsArray);
	// 	// unsubscribe on unmount
	// 	return () => pulseInstance.subController.unsubscribe(cC);
	// }, []);

	return depsArray.map(dep => {
		if (dep instanceof State) return dep.getPublicValue();
		return dep;
	});
}
