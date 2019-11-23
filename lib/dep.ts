import { Global } from './interfaces';
import { DynamicRelation, RelationTypes } from './relationController';
import Collection from './module/modules/collection';
export default class Dep {
  // these
  public dependents: any = new Set();
  public subscribers: Array<object> = [];

  // these are temporary relations created by the relation controller
  public dynamicRelation: DynamicRelation = null;

  // used to stop computed methods from tracking properties accessed within nested actions as dependecies
  public currentActionIndex: boolean | number = false;

  public subscribersAsCallbacks: Array<Function> = [];

  constructor(
    private global: Global,
    // if this dep is for public or internal data within a collection
    public type: 'reactive' | 'internal' | 'index' = 'reactive',
    // the name of the coll
    public collection: Collection,
    // either the name of the object if reactive or the primaryKey if internal
    public propertyName: string | number,
    // if the dep is part of a deep reactive object, this is the root property name
    public rootProperty: string = null
  ) {}

  // for when public data is accessed, reactive class will trigger this function
  register() {
    const subs = this.global.subs;

    if (this.global.runningComputed)
      this.dependents.add(this.global.runningComputed);

    let dataDep = this.global.runningPopulate as Dep;

    // if the data's dep class
    // action index matches the current action create dynamic relation
    if (
      dataDep &&
      dataDep.currentActionIndex === this.global.runtime.runningActions.length
    )
      this.global.relations.relate(dataDep, this);

    if (subs.subscribingComponent) this.subscribeComponent();

    if (subs.unsubscribingComponent) {
      // this.subscribers.delete(this.global.subscribingComponent);
    }
  }

  changed(newValue, config: any = {}) {
    if (this.dynamicRelation)
      this.global.relations.cleanup(this.dynamicRelation);

    // get dynamic data
    const dataWithDynamicProperties = this.collection.injectDynamicRelatedData(
      newValue[this.collection.primaryKey as string],
      newValue
    );

    // run all callbacks and pass in dynamic data, unless important
    this.subscribersAsCallbacks.forEach(callback =>
      callback(
        config.important
          ? { ...dataWithDynamicProperties, ...newValue }
          : dataWithDynamicProperties
      )
    );
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
