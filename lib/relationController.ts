import { Global } from './interfaces';
import Computed from './computed';
import Dep from './dep';

export class DynamicRelation {
  public depsToClean: Set<Dep> = new Set();
  constructor(public updateThis: Dep | Computed) {}

  // perform cleanup of all refrences to this instance
  public destroy() {
    this.depsToClean.forEach(dep => dep.dependents.delete(this));
    delete this.updateThis.dynamicRelation;
  }
}

export default class RelationController {
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
    dynamicRelation.destroy(); // destory all refrences
    this.relationBank.delete(dynamicRelation); // remove last reference from bank
  }
}

export enum RelationTypes {
  COMPUTED_DEPENDS_ON_DATA = 'COMPUTED_DEPENDS_ON_DATA', // used by findById() when run in computed
  COMPUTED_DEPENDS_ON_GROUP = 'COMPUTED_DEPENDS_ON_GROUP', // used by getGroup() when run in computed
  DATA_DEPENDS_ON_DEP = 'DATA_DEPENDS_ON_DEP', // the Dep class of a property when used in populate()
  DATA_DEPENDS_ON_GROUP = 'DATA_DEPENDS_ON_GROUP', // used by getGroup() when run in populate()
  DATA_DEPENDS_ON_DATA = 'DATA_DEPENDS_ON_DATA' // used by findById() when run in populate()
}
