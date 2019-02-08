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
  routes: {
    subscribe: (request, id) => request.post(`/channels/subscribe/${id}`)
  },
  actions: {
    subscribe({ routes, undo, posts, channels }, id) {
      channels.put(id, "subscribed");
      channels.incrementProperty(id, "subCount", 1);
      routes
        .subscribe(id)
        .then(res => posts.collect(res.data.posts))
        .catch(() => undo());
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
