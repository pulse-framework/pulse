import { Global } from "./interfaces";

export default class Dep {
  public dependents: any = new Set();
  public subscribers: Array<object> = [];

  constructor(
    private global: Global,
    public name: string,
    public rootProperty: string,
    public propertyOnObject: string
  ) {}

  register() {
    const subs = this.global.subs;

    if (this.global.runningFilter) {
      this.dependents.add(this.global.runningFilter);
    }
    if (subs.subscribingComponent) {
      this.subscribeComponent();
    }
    if (subs.unsubscribingComponent) {
      // this.subscribers.delete(this.global.subscribingComponent);
    }
  }

  subscribeComponent() {
    const subs = this.global.subs;

    if (this.rootProperty && subs.skimmingDeepReactive) {
      subs.prepareNext(this);
      return;
    }
    if (this.rootProperty) {
      subs.foundDeepReactive();
      subs.prepareNext(this);
      return;
    }
    if (!this.rootProperty && subs.skimmingDeepReactive) {
      subs.exitDeepReactive();
    }

    this.subscribe();

    subs.prepareNext(this);
  }
  subscribe() {
    const subs = this.global.subs;
    const keys = subs.subscribingComponent.keys;
    const key = keys[subs.subscribingComponentKey];
    const component = {
      componentUUID: subs.subscribingComponent.componentUUID,
      key: key
    };
    this.subscribers.push(component);
  }
}
