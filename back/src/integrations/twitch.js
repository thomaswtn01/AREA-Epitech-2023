import APIs                     from "apis";
import { StaticAuthProvider }   from "@twurple/auth"
import { ChatClient }           from "@twurple/chat"
import Bus                      from "../bus.js";


//////////////////////////////////////
//  TWITCH IRC
//////////////////////////////////////


const IRCManager = {
    CLIENTS: new Map(),

    connectChat(application, channel) {
        let key     = application.access_token + ":" + channel;
        let client  = this.CLIENTS.get(key);

        if (client) {
            client.last_use_at = Date.now();
            return Promise.resolve(client);
        }

        return new Promise((resolve, reject) => {
            let authProvider  = new StaticAuthProvider(process.env.TWITCH_CLIENT_ID, application.access_token);
            let chatClient    = new ChatClient({
                authProvider,
                channels: [ channel ],
            });

            chatClient.onJoin(() => {
                resolve(chatClient);
            });

            chatClient.onJoinFailure((channel, reason) => {
                chatClient.quit();
                reject(new Error(`Failed to join "${channel}" for reason "${reason}".`))
            });

            chatClient.onMessage((channel, author, content, msg) => {
                chatClient.received_messages.push({
                    author: msg.userInfo.displayName,
                    content,
                });
            });

            chatClient.onDisconnect(() => {
                this.CLIENTS.delete(key);
            });

            chatClient.connect();
            chatClient.last_use_at          = Date.now();
            chatClient.received_messages    = [];
            this.CLIENTS.set(key, chatClient);
        });
    },

    destroyUnusedConnections() {
        let now = Date.now();

        for (let client of this.CLIENTS.values()) {

            // Clear received messages queue.
            client.received_messages.length = 0;

            // Deconnect after 30 seconds of inactivity.
            if (now > (client.last_use_at + 30_000))
                client.quit();
        }
    },
};


//////////////////////////////////////
//  TWITCH
//////////////////////////////////////


