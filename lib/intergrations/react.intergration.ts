import Pulse from '..';
import Dep from '../dep';
import { ComponentContainer } from '../subController';

function ReactWrapper(
  ReactComponent: any,
  depsFunc?: Function,
  pulseInstance?: Pulse
) {
  const pulse = pulseInstance || globalThis.__pulse;

  if (!pulse)
    console.error(
      `Pulse X React: Pulse instance inaccessible, it is likely you're using "Pulse.React()" before "new Pulse()"`
    );

  const global = pulse._private.global,
    React = global.config.frameworkConstructor;

  return class extends React.Component {
    // does pulse need to map data to props
    public mappable: boolean = false;

    constructor(public props: any) {
      super(props);

      // register component
      const cC = global.subs.registerComponent(this, {}, depsFunc);

      // use mapData to subscribe since we need to support older versions
      cC.automaticDepTracking = depsFunc === undefined;

      if (!cC.automaticDepTracking) {
        const { mapToProps, legacy } = global.subs.mapData(
          depsFunc,
          this,
          true
        );

        cC.mappable = mapToProps;
        cC.legacy = legacy;
      }
    }

    render() {
      let props = { ...this.props },
        cC = global.subs.get(this.__pulseUniqueIdentifier),
        customProp = global.config.mapDataUnderPropName,
        isFunc = typeof depsFunc === 'function';

      // METHOD (1) if no depFunc was supplied Pulse will track accessed dependencies
      if (cC.automaticDepTracking) {
        // start tracking component
        global.subs.trackingComponent = cC;
      }
      // METHOD (2) if custom prop is set and we were supplied a new mapData function
      else if (cC.mappable && customProp && isFunc) {
        props = {
          ...props,
          [customProp]: cC.depsFunc(global.contextRef)
        };
      }
      // METHOD (3) Pulse 2.2 map directly to props
      else if (cC.mappable && isFunc) {
        // concat current props with lastest pulse values
        props = { ...props, ...cC.depsFunc(global.contextRef) };
      }
      // METHOD (4) we were supplied legacy mapData object, string notation 'collection/property'
      else if (cC.legacy) {
        props = {
          ...props,
          // use custom prop name or if unset use 'pulse' since we know it's legacy
          [customProp || 'pulse']: global.subs.legacyMapData(cC.depsFunc)
            .evaluated
        };
      }

      return React.createElement(ReactComponent, props);
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
      componentInstance.setState(updatedData);
    } else {
      componentInstance.forceUpdate();
    }
  },
  onReady() {
    //
  }
};
