import Pulse from './Store'

class PulseVueStore {
    constructor(Vue) {
        const store = new Pulse()
        this.store = new Vue({
            data() {
                return {
                    store
                };
            },
        });
    }

    getStore() {
        return this.store.$data.store
    }
}
export default {
    install: (Vue, options = {}) => {
        Vue.prototype.$store = new PulseVueStore(
            Vue
        ).getStore()
    },
};