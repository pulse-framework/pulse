import Vue from 'vue'
import App from './App.vue'

import Store from "./Store.js"

Vue.config.productionTip = false

new Store({
  commit() {

  }
})

Store.addState({
  name: "Jamie",
  theme: 'dark'
})

new Vue({
  render: h => h(App),
}).$mount('#app')