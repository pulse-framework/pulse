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
			pulseConstructor._SSOT = {};
			Object.keys(options).forEach((key, i) => {
				pulseConstructor._SSOT['$'+key] = options[key];
			})
			Vue.mixin({
				beforeCreate() {
					// bind root properties
					if (pulseConstructor.State) this.State = pulseConstructor.State;
					if (pulseConstructor.Collection) this.Collection = pulseConstructor.Collection;
					if (pulseConstructor.API) this.API = pulseConstructor.API;
					if (pulseConstructor.Computed) this.Computed = pulseConstructor.Computed;
					
					if (usePulse) this.usePulse = usePulse.bind(pulseConstructor._SSOT);
					
					Object.keys(options).forEach((key, i) => {
						this['$'+key] = pulseConstructor._SSOT['$'+key];
					})
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
		pulseInstance.usePulse = (deps: Array<string> | string) => usePulse(deps, pulseInstance);
		Vue.use(pulseInstance);
	}
};

/**
 * 
 * @param deps Can either be a string or an array of strings set equal to the same of the pulse objects defined in Vue.use()
 * @param pulseInstance The pulse container to look at if you want to use a different SSOT
 */
export function usePulse(deps: Array<string|State|keyedState> | string | State, pulseInstance?: Pulse) {

	enum ReturnType{
		'STRING',
		'STATE',
		'KEYED'
	}
	console.log(this);
	
	let depsArray: (string | State | keyedState)[];
	let depsArrayFinal: (State|keyedState)[] = [];
	let depsObjFinal: any = {};

	if (!Array.isArray(deps)) depsArray = [deps]
	else depsArray = deps
	
	let type: ReturnType;
	depsArray.forEach(dep => {
		if (typeof dep === 'string'){
			if (this['$'+dep]) depsObjFinal[dep] = this['$'+dep];
			if(!type) type=ReturnType.STRING;
		}
		else if (dep instanceof State){
			depsArrayFinal.push(dep);
			if(!type) type=ReturnType.STATE;
		}
		else {
			/// must be a keyedState
			for (let d in dep as keyedState) {
				if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
			}
			if(!type) type=ReturnType.KEYED;
		}
		
	})
	
	// let depsArray = normalizeDeps(deps as Array<State>);
	// if (!pulseInstance) pulseInstance = getInstance(depsArray[0]);

	// // The final list of states and dependancies 
	

	// // this allows you to pass in a keyed object of States and subscribe to all  State within the first level of the object. Useful if you wish to subscribe a component to several State instances at the same time.
	// depsArray.forEach(dep => {
	// 	if (dep instanceof State) depsArrayFinal.push(dep);
	// 	else if (typeof dep === 'object')
	// 		for (let d in dep as keyedState) {
	// 			if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
	// 		}
	// });

	// get Vue constructor
	if (pulseInstance){
		const Vue = pulseInstance.intergration.frameworkConstructor;
		if (!Vue) return;
	}
	

	// return depsArray.map(dep => {
	// 	if (dep instanceof State) return dep.getPublicValue();
	// 	return dep;
	// });
	if(type === ReturnType.STRING){
		return depsObjFinal;
	}
	else if (type === ReturnType.STATE) {
		return depsArrayFinal;
	}
	else if (type === ReturnType.KEYED) {
		return depsArrayFinal;
	}
	
}
// export function usePulse(deps: Array<State | keyedState> | State, pulseInstance?: Pulse) {
// 	console.log(this);
// 	let depsArray = normalizeDeps(deps as Array<State>);
// 	if (!pulseInstance) pulseInstance = getInstance(depsArray[0]);

// 	// The final list of states and dependancies 
// 	let depsArrayFinal: Array<State> = [];

// 	// this allows you to pass in a keyed object of States and subscribe to all  State within the first level of the object. Useful if you wish to subscribe a component to several State instances at the same time.
// 	depsArray.forEach(dep => {
// 		if (dep instanceof State) depsArrayFinal.push(dep);
// 		else if (typeof dep === 'object')
// 			for (let d in dep as keyedState) {
// 				if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
// 			}
// 	});

// 	// get Vue constructor
// 	const Vue = pulseInstance.intergration.frameworkConstructor;
// 	if (!Vue) return;

// 	// return depsArray.map(dep => {
// 	// 	if (dep instanceof State) return dep.getPublicValue();
// 	// 	return dep;
// 	// });
// 	return depsArrayFinal;
// }
