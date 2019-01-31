import Store from "./Store";

// This class is somewhat similar to modules in typical state storage libraries, but instead supports functions. It's state is loaded into the main state tree. 

class Collection {
    constructor({model, state, actions, mutations, getters}) {
        this.state = Object.create(null)
        
        // internal state
        this._model = model;
        this._indexes =Object.create(null)
    }
    createIndex(name, val, key) {
        if (val.constructor === Array) {
            if (!key && !val.hasOwnProperty('id')) {
                assert(`Failed to create index, key or id property required`)
                return;
            }
            this._indexes[name] = val.map(item => item[key ? key : 'id'])
        } else if (typeof val === 'object' && val !== null) {
            
        } else {
            assert(`Unable to create index from value provided`)
        }
    }
}



