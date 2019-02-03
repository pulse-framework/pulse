import { Log, assert } from "./Utils";

import Collections from "./Collection";

class Store {
  constructor({
    collections = {},
    data = {},
    indexes = [],
    actions = {},
    mutations = {},
    filters = {}
  }) {
    // internal state
    this._collections = Object.create(null);
    this._globalDataRefrence = Object.create(null);
    this._globalDependencyTree = Object.create(null);
    this._subscribers = [];
    this._history = [];
    this._errors = [];

    // user supplied data and fuctions this will be passed to the collections constructor and replaced

    collections.root = { data, indexes, actions, mutations, filters };
    // init collections
    if (collections) this.initCollections(collections);
    // bind root collection data to root
    this.data = this._collections.root.data;

    // below should happen after we've validated and delt with any namespace clashes on the collections (todo)

    if (this._collections) {
      let loop = Object.keys(this._collections);
      for (let collection of loop) {
        this._globalDataRefrence[collection] = this._collections[
          collection
        ].data;
      }
    }

    // run filters
  }

  subscribe(context) {
    this._subscribers.push(context);
  }

  // build the collection classes
  initCollections(collections) {
    let loop = Object.keys(collections);
    for (let index of loop) {
      this._collections[index] = new Collections(
        {
          name: index,
          subscribers: this._subscribers,
          history: this._history,
          errors: this._errors,
          updateSubscribers: this.updateSubscribers,
          globalDataRefrence: this._globalDataRefrence,
          globalDependencyTree: this._globalDependencyTree
        },
        collections[index]
      );
      // check if the instance has a naming conflict
      if (this[index]) {
        assert(
          `Collection name conflict, instance already has "${index}" thus it will not be accessable on the root state tree.`
        );
      } else if (index !== "root") {
        // bind the collection class to the root state tree
        this[index] = this._collections[index];
      }
    }
  }

  // Bind collection functions to root
  collect(data, index) {
    this._collections.root.collect(data, index);
  }

  // this is run once on the constuctor, the proxy detects when the state is changed, subsequently notifying the subscribers.
  initState(obj) {
    this.state = new Proxy(obj || {}, {
      set: (state, key, value) => {
        state[key] = value;

        this.updateSubscribers(key, value);

        // return true so we know it went well, otherwise it will error.
        return true;
      }
    });
  }

  // Anytime we detect a change, this function will push the updates to the subscribed components for both Vue and React
  updateSubscribers(key, value) {
    // console.log("updating subscribers", key, value);
    this._subscribers.map(component => {
      if (component._isVue) {
        if (component.hasOwnProperty(key)) {
          console.log("UPDATING COMPONENTS", key);
          component.$set(component, key, value);
        }
      } else {
        self.processCallbacks(this.state);
      }
      // console.log("PULSE INSTANCE", this);
    });
  }

  processCallbacks(data) {
    if (!self._subscribers.length) return false;
    this._subscribers.forEach(callback => callback(data));
    return true;
  }

  //
  // addMutation(mutations) {
  //   for (let mutationName in mutations) {
  //     this.mutations[mutationName] = mutations[mutationName];
  //   }
  // }
  // addGetter(getters) {
  //   for (let getterName in getters) {
  //     this.getters[getterName] = getters[getterName];
  //   }
  // }
  // addAction(actions) {
  //   for (let actionName in actions) {
  //     this.actions[actionName] = actions[actionName];
  //   }
  // }

  // ******************** */
  // External functions

  // basic get/set to mutate global state
  // get(name) {
  //   if (!this.getters[name]) return assert(`Getter ${name} not found.`);
  //   return this.getters[name](this.state, this.getters);
  // }
  // set(stateName, value) {
  //   this.state[stateName] = value;
  // }

  // dispatch(name, val) {
  //   this.actions[name](
  //     {
  //       mutation: this.mutations
  //     },
  //     val
  //   );
  // }

  // mapState: Returns any state names passed as properties or if blank the entire state tree
  mapState(properties = []) {
    if (properties.length == 0) return this.state;
    let ret = {};
    properties.forEach(prop => {
      ret[prop] = this.state[prop];
    });
    return ret;
    return null;
  }
  mapCollection(collection, properties = []) {
    if (properties.length == 0) {
      return this._collections[collection].data;
    }
    let ret = {};
    properties.forEach(prop => {
      ret[prop] = this._collections[collection].data[prop];
    });
    return ret;
  }

  /** you can pass any context in the first argument here */
  commit(name, val) {
    Log(`[COMMIT] ${name}`);
    this._history.push({
      oldState: { ...this.state }
    });
    this.mutations[name](
      {
        self: this
      },
      val
    );
  }
  undo() {
    // if (this._history.length == 0) return
    // setTimeout(() => {
    //     this.state = this._history[0].oldState
    // }, 0)
    // this._history = this._history.slice(1)
  }
}

export default Store;
