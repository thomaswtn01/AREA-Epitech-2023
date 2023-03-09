import ServiceAnimeo    from "./integrations/animeo.js";
import ServiceDiscord   from "./integrations/discord.js";
import ServiceGithub    from "./integrations/github.js";
import ServiceSommet    from "./integrations/sommet.js";
import ServiceSpotify   from "./integrations/spotify.js";
import ServiceTwitch    from "./integrations/twitch.js";


//////////////////////////////////////
//  GLOBAL
//////////////////////////////////////


export const Services = [
    ServiceAnimeo,
    ServiceDiscord,
    ServiceGithub,
    ServiceSommet,
    ServiceSpotify,
    ServiceTwitch,
];

// Register actions and triggers.
for (let service of Services) {
    if (service.disabled)
        continue;

    service.onSetup?.();

    for (let trigger of service.descriptor.triggers)
        trigger.service = service;

    for (let action of service.descriptor.actions)
        action.service = service;
}


//////////////////////////////////////
//  INTEGRATIONS
//////////////////////////////////////


export default {
    getServiceByName(name) {
        for (let service of Services)
            if (!service.disabled && service.name == name)
                return service;
    },

    getTriggerByName(name) {
        for (let service of Services)
            if (!service.disabled)
                for (let trigger of service.descriptor.triggers)
                    if (trigger.name == name)
                        return trigger;
    },

    getActionByName(name) {
        for (let service of Services)
            if (!service.disabled)
                for (let action of service.descriptor.actions)
                    if (action.name == name)
                        return action;
    },

    checkRequirements(user, triggerOrAction) {
        if (triggerOrAction.require_auth) {
            let application = user.applications.find((app) => (app.service == triggerOrAction.service.name));

            // Checks if the OAuth2 connection is active for the service.
            if (application == null || application.revoked)
                return false;
        }

        return true;
    },

    checkParams(validator, params) {
        if (validator) {
            let keys = [];

            // Validates parameters.
            for (let param of params) {
                let entry = validator.find((entry) => (entry.name == param.name));

                if (entry) {
                    switch (entry.type) {
                        case "string":
                        case "long_string":
                            if (typeof param.value !== "string")
                                return false;
                            break;

                        case "number":
                            if (typeof param.value !== "number")
                                return false;
                            break;

                        default:
                            throw new Error(`Unsupported type "${entry.type}" for current validator.`);
                    }

                    keys.push(param.name);

                } else {
                    return false
                }
            }

            // Checks for missing required parameters.
            for (let entry of validator)
                if (entry.required && keys.includes(entry.name) == false)
                    return false;
        }

        return true;
    },
}
