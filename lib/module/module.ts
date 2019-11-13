import { collectionFunctions, objectLoop } from '../helpers';
import Reactive from '../reactive';
import Action from '../action';
import Computed from '../computed';
import { JobType } from '../runtime';
import {
  Methods,
  Keys,
  CollectionObject,
  ExpandableObject,
  CollectionConfig,
  Global
} from '../interfaces';
import { normalizeGroups } from '../helpers';

// modules have a contained reactivity system which is the base
// of collections, services and
export default class Module {
  public public: Reactive;
  public keys: Keys = {};
  public onReady?: Function;

  protected namespace: CollectionObject;
  protected config: CollectionConfig = {}; //rename
  protected methods: Methods = {};
  protected actions: { [key: string]: Action } = {};
  protected computed: { [key: string]: Computed } = {};
  protected watchers: { [key: string]: any } = {};
  protected externalWatchers: { [key: string]: any } = {};
  protected persist: Array<string> = [];
  protected local: { [key: string]: any } = {};
  protected model: { [key: string]: any } = {};
  protected throttles: Array<Action> = [];

  constructor(
    public name: string,
    public global: Global,
    protected root: CollectionObject
  ) {
    // define aliases
    this.config = root.config;

    // legacy support ("filters" changed to "computed")
    root.computed = { ...root.computed, ...root.filters };

    // create this.namespace
    root = this.prepareNamespace(root);

    // create public object
    this.public = new Reactive(this, this.namespace);

    // init module features
    this.initRoutes(root.routes);
    this.initActions(root.actions);
    this.initWatchers(root.watch);
    this.initComputed(root.computed);

    // load persisted data from storage
    this.initPersist(root.persist);

    // init finished
    if (root.onReady) this.onReady = root.onReady;
  }
  private prepareNamespace(root: CollectionObject) {
    // map collection methods

    collectionFunctions.map(
      func => this[func] && (this.methods[func] = this[func].bind(this))
    );

    if (root.local) this.local = root.local;

    // for each type set default and register keys
    ['data', 'actions', 'computed', 'indexes', 'routes', 'watch'].forEach(
      type => {
        if (type !== 'indexes' && !root[type]) root[type] = {};
        this.keys[type] =
          type === 'indexes' ? root['groups'] || [] : Object.keys(root[type]);
      }
    );

    // assign namespace
    this.namespace = Object.assign(
      Object.create({ ...this.methods }), // bind methods to prototype
      {
        routes: {},
        indexes: {},
        actions: root.actions,
        ...root.computed,
        ...root.data,
        ...normalizeGroups(root.groups)
      }
    );
    return root;
  }
  private initRoutes(routes: ExpandableObject) {
    const self = this;
    const routeWrapped = routeName => {
      return function() {
        let requestObject = Object.assign({}, self.global.request);
        requestObject.context = self.global.getContext();
        return routes[routeName].apply(
          null,
          [requestObject].concat(Array.prototype.slice.call(arguments))
        );
      };
    };
    objectLoop(
      routes,
      routeName =>
        (this.public.object.routes[routeName] = routeWrapped(routeName))
    );
  }
  private initActions(actions: object = {}) {
    let actionKeys = Object.keys(actions);
    for (let i = 0; i < actionKeys.length; i++) {
      const action = actions[actionKeys[i]];
      this.actions[actionKeys[i]] = new Action(
        this.name,
        this.global,
        action,
        actionKeys[i]
      );

      this.public.privateWrite(actionKeys[i], this.actions[actionKeys[i]].exec);
    }
  }
  private initWatchers(watchers: object = {}) {
    let watcherKeys = Object.keys(watchers);
    for (let i = 0; i < watcherKeys.length; i++) {
      const watcher = watchers[watcherKeys[i]];
      this.watchers[watcherKeys[i]] = () => {
        this.global.runningWatcher = {
          collection: this.name,
          property: watcherKeys[i]
        };
        const watcherOutput = watcher(this.global.getContext(this.name));
        this.global.runningWatcher = false;
        return watcherOutput;
      };
    }
    this.watchers._keys = watcherKeys;
  }
  private initComputed(computed: object): void {
    objectLoop(
      computed,
      (computedName: string, computedFunction: () => void) => {
        this.computed[computedName] = new Computed(
          this.global,
          this.name,
          computedName,
          computedFunction
        );
        this.public.privateWrite(computedName, []);
      },
      this.keys.computed
    );
  }
  public initPersist(persist: Array<string>): void {
    if (!Array.isArray(persist)) return;

    for (let i = 0; i < persist.length; i++) {
      const dataName = persist[i];

      // register this
      this.persist.push(dataName);

      if (this.global.storage.isPromise) {
        this.global.storage.get(this.name, dataName).then(data => {
          if (data === undefined || data === null) return;
          this.global.ingest({
            type: JobType.PUBLIC_DATA_MUTATION,
            value: data,
            property: dataName,
            collection: this.name,
            dep: this.global.getDep(dataName, this.name)
          });
        });
      } else {
        let data = this.global.storage.get(this.name, dataName);
        if (data === undefined || data === null) continue;
        this.public.privateWrite(dataName, data);
      }
    }
  }
  public runWatchers(property) {
    const watcher = this.watchers[property];
    if (watcher) watcher();
    const externalWatchers = this.externalWatchers[property];
    if (externalWatchers)
      externalWatchers.forEach(func =>
        typeof func === 'function' ? func() : false
      );
  }
  // external functions
  private watch(property, callback) {
    if (!this.externalWatchers[property])
      this.externalWatchers[property] = [callback];
    else this.externalWatchers[property].push(callback);
  }
  private forceUpdate(property: string): void {
    // ensure property exists on collection
    if (this.public.exists(property)) {
      // if property is directly mutable

      if (this.public.properties.includes(property)) {
        this.global.ingest({
          type: JobType.PUBLIC_DATA_MUTATION,
          property,
          collection: this.name,
          value: this.public.privateGet(property),
          dep: this.global.getDep(property, this.name)
        });

        // if property is a computed method
      } else if (this.computed[property]) {
        this.global.ingest({
          type: JobType.COMPUTED_REGEN,
          property,
          collection: this.name,
          dep: this.global.getDep(property, this.name)
        });
      }
    }
  }
}
