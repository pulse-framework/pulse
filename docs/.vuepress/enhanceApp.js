export default ({ Vue, router }) => {
  Vue.mixin({
    computed: {
      versions() {
        const { $themeConfig } = this;
        return Object.getOwnPropertyNames($themeConfig.sidebar);
      },
      isDocs() {
        const { $frontmatter } = this;
        if ($frontmatter.home === true) {
          return false;
        } else {
          return true;
        }
      }
    }
  }),
    router.addRoutes([
      { path: '/v1.html', redirect: '/v1/introduction/what-is-pulse' },
      { path: '/v1', redirect: '/v1/introduction/what-is-pulse' },
      { path: '/v2.html', redirect: '/v2/introduction/what-is-pulse' },
      { path: '/v2', redirect: '/v2/introduction/what-is-pulse' },
      { path: '/v3.html', redirect: '/v3/introduction/what-is-pulse' },
      { path: '/v3', redirect: '/v3/introduction/what-is-pulse' }
    ]);
};
