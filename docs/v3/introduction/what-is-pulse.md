---
title: What is Pulse?
---

VuePress follows the principle of **"Convention is better than configuration"**, the recommended document structure is as follows:

<!-- textlint-disable terminology -->

::: vue
.
├── docs
│ ├── .vuepress _(**Optional**)_
│ │ ├── `components` _(**Optional**)_
│ │ ├── `theme` _(**Optional**)_
│ │ │ └── Layout.vue
│ │ ├── `public` _(**Optional**)_
│ │ ├── `styles` _(**Optional**)_
│ │ │ ├── index.styl
│ │ │ └── palette.styl
│ │ ├── `templates` _(**Optional, Danger Zone**)_
│ │ │ ├── dev.html
│ │ │ └── ssr.html
│ │ ├── `config.js` _(**Optional**)_
│ │ └── `enhanceApp.js` _(**Optional**)_
│ │
│ ├── README.md
│ ├── guide
│ │ └── README.md
│ └── config.md
│
└── package.json
:::

<!-- textlint-enable -->

::: warning Note
Please note the capitalization of the directory name.
:::
