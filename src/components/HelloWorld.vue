<template>
  <div class="hello">
    <Button v-on:click="changeTheme">Change</Button>
    <Button v-on:click="logInstance">Log Instance</Button>
    <p>{{theme}}</p>
    <h1>Component 1: {{name}}</h1>
  </div>
</template>

<script>
import pulse from "../store.js";
import axios from "axios";

export default {
  mounted() {
    // setTimeout(() => {
    //   console.log(store.get("getTheme"));
    // }, 3000);

    axios.get("https://api.notify.me/channel/public/jamie").then(res => {
      pulse.$posts.collect(res.data.posts, "jamie");
    });
  },
  data: () => ({
    lol: "",
    ...pulse.mapState()
    // stateTree: {}
  }),
  methods: {
    changeTheme: () => {
      pulse.dispatch("switchTheme");
    },
    logInstance() {
      console.log("PULSE INSTANCE", pulse);
    }
  },
  watch: {
    _() {
      alert("hi");
    }
  },
  beforeCreate() {
    pulse.subscribe(this);
  }
};
</script>