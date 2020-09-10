import { Pulse } from './internal';

export interface IntegrationConfig<T> {
  name?: any;
  foreignInstance?: T;
  updateMethod?: (componentInstance: any, updateProperties: any) => void;
  onPulseReady?: (pulseInstance: Pulse) => void;
  onCoreReady?: (pulseInstance: Pulse) => void;
}

// import this into integration modules to create a
export class Integration<T = any> {
  public ready?: boolean;
  constructor(public config: IntegrationConfig<T>) {}
}

export class Integrations {
  public loaded: { [key: string]: Integration } = {};
  public loadedSet: Set<Integration> = new Set();
  constructor(public instance: () => Pulse) {
    if (Pulse.initialIntegrations) Pulse.initialIntegrations.forEach(int => this.use(int));
  }
  public use(integration: Integration) {
    if (!(integration instanceof Integration) || !integration.config.name) throw 'Pulse Error: Not a valid integration object';
    this.loaded[integration.config.name] = integration;
    this.loadedSet.add(integration);
  }
  // Event runners
  public pulseReady() {
    this.loadedSet.forEach(integration => integration.config.onPulseReady && integration.config.onPulseReady(this.instance()));
  }
  public coreReady() {
    this.loadedSet.forEach(integration => integration.config.onCoreReady && integration.config.onCoreReady(this.instance()));
  }
  public update(componentInstance: any, updateProperties: any) {
    this.loadedSet.forEach(integration => integration.config.updateMethod && integration.config.updateMethod(componentInstance, updateProperties));
  }
}
