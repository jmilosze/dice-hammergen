import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "bulma/css/bulma.css";
import { db } from "firebase/database";

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    $db: typeof db;
  }
}

const app = createApp(App).use(router);
app.config.globalProperties.$db = db;
app.mount("#app");
