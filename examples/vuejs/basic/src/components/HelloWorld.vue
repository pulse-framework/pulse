<template>
  <div class="hello"></div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String
  },
  mounted() {
    this.thing = true;
  },
  data() {
    return {
      thing: null
    };
  },
  methods: {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
