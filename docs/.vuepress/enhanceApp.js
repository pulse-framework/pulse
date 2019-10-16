export default ({ Vue }) => {
    Vue.mixin({
      computed: {
        versions() {
          const {$themeConfig} = this
          return Object.getOwnPropertyNames($themeConfig.sidebar)
        },
        isDocs() {
          const {$frontmatter} = this
          if (
            $frontmatter.home === true) {
              return false
            }
          else {
            return true
          }
        }
      },
      data() {
        return{
          firstpage: '/introduction/what-is-pulse.html'
        }
      }
    })
}