// prettier-ignore
import Pulse from '../pulse'

const channels = {
  model: {
    id: {
      type: Number,
      primaryKey: true
    }
  },
  indexes: ["jamie", "casey"]
};
const posts = {
  model: {
    dateCreated: {
      primaryKey: true
    }
  },
  // this is where you register namespaces for your collection's data property
  // data added via collect(data, index) will be cached here
  indexes: ["selected", "jamie", "casey"],

  // filters are like getters, but support Pulse's filter API
  // the name of the filter is accessable via the collection's data property
  filters: {
    orderByDate({ filter }) {
      return filter({
        from: "suggested",
        byProperty: "dateCreated"
      });
    },
    isLive({ filter }) {
      return filter({
        from: "subscribed",
        isNull: "liveEndDate",
        isNotNull: "liveStreamType"
      });
    },
    isLiveOnTwitch({ filter }) {
      return filter({
        from: "subscribed",
        isNull: "liveEndDate",
        matching: {
          liveStreamType: "twitch"
        }
      });
    },
    customFilter({ data }) {
      return data.subscribed;
    }
  }

  // // requires the a complete model with correct data types
  // async onMissingKey({request, collect}, key) {
  //   let res = await instance.request.get(`url/${key}`)
  //   collect(res.data.posts)
  //   collect()
  // },
  // // requires that the component specify the data it requires
  // async onIncompleteData(instance, key) {
  //   let res = await instance.request.get(`url/${key}`)
  //   instance.$post.collect(res.data)
  // }
};

const store = new Pulse({
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
  request: {},
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
