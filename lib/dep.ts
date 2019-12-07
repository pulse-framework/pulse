import { Global, ModuleInstance } from './interfaces';
import { DynamicRelation, RelationTypes } from './relationController';
import Collection from './module/modules/collection';
import { JobType } from './runtime';
import Computed from './computed';
import { ComponentContainer } from './subController';
export default class Dep {
  // these
  public dependents: Set<Computed> = new Set();
  public subscribers: Set<ComponentContainer> = new Set();

  // these are temporary relations created by the relation controller
  public dynamicRelation: DynamicRelation = null;

  // used to stop computed methods from tracking properties accessed within nested actions as dependecies
  public currentActionIndex: boolean | number = false;

  public subscribersToInternalDataAsCallbacks: Array<Function> = [];

  constructor(
    private global: Global,
    // if this dep is for public or internal data within a collection
    public type: 'reactive' | 'internal' | 'index' = 'reactive',
    // the name of the coll
    public parentModuleInstance: ModuleInstance,
    // either the name of the object if reactive or the primaryKey if internal
    public propertyName: string | number,
    // if the dep is part of a deep reactive object, this is the root property name
    public rootProperty: string = null
  ) {}

  // for when public data is accessed, reactive class will trigger this function
  register() {
    const subs = this.global.subs;
    const name = this.propertyName as string;

    if (this.type === 'reactive') {
      if (this.global.runningComputed && !this.global.runningWatcher) {
        // register dependent
        this.dependents.add(this.global.runningComputed);

        // if this property is a computed function that has not ran at least once

        if (
          this.parentModuleInstance.keys.computed.includes(this
            .propertyName as string) &&
          !this.parentModuleInstance.isComputedReady(this
            .propertyName as string)
        ) {
          // re-queue the computed function that is currently running
          // (not the one that is being accessed) this will give the unready computed
          // function a chance to run before this one is ran again, since runningComputed depends on the
          // output of this computed function
          // console.log('reingesting');
          this.global.runtime.ingest({
            type: JobType.COMPUTED_REGEN,
            property: this.global.runningComputed as Computed,
            collection: this.parentModuleInstance
          });
        }
      }
    } else if (this.type === 'internal') {
      let dataDep = this.global.runningPopulate as Dep;
      // if the data's dep class
      // action index matches the current action, create dynamic relation
      if (
        dataDep &&
        dataDep.currentActionIndex === this.global.runtime.runningActions.length
      )
        this.global.relations.relate(dataDep, this);
    }

    if (this.global.subs.trackingComponent)
      this.subscribe(this.global.subs.trackingComponent);

    if (subs.unsubscribingComponent) {
      // this.subscribers.delete(this.global.subscribingComponent);
    }
  }

  changed(newValue, config: any = {}) {
    let collection = this.parentModuleInstance as Collection;

    if (this.dynamicRelation)
      this.global.relations.cleanup(this.dynamicRelation);

    if (this.type === 'internal') {
      // get dynamic data
      const dataWithDynamicProperties = collection.injectDynamicRelatedData(
        newValue[collection.primaryKey as string],
        newValue
      );

      // run all callbacks and pass in dynamic data, unless important
      this.subscribersToInternalDataAsCallbacks.forEach(callback =>
        callback(
          config.important
            ? { ...dataWithDynamicProperties, ...newValue }
            : dataWithDynamicProperties
        )
      );
    }
  }

  subscribe(componentContainer: ComponentContainer) {
    if (!this.global.runtime.runningAction)
      this.subscribers.add(componentContainer);
  }
}
