import Pulse from '..';

export function ReactWrapper(ReactComponent: any) {
  const pulse = globalThis.__pulse;
  if (!pulse)
    console.error(
      `Pulse X React: Pulse instance inaccessible, it is likely you're using "Pulse.React()" before "new Pulse()"`
    );
  const global = pulse._private.global;
  const React = global.config.frameworkConstructor;
  return class extends React.Component {
    constructor(private props) {
      super(props);

      // subscribe component to Pulse
      global.subs.registerComponent(this, {
        waitForMount: global.config.waitForMount,
        blindSubscribe: true
      });
    }
    componentDidMount() {
      global.subs.trackingComponent = false;
      if (global.config.waitForMount) pulse.mount(this);
    }
    componentWillUnmount() {
      if (global.config.autoUnmount) pulse.unmount(this);
    }
    render() {
      global.subs.trackingComponent = global.subs.get(
        this.__pulseUniqueIdentifier
      );
      if (!global.subs.trackingComponent)
        console.error('Pulse x React: React component not found!');

      const component = React.createElement(ReactComponent, this.props);
      return component;
    }
  };
}

export function useFramework(ReactConstructor) {
  // set framework here
}
