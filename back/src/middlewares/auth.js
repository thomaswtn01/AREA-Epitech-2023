import { decodeToken }  from "../utils.js";
import { User }         from "../database/mongodb.js";


//////////////////////////////////////
//  UTILS
//////////////////////////////////////


export async function acceptAuth(req) {
    if (req.headers.authorization) {
        let { data }    = decodeToken(req.headers.authorization, 64);
        let user        = data && await User.findById(data);

        if (user) {
            req.user = user;
            return true;
        }
    }

    return false;
}


//////////////////////////////////////
//  MIDDLEWARE AUTH
//////////////////////////////////////


export default async function (req, res, next) {
    try {
        // Set request user and continue.
        if (await acceptAuth(req))
            return next();

        // Send 403 error.
        res.status(403).json({
            code    : 403,
            error   : "Not authenticated.",
        });

    } catch (error) {

        // Verbose error.
        console.error(error);

        // Send 503 error.
        res.status(503).json({
            code: 503,
            error,
        });
    }
}
