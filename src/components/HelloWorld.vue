<template>
  <div class="hello">
    <input v-model="thing">
    <Button v-on:click="get(thing)">Get Channel</Button>
    <Button v-on:click="logInstance">Log Instance</Button>
    <Button v-on:click="update">Update Instance</Button>
    <!-- <VueObjectView v-model="pulse"/> -->
    <!-- <p>{{theme}}</p>
    <h1>Component 1: {{name}}</h1>-->
    <div class="deps">
      <div
        class="collection"
        v-for="(collection, colIndex) in pulse._global.dependencyGraph"
        :key="colIndex"
      >
        <h2>{{colIndex}}</h2>
        <div class="filters">
          <h3>Data</h3>
          <div v-for="(filter, index) in collection" :key="index">
            <div>{{index}}</div>
            <div>{{typeof pulse._collections[colIndex].data[index]}}</div>
            <div>[{{pulse._collections[colIndex].data[index].length}}]</div>
            <br>
          </div>
        </div>
      </div>
      <div class="collection">
        <h2>History</h2>
        <div v-for="(item, index) in pulse._history" :key="index">
          <div class="history_item">{{index}}</div>
          <br>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.deps {
  display: flex;
  flex-direction: row;
}
.collection {
  width: 300px;
  flex-direction: column;
  display: flex;
}
</style>


<script>
import pulse from "../store.js";
import axios from "axios";

export default {
  mounted() {
    // setTimeout(() => {
    //   console.log(pulse.channels.data.channelOpened);
    //   console.log(pulse.channels.data);
    // }, 4000);
    this.get("jamie");
    // this.get("casey");
    // this.get("ninja");
    // console.log(this);
  },
  data: () => ({
    //  map data from a specific collection
    ...pulse.mapCollection("posts"),

    // map data from any collection with a custom name
    // ...pulse.mapData(({ posts, channels }) => {
    //   return {
    //     posts: posts.livePosts,
    //     hahah: channels.favorites
    //   };
    // }),

    pulse: pulse,
    thing: ""
  }),
  computed: {},
  methods: {
    get(username) {
      axios
        .get(`http://localhost:3000/channel/public/${username}`)
        .then(res => {
          pulse.posts.collect(res.data.posts, "feed");
          pulse.channels.collect(res.data.channel, res.data.channel.username);
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