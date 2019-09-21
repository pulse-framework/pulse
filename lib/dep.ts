import { Global } from './interfaces';
import { RelationTypes } from './relationController';
import { DynamicRelation } from './relationController2';
import Collection from './collection';
export default class Dep {
  // these
  public dependents: any = new Set();
  public subscribers: Array<object> = [];

  // these are temporary relations created by the relation controller
  public dynamicRelations: Set<DynamicRelation> = new Set();

  constructor(
    private global: Global,
    // if this dep is for public or internal data within a collection
    public type: 'reactive' | 'internal' = 'reactive',
    // the name of the coll
    public colleciton: Collection,
    // either the name of the object if rective or the primaryKey if internal
    public propertyName: string | number,
    // if the dep is part of a deep reactive object, this is the root property name
    public rootProperty: string = null
  ) {}

  // for when public data is accessed, reactive class will trigger this function
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
  // matteo just rolled over my toe with alijah's chair :(
  changed() {}

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
