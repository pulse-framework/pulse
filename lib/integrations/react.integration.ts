import Pulse from '..';
import State from '../state';
import {SubscriptionContainer} from '../sub';
import {
	normalizeDeps,
	getPulseInstance
} from '../utils';

export function PulseHOC(ReactComponent: any, deps?: Array<State> | { [key: string]: State } | State, pulseInstance?: Pulse) {
	let depsArray: Array<State>;
	let depsObject: { [key: string]: State };

	if (deps instanceof State || Array.isArray(deps)) {
		// Normalize Dependencies
		depsArray = normalizeDeps(deps || []);

		// Get Pulse Instance
		if (!pulseInstance) {
			if (depsArray.length > 0) {
				const tempPulseInstance = getPulseInstance(depsArray[0]);
				pulseInstance = tempPulseInstance || undefined;
			} else {
				console.warn("Pulse: Please don't pass an empty array!");
			}
		}
	} else if (typeof deps === "object") {
		depsObject = deps;

		// Get Pulse Instance
		if (!pulseInstance) {
			const objectKeys = Object.keys(depsObject);
			if (objectKeys.length > 0) {
				const tempPulseInstance = getPulseInstance(depsObject[objectKeys[0]]);
				pulseInstance = tempPulseInstance || undefined;
			} else {
				console.warn("Pulse: Please don't pass an empty object!");
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
		public componentContainer: SubscriptionContainer | null = null; // Will be set in registerSubscription (sub.ts)

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

type PulseHookArray<X> = { [K in keyof X]: X[K] extends State<infer U> ? U : never };

export function usePulse<X extends Array<State<any>>>(deps: X | [] | State, pulseInstance?: Pulse): PulseHookArray<X> {
  // Normalize Dependencies
  let depsArray = normalizeDeps(deps) as PulseHookArray<X>;

  // Get Pulse Instance
  if (!pulseInstance) {
    const tempPulseInstance = getPulseInstance(depsArray[0]);
    if (!tempPulseInstance) {
      console.error('Pulse: Failed to get Pulse Instance');
      return undefined;
    }
    pulseInstance = tempPulseInstance;
  }

  // Get React constructor
  const React = pulseInstance.integration?.frameworkConstructor;
  if (!React) {
    console.error('Pulse: Failed to get Framework Constructor');
    return undefined;
  }

  /* TODO: depsArrayFinal doesn't get used so idk if its necessary
	let depsArrayFinal: Array<State> = [];
	// this allows you to pass in a keyed object of States and subscribe to all  State within the first level of the object. Useful if you wish to subscribe a component to several State instances at the same time.
	depsArray.forEach(dep => {
		if (dep instanceof State) depsArrayFinal.push(dep);
		else if (typeof dep === 'object')
			for (let d in dep as keyedState) {
				if ((dep[d] as any) instanceof State) depsArrayFinal.push(dep[d]);
			}
	});
	 */

  // this is a trigger state used to force the component to re-render
  const [_, set_] = React.useState({});

  React.useEffect(function () {
    // Create a callback base subscription, Callback invokes re-render Trigger
    const subscriptionContainer = pulseInstance?.subController.subscribeWithSubsArray(() => {
      set_({});
    }, depsArray);

    // Unsubscribe on Unmount
    return () => pulseInstance?.subController.unsubscribe(subscriptionContainer);
  }, []);

  // Return Public Value of State
  if (!Array.isArray(deps) && depsArray.length === 1) return depsArray[0].getPublicValue();

  // Return Public Value of State in Array
  return depsArray.map(dep => {
    return dep.getPublicValue();
  }) as PulseHookArray<X>;
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

			// Set State (Rerender)
			componentInstance.setState(updatedData);
		} else {
			// Force Update (Rerender)
			componentInstance.forceUpdate();
		}
	},
	onReady(pulseInstance: any | Pulse) {
		// TODO is the onReady really necessary.. because I can't find a position where it get called
		// pulseInstance.usePulse = (deps: Array<State> | State) => usePulse(deps, pulseInstance);
	}
};
