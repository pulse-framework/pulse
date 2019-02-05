import Vue from "vue";
import App from "./App.vue";

import pulse from "./store";

Vue.config.productionTip = false;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

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
