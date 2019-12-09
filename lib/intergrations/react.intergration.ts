import Pulse from '..';
import Dep from '../dep';
import { ComponentContainer } from '../subController';

function ReactWrapper(ReactComponent: any, depsFunc?: Function) {
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
      let {
        deps,
        isMapData,
        evaluated
      } = global.subs.analyseFunctionForReactiveProperties(depsFunc);
      this.isMapData = isMapData;

      deps.forEach(dep => dep.subscribe(componentContainer));

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
        let props = this.props,
          old = global.config.mapDataUnderPropName;

        // support for 2.1 React props as pulse.mappedName but with ability to choose a custom name
        if (old) props[old] = this.mappedData;
        else props = { ...props, ...this.mappedData };

        component = React.createElement(ReactComponent, props);
      } else {
        component = React.createElement(ReactComponent, this.props);
      }
      return component;
    }
  };
}

export default {
  name: 'react',
  bind(pulseConstructor) {
    pulseConstructor.React = ReactWrapper;
  },
  updateMethod(componentInstance: any, updatedData: Object) {
    if (updatedData) {
      componentInstance.$setState(updatedData);
    } else {
      componentInstance.forceUpdate();
    }
  }
};
