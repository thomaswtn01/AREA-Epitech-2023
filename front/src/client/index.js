import { createApp }                        from "vue";
import { createRouter, createWebHistory }   from "vue-router";
import Store                                from "./store.js";
import { API }                              from "./api.js";

//  PAGES

import App                                  from "./components/app.js";
import Home                                 from "./components/home.js";
import Login                                from "./components/login.js";
import Register                             from "./components/register.js";
import CreateAuto                           from "./components/createAuto.js";
import Settings                             from "./components/settings.js";
import OAuth                                from "./components/oauth.js";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/"                     , component: Home },
        { path: "/login"                , component: Login },
        { path: "/register"             , component: Register },
        { path: "/oauth/:service"       , component: OAuth },
        { path: "/create"               , component: CreateAuto },
        { path: "/settings"             , component: Settings },
        { path: "/:pathMatch(.*)*"      , redirect: "/" },
    ],
});

router.beforeEach((to) => {
    if (to.path == "/login" || to.path == "/register") {
        if (Store.user)
            return "/";

    } else if (!Store.user && to.matched[0].path != "/oauth/:service") {
        return "/login";
    }
});

(async () => {
    if (localStorage.token) {
        let me = await API.fetchMe().catch(() => {});

        if (me) {
            Store.user = me;

        } else {
            delete localStorage.token;
        }
    }

    Store.about     = await API.fetchAbout();
    Store.loading   = false;

    const app = createApp(App).use(router);

    return router.isReady().then(() => {
        app.mount("body");
    });
})();
