import { Services } from "../integrations.js";


//////////////////////////////////////
//  ROUTE ABOUT
//////////////////////////////////////


export default function (req, res) {
    res.json({
        client: {
            host: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        },
        server: {
            current_time    : Math.floor(Date.now() / 1000),
            services        : Services.map((service) => ({
                name        : service.name,
                has_oauth   : service.has_oauth,
                disabled    : service.disabled,
                design: {
                    label       : service.descriptor.design.label,
                    icon        : service.descriptor.design.icon,
                    color       : service.descriptor.design.color,
                },
                actions: service.descriptor.triggers.map((trigger) => ({
                    name        : trigger.name,
                    description : trigger.description,
                    params      : trigger.params,
                })),
                reactions: service.descriptor.actions.map((action) => ({
                    name        : action.name,
                    description : action.description,
                    params      : action.params,
                })),
            })),
        },
        extra: {
            mobile_redirect_uri: process.env.MOBILE_APP_REDIRECT_URI,
        },
    });
}
