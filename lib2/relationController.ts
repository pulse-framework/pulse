// This file tracks and handles miscellaneous relationships between:
// - Data & Computed (findById())
// - Groups to sister collection groups (hasMany)

import { Global, JobType } from './interfaces';
import Computed from './computed';

export default class RelationController {
  private groupRelations: { [key: string]: Array<string> } = {};
  private dataRelationsToComputed: { [key: string]: Array<Computed> } = {};
  constructor(
    // collections reference
    private global: Global
  ) {}

  // Called inside "findById" and potentially other functions that allow data to be related to Computed properties
  public createInternalDataRelation(
    collectionName: string,
    primaryKey: string | number,
    computedInstance: Computed
  ) {
    const key = `${collectionName}/${primaryKey}`;
    let relations = this.dataRelationsToComputed[key];
    if (Array.isArray(relations)) relations.push(computedInstance);
    else this.dataRelationsToComputed[key] = [computedInstance];
  }

  // Called when internal data has been modified. It checks to see if any computed relations exist for that data.
  // If found, ingest the computed instance into the job queue.
  public internalDataModified(collection, primaryKey) {
    const key = `${collection}/${primaryKey}`;
    if (this.dataRelationsToComputed[key]) {
      this.dataRelationsToComputed[key].forEach(computedInstance => {
        // ingest instance
        this.global.ingest({
          type: JobType.COMPUTED_REGEN,
          collection: collection,
          property: computedInstance,
          dep: this.global.getDep(
            computedInstance.name,
            computedInstance.collection
          )
        });
      });
    }
  }
  // Computed functions that include "findById" will need to cleanup their relations since output of findById (the data to relate to) has probably changed)
  public computedCleanup(computed) {
    let relationKeys = Object.keys(this.dataRelationsToComputed);
    for (let i = 0; i < relationKeys.length; i++) {
      let relationKey = relationKeys[i];
      let relations = this.dataRelationsToComputed[relationKey];
      relations.forEach((computedInstance, index) => {
        if (computedInstance === computed) {
          relations.length > 1
            ? relations.splice(index, 1)
            : delete this.dataRelationsToComputed[relationKey];
        }
      });
    }
  }
}
