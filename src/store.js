// prettier-ignore
import Pulse from '../lib'

const channels = {
  model: {
    id: {
      type: Number,
      primaryKey: true
    }
  },
  groups: [
    "myChannels",
    "subscribed",
    "muted",
    "unreadContent",
    "suggested",
    "favorites"
  ],
  data: {
    channelOpened: true
  },
  filters: {}
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
};

const posts = {
  model: {
    id: {
      primaryKey: true
    }
  },
  groups: ["feed"],
  data: {
    liveStreamPost: false,
    postSent: false,
    newPost: false
  },
  routes: {
    newPost: ({ request }, post) => request.post(`/post/new`, post),
    getbyFeedByTimestamp: ({ request }, timestamp) =>
      request.get(`post/for/${id}/${new Date(timestamp).getTime()}`)
  },
  actions: {
    async scrape({ routes }, link) {
      return routes.scrape();
    }
  },
  filters: {
    liveOnTwitchButJamieAGAIN: ({ posts }) => {
      return posts.liveOnTwitchButJamie;
    },
    liveOnTwitchButJamie: ({ posts }) => {
      return posts.liveOnTwitch.filter(post => post.owner === 1);
    },
    liveOnTwitch: ({ posts }) => {
      return posts.livePosts.filter(post => post.liveStreamPost === "twitch");
    },
    livePosts: ({ posts }) => {
      return posts.feed.filter(post => post.liveStreamType !== null);
    }
  }
};

const store = new Pulse({
  collections: {
    channels,
    posts,
    test: {}
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
