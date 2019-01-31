import Vue from 'vue'
import App from './App.vue'

import Store from "../../Store.js"

Vue.config.productionTip = false

Store.addState({
  name: "Jamie",
  theme: 'dark'
})

//PogChamp He spelled my name right
Store.addCommit({
  changeName({
    state
  }, val) {
    state.name = val;
  },
  changeTheme({
    state
  }) {
    if (state.theme === "light") {
      state.theme = "dark";
    } else {
      state.theme = "light";
    }
  }
})

Store.addGetter({
  tellMyName({
    state
  }) {
    console.log(state.name)
    return state.name
  }
})

new Vue({
  render: h => h(App),
}).$mount('#app')