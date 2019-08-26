// This class is global, since relationships can be between collections.
// Three public functions: relate(), update() & cleanup()
// Collections & Deps get "tickets" which are UUIDs that reference relations stored here.
// this is the fastest way to access relations and cleanup from the outside.
// 5 different relationship types currently supported

import { Global, JobType } from './interfaces';
import Computed from './computed';
import Dep from './dep';
import { uuid, key } from './helpers';

// collection/primaryKey
export type Key = string;
// what to update
export type UpdateThis = Computed | Key;
// when to update it
export type WhenThisChanges = Key | Dep;

export enum RelationTypes {
  COMPUTED_DEPENDS_ON_DATA, // used by findById() when run in computed
  COMPUTED_DEPENDS_ON_GROUP, // used by getGroup() when run in computed
  DATA_DEPENDS_ON_DEP, // the Dep class of a property when used in populate()
  DATA_DEPENDS_ON_GROUP, // used by getGroup() when run in populate()
  DATA_DEPENDS_ON_DATA // used by findById() when run in populate()
}
export interface Relation {
  type: RelationTypes;
  updateThis: UpdateThis;
  whenThisChanges: WhenThisChanges;
  uuid: any;
}
export default class RelationController {
  private relations: { [key: string]: Relation } = {};
  private cleanupRefs: { [key: string]: Array<string> };
  constructor(private global: Global) {}

  private save(
    id: any,
    type: RelationTypes,
    updateThis: UpdateThis,
    whenThisChanges: WhenThisChanges
  ) {
    this.relations[id] = { uuid: id, type, updateThis, whenThisChanges };
  }

  private cleanup(cleanupKey: string): void {
    // delete relations for this cleanupKey based on the tickets saved
    this.cleanupRefs[cleanupKey].forEach(uuid => delete this.relations[uuid]);
    // empty old tickets ready for new evaluation
    this.cleanupRefs[cleanupKey] = [];
  }

  private saveTicketsByCleanupKey(cleanupKey, ticket) {
    if (Array.isArray(this.cleanupRefs[cleanupKey]))
      this.cleanupRefs[cleanupKey].push(ticket);
    // create new array with ticket already inside
    else this.cleanupRefs[cleanupKey] = [ticket];
  }

  public relate(
    type: RelationTypes,
    updateThis: UpdateThis,
    whenThisChanges: WhenThisChanges,
    collection?: string // needed for data relations
  ): void {
    // a unique identifier for this relation increases speed finding & cleaning up relations
    const ticket = uuid();

    // if collection is set we change whenThisChanges (expected as a primaryKey)
    // to be a key with the collection/key
    if (collection) whenThisChanges = key(collection, whenThisChanges as Key);

    // cleanup previous relations for this cleanup key
    let cleanupKey: string;

    // cleanup key is already set
    if (typeof updateThis === 'string') cleanupKey = updateThis as Key;
    // extract cleanup key from computed instance
    else if (updateThis instanceof Computed)
      cleanupKey = key(
        (updateThis as Computed).collection,
        (updateThis as Computed).name
      );

    // clean up
    this.cleanup(cleanupKey);

    // new cleanup ref
    this.saveTicketsByCleanupKey(cleanupKey, ticket);

    switch (type) {
      //
      case RelationTypes.COMPUTED_DEPENDS_ON_DATA:
        this.global.ticket(collection, ticket, whenThisChanges); // for update
        this.save(ticket, type, updateThis as Computed, whenThisChanges as Key);

        break;
      //
      case RelationTypes.COMPUTED_DEPENDS_ON_GROUP:
        this.global.ticket(collection, ticket, whenThisChanges);
        this.save(ticket, type, updateThis as Computed, whenThisChanges as Key);

        break;
      //
      case RelationTypes.DATA_DEPENDS_ON_DATA:
        (whenThisChanges as Dep).ticket(ticket);
        this.save(ticket, type, updateThis as Key, whenThisChanges as Key);

        break;
      //
      case RelationTypes.DATA_DEPENDS_ON_DEP:
        (whenThisChanges as Dep).ticket(ticket);
        this.save(ticket, type, updateThis as Key, whenThisChanges as Dep);

        break;
      //
      case RelationTypes.DATA_DEPENDS_ON_GROUP:
        this.global.ticket(collection, ticket);
        this.save(ticket, type, updateThis as Key, whenThisChanges as Key);

        break;
    }
  }

  // this should be called whenever the whenThisChanges value updates
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
          this.privateIngestDataUpdate(relation.updateThis as Key);

          break;
        //
        case RelationTypes.DATA_DEPENDS_ON_GROUP:
          this.privateIngestDataUpdate(relation.updateThis as Key);

          break;
        //
        case RelationTypes.DATA_DEPENDS_ON_DEP:
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
    this.global.runtime.ingest({
      type: JobType.COMPUTED_REGEN,
      collection: computed.collection,
      property: computed.name,
      dep: this.global.getDep(computed.name, computed.collection)
    });
  }

  privateIngestDataUpdate(updateThis: key): void {
    const parsed = this.parse(updateThis as Key);
    this.global.runtime.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: parsed.collection,
      property: parsed.primaryKey
    });
  }
}

// export enum RelationTypes {
//   COMPUTED_DEPENDS_ON_DATA, // used by findById() when run in computed                  //DONE
//   // { type: 0, updateThis: Computed, whenThisChanges: collection/primaryKey  }
//   // how: ingest Computed
//   // store uuid on collection (relations = [uuid, uuid]) [cleanup on run]

//   COMPUTED_DEPENDS_ON_GROUP, // used by getGroup() when run in computed
//   // { type: 1, updateThis: Computed, whenThisChanges: Dep (group)  }
//   // store uuid on Dep (relations = [uuid, uuid]) [cleanup on Computed run]
//   // how: ingest Computed

//   DATA_DEPENDS_ON_DEP, // the Dep class of a property when used in populate()            //DONE
//   // { type: 2, updateThis: collection/primaryKey, whenThisChanges: Dep (any) }
//   // store uuid on Dep (relations = [uuid, uuid]) [cleanup on data regen]

//   DATA_DEPENDS_ON_GROUP, // used by getGroup() when run in populate()                    //DONE
//   // { type: 3, updateThis: collection/primaryKey, whenThisChanges: collection/groupName (not a groups have Dep classes)  }
//   // store uuid on Dep (relations = [uuid, uuid]) [cleanup on data regen]

//   DATA_DEPENDS_ON_DATA // used by findById() when run in populate()
//   // { type: 4, updateThis: collection/primaryKey, whenThisChanges: collection/primaryKey  }
//   // store uuid on collectiternalDataRelations = [uuid, uuid]) [cleanup on data regen]
// }
