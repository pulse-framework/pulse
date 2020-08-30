"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePulse = exports.PulseHOC = void 0;
const state_1 = require("../state");
const utils_1 = require("../utils");
function PulseHOC(ReactComponent, deps, pulseInstance) {
    var _a;
    let depsArray;
    let depsObject;
    if (deps instanceof state_1.default || Array.isArray(deps)) {
        // Normalize Dependencies
        depsArray = utils_1.normalizeDeps(deps || []);
        // Get Pulse Instance
        if (!pulseInstance) {
            if (depsArray.length > 0) {
                const tempPulseInstance = utils_1.getPulseInstance(depsArray[0]);
                pulseInstance = tempPulseInstance || undefined;
            }
            else {
                console.warn("Pulse: Please don't pass an empty array!");
            }
        }
    }
    else if (typeof deps === 'object') {
        depsObject = deps;
        // Get Pulse Instance
        if (!pulseInstance) {
            const objectKeys = Object.keys(depsObject);
            if (objectKeys.length > 0) {
                const tempPulseInstance = utils_1.getPulseInstance(depsObject[objectKeys[0]]);
                pulseInstance = tempPulseInstance || undefined;
            }
            else {
                console.warn("Pulse: Please don't pass an empty object!");
            }
        }
    }
    else {
        console.error('Pulse: No Valid PulseHOC properties');
        return ReactComponent;
    }
    // Check if pulse Instance exists
    if (!pulseInstance) {
        console.error('Pulse: Failed to get Pulse Instance');
        return ReactComponent;
    }
    // Get React constructor
    const React = (_a = pulseInstance.integration) === null || _a === void 0 ? void 0 : _a.frameworkConstructor;
    if (!React) {
        console.error('Pulse: Failed to get Framework Constructor');
        return ReactComponent;
    }
    return class extends React.Component {
        constructor(props) {
            super(props);
            this.componentContainer = null; // Will be set in registerSubscription (sub.ts)
            this.updatedProps = this.props;
            // Create HOC based Subscription with Array (Rerenders will here be caused via force Update)
            if (depsArray)
                pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.subController.subscribeWithSubsArray(this, depsArray);
            // Create HOC based Subscription with Object
            if (depsObject) {
                const response = pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.subController.subscribeWithSubsObject(this, depsObject);
                this.updatedProps = Object.assign(Object.assign({}, props), response === null || response === void 0 ? void 0 : response.props);
                // Defines State for causing rerender (will be called in updateMethod)
                this.state = depsObject;
            }
        }
        componentDidMount() {
            if (pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.config.waitForMount)
                pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.subController.mount(this);
        }
        componentWillUnmount() {
            pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.subController.unsubscribe(this);
        }
        render() {
            return React.createElement(ReactComponent, this.updatedProps);
        }
    };
}
exports.PulseHOC = PulseHOC;
function usePulse(deps, pulseInstance) {
    var _a;
    // Normalize Dependencies
    let depsArray = utils_1.normalizeDeps(deps);
    // Get Pulse Instance
    if (!pulseInstance) {
        const tempPulseInstance = utils_1.getPulseInstance(depsArray[0]);
        if (!tempPulseInstance) {
            console.error('Pulse: Failed to get Pulse Instance');
            return undefined;
        }
        pulseInstance = tempPulseInstance;
    }
    // Get React constructor
    const React = (_a = pulseInstance.integration) === null || _a === void 0 ? void 0 : _a.frameworkConstructor;
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
        const subscriptionContainer = pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.subController.subscribeWithSubsArray(() => {
            set_({});
        }, depsArray);
        // Unsubscribe on Unmount
        return () => pulseInstance === null || pulseInstance === void 0 ? void 0 : pulseInstance.subController.unsubscribe(subscriptionContainer);
    }, []);
    // Return Public Value of State
    if (!Array.isArray(deps) && depsArray.length === 1)
        return depsArray[0].getPublicValue();
    // Return Public Value of State in Array
    return depsArray.map(dep => {
        return dep.getPublicValue();
    });
}
exports.usePulse = usePulse;
exports.default = {
    name: 'react',
    bind(pulseInstance) {
        //
        // pulseInstance.React = (instance: any, deps: Array<State>) =>
        //   PulseHOC(instance, deps, pulseInstance);
        // // usePulse is able to get its context from the state passed in, below is redundant
        // pulseInstance.usePulse = (deps: Array<State>) => usePulse(deps, pulseInstance);
    },
    updateMethod(componentInstance, updatedData) {
        // UpdatedData will be empty if the PulseHOC doesn't get an object as deps
        if (Object.keys(updatedData).length !== 0) {
            // Update Props
            componentInstance.updatedProps = Object.assign(Object.assign({}, componentInstance.updatedProps), updatedData);
            // Set State (Rerender)
            componentInstance.setState(updatedData);
        }
        else {
            // Force Update (Rerender)
            componentInstance.forceUpdate();
        }
    },
    onReady(pulseInstance) {
        // TODO is the onReady really necessary.. because I can't find a position where it get called
        // pulseInstance.usePulse = (deps: Array<State> | State) => usePulse(deps, pulseInstance);
    }
};
