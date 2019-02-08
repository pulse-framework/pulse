import Vue from "vue";
import App from "./App.vue";

import Pulse from "../lib";
import core from "./core";

Vue.use(Pulse, core);

Vue.config.productionTip = false;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

new Vue({
  render: h => h(App)
}).$mount("#app");
