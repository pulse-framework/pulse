import * as React from 'react';
import { State, Pulse, normalizeDeps, getPulseInstance, SubscriptionContainer } from '@pulsejs/core';

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
