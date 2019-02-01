// prettier-ignore
import Store from '../pulse'

const store = new Store({
  state: {
    name: "Jamie",
    test: "Pulse is cool",
    theme: "dark"
  },
  mutations: {
    changeName({ self }, val) {
      state.name = val;
    },
    changeTheme({ self }, value) {
      store.set("theme", value);
    }
  },
  getters: {
    getTheme(state) {
      return state.theme;
    }
  },
  actions: {
    switchTheme() {
      if (self.getters.getTheme === "light") {
        store.commit("changeTheme");
      } else {
        store.set("theme", "light");
      }
    }
  }
});

export default store;
