import mongoose from "mongoose";


//////////////////////////////////////
//  MODEL : USER
//////////////////////////////////////


export default new mongoose.Schema({
    username: {
        type        : String,
        required    : true,
        index: {
            unique: true,
            collation: {
                locale      : "en",
                strength    : 2,
            },
        },
    },

    avatar: {
        type        : String,
        required    : true,
    },

    applications: [
        {
            type    : mongoose.Schema.Types.ObjectId,
            ref     : "application",
        },
    ],

    triggers: [
        {
            type    : mongoose.Schema.Types.ObjectId,
            ref     : "action-reaction",
        },
    ],
});
