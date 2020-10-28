module.exports = {
  title: 'Pulse Framework',
  description: 'Global state and logic framework for reactive JavaScript applications.',
  dest: 'dist',
  serviceWorker: true,
  base: '/',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }]],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/v3/introduction/what-is-pulse' },
      { text: 'Changelog', link: '/v3/introduction/changelog' }
    ],
    lastUpdated: 'Last Updated',
    // Assumes GitHub. Can also be a full GitLab url.
    repo: 'pulse-framework/pulse',
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
          title: 'Quick Start',
          collapsable: false,
          children: ['getting-started/setup-with-react', 'getting-started/setup-with-vue']
        },
        {
          title: 'Documentation',
          collapsable: false,
          children: [
            'docs/concepts',
            'docs/library',
            'docs/modules',
            'docs/module-methods',
            'docs/collections',
            'docs/collection-methods',
            'docs/context-object',
            'docs/persisting-data',
            'docs/http-requests',
            'docs/using-pulse-data',
            'docs/debugging'
          ]
        },
        {
          title: 'Examples',
          collapsable: false,
          children: ['examples/authentication']
        },
        {
          title: 'Under The Hood',
          collapsable: false,
          children: ['under-the-hood/runtime']
        }
      ],
      '/v3/': [
        {
          title: 'Introduction',
          collapsable: false,
          children: ['introduction/what-is-pulse', 'introduction/changelog']
        },
        {
          title: 'Getting Started',
          collapsable: false,
          children: [
            'getting-started/concepts',
            'getting-started/setup-with-react',
            'getting-started/setup-with-vue',
            'getting-started/setup-with-next'
          ]
        },
        {
          title: 'Documentation',
          collapsable: false,
          children: [
            'docs/pulse-instance',
            'docs/state',
            'docs/computed',
            'docs/collections',
            'docs/actions',
            'docs/controllers',
            'docs/core',
            'docs/api',
            'docs/persisting-data',
            'docs/events'
          ]
        },
        {
          title: 'Resources',
          collapsable: false,
          children: ['resources/snippets', 'getting-started/style-guide', 'resources/ideas']
        }
      ]
    }
  },
  plugins: [
    ['@vuepress/back-to-top', true],
    [
      '@vuepress/pwa',
      {
        serviceWorker: true,
        updatePopup: true
      }
    ],
    ['@vuepress/medium-zoom', true],
    [
      '@vuepress/google-analytics',
      {
        ga: 'UA-128189152-1'
      }
    ],
    [
      'container',
      {
        type: 'vue',
        before: '<pre class="vue-container"><code>',
        after: '</code></pre>'
      }
    ],
    [
      'container',
      {
        type: 'upgrade',
        before: info => `<UpgradePath title="${info}">`,
        after: '</UpgradePath>'
      }
    ],
    ['flowchart']
  ]
};
