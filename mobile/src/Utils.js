import { runInAction }          from "mobx";
import AsyncStorage             from "@react-native-async-storage/async-storage";
import Store                    from "./Store.js";
import { API, APIFetchError }   from "./API.js";

async function persistToken(token) {
    Store.TOKEN = token;
    await AsyncStorage.setItem("TOKEN", token);
}

export function executableOnce(cb) {
    let unlocked = true;

    return function (...args) {
        if (unlocked) {
            unlocked = false;
            return cb(...args);
        }
    };
}

export async function login(username, password, navigation) {
    try {
        await API.login(username, password).then(persistToken);

        //  #1 : Fetch user and service infos.
        let user    = await API.fetchMe();
        let about   = await API.fetchAbout();

        //  #2 : Update in Store.
        runInAction(() => {
            Store.user  = user;
            Store.about = about;
            console.log(user);
            console.log(about);
        });

        //  #3 : Navigate to home.
        navigation.navigate("Home");

    } catch (error) {
        throw error instanceof APIFetchError
            ? error.error.error
            : "Unexpected error.";
    }
}

export async function register(username, password, navigation) {
    try {
        await API.register(username, password);

    } catch (error) {
        throw error instanceof APIFetchError
            ? error.error.error
            : "Unexpected error.";
    }

    return login(username, password, navigation);
}
