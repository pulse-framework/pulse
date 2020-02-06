import Pulse from '..';
import State from '../state';
import { ComponentContainer } from '../sub';

type NamedStateObject = { [key: string]: State };

function ReactWrapper(
  ReactComponent: any,
  deps?: Array<State> | { [key: string]: State },
  pulseInstance?: Pulse
) {
  const pulse: Pulse = pulseInstance || globalThis.__pulse;

  if (!pulse)
    console.error(
      `Pulse X React: Pulse instance inaccessible, it is likely you're using "Pulse.React()" before "new Pulse()"`
    );

  let React = pulse.config.frameworkConstructor;

  return class extends React.Component {
    pulseComponentContainer: ComponentContainer;
    constructor(public props: any) {
      super(props);
      // is array of deps
      if (Array.isArray(deps)) {
        pulseInstance.subController.subscribe(this, deps);
        // keyed object of deps, map to props
      } else if (typeof deps === 'object') {
        // keyed object of deps, map to props
        props = {
          ...props,
          ...pulseInstance.subController.mapToProps(this, deps)
        };
      }
    }
    componentDidMount() {
      if (pulse.config.waitForMount) pulse.subController.mount(this);
    }
    componentWillUnmount() {
      pulse.subController.unsubscribe(this);
    }
    render() {
      return React.createElement(ReactComponent, this.props);
    }
  };
}

function getInstance(state: State): Pulse {
  if (state.instance) return state.instance;
  else return globalThis.__pulse;
}

export function usePulse(
  deps: Array<State> | State,
  pulseInstance?: Pulse
): Array<State> {
  let isArr: boolean = Array.isArray(deps);
  let depsArray: Array<State> = isArr
    ? (deps as Array<State>)
    : [deps as State];

  // get instance of Pulse from either the first state or global
  if (!pulseInstance) pulseInstance = getInstance(depsArray[0]);

  // get React constructor
  const React = pulseInstance.intergration.frameworkConstructor;
  if (!React) return;

  // this is a trigger state used to force the component to re-render
  const [_, set_] = React.useState(false);

  React.useEffect(function() {
    // create a callback based subscription, callback invokes re-render trigger
    const cC = pulseInstance.subController.subscribe(() => set_(!_), depsArray);
    // unsubscribe on unmount
    return () => pulseInstance.subController.unsubscribe(cC);
  }, []);

  return depsArray;
}

export default {
  name: 'react',
  bind(pulseConstructor: any | Pulse) {
    pulseConstructor.React = ReactWrapper;
    pulseConstructor.usePulse = usePulse;
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
    pulseInstance.usePulse = (deps: Array<State> | State) =>
      usePulse(deps, pulseInstance);
  }
};
