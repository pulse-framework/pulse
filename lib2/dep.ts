import { Global } from './interfaces';
import { RelationTypes } from './relationController';

export default class Dep {
  public dependents: any = new Set();
  public subscribers: Array<object> = [];

  constructor(
    private global: Global,
    public name: string,
    public rootProperty: string,
    public propertyOnObject: string,
    public tickets: Array<string>
  ) {}

  register() {
    const subs = this.global.subs;

    if (this.global.runningComputed) {
      this.dependents.add(this.global.runningComputed);
    }
    if (this.global.runningPopulate) {
      this.global.relations.relate(
        RelationTypes.DATA_DEPENDS_ON_DEP,
        this.global.runningPopulate,
        this as Dep
      );
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
  ticket(uuid) {
    this.tickets.push(uuid);
  }
}
