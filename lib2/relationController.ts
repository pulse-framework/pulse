// This class is global, since relationships can be global.
// This class has three public functions: relate(), update() & cleanup()
// Provides Collections & Deps with "tickets" which are UUIDs that reference relations stored on this class
// This class has 5 different relationship types currently supported
// upd
import { Global, JobType } from './interfaces';
import Computed from './computed';
import Dep from './dep';
import { uuid } from './helpers';

// collection/primaryKey
export type Key = string;
// what to update
export type UpdateThis = Computed | Key;
// when to update it
export type WhenThisChanges = Key | Dep;

export enum RelationTypes {
  COMPUTED_DEPENDS_ON_DATA, // used by findById() when run in computed
  // { type: 0, updateThis: Computed, whenThisChanges: collection/primaryKey  }
  // how: ingest Computed
  // store uuid on collection (relations = [uuid, uuid]) [cleanup on run]

  COMPUTED_DEPENDS_ON_GROUP, // used by getGroup() when run in computed
  // { type: 1, updateThis: Computed, whenThisChanges: Dep (group)  }
  // store uuid on Dep (relations = [uuid, uuid]) [cleanup on Computed run]
  // how: ingest Computed

  DATA_DEPENDS_ON_DEP, // the Dep class of a property when used in include()            //DONE
  // { type: 2, updateThis: collection/primaryKey, whenThisChanges: Dep (any) }
  // store uuid on Dep (relations = [uuid, uuid]) [cleanup on data regen]

  DATA_DEPENDS_ON_GROUP, // used by getGroup() when run in include()
  // { type: 3, updateThis: collection/primaryKey, whenThisChanges: Dep (group)  }
  // store uuid on Dep (relations = [uuid, uuid]) [cleanup on data regen]

  DATA_DEPENDS_ON_DATA // used by findById() when run in include()
  // { type: 4, updateThis: collection/primaryKey, whenThisChanges: collection/primaryKey  }
  // store uuid on collectiternalDataRelations = [uuid, uuid]) [cleanup on data regen]
}

export interface Relation {
  type: RelationTypes;
  updateThis: UpdateThis;
  whenThisChanges: WhenThisChanges;
  uuid: any;
}

export default class RelationController {
  private relations: { [key: string]: Relation } = {};
  constructor(private global: Global) {}

  private save(
    id: any,
    type: RelationTypes,
    updateThis: UpdateThis,
    whenThisChanges: WhenThisChanges
  ) {
    this.relations[id] = { uuid: id, type, updateThis, whenThisChanges };
  }

  public cleanup(uuids: Array<string>): void {
    uuids.forEach(uuid => delete this.relations[uuid]);
  }

  public relate(
    type: RelationTypes,
    updateThis: UpdateThis,
    whenThisChanges: WhenThisChanges,
    collection?: string // needed for data relations
  ): void {
    // a unique identifier for this relation increases speed finding & cleaning up relations
    const id = uuid();

    if (collection) whenThisChanges = `${collection}/${whenThisChanges as Key}`;

    switch (type) {
      //
      case RelationTypes.COMPUTED_DEPENDS_ON_DATA:
        this.global.ticket(collection, id, whenThisChanges);
        this.save(id, type, updateThis as Computed, whenThisChanges);

        break;
      //
      case RelationTypes.COMPUTED_DEPENDS_ON_GROUP:
        (whenThisChanges as Dep).ticket(id);
        this.save(id, type, updateThis as Computed, whenThisChanges as Dep);

        break;
      //
      case RelationTypes.DATA_DEPENDS_ON_DATA:
        (whenThisChanges as Dep).ticket(id);
        this.save(id, type, updateThis as Key, whenThisChanges as Dep);

        break;
      //
      case RelationTypes.DATA_DEPENDS_ON_DEP:
        (whenThisChanges as Dep).ticket(id);
        this.save(id, type, updateThis as Key, whenThisChanges as Dep);

        break;
      //
      case RelationTypes.DATA_DEPENDS_ON_GROUP:
        this.global.ticket(collection, id);
        this.save(id, type, updateThis as Key, whenThisChanges as Dep);

        break;
    }
  }

  public update(uuids: Array<string>): void {
    uuids.forEach(uuid => {
      const relation = this.relations[uuid];

      switch (relation.type) {
        //
        case RelationTypes.COMPUTED_DEPENDS_ON_DATA:
          this.ingestComputed(relation.updateThis as Computed);

          break;
        //
        case RelationTypes.COMPUTED_DEPENDS_ON_GROUP:
          this.ingestComputed(relation.updateThis as Computed);

          break;
        //
        case RelationTypes.DATA_DEPENDS_ON_DATA:
          break;
      }
    });
  }

  private parse(key: string) {
    return {
      collection: key.split('/')[0],
      primaryKey: key.split('/')[1]
    };
  }

  private ingestComputed(computed: Computed) {
    this.global.ingest({
      type: JobType.COMPUTED_REGEN,
      collection: computed.collection,
      property: computed,
      dep: this.global.getDep(computed.name, computed.collection)
    });
  }
}
