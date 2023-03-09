import mongoose from "mongoose";


//////////////////////////////////////
//  MODEL : APPLICATION
//////////////////////////////////////


export default new mongoose.Schema({
    service: {
        type        : String,
        required    : true,
        index       : true,
    },

    user_id: {
        type        : String,
        required    : true,
        ref         : "user",
    },

    user_name: {
        type        : String,
        required    : true,
    },

    access_token: {
        type        : String,
        required    : true,
    },

    refresh_token: {
        type        : String,
        default     : null,
    },

    revoked: {
        type        : Boolean,
        default     : false,
    },

    linked_to: {
        type        : mongoose.Types.ObjectId,
        required    : true,
        index       : true,
        ref         : "user",
    },
});
