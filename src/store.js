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
    name: "",
    test: "Pulse is cool",
    theme: "dark"
  },
  mutations: {
    changeName({ self }, val) {
      state.name = val;
    },
    changeTheme({ self }, value) {
      self.set("theme", value);
    }
  },
  getters: {
    getTheme(state) {
      return state.theme;
    }
  },
  actions: {
    switchTheme() {
      if (store.state.theme === "light") {
        store.set("theme", "dark");
      } else {
        store.set("theme", "light");
      }
    }
  }
});

export default store;
