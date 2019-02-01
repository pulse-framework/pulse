// prettier-ignore
import Store from '../pulse'

const channels = {
  state: {
    channelOpened: true
  }
};

const store = new Store({
  collections: {
    channels
  },
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
    switchTheme(state) {
      if (state.dark === "light") {
        store.commit("changeTheme");
      } else {
        store.set("theme", "light");
      }
    }
  }
});

export default store;
