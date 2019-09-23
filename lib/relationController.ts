import { Global } from './interfaces';
import Computed from './computed';
import Dep from './dep';

export class DynamicRelation {
  public depsToClean: Set<Dep> = new Set();
  constructor(
    // refrence to the parent (the thing to update)
    public updateThis: Dep | Computed
  ) {}

  // perform cleanup of all refrences to this instance, before self desruct
  public destroy() {
    this.depsToClean.forEach(dep => dep.dependents.delete(this));
    delete this.updateThis.dynamicRelation;
  }
}

export default class RelationController {
  // used to store the dynamic relations. not needed, but great for  ugging
  private relationBank: Set<DynamicRelation> = new Set();

  constructor(private global: Global) {}

  // function called during runningComputed and runningPopulate
  public relate(updateThis: Computed | Dep, whenDepChanges: Dep) {
    if (!whenDepChanges) return; // if a dep is not found, abort
    let dep = whenDepChanges;

    if (!updateThis.dynamicRelation) {
      updateThis.dynamicRelation = new DynamicRelation(updateThis);
      this.relationBank.add(updateThis.dynamicRelation);
    }

    // save Dep inside relation so relation knows where to remove dependent from on cleanup
    updateThis.dynamicRelation.depsToClean.add(dep);

    // add dynamic relation as a dependent inside Dep
    dep.dependents.add(updateThis.dynamicRelation);
  }

  // when a job is complete with a dep that includes a dynamic
  public cleanup(dynamicRelation: DynamicRelation): void {
    // perform cleanup, destroy dynamic relation
    if (!dynamicRelation) return;
    console.log('cleaning', this.relationBank.size);
    dynamicRelation.destroy(); // destory all refrences
    this.relationBank.delete(dynamicRelation); // remove last reference from bank
  }
}

// 1) make data class for internal collection data, store these in "internalData"
// 2) getGroup should save dynamicRelation on corresponding dep & create one if not
// 3) deps should be stored in Reactive class, including dynamically created ones
// 4) dynamicRelations should be stored in Sets on Dep (groups should also use Dep) and Data classes
// 5) Computed and Data classes should store arrays of dynamicRelations under "related" Set
// 6) when Computed and Data runs send DynamicRelations to relation controller and delete relations
// 7) as an update will cause computed/populate to regen which in turn causes cleanup of dynamic relations to be necessary, a concept i had not previously realised- this saves a lot of cleanup logic.
export enum RelationTypes {
  COMPUTED_DEPENDS_ON_DATA = 'COMPUTED_DEPENDS_ON_DATA', // used by findById() when run in computed
  COMPUTED_DEPENDS_ON_GROUP = 'COMPUTED_DEPENDS_ON_GROUP', // used by getGroup() when run in computed
  DATA_DEPENDS_ON_DEP = 'DATA_DEPENDS_ON_DEP', // the Dep class of a property when used in populate()
  DATA_DEPENDS_ON_GROUP = 'DATA_DEPENDS_ON_GROUP', // used by getGroup() when run in populate()
  DATA_DEPENDS_ON_DATA = 'DATA_DEPENDS_ON_DATA' // used by findById() when run in populate()
}
// day 652. I havent found the root cause of magnetic pull. I will have to sell my bitcoins to fund my research on the topic. fear not. the mystery of magnest WILL be solved. -luka big pants.
