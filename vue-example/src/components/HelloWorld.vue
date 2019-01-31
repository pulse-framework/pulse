<template>
  <div class="hello">
    <h1>Thing : {{name}}</h1>
    <Button v-on:click="changeTheme">Change</Button>
    <p>{{theme}}</p>
  </div>
</template>

<script>
import Store from "../Store.js";
import { Log } from "../Utils.js";

export default {
  mounted() {
    setTimeout(() => {
      console.log(Store.getter("tellMyName"));
    }, 5000);
  },
  data: () => ({
    ...Store.mapState()
  }),
  methods: {
    changeTheme: function() {
      Store.commit("changeTheme");
    }
  },
  beforeCreate() {
    Store.subscribe(this);
  }
};
</script>