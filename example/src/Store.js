class Store {

    constructor() {
        let self = this;

        this.state = {}
        this.subs = []
        this.commits = {}
    }

    addState(obj) {
        var _self = this;
        this.state = { ...obj
        }

        //Where is commit?
        this.state = new Proxy((obj || {}), {
            set: function (state, key, value) {
                state[key] = value;

                _self.subs.map(ctx => {
                    ctx.$set(ctx, key, value);
                })
                // it will call publishers
                console.log(`updated state ${key} to ${value}`)

                return true;
            }
        })
    }

    addCommit(commits) {
        for (let commitName in commits) {
            this.commits[commitName] = commits[commitName]
        }
    }

    mapState(properties = []) {
        // return this.state
        console.log(properties)
        if (properties.length == 0) return this.state

        let ret = {};
        properties.forEach(prop => {
            ret[prop] = this.state[prop]
        })

        console.log(ret);
        return ret;
    }

    subscribe(context) {
        this.subs.push(context);
    }

    commit(name, val) {
        this.commits[name](this.state, val)
    }

}

const _Store = new Store();

export default _Store;