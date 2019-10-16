<template>
  <div class="versiondropdown">
    <select v-model="selected"  v-on:change="changedocs(selected)">
     <option v-for="value in this.versions">
      {{ getVer(value)[1] }}
     </option>
    </select>
  </div>
</template>

<script>
import { getVer } from '../util'



export default {
  name: 'VersionDropdown',
  methods: {
    getVer,
    changedocs(url){
      location.pathname = url+this.firstpage
    }
  },
  mounted() {
    if(this.isDocs == true) {
      this.selected = getVer(this.$route.path)[1]
    }
  },
  data() {
    return{
      selected: ''
    }
  },
}
</script>