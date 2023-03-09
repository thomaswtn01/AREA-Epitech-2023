import APIs from "apis";
import Bus  from "../bus.js";


//////////////////////////////////////
//  DISCORD
//////////////////////////////////////


export default {

    name        : "discord",
    has_oauth   : true,

    descriptor: {
        design: {
            label   : "Discord",
            color   : "#5865F2",
            icon    : "/assets/img/services/discord.svg",
        },
        triggers: [
            {
                name            : "on_discord_guild_join",
                description     : "Déclenché lorsque tu rejoins un serveur.",
                require_auth    : true,
                params: {
                    in: [],
                    out: [
                        {
                            name    : "GUILD_NAME",
                            type    : "string",
                        },
                        {
                            name    : "GUILD_ICON_URL",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_discord_guild_leave",
                description     : "Déclenché lorsque tu quittes un serveur.",
                require_auth    : true,
                params: {
                    in: [],
                    out: [
                        {
                            name    : "GUILD_NAME",
                            type    : "string",
                        },
                        {
                            name    : "GUILD_ICON_URL",
                            type    : "string",
                        },
                    ],
                },
            },
        ],
        actions: [
            {
                name            : "do_discord_send_webhook",
                description     : "Envoie un message dans un Webhook.",
                require_auth    : false,
                params: [
                    {
                        name        : "url",
                        type        : "string",
                        required    : true,
                    },
                    {
                        name        : "message",
                        type        : "string",
                        required    : true,
                    },
                ],

                async onTrigger(user, { config, data }) {
                    await APIs.fetch("POST", config.url, {
                        json: {
                            content: config.message.replace(/\$([\w]+)/g, (str, name) => (data[name] || str)),
                        },
                    });
                },
            },
        ],
    },

    async onSetup() {
        setInterval((
            await Bus.buildActionCache(this.descriptor.triggers, {
                service         : this.name,
                require_auth    : true,

                onRun({ application }) {
                    return APIs.fetch("GET", "https://discord.com/api/v10/users/@me/guilds", {
                        headers: {
                            Authorization: `Bearer ${application.access_token}`,
                        },
                    })
                        .then(res => res.json())
                        .then(res => new Map(res.map((guild) => ([ guild.id, guild ]))));
                },

                onCompare(before, after) {

                    // Clone after for reuse.
                    after = structuredClone(after);

                    // Intersect before and after.
                    for (let id of [...before.keys()])
                        if (after.delete(id))
                            before.delete(id);

                    // Return changements.
                    if (after.size || before.size)
                        return {
                            added   : after,
                            removed : before,
                        };
                },

                async onChange(user, { added, removed }) {
                    for (let reaction of user.reactions) {
                        if (reaction.trigger.name == "on_discord_guild_join") {
                            for (let guild of added.values())
                                await Bus.trigger(user, reaction, {
                                    GUILD_NAME      : guild.name,
                                    GUILD_ICON_URL  : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
                                });

                        } else {
                            for (let guild of removed.values())
                                await Bus.trigger(user, reaction, {
                                    GUILD_NAME      : guild.name,
                                    GUILD_ICON_URL  : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
                                });
                        }
                    }
                },
            })
        ), 10_000);
    },

    onOAuth(req, res) {
        const oauth = new APIs.Discord({
            client_id       : process.env.DISCORD_CLIENT_ID,
            client_secret   : process.env.DISCORD_CLIENT_SECRET,
            redirect_uri    : Bus.getRedirectURI(req) + "/discord",
            scope           : "identify guilds",
            response_type   : "code",
        });

        if (req.method == "GET") {
            return res.redirect(oauth.authorize_url + `&state=${Bus.getRedirectState(req)}`);

        } else {
            return Bus.loginOAuth(req, res, {
                service : this.name,
                onAuth  : async (code) => {
                    let session = await oauth.authorize(code);
                    let user    = await APIs.Discord.getUser(session.access_token);

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
            const oauth = new APIs.Discord({
                client_id       : process.env.DISCORD_CLIENT_ID,
                client_secret   : process.env.DISCORD_CLIENT_SECRET,
                scope           : "identify guilds",
                response_type   : "code",
            });

            let session = await oauth.refreshToken(application.refresh_token);

            return {
                access_token    : session.access_token,
                refresh_token   : session.refresh_token,
            };

        } catch (err) {
            if (err.code != 400)
                throw err;
        }
    },
}
