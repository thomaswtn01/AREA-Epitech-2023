import Integrations                                             from "./integrations.js";
import { ActionReaction, Application, startTransaction, User }  from "./database/mongodb.js";
import { generateToken }                                        from "./utils.js";


//////////////////////////////////////
//  OAUTH2 REFRESH
//////////////////////////////////////


(async function refreshTokens() {
    let applications = await Application.find({});

    for (let application of applications) {
        try {
            let session = await Integrations
                .getServiceByName(application.service)
                .onRefresh(application);

            if (session) {
                application.access_token    = session.access_token;
                application.refresh_token   = session.refresh_token;
                await application.save();

            } else {
                await application.remove();
            }

        } catch (err) {
            console.error(application, err);
        }
    }

    setTimeout(refreshTokens, 60_000);
})();


//////////////////////////////////////
//  BUS
//////////////////////////////////////


export default {

    getRedirectURI() {
        return process.env.WEB_APP_REDIRECT_URI;
    },

    getRedirectState(req) {
        return req.query.redirect_uri
            ? "mobile"
            : "";
    },

    async loginOAuth(req, res, { service, onAuth }) {
        try {
            if (req.body.code) {
                let auth = await onAuth(req.body.code);

                if (req.user) {
                    await startTransaction(async (session) => {
                        let [ application ] = await Application.create([
                            {
                                service,
                                user_id         : auth.id,
                                user_name       : auth.username,
                                access_token    : auth.access_token,
                                refresh_token   : auth.refresh_token,
                                linked_to       : req.user.id,
                            },
                        ], { session });

                        await User.findByIdAndUpdate(req.user.id, {
                            $push: {
                                applications: application.id,
                            },
                        }, { session }).lean();
                    });

                    // Send 200 OK.
                    res.status(200).json({
                        code    : 200,
                        message : "success",
                    });

                } else {

                    // Find and update user in the database.
                    let application = await Application.findOneAndUpdate({ service, user_id : auth.id }, {
                        $set: {
                            user_name       : auth.username,
                            access_token    : auth.access_token,
                            refresh_token   : auth.refresh_token,
                        },
                    }, { new: true }).lean();

                    if (application) {

                        // Connects the user to the linked service account.
                        res.status(200).json({
                            code    : 200,
                            token   : generateToken(application.linked_to),
                        });

                    } else {

                        // The user must create an account first.
                        res.status(404).json({
                            code        : 404,
                            error       : "service_unlinked",
                            description : "Unlinked, create an account and link this service to be able to login with it.",
                        });
                    }
                }

            } else {
                res.status(400).json({
                    code        : 400,
                    error       : "bad_request",
                    description : "Malformed request.",
                });
            }

        } catch (err) {
            if (err.code == 400 || err.code == 401) {
                res.status(400).json({
                    code        : 400,
                    error       : "invalid_grant",
                    description : "Invalid authorization code, please retry.",
                });

            } else {
                res.status(500).json({
                    code        : 500,
                    error       : "internal_error",
                    description : "An error occured, please contact an administrator.",
                });
            }
            console.error(err);
        }
    },

    async buildActionCache(triggers, options = {}) {
        let cache       = new Map();
        let cacheTmp    = new Map();

        async function execUpdate(user, after) {
            let before = cache.get(user.me.id);

            if (before) {
                let compared = await options.onCompare(before, after);

                if (compared)
                    await options.onChange(user, compared);
            }

            cacheTmp.set(user.me.id, after);
        }

        async function run() {
            let users = new Map();

            let actionReactions = await ActionReaction.find({
                $or: triggers.map((trigger) => ({ "trigger.name": trigger.name })),
            })
                .populate({
                    path        : "user_id",
                    populate    : "applications",
                });

            for (let action of actionReactions)
                users.ensure(action.user_id.id, () => ({
                    me          : action.user_id,
                    application : action.user_id.applications.find((app) => (app.service == options.service)),
                    reactions   : [],
                })).reactions.push(action);

            for (let user of users.values()) {
                try {
                    if (options.require_auth) {
                        if (user.application && !user.application.revoked)
                            await execUpdate(user, await options.onRun(user, cache.get(user.me.id)));

                    } else {
                        await execUpdate(user, await options.onRun(user));
                    }

                } catch (err) {
                    console.error(err);
                }
            }

            cache       = cacheTmp;
            cacheTmp    = new Map();
        }

        // Cache user data for the current service.
        await run();

        // Return runner.
        return run;
    },

    async trigger(user, reaction, data) {
        try {
            for (let action of reaction.actions) {
                let actionRef = Integrations.getActionByName(action.name);

                if (actionRef) {
                    let application = null;

                    if (actionRef.require_auth) {
                        application = user.me.applications.find((app) => (app.service == actionRef.service.name));

                        if (application == null || application.revoked)
                            throw new Error(`Action "${action.name}" require a linked account to "${actionRef.service.name}".`);
                    }

                    await actionRef.onTrigger(user, {
                        application,
                        config: Object.fromEntries(action.params.map((entry) => [ entry.name, entry.value ])),
                        data: {
                            AREA_USERNAME       : user.me.username,
                            SERVICE_USERNAME    : application?.user_name,
                            ...data,
                        },
                    });

                } else {
                    throw new Error(`Unknown action "${action.name}".`);
                }
            }

        } catch (err) {
            console.error(err);
        }
    },
}
