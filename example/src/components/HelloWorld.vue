<template>
  <div class="hello">
    <h1>Thing : {{name}}</h1>
    <Button v-on:click="changeTheme">Change</Button>
    <p>{{theme}}</p>
  </div>
</template>

<script>
import Store from "../Store.js";
export default {
  mounted() {
    setTimeout(() => {
      console.log(Store.state.name);
    }, 5000);
  },
  data: () => ({
    ...Store.mapState()
  }),
  methods: {
    changeTheme: function() {
      const theme = Store.state.theme;
      if (theme === "light") {
        Store.state.theme = "dark";
      } else {
        Store.state.theme = "light";
      }
    }
  },
  beforeCreate() {
    Store.subscribe(this);
  }
};
</script>