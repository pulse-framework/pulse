export default {
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
  persist: ["channelOpened"],
  routes: {
    subscribe: (request, id) => request.post(`subscribe/${id}`),
    getRedditComments: request => request.get(`r/all/comments.json`),
    getPublicChannel: (request, username) =>
      request.get("channel/public/" + username)
  },
  actions: {
    subscribe({ routes, undo, posts, channels }, id) {
      console.log(posts);
      channels.put(id, "subscribed");
      channels.increment(id, "subCount", 1);
      routes
        .subscribe(id)
        .then(res => posts.collect(res.data.posts))
        .catch(() => undo());
    },
    getRedditComments({ routes }) {
      routes.getRedditComments().then(console.log);
    },
    getPublicChannel({ routes, channels }, username) {
      routes.getPublicChannel(username).then(res => {
        console.log(res);
        channels.collect(res.channel, "suggested");
      });
    }
  },
  filters: {
    test2: ({ posts, channels }) => {
      if (channels.channelOpened) {
        return true;
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

// this.$channels.subscribe(1)
