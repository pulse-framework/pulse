import channels from "./channels.collection";
import posts from "./posts.collection";

export default {
  collections: {
    channels,
    posts
  },
  data: {
    name: "",
    test: "Pulse is cool",
    theme: "dark"
  },
  mutations: {
    changeName({ self }, val) {
      self.name = val;
    },
    changeTheme({ self }, value) {
      self.set("theme", value);
    }
  },
  request: {
    baseURL: "https://api.notify.me"
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
};
