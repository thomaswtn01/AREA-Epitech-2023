import { observable } from "mobx";

export default observable({

    // APP CLIENT
    API_URL : null,
    TOKEN   : null,

    // APP SERVER
    about   : {},
    loading : true,
    user    : null,
});
