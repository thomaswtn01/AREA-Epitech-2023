import mongoose from "mongoose";


//////////////////////////////////////
//  MODEL : ACTION-REACTION
//////////////////////////////////////


export default new mongoose.Schema({
    user_id: {
        type        : mongoose.Types.ObjectId,
        required    : true,
        index       : true,
        ref         : "user",
    },

    trigger: {
        name: {
            type        : String,
            required    : true,
            index       : true,
        },

        params: [
            {
                _id: false,

                name: {
                    type        : String,
                    required    : true,
                },

                value: {
                    type        : String,
                    required    : true,
                },
            },
        ],
    },

    actions: [
        {
            _id: false,

            name: {
                type        : String,
                required    : true,
                index       : true,
            },

            params: [
                {
                    _id: false,

                    name: {
                        type        : String,
                        required    : true,
                    },

                    value: {
                        type        : String,
                        required    : true,
                    },
                },
            ],
        },
    ],
});
