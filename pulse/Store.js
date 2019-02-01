import { Log, assert } from "./Utils";

import Collections from "./Collection";

class Store {
  constructor({
    collections = {},
    actions = {},
    state = {},
    getters = {},
    mutations = {}
  }) {
    let self = this;

    // public state
    this.state = Object.create(null);
    this.mutations = Object.create(null);
    this.getters = Object.create(null);
    this.actions = Object.create(null);

    // internal state
    this._collections = Object.create(null);
    this._subscribers = [];
    this._history = [];

    if (state) this.addState(state);
    if (actions) this.addAction(actions);
    if (mutations) this.addMutation(mutations);
    if (getters) this.addGetter(getters);
    if (collections) this.initCollections(collections);
  }

  subscribe(context) {
    this._subscribers.push(context);
  }

  // build the collection classes
  initCollections(collections) {
    let loop = Object.keys(collections)[("accounts", "channels")];
    for (let index in loop) {
      this.collections[index] = new Collections(collections);
      // check if the instance has a naming conflict
      if (this[index])
        assert(
          `Collection name conflict, instance already has ${index} thus it will not be accessable on the root state tree.`
        );
      else {
        // bind the collection class to the root state tree
        this[index] = this.collections[index];
      }
    }
  }

  addState(obj) {
    var _self = this;
    this.state = { ...obj };

    //Its just a Listener
    this.state = new Proxy(obj || {}, {
      set: function(state, key, value) {
        state[key] = value;
        _self._subscribers.map(context => {
          context.$set(context, key, value);
        });
        Log(`[STATE] Updated state ${key} to ${value}`);

        return true;
      }
    });
  }
  addMutation(mutations) {
    for (let mutationName in mutations) {
      this.mutations[mutationName] = mutations[mutationName];
    }
  }
  addGetter(getters) {
    for (let getterName in getters) {
      this.getters[getterName] = getters[getterName];
    }
  }
  addAction(actions) {
    for (let actionName in actions) {
      this.actions[actionName] = actions[actionName];
    }
  }

  // ******************** */
  // External functions

  // basic get/set to mutate global state
  get(name) {
    this.getters[name]({
      state: this.state
    });
  }
  set(stateName, value) {
    this.state[stateName] = value;
  }

  dispatch(name, val) {
    this.actions[name](
      {
        mutation: this.mutations
      },
      val
    );
  }

  // mapState: Returns any state names passed as properties or if blank the entire state tree
  mapState(properties = []) {
    if (properties.length == 0) return this.state;
    let ret = {};
    properties.forEach(prop => {
      ret[prop] = this.state[prop];
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
