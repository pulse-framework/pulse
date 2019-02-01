<template>
  <div class="hello">
    <Button v-on:click="changeTheme">Change</Button>
    <p>{{theme}}</p>
    <h1>Component 1: {{name}}</h1>
  </div>
</template>

<script>
import store from "../store.js";

export default {
  mounted() {
    setTimeout(() => {
      console.log(store.get("getTheme"));
    }, 3000);
  },
  data: () => ({
    ...store.mapState()
  }),
  methods: {
    changeTheme: () => {
      store.dispatch("switchTheme");
    }
  },
  beforeCreate() {
    store.subscribe(this);
  }
};
</script>