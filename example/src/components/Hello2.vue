<template>
  <div class="hello">
    <h1>feltron: {{name}}</h1>
  </div>
</template>

<script>
import Store from "../Store.js";
export default {
  mounted() {
    setTimeout(() => {
      Store.commit("changeName", "twitch");
    }, 3000);
  },
  data: () => ({
    ...Store.mapState()
  }),
  beforeCreate() {
    Store.subscribe(this);
  }
};
</script>