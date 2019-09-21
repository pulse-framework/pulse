import { Global } from './interfaces';
import Computed from './computed';
import { JobType } from './runtime';
import Dep from './dep';
import Collection from './Collection';
import { key } from './helpers';

export enum RelationTypes {
  COMPUTED_DEPENDS_ON_DATA = 'COMPUTED_DEPENDS_ON_DATA', // used by findById() when run in computed
  COMPUTED_DEPENDS_ON_GROUP = 'COMPUTED_DEPENDS_ON_GROUP', // used by getGroup() when run in computed
  DATA_DEPENDS_ON_DEP = 'DATA_DEPENDS_ON_DEP', // the Dep class of a property when used in populate()
  DATA_DEPENDS_ON_GROUP = 'DATA_DEPENDS_ON_GROUP', // used by getGroup() when run in populate()
  DATA_DEPENDS_ON_DATA = 'DATA_DEPENDS_ON_DATA' // used by findById() when run in populate()
}

// T wan is the best
export class DynamicRelation {
  public watching: Set<Dep> = new Set();
  constructor(
    // refrence to the parent (the thing to update)
    public updateThis: Dep | Computed
  ) {}

  // perform cleanup of all refrences to this instance, before self desruct
  public destroy() {
    this.watching.forEach(dep => dep.dependents.delete(this));
    this.updateThis.dynamicRelations.delete(this);
  }
}

export default class RelationController {
  public relating: DynamicRelation;
  private relationBank: Set<DynamicRelation> = new Set();
  constructor(private global: Global) {}

  // function called during runningComputed and runningPopulate
  // updateThis
  public relate(updateThis: Computed | Dep, whenDepChanges: Dep) {
    let relation: DynamicRelation;
    // if we're dealing with the same evaluation
    if (this.relating.updateThis !== updateThis) {
      // create dynamic relation class per relation
      relation = new DynamicRelation(updateThis);
      this.relationBank.add(relation);
      this.relating = relation;
    } else {
      relation = this.relating;
    }

    // add this relation instance to parent
    updateThis.dynamicRelations.add(relation);
    // ^^ this might be better as a single property, as there will only be
    // one DynamicRelation per updateThis

    // add dynamic relation to dependents inside Dep
    whenDepChanges.dependents.add(relation);
  }

  // this is called when a dep updates
  public update(dynamicRelations: Set<DynamicRelation>): void {
    let thingsToUpdate: Set<Computed | Dep> = new Set();

    dynamicRelations.forEach(dynamicRelation => {
      // save the thing we're updating
      thingsToUpdate.add(dynamicRelation.updateThis);
      // perform cleanup, destroy dynamic relation
      dynamicRelation.destroy(); // destory all refrences
      this.relationBank.delete(dynamicRelation); // remove last reference from bank
    });

    // ingest thing to update into runtime
    this.global.ingestDependents(thingsToUpdate);
  }
}

// 1) make data class for internal collection data, store these in "internalData"
// 2) getGroup should save dynamicRelation on corresponding dep & create one if not
// 3) deps should be stored in Reactive class, including dynamically created ones
// 4) dynamicRelations should be stored in Sets on Dep (groups should also use Dep) and Data classes
// 5) Computed and Data classes should store arrays of dynamicRelations under "related" Set
// 6) when Computed and Data runs send DynamicRelations to relation controller and delete relations
// 7) as an update will cause computed/populate to regen which in turn causes cleanup of dynamic relations to be necessary, a concept i had not previously realised- this saves a lot of cleanup logic.
