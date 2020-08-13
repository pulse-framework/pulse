import reactIntegration from './react.integration';
import vueIntegration from './vue.integration';
import Pulse from '../pulse';

export interface Integration {
  ready?: boolean;
  frameworkConstructor?: any;
  name?: any;
  bind?: Function;
  updateMethod?: Function;
  wrapper?: Function;
  onReady?: Function;
}

// This gets assigned to the constructor Pulse.integration
const integration: Integration = {
  ready: false
};

export default function use(plugin: any, pulseInstance: Pulse) {
  const frameworkName = getFrameworkName(plugin);

  switch (frameworkName) {
    case 'react':
      integrate(reactIntegration, 'react');
      break;
    case 'vue':
      integrate(vueIntegration, 'vue');
      break;
    case 'custom':
      if (validateCustomFramework(plugin as Integration)) integrate(plugin, 'custom');
      break;
  }

  // assign framework constructor to integration object
  if (frameworkName !== 'custom') integration.frameworkConstructor = plugin;

  // Inject into static property of constructor
  pulseInstance.integration = integration;

  // if the integration is ready, call bind otherwise warn user
  if (integration.ready) integration.bind(pulseInstance);
  else {
    console.error(`Pulse: Failed to integrate with framework! It's possible you didn't call Pulse.use() before new Pulse.`);
    // TODO: in some cases one might want to use Pulse without a framework so consider making this warning only show in dev, and making a config option to hide it entirely.
  }
}

//******** HELPERS BELOW *******

function integrate(int: Integration, frameworkName: string) {
  // bind all properties from integration
  Object.keys(int).forEach(property => {
    integration[property] = int[property];
  });
  // assign name and set ready
  integration.name = int.name || frameworkName;
  integration.ready = true;
}

function validateCustomFramework(customIntegration: Integration): boolean {
  let valid: boolean = true;
  // check for required properties
  ['name', 'bind', 'updateData'].forEach(property => {
    if (!customIntegration.hasOwnProperty(property)) valid = false;
  });
  return valid;
}

function getFrameworkName(frameworkConstructor): string {
  let name: string = 'custom';
  if (!frameworkConstructor) return name;

  // ATTEMPT CHECK FOR REACT
  if (frameworkConstructor.name === 'React' || frameworkConstructor.hasOwnProperty('__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'))
    return 'react';

  // ATTEMPT CHECK FOR VUE
  // this check works in dev, but not prod since Vue is a function that returns a constructor in prod, for some reason.
  if (frameworkConstructor.name === 'Vue') return 'vue';

  if (typeof frameworkConstructor === 'function') {
    return 'vue'; // more performant than below since it's kinda annoying to contruct an instance of Vue just to check if it is Vue, but it shouldn't hurt until we add support for more frameworks.
    let maybeVue = new frameworkConstructor();
    if (maybeVue._isVue) return 'vue';
  }

  return name;
}
