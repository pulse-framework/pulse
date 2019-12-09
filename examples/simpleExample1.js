// in this example, we'll get posts from an API and save them in a group to be accessed by a component
import Pulse from 'pulse-framework';

const pulse = new Pulse({
  request: {
    baseURL: 'https://api.mysite.com'
  },
  collections: {
    posts: {
      groups: ['homepage', 'group1', 'group2'],
      routes: {
        getPosts: request => request.get('posts/all'),
        getChannel: (request, username) =>
          request.get(`channel/public/${username}`)
      },
      actions: {
        getPosts({ routes, collect }) {
          routes.getChannel('jamie').then(res => {
            // use the collect method to collect posts into a group called "homepage", defined above
            collect(res.posts, ['homepage', 'group1', 'group2']);
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
