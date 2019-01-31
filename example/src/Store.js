import {
    Log
} from './Utils'

class Store {

    constructor() {
        let self = this;

        this.state = {}
        this.subs = []
        this.commits = {}
        this.histories = []
        this.getters = {}
    }

    addState(obj) {
        var _self = this;
        this.state = { ...obj
        }

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
        //Is it possible? To console.log("commitName was commited")?
        Log(`[COMMIT] ${name}`)
        this.histories.push({
            oldState: { ...this.state
            }
        })
        this.commits[name]({
            state: this.state
        }, val)
    }
    //Who is Redux or Vuex? NotifyX > All
    undo() {
        // if (this.histories.length == 0) return
        // setTimeout(() => {
        //     this.state = this.histories[0].oldState
        // }, 0)
        // this.histories = this.histories.slice(1)
    }

}

const _Store = new Store();

export default _Store;