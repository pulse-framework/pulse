<template>
  <div class="hello">
    <h1>Thing : {{name}}</h1>
    <Button v-on:click="changeTheme">Change</Button>
    <p>{{theme}}</p>
  </div>
</template>

<script>
import store from "../store.js";

export default {
  mounted() {
    setTimeout(() => {
      console.log(store.getter("tellMyName"));
    }, 5000);
  },
  data: () => ({
    ...store.mapState()
  }),
  methods: {
    changeTheme: function() {
      store.commit("changeTheme");
    }
  },
  beforeCreate() {
    store.subscribe(this);
  }
};
</script>