import { Pulse, State, Event, EventCallbackFunc, SubscriptionContainer } from '../internal';
import { normalizeDeps, getPulseInstance } from '../utils';
import Group from '../collection/group';

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
  } else if (typeof deps === 'object') {
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
    console.error('Pulse: No Valid PulseHOC properties');
    return ReactComponent;
  }

  // Check if pulse Instance exists
  if (!pulseInstance) {
    console.error('Pulse: Failed to get Pulse Instance');
    return ReactComponent;
  }

  // Get React constructor
  const React = pulseInstance.integration?.frameworkConstructor;
  if (!React) {
    console.error('Pulse: Failed to get Framework Constructor');
    return ReactComponent;
  }

  return class extends React.Component {
    public componentContainer: SubscriptionContainer | null = null; // Will be set in registerSubscription (sub.ts)

    public updatedProps = this.props;

    constructor(props: any) {
      super(props);

      // Create HOC based Subscription with Array (Rerenders will here be caused via force Update)
      if (depsArray) pulseInstance?.subController.subscribeWithSubsArray(this, depsArray);

      // Create HOC based Subscription with Object
      if (depsObject) {
        const response = pulseInstance?.subController.subscribeWithSubsObject(this, depsObject);
        this.updatedProps = {
          ...props,
          ...response?.props
        };

        // Defines State for causing rerender (will be called in updateMethod)
        this.state = depsObject;
      }
    }

    componentDidMount() {
      if (pulseInstance?.config.waitForMount) pulseInstance?.subController.mount(this);
    }

    componentWillUnmount() {
      pulseInstance?.subController.unsubscribe(this);
    }

    render() {
      return React.createElement(ReactComponent, this.updatedProps);
    }
  };
}

// Array Type
type PulseHookArrayType<T> = { [K in keyof T]: T[K] extends Group<infer U> ? U[] : T[K] extends State<infer U> ? U : never };

// No Array Type
type PulseHookType<T> = T extends Group<infer U> ? U[] : T extends State<infer U> ? U : never;

// Array
export function usePulse<X extends Array<State>>(deps: X | [], pulseInstance?: Pulse): PulseHookArrayType<X>;

// No Array
export function usePulse<X extends State>(deps: X, pulseInstance?: Pulse): PulseHookType<X>;

export function usePulse<X extends Array<State>, Y extends State>(deps: X | [] | Y, pulseInstance?: Pulse): PulseHookArrayType<X> | PulseHookType<Y> {
  // Normalize Dependencies
  let depsArray = normalizeDeps(deps) as Array<State>;

  // Function which creates the return value
  const getReturnValue = (depsArray: State[]): PulseHookArrayType<X> | PulseHookType<Y> => {
    // Return Public Value of State
    if (depsArray.length === 1 && !Array.isArray(deps)) return depsArray[0]?.getPublicValue() as PulseHookType<Y>;

    // Return Public Value of State in Array
    return depsArray.map(dep => {
      return dep.getPublicValue();
    }) as PulseHookArrayType<X>;
  };

  // Get Pulse Instance
  if (!pulseInstance) {
    const tempPulseInstance = getPulseInstance(depsArray[0]);
    if (!tempPulseInstance) {
      console.error('Pulse: Failed to get Pulse Instance');
      return getReturnValue(depsArray);
    }
    pulseInstance = tempPulseInstance;
  }

  // Get React constructor
  const React = pulseInstance.integration?.frameworkConstructor;
  if (!React) {
    console.error('Pulse: Failed to get Framework Constructor');
    return getReturnValue(depsArray);
  }

  // This is a trigger state used to force the component to re-render
  const [_, set_] = React.useState({});

  React.useEffect(function () {
    // Create a callback base subscription, Callback invokes re-render Trigger
    const subscriptionContainer = pulseInstance?.subController.subscribeWithSubsArray(() => {
      set_({});
    }, depsArray);

    // Unsubscribe on Unmount
    return () => pulseInstance?.subController.unsubscribe(subscriptionContainer);
  }, []);

  return getReturnValue(depsArray);
}

// useEvent helper for using Events inside React components as hooks
export function useEvent<E extends Event>(event: E, callback: EventCallbackFunc<E['payload']>, pulseInstance?: Pulse) {
  // get the instance of Pulse
  if (!pulseInstance) pulseInstance = event.instance();
  // get React integration
  const React = pulseInstance.integration?.frameworkConstructor;
  React.useEffect(() => {
    // call the event on component mount
    const unsub = event.on(callback);
    // remove the event on component unmount
    return () => unsub();
  }, []);
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
      componentInstance.updatedProps = { ...componentInstance.updatedProps, ...updatedData };

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
