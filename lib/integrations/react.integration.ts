import Pulse from '..';
import State from '../state';
import {SubscriptionContainer} from '../sub';
import {
	normalizeDeps,
	getInstance
} from '../utils';

type NamedStateObject = {
	[key: string]: State
};
type keyedState = {
	[key: string]: State
};

export function PulseHOC(ReactComponent: any, deps?: Array<State> | { [key: string]: State } | State, pulseInstance?: Pulse) {
	let depsArray: Array<State>;
	let depsObject: { [key: string]: State };

	if (deps instanceof State || Array.isArray(deps)) {
		// Normalize Dependencies
		depsArray = normalizeDeps(deps || []);

		// Get Pulse Instance
		if (!pulseInstance) {
			if (depsArray.length > 0) {
				const tempPulseInstance = getInstance(depsArray[0]);
				pulseInstance = tempPulseInstance || undefined;
			} else {
				console.error("Pulse: Please don't pass an empty array!");
			}
		}
	} else if (typeof deps === "object") {
		depsObject = deps;

		if (!pulseInstance) {
			const objectKeys = Object.keys(depsObject);
			if (objectKeys.length > 0) {
				const tempPulseInstance = getInstance(depsObject[objectKeys[0]]);
				pulseInstance = tempPulseInstance || undefined;
			} else {
				console.error("Pulse: Please don't pass an empty object!");
			}
		}
	} else {
		console.error("Pulse: No Valid PulseHOC properties");
		return ReactComponent;
	}

	// Check if pulse Instance exists
	if (!pulseInstance) {
		console.error("Pulse: Failed to get Pulse Instance");
		return ReactComponent;
	}

	// Get React constructor
	const React = pulseInstance.integration?.frameworkConstructor;
	if (!React) {
		console.error("Pulse: Failed to get Framework Constructor");
		return ReactComponent;
	}

	return class extends React.Component {
		public componentContainer: SubscriptionContainer | null = null; // Will be set in registerComponent

		public updatedProps = this.props;

		constructor(props: any) {
			super(props);

			// Create HOC based Subscription with Array (Rerenders will here be caused via force Update)
			if (depsArray)
				pulseInstance?.subController.subscribeWithSubsArray(this, depsArray);

			// Create HOC based Subscription with Object
			if (depsObject) {
				const response = pulseInstance?.subController.subscribeWithSubsObject(this, depsObject);
				this.updatedProps = {
					...props,
					...response?.props
				}

				// Defines State for causing rerender (will be called in updateMethod)
				this.state = depsObject;
			}
		}

		componentDidMount() {
			if (pulseInstance?.config.waitForMount)
				pulseInstance?.subController.mount(this);
		}

		componentWillUnmount() {
			pulseInstance?.subController.unsubscribe(this);
		}

		render() {
			return React.createElement(ReactComponent, this.updatedProps);
		}
	};
}

export function usePulse(deps: Array<State | keyedState> | State, pulseInstance ?: Pulse) {
	let depsArray = normalizeDeps(deps as Array<State>);
	if (!pulseInstance) pulseInstance = getInstance(depsArray[0]);

	let depsArrayFinal: Array<State> = [];

	// this allows you to pass in a keyed object of States and subscribe to all  State within the first level of the object. Useful if you wish to subscribe a component to several State instances at the same time.
	depsArray.forEach(dep => {
		if (dep instanceof State) depsArrayFinal.push(dep);
		else if (typeof dep === 'object')
			for (let d in dep as keyedState) {
				if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
			}
	});

	// get React constructor
	const React = pulseInstance.integration.frameworkConstructor;
	if (!React) return;

	// this is a trigger state used to force the component to re-render
	const [_, set_] = React.useState({});

	React.useEffect(function () {
		// create a callback based subscription, callback invokes re-render trigger
		const cC = pulseInstance.subController.subscribeWithSubsArray(() => {
			set_({});
		}, depsArray);
		// unsubscribe on unmount
		return () => pulseInstance.subController.unsubscribe(cC);
	}, []);

	return depsArray.map(dep => {
		if (dep instanceof State) return dep.getPublicValue();
		return dep;
	});
}

export default {
	name: 'react',
	bind(pulseInstance: Pulse) {
		//
		// pulseInstance.React = (instance: any, deps: Array<State>) =>
		//   PulseHOC(instance, deps, pulseInstance);
		// // usePulse is able to get its context from the state passed in, below is redundant
		// pulseInstance.usePulse = (deps: Array<State>) => usePulse(deps, pulseInstance);
	},
	updateMethod(componentInstance: any, updatedData: Object) {
		// UpdatedData will be empty if the PulseHOC doesn't get an object as deps

		if (Object.keys(updatedData).length !== 0) {
			// Update Props
			componentInstance.updatedProps = {...componentInstance.updatedProps, ...updatedData};

			// Set State
			componentInstance.setState(updatedData);
		} else {
			componentInstance.forceUpdate();
		}
	},
	onReady(pulseInstance: any | Pulse) {
		// TODO is the onReady really necessary.. because I can't find a position where it get called
		// pulseInstance.usePulse = (deps: Array<State> | State) => usePulse(deps, pulseInstance);
	}
};
