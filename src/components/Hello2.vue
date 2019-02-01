<template>
  <div class="hello">
    <h1>feltron: {{name}}</h1>
  </div>
</template>

<script>
import store from "../store.js";
export default {
  mounted() {
    setTimeout(() => {
      //store.commit('changeName', 'Twitch')
      store.set("name", "SetFuckingState");
    }, 3000);
  },
  data: () => ({
    ...store.mapState()
  }),
  beforeCreate() {
    store.subscribe(this);
  }
};
</script>