<template>
  <div class="hello">
    <Button v-on:click="changeTheme">Change</Button>
    <p>{{theme}}</p>
    <h1>Component 1: {{name}}</h1>
  </div>
</template>

<script>
import store from "../store.js";
import axios from "axios";

export default {
  mounted() {
    setTimeout(() => {
      console.log(store.get("getTheme"));
    }, 3000);

    axios.get("https://api.notify.me/channel/public/jamie").then(res => {
      store.$posts.collect(res.data.posts, "jamie");

      // store.$posts.get('jamie')
    });
  },
  data: () => ({
    lol: "",
    ...store.mapState()
    // stateTree: {}
  }),
  methods: {
    changeTheme: () => {
      store.dispatch("switchTheme");
    }
  },
  watch: {
    _() {
      alert("hi");
    }
  },
  beforeCreate() {
    store.subscribe(this);
  }
};
</script>