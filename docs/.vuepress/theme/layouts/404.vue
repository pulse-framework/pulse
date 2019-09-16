<template>
    <div>
        <Header style="background: linear-gradient(45deg, #064789 0%, #427aa1 100%)"/>
        <div class="container mx-auto my-10 py-10 px-20 rounded border shadow-xl text-center" style="width: 100%">
            <span class="text-6xl">404</span>
            <blockquote class="mb-10">{{ getMsg() }}</blockquote>
            <router-link to="/" class="rounded bg-red-600 px-5 py-3">Take me home.</router-link>
        </div>
        <Footer />
    </div>
</template>

<script>
const msgs = [
  `There's nothing here.`,
  `Woah!, How did we get here?`,
  `That's a Four-Oh-Four.`,
  `Looks like we've got some broken links.`
];

import Header from '@theme/components/Header';
import Footer from '@theme/components/Footer';
export default {
  components: { 
    Header,
    Footer,
  },
  methods: {
    getMsg () {
      return msgs[Math.floor(Math.random() * msgs.length)]
    }
  }
}
</script>
