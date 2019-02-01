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
      store.setState("theme", value);
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
        store.setState("theme", "light");
      }
    }
  }
});

export default store;
