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
  filters: {
    test2: ({ posts, channels }) => {
      if (channels.channelOpened) {
        return [...posts.test, ...posts.feed];
      }
    },
    gay: ({ posts, channels }) => {
      if (posts.postSent) {
        return [...posts.test];
      }
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
  // };
};

const posts = {
  model: {
    id: {
      primaryKey: true
    },
    owner: {
      parent: "channels",
      byProperty: "owner"
    }
  },
  groups: ["feed"],
  data: {
    currentFilter: "",
    liveStreamPost: false,
    postSent: false,
    newPost: true
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
    withFilter: ({ posts }) => {},
    liveOnTwitchButJamieAGAIN: ({ posts, channels }) => {
      if (channels.channelOpened) return posts.newPost;
    },
    liveOnTwitchButJamie: ({ posts }) => {
      return posts.liveOnTwitch.filter(post => post.owner === 1);
    },
    liveOnTwitch: ({ posts }) => {
      return posts.livePosts.filter(post => post.liveStreamType === "twitch");
    },
    livePosts: ({ posts }) => {
      return posts.feed.filter(post => post.liveStreamType !== null);
    },
    test: ({ posts }) => {
      return posts.feed.filter(post => post.liveStreamType !== null);
    }
  }
};

export default new Pulse({
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
