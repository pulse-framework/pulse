import Vue from "vue";
import App from "./App.vue";

import store from "./store";

Vue.config.productionTip = false;

import o from "vue-object-view";

Vue.component("VueObjectView", o);

// store.addState({
//   name: "Jamie",
//   theme: 'dark'
// })

// store.addCommit({
//   changeName({
//     state
//   }, val) {
//     state.name = val;
//   },
//   changeTheme({
//     state
//   }) {
//     if (state.theme === "light") {
//       state.theme = "dark";
//     } else {
//       state.theme = "light";
//     }
//   }
// })

// store.addGetter({
//   tellMyName({ state }) {
//     console.log(state.name);
//     return state.name;
//   }
// });

new Vue({
  render: h => h(App)
}).$mount("#app");
