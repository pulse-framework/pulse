export default {
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
    newPost: (request, post) => request.post(`/post/new`, post),
    getbyFeedByTimestamp: (request, timestamp) =>
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
