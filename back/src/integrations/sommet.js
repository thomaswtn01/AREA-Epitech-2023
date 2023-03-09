import APIs     from "apis";
import Bus      from "../bus.js";


//////////////////////////////////////
//  SOMMET
//////////////////////////////////////


export default {

    name        : "sommet",
    has_oauth   : true,
    disabled    : false,

    descriptor: {
        design: {
            label   : "Sommet",
            color   : "#000000",
            icon    : "/assets/img/services/sommet.svg",
        },
        triggers: [
            {
                name            : "on_sommet_play_song",
                description     : "Déclenché lorsque tu écoutes une musique.",
                require_auth    : true,
                params: {
                    in: [],
                    out: [
                        {
                            name    : "SONG_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "SONG_ARTIST",
                            type    : "string",
                        },
                        {
                            name    : "SONG_ALBUM",
                            type    : "string",
                        },
                    ],
                },
            },
        ],
        actions: [],
    },

    async onSetup() {
        setInterval((
            await Bus.buildActionCache(this.descriptor.triggers, {
                service         : this.name,
                require_auth    : true,

                onRun({ application }) {
                    return APIs.fetch("GET", "https://sommet.app/api/user/@me/player", {
                        headers: {
                            Authorization: `Bearer ${application.access_token}`,
                        },
                    })
                        .then(res => {
                            if (res.statusCode == 200) {
                                res = res.json();
                                res = res.item;

                                return {
                                    id      : res.id,
                                    title   : res.name,
                                    artist  : res.artist.name,
                                    album   : res.album.name,
                                };

                            } else {
                                return null;
                            }
                        })
                        .catch(() => null)
                },

                onCompare(before, after) {
                    if (after && (before && before.id) != after.id)
                        return after;
                },

                async onChange(user, song) {
                    for (let reaction of user.reactions)
                        await Bus.trigger(user, reaction, {
                            SONG_TITLE  : song.title,
                            SONG_ARTIST : song.artist,
                            SONG_ALBUM  : song.album,
                        });
                },
            })
        ), 10_000);
    },

    async onOAuth(req, res) {
        if (req.method == "GET") {
            return res.redirect(`https://sommet.app/oauth2/authorize?client_id=${process.env.SOMMET_CLIENT_ID}&redirect_uri=${encodeURIComponent(Bus.getRedirectURI(req) + "/sommet")}&scope=user%20user.playback_state&prompt=consent&state=${Bus.getRedirectState(req)}`);

        } else {
            return Bus.loginOAuth(req, res, {
                service : this.name,
                onAuth  : async (code) => {
                    let session = await APIs.fetch("POST", "https://sommet.app/api/oauth2/token", {
                        json: {
                            client_id               : process.env.SOMMET_CLIENT_ID,
                            client_secret           : process.env.SOMMET_CLIENT_SECRET,
                            redirect_uri            : Bus.getRedirectURI(req) + "/sommet",
                            code,
                        },
                    })
                        .then(res => res.json());

                    let user = await APIs.fetch("GET", "https://sommet.app/api/user/@me", {
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
            let session = new APIs.fetch("POST", "https://sommet.app/api/oauth2/token", {
                form: {
                    grant_type      : "refresh_token",
                    refresh_token   : application.refresh_token,
                    client_id       : process.env.SOMMET_CLIENT_ID,
                    client_secret   : process.env.SOMMET_CLIENT_SECRET,
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
