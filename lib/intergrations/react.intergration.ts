import Pulse from '..';
import State from '../state';
import { ComponentContainer, SubscriptionContainer } from '../sub';
import { normalizeDeps, getInstance } from '../utils';
import Group from '../collection/group';

type NamedStateObject = { [key: string]: State };
type keyedState = { [key: string]: State };

export function PulseHOC(
  ReactComponent: any,
  deps?: Array<State> | { [key: string]: State },
  pulseInstance?: Pulse
) {
  if (!pulseInstance) pulseInstance = getInstance(deps[0]);
  let React = pulseInstance.config.frameworkConstructor;
  return class extends React.Component {
    public pulseComponentContainer: SubscriptionContainer;
    constructor(public props: any) {
      super(props);
      // is array of deps
      if (Array.isArray(deps)) {
        pulseInstance.subController.subscribe(this, deps);
        // keyed object of deps, map to props
      } else if (typeof deps === 'object') {
        // keyed object of deps, map to props
        const x = pulseInstance.subController.mapToProps(this, deps);
        props = {
          ...props,
          ...x.props
        };
        this.pulseComponentContainer = x.cC;
      }
    }
    componentDidMount() {
      if (pulseInstance.config.waitForMount) pulseInstance.subController.mount(this);
    }
    componentWillUnmount() {
      pulseInstance.subController.unsubscribe(this);
    }
    render() {
      return React.createElement(ReactComponent, this.props);
    }
  };
}

export function usePulse(
  deps: Array<State | keyedState> | State,
  pulseInstance?: Pulse
): Array<any> {
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
  const React = pulseInstance.intergration.frameworkConstructor;
  if (!React) return;

  // this is a trigger state used to force the component to re-render
  const [_, set_] = React.useState({});

  React.useEffect(function() {
    // create a callback based subscription, callback invokes re-render trigger
    const cC = pulseInstance.subController.subscribe(() => {
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
    if (updatedData) {
      componentInstance.setState(updatedData);
    } else {
      componentInstance.forceUpdate();
    }
  },
  onReady(pulseInstance: any | Pulse) {
    //
    pulseInstance.usePulse = (deps: Array<State> | State) => usePulse(deps, pulseInstance);
  }
};
