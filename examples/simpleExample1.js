// in this example, we'll get posts from an API and save them in a group to be accessed by a component

const pulse = new Pulse.Library({
  request: {
    baseURL: 'https://api.mysite.com'
  },
  collections: {
    posts: {
      groups: ['homepage'],
      routes: {
        getPosts: request => request.get('posts/all')
      },
      actions: {
        getPosts({ routes, collect }) {
          routes.getPosts().then(res => {
            // use the collect method to collect posts into a group called "homepage", defined above
            collect(res.posts, 'homepage');
          });
        }
      }
    }
  }
});

// call action to trigger
pulse.posts.getPosts();

// your posts are now here
pulse.posts.homepage;

// or map them to your component
pulse.mapData({
  posts: 'posts/homepage'
});
// returns { posts: [...] }
