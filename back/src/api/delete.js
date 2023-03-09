import { User, Account, Application, ActionReaction, startTransaction } from "../database/mongodb.js";

export default async function (req, res) {
    try {
        await startTransaction(async (session) => {
            await User.deleteOne({ _id: req.user.id }, { session });
            await Account.deleteOne({ _id: req.user.id }, { session });
            await Application.deleteMany({ linked_to: req.user.id }, { session });
            await ActionReaction.deleteMany({ user_id: req.user.id }, { session });
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
}
