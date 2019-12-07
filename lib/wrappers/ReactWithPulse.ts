import Pulse from '..';
import Dep from '../dep';
import { ComponentContainer } from '../subController';

export function ReactWrapper(ReactComponent: any, depsFunc?: Function) {
  const pulse = globalThis.__pulse;
  if (!pulse)
    console.error(
      `Pulse X React: Pulse instance inaccessible, it is likely you're using "Pulse.React()" before "new Pulse()"`
    );
  const global = pulse._private.global;
  const React = global.config.frameworkConstructor;
  return class extends React.Component {
    private config = {
      waitForMount: global.config.waitForMount,
      blindSubscribe: true
    };
    private deps: Set<any> = new Set();
    constructor(private props: any) {
      super(props);

      // subscribe component to Pulse
      global.subs.registerComponent(this, this.config);
    }
    componentDidMount(): void {
      global.subs.trackingComponent = false;
      if (global.config.waitForMount) global.subs.mount(this);
    }
    componentWillUnmount(): void {
      if (global.config.autoUnmount) global.subs.untrack(this);
    }
    registerDeps(componentContainer: ComponentContainer) {
      let { deps, isMapData, evaluated } = global.subs.getAllDepsForProperties(
        depsFunc
      );
      this.deps = deps;
      this.isMapData = isMapData;
      this.deps.forEach(dep => dep.subscribe(componentContainer));
      if (isMapData) this.mappedData = evaluated;
    }
    render() {
      let componentContainer: ComponentContainer = global.subs.get(
        this.__pulseUniqueIdentifier
      );

      let manualDepTracking: boolean = typeof depsFunc === 'function';

      if (manualDepTracking) this.registerDeps(componentContainer);
      else global.subs.trackingComponent = componentContainer;

      if (!global.subs.trackingComponent && !manualDepTracking)
        console.error('Pulse x React: React component not found!');

      let component: any;
      if (this.isMapData) {
        component = React.createElement(ReactComponent, {
          ...this.props,
          ...this.mappedData
        });
      } else {
        component = React.createElement(ReactComponent, this.props);
      }
      return component;
    }
  };
}

export function useFramework(ReactConstructor) {
  // set framework here
}
