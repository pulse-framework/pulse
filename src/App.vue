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


<style>
body {
  background: #181818;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  padding: 10px;
}
</style>
