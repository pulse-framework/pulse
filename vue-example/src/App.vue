<template>
  <div id="app">
    <h1>Pulse Framework</h1>
    <HelloWorld/>
    <Test/>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import Test from "./components/Hello2.vue";

export default {
  name: "app",
  components: {
    HelloWorld,
    Test
  }
};
</script>
