import reactIntergration from './react.intergration';
import vueIntergration from './vue.intergration';

export interface Intergration {
  frameworkConstructor: any;
  name: any;
  bind: Function;
  wrapper: Function;
  updateMethod: Function;
}

export default (frameworkConstructor, PulseConstructor) => {
  // React support
  if (
    frameworkConstructor.hasOwnProperty(
      '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'
    )
  ) {
    PulseConstructor.intergration = reactIntergration;
    // Vue support
  } else if (frameworkConstructor.name === 'Vue') {
    PulseConstructor.intergration = vueIntergration;

    // Custom Intergration
  } else if (
    frameworkConstructor.hasOwnProperty('name') &&
    frameworkConstructor.hasOwnProperty('bind') &&
    frameworkConstructor.hasOwnProperty('updateData')
  ) {
    PulseConstructor.intergration = frameworkConstructor;
  }

  PulseConstructor.intergration.frameworkConstructor = frameworkConstructor;

  // if (!PulseConstructor.intergration) return;

  // PulseConstructor.intergration.bind(PulseConstructor);
};
