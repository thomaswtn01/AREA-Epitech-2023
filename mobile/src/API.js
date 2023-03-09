import Store from "./Store.js";

export class APIFetchError {
    constructor(code, error) {
        this.code   = code;
        this.error  = error;
    }
}

export const API = {
    async fetch(method, path, options = {}) {

        //  #1 : Build options.
        {
            options.method = method;

            //  #1 : Headers.
            if (options.headers == null)
                options.headers = {};

            //  #2 : Bearer token.
            if (options.noAuth) {
                delete options.noAuth;

            } else if (Store.TOKEN) {
                options.headers.Authorization = Store.TOKEN;
            }

            //  #3 : Request body.
            if (options.json) {
                options.headers["Content-Type"] = "application/json";
                options.body                    = JSON.stringify(options.json);
                delete options.json;
            }
        }

        //  #2 : Send request.
        {
            let res     = await fetch(Store.API_URL + "/api" +  path, options);
            let body    = await res.json();

            if (res.status >= 400) {
                throw new APIFetchError(res.status, body);

            } else {
                return body;
            }
        }
    },

    async login(username, password) {
        return API.fetch("POST", "/login", {
            noAuth  : true,
            json    : { username, password },
        })
            .then(res => res.token);
    },

    async register(username, password) {
        return API.fetch("POST", "/register", {
            noAuth  : true,
            json    : { username, password },
        });
    },

    async fetchMe() {
        return API.fetch("GET", "/user/@me");
    },

    async fetchAbout() {
        return API.fetch("GET", "/about.json");
    },
};
