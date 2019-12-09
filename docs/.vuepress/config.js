module.exports = {
  title: 'PulseJS',
  description: 'Application logic library for reactive Javascript frameworks',
  dest: 'dist',
  serviceWorker: true,
  base: '/',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }]],
  themeConfig: {
    logo: '/logo.svg',
    nav: [{ text: 'Home', link: '/' }, { text: 'Guide', link: '/v2/' }],
    lastUpdated: 'Last Updated',
    // Assumes GitHub. Can also be a full GitLab url.
    repo: 'jamiepine/pulse',
    // Customising the header label
    // Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
    repoLabel: 'Contribute!',
    // if your docs are not at the root of the repo:
    docsDir: 'docs',
    // if your docs are in a specific branch (defaults to 'master'):
    docsBranch: 'master',
    // defaults to false, set to true to enable
    editLinks: true,
    // custom text for edit link. Defaults to "Edit this page"
    editLinkText: 'Help us improve this page!',
    serviceWorker: {
      updatePopup: true
    },
    markdown: {
      lineNumbers: true
    },
    sidebar: {
      // These links will appear in the sidebar
      // Create heading groups
      '/v1/': [
        {
          title: 'Introduction',
          collapsable: false,
          children: [
            // These are pages we'll add later
            'introduction/what-is-pulse'
          ]
        },
        {
          title: 'Getting Started',
          collapsable: false,
          children: [
            // These are pages we'll add later
            'getting-started/setup-with-react',
            'getting-started/setup-with-vue'
          ]
        },
        {
          title: 'Guide',
          collapsable: false,
          children: [
            // These are pages we'll add later
            'guide/library',
            'guide/collections',
            'guide/namespacing',
            'guide/using-data',
            'guide/persisting-data',
            'guide/mutating-data',
            'guide/context-object',
            'guide/filters',
            'guide/data-relations',
            'guide/http-requests',
            'guide/models',
            'guide/debugging'
          ]
        }
      ],
      '/v2/': [
        {
          title: 'Introduction',
          collapsable: false,
          children: ['introduction/what-is-pulse', 'introduction/changelog']
        },
        {
          title: 'Getting Started',
          collapsable: false,
          children: [
            'getting-started/setup-with-react',
            'getting-started/setup-with-vue'
          ]
        },
        {
          title: 'Guide',
          collapsable: false,
          children: [
            'guide/library',
            'guide/collections',
            'guide/namespacing',
            'guide/using-data',
            'guide/persisting-data',
            'guide/mutating-data',
            'guide/context-object',
            'guide/filters',
            'guide/data-relations',
            'guide/http-requests',
            'guide/models',
            'guide/debugging'
          ]
        },
        {
          title: 'Examples',
          collapsable: false,
          children: [
            'examples/UsageWithVueJS',
            'examples/UsageWithReact',
            'examples/authentication'
          ]
        }
      ]
    }
  }
};
