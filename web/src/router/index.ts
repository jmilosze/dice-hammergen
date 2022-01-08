import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";
import Session from "../views/Session.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: Home,
    props: true
  },
  { path: "/s/:sessionId", name: "session", component: Session, props: true },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
