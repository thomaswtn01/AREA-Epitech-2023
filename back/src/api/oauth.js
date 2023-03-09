import { User, Application, startTransaction }  from "../database/mongodb.js";
import Integrations                             from "../integrations.js";
import { acceptAuth }                           from "../middlewares/auth.js";


//////////////////////////////////////
//  ROUTE : OAUTH
//////////////////////////////////////


export default async function (req, res) {
    let integration = Integrations.getServiceByName(req.params.service);

    if (integration) {
        if (integration.onOAuth) {

            if (await acceptAuth(req)) {
                if (req.method == "DELETE") {
                    let user    = await req.user.populate("applications");
                    let app     = user.applications.find((application) => (application.service == integration.name));

                    if (app) {
                        await startTransaction(async (session) => {
                            await User.updateOne({ id: req.user.id }, {
                                $pull: {
                                    applications: app.id,
                                },
                            }, { session });

                            await Application.deleteOne({ _id: app.id }, { session });
                        });

                        return res.status(200).json({
                            code        : 200,
                            error       : "unlinked",
                            description : "This service has been unlinked.",
                        });
                    }

                    return res.status(404).json({
                        code        : 404,
                        error       : "not_linked",
                        description : "This service is not linked.",
                    });

                } else if (req.method == "POST") {
                    let user = await req.user.populate("applications");

                    if (user.applications.some((application) => (application.service == integration.name)))
                        return res.status(409).json({
                            code        : 409,
                            error       : "already_linked",
                            description : "This service is already linked.",
                        });
                }
            }

            return integration.onOAuth(req, res);

        } else {
            res.status(405).json({
                code        : 405,
                error       : "no_oauth2",
                description : "The service does not offer an OAuth2 connection.",
            });
        }

    } else {
        res.status(404).json({
            code        : 404,
            error       : "invalid_service",
            description : "Unknown service.",
        });
    }
}
