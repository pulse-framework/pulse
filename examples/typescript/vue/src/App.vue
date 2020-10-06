<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld :msg="number" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';
import Pulse from '@pulsejs/vue';

const App = new Pulse();

export const core = App.Core({
  NUMBER: App.State('hello')
});

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  created() {},
  data() {
    return {
      ...this.mapCore(core => ({
        number: core.NUMBER
      }))
    };
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
