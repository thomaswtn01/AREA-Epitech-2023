import APIs     from "apis";
import Bus      from "../bus.js";


//////////////////////////////////////
//  GLOBAL
//////////////////////////////////////


const SPOTIFY_SECRET_KEY =  Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString("base64");


//////////////////////////////////////
//  SPOTIFY
//////////////////////////////////////


export default {

    name        : "spotify",
    has_oauth   : true,
    disabled    : false,

    descriptor: {
        design: {
            label   : "Spotify",
            color   : "#1DB954",
            icon    : "/assets/img/services/spotify.svg",
        },
        triggers: [
            {
                name            : "on_spotify_play_song",
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
                    return APIs.fetch("GET", "https://api.spotify.com/v1/me/player", {
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
                                    artist  : res.artists.map((artist) => artist.name).join(", "),
                                    album   : res.album.name,
                                };

                            } else {
                                return null;
                            }
                        });
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

    onOAuth(req, res) {
        if (req.method == "GET") {
            return res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(Bus.getRedirectURI(req) + "/spotify")}&scope=user-read-playback-state%20user-library-read&response_type=code&show_dialog=true&state=${Bus.getRedirectState(req)}`);

        } else {
            return Bus.loginOAuth(req, res, {
                service : this.name,
                onAuth  : async (code) => {
                    let session = await APIs.fetch("POST", "https://accounts.spotify.com/api/token", {
                        headers: {
                            Authorization: `Basic ${SPOTIFY_SECRET_KEY}`,
                        },
                        form: {
                            grant_type      : "authorization_code",
                            redirect_uri    : Bus.getRedirectURI(req) + "/spotify",
                            code,
                        },
                    })
                        .then(res => res.json());

                    let user = await APIs.fetch("GET", "https://api.spotify.com/v1/me", {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    })
                        .then(res => res.json());

                    return {
                        id              : user.id,
                        username        : user.display_name,
                        access_token    : session.access_token,
                        refresh_token   : session.refresh_token,
                    };
                },
            });
        }
    },

    async onRefresh(application) {
        try {
            let session = await APIs.fetch("POST", "https://accounts.spotify.com/api/token", {
                headers: {
                    Authorization   : `Basic ${SPOTIFY_SECRET_KEY}`,
                },
                form: {
                    grant_type      : "refresh_token",
                    refresh_token   : application.refresh_token,
                },
            })
                .then(res => res.json());

            return {
                access_token    : session.access_token,
                refresh_token   : application.refresh_token,
            };

        } catch (err) {
            if (err.code != 400)
                throw err;
        }
    },
}
