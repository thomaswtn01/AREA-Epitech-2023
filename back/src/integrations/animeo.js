import APIs     from "apis";
import Bus      from "../bus.js";


//////////////////////////////////////
//  ANIMEO
//////////////////////////////////////


export default {

    name        : "animeo",
    has_oauth   : true,
    disabled    : false,

    descriptor: {
        design: {
            label   : "Animeo",
            color   : "#FF6300",
            icon    : "/assets/img/services/animeo.svg",
        },
        triggers: [
            {
                name            : "on_animeo_trend_update_anime",
                description     : "Déclenché lorsqu'un nouveau anime est disponible.",
                require_auth    : false,
                params: {
                    in: [],
                    out: [
                        {
                            name    : "ANIME_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "ANIME_SYNOPSIS",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_animeo_trend_update_episode",
                description     : "Déclenché lorsqu'un nouveau épisode est disponible.",
                require_auth    : false,
                params: {
                    in: [],
                    out: [
                        {
                            name    : "ANIME_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "EPISODE_NUMBER",
                            type    : "string",
                        },
                        {
                            name    : "EPISODE_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "EPISODE_DESCRIPTION",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_animeo_watch_anime",
                description     : "Déclenché lorsque tu commences à regarder un anime.",
                require_auth    : true,
                params: {
                    in: [],
                    out: [
                        {
                            name    : "ANIME_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "EPISODE_NUMBER",
                            type    : "string",
                        },
                        {
                            name    : "EPISODE_TITLE",
                            type    : "string",
                        },
                    ],
                },
            },
        ],
        actions: [],
    },

    async onSetup() {
        let last_poll = Date.now();

        let playerActionCache = await Bus.buildActionCache([ this.descriptor.triggers.find((trigger) => trigger.name == "on_animeo_watch_anime") ], {
            service         : this.name,
            require_auth    : true,

            onRun({ application }) {
                return APIs.fetch("GET", "https://animeovf.fr/api/user/@me/player", {
                    headers: {
                        Authorization: `Bearer ${application.access_token}`,
                    },
                })
                    .then(res => {
                        return res.statusCode == 200
                            ? res.json()
                            : null;
                    });
            },

            onCompare(before, after) {
                if (after && ((before && before.anime.id) != after.anime.id || before.episode.id != after.episode.id))
                    return after;
            },

            async onChange(user, player) {
                for (let reaction of user.reactions)
                    await Bus.trigger(user, reaction, {
                        ANIME_TITLE     : player.anime.title,
                        EPISODE_NUMBER  : player.episode.number,
                        EPISODE_TITLE   : player.episode.title,
                    });
            },
        });

        let trendActionCache = await Bus.buildActionCache(this.descriptor.triggers.filter((trigger) => trigger.name != "on_animeo_watch_anime"), {
            service         : this.name,
            require_auth    : false,

            onRun() {
                return APIs.fetch("GET", `https://animeovf.fr/api/animes/events?after=${last_poll}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.ANIMEO_CLIENT_SECRET}`,
                    },
                })
                    .then(res => res.json())
                    .catch(() => []);
            },

            onCompare(before, after) {
                return after.length
                    && after;
            },

            async onChange(user, events) {
                for (let event of events) {
                    if (event.type == "new_anime") {
                        let reactions = user.reactions.filter((reaction) => reaction.trigger.name == "on_animeo_trend_update_anime");

                        for (let reaction of reactions)
                            await Bus.trigger(user, reaction, {
                                ANIME_TITLE             : event.payload.title,
                                ANIME_SYNOPSIS          : event.payload.synopsis,
                            });

                    } else if (event.type == "new_episode") {
                        let reactions = user.reactions.filter((reaction) => reaction.trigger.name == "on_animeo_trend_update_episode");

                        for (let reaction of reactions)
                            await Bus.trigger(user, reaction, {
                                ANIME_TITLE             : event.payload.anime.title,
                                EPISODE_NUMBER          : event.payload.number,
                                EPISODE_TITLE           : event.payload.title,
                                EPISODE_DESCRIPTION     : event.payload.description,
                            });
                    }
                }
            },
        });

        setInterval(async () => {
            await Promise.allSettled([
                playerActionCache(),
                trendActionCache(),
            ]);

            last_poll = Date.now();
        }, 10_000);
    },

    async onOAuth(req, res) {
        if (req.method == "GET") {
            return res.redirect(`https://animeovf.fr/oauth2/authorize?client_id=${process.env.ANIMEO_CLIENT_ID}&redirect_uri=${encodeURIComponent(Bus.getRedirectURI(req) + "/animeo")}&scope=user%20user.watch_history%20user.player_state&prompt=consent&state=${Bus.getRedirectState(req)}`);

        } else {
            return Bus.loginOAuth(req, res, {
                service : this.name,
                onAuth  : async (code) => {
                    let session = await APIs.fetch("POST", "https://animeovf.fr/api/oauth2/token", {
                        json: {
                            client_id               : process.env.ANIMEO_CLIENT_ID,
                            client_secret           : process.env.ANIMEO_CLIENT_SECRET,
                            redirect_uri            : Bus.getRedirectURI(req) + "/animeo",
                            code,
                        },
                    })
                        .then(res => res.json());

                    let user = await APIs.fetch("GET", "https://animeovf.fr/api/user/@me", {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    })
                        .then(res => res.json());

                    return {
                        id              : user.id,
                        username        : user.username,
                        access_token    : session.access_token,
                        refresh_token   : session.refresh_token,
                    };
                },
            });
        }
    },

    async onRefresh(application) {
        try {
            let session = new APIs.fetch("POST", "https://animeovf.fr/api/oauth2/token", {
                form: {
                    grant_type      : "refresh_token",
                    refresh_token   : application.refresh_token,
                    client_id       : process.env.ANIMEO_CLIENT_ID,
                    client_secret   : process.env.ANIMEO_CLIENT_SECRET,
                },
            })
                .then(res => res.json());

            return {
                access_token    : session.access_token,
                refresh_token   : application.refresh_token,
            };

        } catch (err) {
            if (err.code != 401)
                throw err;
        }
    },
}
