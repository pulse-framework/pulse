// prettier-ignore
import Store from '../pulse'

const channels = {
  state: {
    channelOpened: true
  },
  model: {
    id: {
      type: Number,
      primaryKey: true
    }
  }
};
const posts = {
  model: {
    dateCreated: {
      primaryKey: true
    }
  }
};

const store = new Store({
  collections: {
    channels,
    posts
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
  actions: {
    switchTheme() {
      if (store.state.theme === "light") {
        store.commit("changeTheme", "dark");
        // store.set("theme", "dark");
      } else {
        store.commit("changeTheme", "light");
        // store.set("theme", "light");
      }
    }
  },
  getters: {
    getTheme(state) {
      return state.theme;
    }
  }
});

export default store;
