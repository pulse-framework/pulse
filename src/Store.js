import {
    Log, assert
} from './Utils'

class Store {

    constructor() {
        let self = this;

        // public state
        this.state = Object.create(null)
        this.commits =  Object.create(null)
        this.getters =  Object.create(null)
        
        // internal state
        this.subs = []
        this._history = []
    }

    addState(obj) {
        var _self = this;
        this.state = { ...obj }

        this.state = new Proxy((obj || {}), {
            set: function (state, key, value) {
                state[key] = value;

                _self.subs.map(ctx => {
                    ctx.$set(ctx, key, value);
                })
                Log(`[STATE] Updated state ${key} to ${value}`)

                return true;
            }
        })
    }

    addCommit(commits) {
        for (let commitName in commits) {
            this.commits[commitName] = commits[commitName]
        }
    }

    addGetter(getters) {
        for (let getterName in getters) {
            this.getters[getterName] = getters[getterName]
        }
    }

    mapState(properties = []) {
        if (properties.length == 0) return this.state
        let ret = {};
        properties.forEach(prop => {
            ret[prop] = this.state[prop]
        })
        return ret;
    }

    subscribe(context) {
        this.subs.push(context);
    }

    getter(name) {
        this.getters[name]({
            state: this.state
        })
    }

    /** you can pass any context in the first argument here */
    commit(name, val) {
        Log(`[COMMIT] ${name}`)
        this._history.push({
            oldState: { ...this.state
            }
        })
        this.commits[name]({
            state: this.state
        }, val)
    }
    undo() {
        // if (this._history.length == 0) return
        // setTimeout(() => {
        //     this.state = this._history[0].oldState
        // }, 0)
        // this._history = this._history.slice(1)
    }
    
    

}


export default new Store();