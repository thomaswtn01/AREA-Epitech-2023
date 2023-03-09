import { generateToken }    from "../utils.js";
import { User, Account, startTransaction }    from "../database/mongodb.js";


//////////////////////////////////////
//  ROUTE : AUTH
//////////////////////////////////////


export default {

    async login(req, res) {
        let username = req.body.username;
        let password = req.body.password;

        // Check username and password.
        if ((/^[a-zA-Z0-9_]{3,16}$/.test(username) && password?.length >= 8) == false)
            return res.status(400).json({
                code    : 400,
                error   : "Username should respect ^[a-zA-Z0-9_]{3,16}$ and password must contain at least 8 characters."
            });

        let account = await Account.findOne({ username, password }).lean();

        // Check account.
        if (!account)
            return res.status(403).json({
                code    : 403,
                error   : "Username or password incorrect.",
            });

        // Send 200 OK.
        return res.status(200).json({
            code    : 200,
            token   : generateToken(account._id),
        });
    },

    async register(req, res) {
        let username = req.body.username;
        let password = req.body.password;

        // Check username and password.
        if ((/^[a-zA-Z0-9_]{3,16}$/.test(username) && password?.length >= 8) == false)
            return res.status(400).json({
                code    : 400,
                error   : "Username should respect ^[a-zA-Z0-9_]{3,16}$ and password must contain at least 8 characters."
            });

        try {
            await startTransaction(async (session) => {

                // Create account.
                let [ account ] = await Account.create([{ username, password }], { session });

                // Create user.
                await User.create([
                    {
                        _id         : account._id,
                        username,
                        avatar      : "/assets/img/avatar.png",
                    }
                ], { session });
            });

            // Send 201 Created.
            res.status(201).json({
                code    : 201,
                message : "User created.",
            });

        } catch (err) {
            if (err.code == 11000) {
                res.status(409).json({
                    code    : 409,
                    error   : "Username is taken.",
                });

            } else {
                console.error(err);

                res.status(500).json({
                    code    : 500,
                    error   : "An error occured, please contact an administrator.",
                });
            }
        }
    }
}