export default {

    name        : "twitch",
    has_oauth   : true,
    disabled    : false,

    descriptor: {
        design: {
            label   : "Twitch",
            color   : "#9146FF",
            icon    : "/assets/img/services/twitch.svg",
        },
        triggers: [
            {
                name            : "on_twitch_stream_online",
                description     : "Déclenché lorsqu'un streamer est en live.",
                require_auth    : true,
                params: {
                    in: [
                        {
                            name        : "channel",
                            type        : "string",
                            required    : true,
                        },
                    ],
                    out: [
                        {
                            name    : "LIVE_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "CHANNEL_NAME",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_twitch_stream_offline",
                description     : "Déclenché lorsqu'un streamer n'est plus en live.",
                require_auth    : true,
                params: {
                    in: [
                        {
                            name        : "channel",
                            type        : "string",
                            required    : true,
                        },
                    ],
                    out: [
                        {
                            name    : "CHANNEL_NAME",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_twitch_stream_message",
                description     : "Déclenché lorsqu'un utilisateur envoie un message dans le tchat.",
                require_auth    : true,
                params: {
                    in: [
                        {
                            name        : "channel",
                            type        : "string",
                            required    : true,
                        },
                    ],
                    out: [
                        {
                            name    : "CHANNEL_NAME",
                            type    : "string",
                        },
                        {
                            name    : "MESSAGE_AUTHOR",
                            type    : "string",
                        },
                        {
                            name    : "MESSAGE_CONTENT",
                            type    : "string",
                        },
                    ],
                },
            },
        ],
        actions: [
            {
                name            : "do_twitch_send_live_message",
                description     : "Envoie un message dans le tchat d'un live.",
                require_auth    : true,
                params: [
                    {
                        name        : "channel",
                        type        : "string",
                        required    : true,
                    },
                    {
                        name        : "message",
                        type        : "long_string",
                        required    : true,
                    },
                ],

                onTrigger(user, { application, config, data }) {
                    return IRCManager.connectChat(application, config.channel).then((client) => {
                        client.say(config.channel, config.message.replace(/\$([\w]+)/g, (str, name) => (data[name] || str)));
                    });
                },
            },
        ],
    },

    async onSetup() {
        function sortByChannel(reactions) {
            let result = new Map();

            for (let reaction of reactions) {
                let channel = reaction.trigger.params.find((param) => param.name == "channel").value.toLowerCase();

                result.ensure(channel, () => []).push(reaction);
            }

            return result;
        }

        let actionCache = await Bus.buildActionCache(this.descriptor.triggers, {
            service         : this.name,
            require_auth    : true,

            async onRun(user, cached) {
                let channelMap = sortByChannel(user.reactions);

                // Set cache at first run.
                if (cached == null)
                    cached = new Map();

                for (let [ channel, reactions ] of channelMap.entries()) {
                    let channelInfo = cached.ensure(channel, () => ({
                        messages    : [],
                        prev_state  : null,
                        next_state  : null,
                    }));

                    try {
                        if (reactions.some(((reaction) => reaction.trigger.name == "on_twitch_stream_message"))) {
                            let client = await IRCManager.connectChat(user.application, channel);

                            channelInfo.messages        = client.received_messages;
                            client.received_messages    = [];
                        }

                        if (reactions.some(((reaction) => reaction.trigger.name != "on_twitch_stream_message"))) {
                            channelInfo.next_state = await APIs.fetch("GET", `https://api.twitch.tv/helix/streams?user_login=${channel}&type=live`, {
                                headers: {
                                    "Client-Id"     : process.env.TWITCH_CLIENT_ID,
                                    Authorization   : `Bearer ${user.application.access_token}`,
                                },
                            })
                                .then(res => res.json())
                                .then(res => res.data[0] || null);
                        }

                    } catch (err) {
                        console.error(err);
                    }
                }

                return cached;
            },

            onCompare(cached) {
                let events = [];

                for (let [ channel, info ] of cached.entries()) {
                    if (info.messages.length)
                        events.push({
                            channel,
                            type        : "message",
                            messages    : info.messages,
                        });

                    if (info.prev_state != info.next_state && (info.prev_state == null || info.next_state == null))
                        events.push({
                            channel,
                            type        : "stream",
                            title       : info.next_state ? info.next_state.title : info.prev_state.title,
                            state       : info.next_state ? "online" : "offline",
                        })

                    // Set next state as previous state.
                    info.prev_state = info.next_state;
                }

                return events.length
                    && events;
            },

            async onChange(user, events) {
                for (let event of events) {
                    if (event.type == "message") {
                        let reactions = user.reactions.filter((reaction) => reaction.trigger.name == "on_twitch_stream_message" && reaction.trigger.params.find((param) => param.name == "channel").value == event.channel);

                        for (let message of event.messages)
                            for (let reaction of reactions)
                                await Bus.trigger(user, reaction, {
                                    CHANNEL_NAME        : `#${event.channel}`,
                                    MESSAGE_AUTHOR      : message.author,
                                    MESSAGE_CONTENT     : message.content,
                                });

                    } else {
                        let reactions = event.state == "online"
                            ? user.reactions.filter((reaction) => reaction.trigger.name == "on_twitch_stream_online" && reaction.trigger.params.find((param) => param.name == "channel").value == event.channel)
                            : user.reactions.filter((reaction) => reaction.trigger.name == "on_twitch_stream_offline" && reaction.trigger.params.find((param) => param.name == "channel").value == event.channel);

                        for (let reaction of reactions)
                            await Bus.trigger(user, reaction, {
                                LIVE_TITLE      : event.title,
                                CHANNEL_NAME    : `#${event.channel}`,
                            });
                    }
                }
            },
        })

        setInterval(async () => {
            await actionCache().catch(console.error);
            await IRCManager.destroyUnusedConnections();
        }, 10_000);
    },

    onOAuth(req, res) {
        if (req.method == "GET") {
            return res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(Bus.getRedirectURI(req) + "/twitch")}&scope=chat:read%20chat:edit&response_type=code&force_verify=true&state=${Bus.getRedirectState(req)}`);

        } else {
            return Bus.loginOAuth(req, res, {
                service : this.name,
                onAuth  : async (code) => {
                    let session = await APIs.fetch("POST", "https://id.twitch.tv/oauth2/token", {
                        json: {
                            client_id       : process.env.TWITCH_CLIENT_ID,
                            client_secret   : process.env.TWITCH_CLIENT_SECRET,
                            grant_type      : "authorization_code",
                            redirect_uri    : Bus.getRedirectURI(req) + "/twitch",
                            code,
                        },
                    })
                        .then(res => res.json());

                    let user = await APIs.fetch("GET", "https://api.twitch.tv/helix/users", {
                        headers: {
                            "Client-Id"         : process.env.TWITCH_CLIENT_ID,
                            "Authorization"     : `Bearer ${session.access_token}`,
                        },
                    })
                        .then(res => res.json())
                        .then(res => res.data[0]);

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
            let session = await APIs.fetch("POST", "https://id.twitch.tv/oauth2/token", {
                form: {
                    grant_type      : "refresh_token",
                    refresh_token   : application.refresh_token,
                    client_id       : process.env.TWITCH_CLIENT_ID,
                    client_secret   : process.env.TWITCH_CLIENT_SECRET,
                },
            })
                .then(res => res.json());

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
