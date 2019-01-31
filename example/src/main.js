import Vue from 'vue'
import App from './App.vue'

import Store from "./Store.js"

Vue.config.productionTip = false

Store.addState({
  name: "Jamie",
  theme: 'dark'
})

//Hey, How can I get theme value? On HelloWorld
Store.addCommit({
  changeName({
    state
  }, val) {
    // console.log(obj, val)
    state.name = val;
  }
})

new Vue({
  render: h => h(App),
}).$mount('#app')