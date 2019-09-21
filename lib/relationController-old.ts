import { Global } from './interfaces';
import Computed from './computed';
import { JobType } from './runtime';
import Dep from './dep';
import { uuid, key, parse } from './helpers';
import { renameSync } from 'fs';
import { brotliCompress } from 'zlib';

// This class is global, since relationships can be between collections.
// Three public functions: relate(), update() & cleanup()
// Collections & Deps get "tickets" which are UUIDs that reference relations stored here.
// this is the fastest way to access relations and cleanup from the outside.
// 5 different relationship types currently supported

// collection/primaryKey
export type Key = string;
// what to update
export type UpdateThis = Computed | Key;
// when to update it
export type WhenThisChanges = Key | Dep;

export type CleanupKey = string;

export enum RelationTypes {
  COMPUTED_DEPENDS_ON_DATA = 'COMPUTED_DEPENDS_ON_DATA', // used by findById() when run in computed
  COMPUTED_DEPENDS_ON_GROUP = 'COMPUTED_DEPENDS_ON_GROUP', // used by getGroup() when run in computed
  DATA_DEPENDS_ON_DEP = 'DATA_DEPENDS_ON_DEP', // the Dep class of a property when used in populate()
  DATA_DEPENDS_ON_GROUP = 'DATA_DEPENDS_ON_GROUP', // used by getGroup() when run in populate()
  DATA_DEPENDS_ON_DATA = 'DATA_DEPENDS_ON_DATA' // used by findById() when run in populate()
}
export interface Relation {
  type: RelationTypes;
  updateThis: UpdateThis;
  whenThisChanges: WhenThisChanges;
}
export default class RelationController {
  private relations: { [key: string]: Relation } = {};
  private cleanupRefs: { [key: string]: Array<string> } = {};
  private relationSize: number = 0;

  // for data depending on data we store the dep by the cleanupKey
  // object key is CleanupKey but typescript doesn't allow custom types for object keys as they can only be strings
  private watchingDeps: { [key: string]: Array<Dep> } = {};
  constructor(private global: Global) {}

  private save(
    id: any,
    type: RelationTypes,
    updateThis: UpdateThis,
    whenThisChanges: WhenThisChanges
  ) {
    this.relations[id] = {
      type,
      updateThis,
      whenThisChanges
    };
  }

  private cleanup(cleanupKey: string): void {
    if (!this.cleanupRefs[cleanupKey]) return;
    // delete relations for this cleanupKey based on the tickets saved
    this.cleanupRefs[cleanupKey].forEach(ticket => {
      const whenThisChanges = this.relations[ticket].whenThisChanges;

      if (typeof whenThisChanges !== 'string') return;

      // tell collections to clean their tickets
      this.global.cleanupTickets(whenThisChanges);

      delete this.relations[ticket];
    });

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

    // this.relationSize = Object.keys(this.relations).length;

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

    // clean up all previous tickets for this relation by unique cleanup key
    this.cleanup(cleanupKey);

    // console.log(cleanupKey);

    // new cleanup ref
    this.saveTicketsByCleanupKey(cleanupKey, ticket);

    switch (type) {
      // used to relate the result of findById() when used in a Computed method
      case RelationTypes.COMPUTED_DEPENDS_ON_DATA:
        this.global.ticket(collection, ticket, whenThisChanges); // for update
        this.save(ticket, type, updateThis as Computed, whenThisChanges as Key);

        break;
      // used to relate the result of getGroup() when used in a Computed method
      case RelationTypes.COMPUTED_DEPENDS_ON_GROUP:
        this.global.ticket(collection, ticket, whenThisChanges);
        this.save(ticket, type, updateThis as Computed, whenThisChanges as Key);

        break;
      // used to relate the result of findById() when used in populate()
      case RelationTypes.DATA_DEPENDS_ON_DATA:
        this.global.ticket(collection, ticket, whenThisChanges);
        this.save(ticket, type, updateThis as Key, whenThisChanges as Key);

        break;
      // used to relate the result of getGroup() when used in populate()
      case RelationTypes.DATA_DEPENDS_ON_GROUP:
        this.global.ticket(collection, ticket, whenThisChanges);
        this.save(ticket, type, updateThis as Key, whenThisChanges as Key);

        break;

      //
      case RelationTypes.DATA_DEPENDS_ON_DEP:
        (whenThisChanges as Dep).ticket(ticket);
        this.save(ticket, type, updateThis as Key, whenThisChanges as Dep);

        break;
    }
  }

  // this should be called whenever the whenThisChanges value updates
  // taking an array of tickets (usually one) to ingest updates
  public update(tickets: Array<string>): void {
    tickets.forEach(ticket => {
      const relation = this.relations[ticket];

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
          this.ingestDataUpdate(relation.updateThis as Key);

          break;
        //
        case RelationTypes.DATA_DEPENDS_ON_GROUP:
          this.ingestDataUpdate(relation.updateThis as Key);

          break;
        //
        case RelationTypes.DATA_DEPENDS_ON_DEP:
          const parsed = parse(relation.updateThis as Key);
          this.global.ingest({
            type: JobType.INTERNAL_DATA_MUTATION,
            collection: parsed.collection,
            property: parsed.primaryKey
          });
          break;
      }
    });
  }

  private ingestComputed(computed: Computed) {
    this.global.ingest({
      type: JobType.COMPUTED_REGEN,
      collection: computed.collection,
      property: computed.name,
      dep: this.global.getDep(computed.name, computed.collection)
    });
  }

  private ingestDataUpdate(updateThis: key): void {
    const parsed = parse(updateThis as Key);
    this.global.ingest({
      type: JobType.INTERNAL_DATA_MUTATION,
      collection: parsed.collection,
      property: parsed.primaryKey
    });
  }
}

// big pants rules, dont crush ramen. you fucking imbecile. why would you even do that i dont understand like what the fuck bro
// whats good this is luka just chillin, the date is wednesday, september 18th. 1:49 AM. i still dont know how magnets work. I will be back with updates. thank you. -big pants.
// its me, luka. im back. still no update on the magnet problem. ill check back in later. good luck.
// its luka again. help. they found me.
// jamie is actually blind what the hell
