<template>
  <div class="hello">
    <input v-model="thing">
    <Button v-on:click="get(thing)">Get Channel</Button>
    <Button v-on:click="logInstance">Log Instance</Button>
    <Button v-on:click="testUpdate">testUpdate</Button>
    {{$channels.channelOpened}}
    <!-- <VueObjectView v-model="pulse"/> -->
    <!-- <p>{{theme}}</p>
    <h1>Component 1: {{name}}</h1>-->
    <div v-if="pulse !== null" class="deps">
      <div
        class="collection"
        v-for="(collection, colIndex) in pulse._global.dependencyGraph"
        :key="colIndex"
      >
        <h2>{{colIndex}}</h2>
        <div class="filters">
          <div class="data" v-for="(filter, filterName) in collection" :key="filterName">
            <div class="dataProp">{{filterName}}</div>
            <div
              v-if="Array.isArray(pulse._collections[colIndex][filterName])"
              class="propType"
            >Array</div>
            <div v-else class="propType">{{typeof pulse._collections[colIndex][filterName]}}</div>
            <!-- <div>[{{pulse._collections[colIndex].data[index].length}}]</div> -->
            <!-- <div class="dependencies_title">Dependencies</div> -->
            <div class="dependencies">
              <div
                v-for="(dep, boop) in collection[filterName].dependencies"
                :key="boop"
                class="dependency"
              >{{dep}}</div>
            </div>
            <div class="dependencies">
              <div
                v-for="(dep, boop) in collection[filterName].dependents"
                :key="boop"
                class="dependency dependent"
              >{{dep}}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="collection">
        <h2>History</h2>
        <div v-for="(item, index) in pulse._history" :key="index">
          <div
            v-if="item.hasOwnProperty('collected')"
            class="history_item"
          >Collected {{item.collected.dataCollected.length || 0}} Items</div>
          <div
            v-else-if="item.hasOwnProperty('regenerated')"
            class="history_item"
          >Regenerated {{item.regenerated.filtersRegenerated.length || 0}} filters {{item.regenerated.filtersRegenerated}}</div>
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
  width: 280px;
  flex-direction: column;
  display: flex;
  padding-right: 10px;
}
.data {
  border-radius: 5px;
  margin-bottom: 10px;
  background: #121212;
  padding: 10px;
}
.dependencies {
  display: flex;
  flex-wrap: wrap;
}
.dependency {
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 2px 10px;
  border-radius: 3px;
  background: rgb(114, 83, 146);
}
.dependent {
  background: rgb(83, 146, 91);
}
.dataProp {
  font-size: 15px;
  font-weight: bold;
}
.propType {
  font-size: 11px;
}
</style>


<script>
import axios from "axios";
import Pulse from "pulse-framework";

export default {
  mounted() {
    setTimeout(() => {
      // this.$pulse.posts.data.liveStreamPost = true;
      this.$channels.channelOpened = ["jeff"];
      this.$channels.getPublicChannel("jamie");
    }, 3000);
    // this.get("jamie");
    // this.get("casey");
    // this.get("ninja");
    // console.log(mapCollection);

    this.pulse = this.$pulse;
  },
  data: () => ({
    //  map data from a specific collection

    // map data from any collection with a custom name
    // ...pulse.mapData(({ posts, channels }) => {
    //   return {
    //     posts: posts.livePosts,
    //     hahah: channels.favorites
    //   };
    // }),
    pulse: null,
    thing: "jamie"
  }),
  computed: {
    // theFeed() {
    //   return this.$posts.feed;
    // }
  },
  methods: {
    testUpdate() {
      this.$posts.update(4956, {
        alert: true
      });
    },
    logInstance() {
      console.log("PULSE INSTANCE", this.pulse);
    }
  },
  watch: {
    _() {
      alert("hi");
    }
  }
  // beforeCreate() {
  //   pulse.subscribe(this);
  // }
};
</script>