<template>
  <div class="hello">
    <input v-model="thing">
    <Button v-on:click="get(thing)">Get Channel</Button>
    <Button v-on:click="logInstance">Log Instance</Button>
    <Button v-on:click="update">Update Instance</Button>
    <!-- <VueObjectView v-model="pulse"/> -->
    <!-- <p>{{theme}}</p>
    <h1>Component 1: {{name}}</h1>-->
  </div>
</template>

<script>
import pulse from "../store.js";
import axios from "axios";

export default {
  mounted() {
    // setTimeout(() => {
    //   console.log(pulse.channels.data.channelOpened);
    //   console.log(pulse.channels.data);
    // }, 4000);
    // this.get("jamie");
    // this.get("casey");
    // this.get("ninja");
    // console.log(this);
  },
  data: () => ({
    ...pulse.mapCollection("posts", ["selected", "favorites"]),
    ...pulse.mapCollection("channels"),

    pulse: pulse,
    thing: ""
  }),
  computed: {},
  methods: {
    get(username) {
      axios
        .get(`http://localhost:3000/channel/public/${username}`)
        .then(res => {
          if (username === "jamie")
            pulse.channels.collect([res.data.channel], "myChannels");
          pulse.posts.collect(res.data.posts, "favorites");
          pulse.channels.collect(res.data.channel, res.data.channel.username);
          pulse.collect(res.data.posts, res.data.channel.username);
        });
    },
    update() {
      this.pulse = pulse;
    },
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