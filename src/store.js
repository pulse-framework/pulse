// prettier-ignore
import Pulse from '../pulse'

const channels = {
  model: {
    id: {
      type: Number,
      primaryKey: true
    }
  },
  filters: {
    testOne: ({ data, posts }) => {
      if (data.channelOpened) {
        return posts.happy;
      }
    },
    testTwo: ({ data, posts }) => {
      if (data.channelOpened) {
        return posts.happy;
      }
    }
  },
  data: {
    myChannels: [],
    selected: {},
    channelOpened: true
  }
};

const posts = {
  model: {
    dateCreated: {
      primaryKey: true
    }
  },
  // this is where you define any data you need, if you collect() data with the same name as a property matching one in your data, provided the type matches and its empty, it will be populated and cached
  data: {
    favorites: [],
    unread: [],
    happy: "Happy boy"
  },
  // filters are like getters, but support Pulse's filter API
  // the name of the filter is accessable via the collection's data property
  filters: {
    // orderByDate: {
    //     from: "subscribed",
    //     byProperty: "dateCreated"
    // },
    // myLive: ({ data }) => {}
    // wasLive: ({ filter }) => {
    //   return filter({
    //     from: "subscribed",
    //     isNotNull: ["liveEndDate", "liveStreamType"]
    //   });
    // }
    // isLive({ filter }) {
    //   return filter({
    //     from: "orderByDate",
    //     isNull: "liveEndDate",
    //     isNotNull: "liveStreamType"
    //   });
    // },
    // isLiveOnTwitch({ filter }) {
    //   return filter({
    //     from: "isLive",
    //     isNull: "liveEndDate",
    //     matching: {
    //       liveStreamType: "twitch"
    //     }
    //   });
  },
  customFilter: ({ data }) => {
    return data.subscribed;
  }
};

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
// };

const store = new Pulse({
  collections: {
    channels,
    posts
  },
  indexes: ["jamie", "casey"],
  data: {
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
