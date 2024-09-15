import { createApp } from "vue";
import App from "./App.vue";
import { VueFire } from "vuefire";
import router from "./router";
import "bulma/css/bulma.css";
import { firebaseApp } from "firebase";

const app = createApp(App);

app.use(router);
app.config.globalProperties.$db = db;
app.use(VueFire, { firebaseApp });

app.mount("#app");
