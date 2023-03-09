import mongoose                 from "mongoose";
import SchemaUser               from "./models/user.js";
import SchemaAccount            from "./models/account.js";
import SchemaApplication        from "./models/application.js";
import SchemaActionReaction     from "./models/action_reaction.js";


//////////////////////////////////////
//  MONGOOSE
//////////////////////////////////////


try {
    // Show log message.
    mongoose.connection.on("connected", () => {
        console.log("[LOG][MONGODB] Connected.");
    });

    mongoose.set("strictQuery", true);

    // Connect to database.
    await mongoose.connect(`mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`, {
        dbName  : process.env.MONGODB_DATABASE,
        user    : process.env.MONGODB_USER,
        pass    : process.env.MONGODB_PASSWORD,
    });

} catch (err) {

    // Show verbose message.
    console.error(err);

    // We should exit now.
    process.exit(2);
}


//////////////////////////////////////
//  TRANSACTIONS
//////////////////////////////////////


export async function startTransaction(cb) {
    return mongoose.connection.transaction(cb);
}


//////////////////////////////////////
//  EXPORTS
//////////////////////////////////////


/**
 * @type mongoose.Model<SchemaAccount>
 */
export const Account = mongoose.model("account", SchemaAccount);

/**
 * @type mongoose.Model<SchemaUser>
 */
export const User = mongoose.model("user", SchemaUser);

/**
 * @type mongoose.Model<SchemaApplication>
 */
export const Application = mongoose.model("application", SchemaApplication);

/**
 * @type mongoose.Model<SchemaActionReaction>
 */
export const ActionReaction = mongoose.model("action-reaction", SchemaActionReaction);
