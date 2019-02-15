<template>
  <div id="app">
    <h1>Pulse Framework</h1>
    <Debug/>
  </div>
</template>

<script>
import Debug from "./components/Debug.vue";

export default {
  name: "app",
  components: {
    Debug
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
