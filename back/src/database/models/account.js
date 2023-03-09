import mongoose from "mongoose";


//////////////////////////////////////
//  MODEL : ACCOUNT
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

    password: {
        type        : String,
        required    : true,
    },
});
