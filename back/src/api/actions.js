import { User, ActionReaction, startTransaction }   from "../database/mongodb.js";
import Integrations                                 from "../integrations.js";


//////////////////////////////////////
//  ROUTE : ACTIONS
//////////////////////////////////////


export default {

    async create(req, res) {
        await req.user.populate("applications");

        function validate(body) {
            function validateParams(params) {
                for (let param of params)
                    if (!(typeof param.name === "string" && typeof param.value === "string"))
                        return false;
                return true;
            }

            return typeof body.trigger === "object"
                && typeof body.trigger.name === "string"
                && Array.isArray(body.trigger.params)
                && validateParams(body.trigger.params)
                && typeof body.action === "object"
                && typeof body.action.name === "string"
                && Array.isArray(body.action.params)
                && validateParams(body.action.params);
        }

        if (validate(req.body)) {
            let trigger = Integrations.getTriggerByName(req.body.trigger.name);
            let action  = Integrations.getActionByName(req.body.action.name);

            if (trigger && action) {
                if (Integrations.checkRequirements(req.user, trigger)) {
                    if (Integrations.checkParams(trigger.params.in, req.body.trigger.params) && Integrations.checkParams(action.params, req.body.action.params)) {

                        try {
                            await startTransaction(async (session) => {
                                let [ action ] = await ActionReaction.create([
                                    {
                                        user_id: req.user.id,
                                        trigger: {
                                            name    : req.body.trigger.name,
                                            params  : req.body.trigger.params,
                                        },
                                        actions: [
                                            {
                                                name    : req.body.action.name,
                                                params  : req.body.action.params,
                                            },
                                        ],
                                    },
                                ], { session });

                                await User.findByIdAndUpdate(req.user.id, {
                                    $push: {
                                        triggers: action.id,
                                    },
                                }, { session }).lean();
                            });

                        } catch (err) {
                            console.error(err);

                            res.status(500).json({
                                code    : 500,
                                error   : "An error occured, please contact an administrator.",
                            });
                        }

                        // Send 200 OK.
                        res.status(200).json({
                            code    : 200,
                            message : "success",
                        });

                    } else {
                        res.status(400).json({
                            code        : 400,
                            error       : "invalid_params",
                            description : "Invalid parameters.",
                        });
                    }

                } else {
                    res.status(405).json({
                        code        : 403,
                        error       : "service_not_connected",
                        description : "The trigger requires an OAuth2 connection to the associated service.",
                    });
                }

            } else {
                res.status(404).json({
                    code        : 404,
                    error       : "invalid_trigger_or_action",
                    description : "Unknown trigger or action.",
                });
            }

        } else {
            res.status(400).json({
                code        : 400,
                error       : "bad_request",
                description : "Malformed request.",
            });
        }
    },

    async delete(req, res) {
        try {
            await startTransaction(async (session) => {
                await User.updateOne({ _id: req.user.id }, { $pull: { triggers: req.params.id } }, { session });
                await ActionReaction.deleteOne({ _id: req.params.id }, { session });
            });

            // Send 200 OK.
            res.status(200).json({
                code    : 200,
                message : "success",
            });

        } catch (err) {
            console.error(err);

            res.status(500).json({
                code        : 500,
                error       : "internal_error",
                description : "An error occured, please contact an administrator.",
            });
        }
    },
}
