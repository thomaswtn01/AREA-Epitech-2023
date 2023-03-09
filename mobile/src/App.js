import { registerRootComponent }                from "expo";
import * as Linking                             from "expo-linking";
import { TouchableHighlight, View, Text }       from "react-native";
import { useNavigation, NavigationContainer }   from "@react-navigation/native";
import { createNativeStackNavigator }           from "@react-navigation/native-stack";
import AsyncStorage                             from "@react-native-async-storage/async-storage";
import { observer }                             from "mobx-react-lite";
import { runInAction }                          from "mobx";
import { API }                                  from "./API.js";

//  SCREENS

import Home                                     from "./screens/Home.js";
import Login                                    from "./screens/Login.js";
import Register                                 from "./screens/Register.js";
import Settings                                 from "./screens/Settings.js";
import CreateAuto                               from "./screens/CreateAuto.js";
import AppSettings                              from "./screens/AppSettings.js";
import OAuth                                    from "./screens/OAuth.js";
import Store                                    from "./Store.js";

const Stack = createNativeStackNavigator();

const linking = {
    prefixes: [ Linking.createURL("/") ],
    config: {
        screens: {
            Home: {
                path: "/",
            },
            Register: {
                path: "register",
            },
            OAuth: {
                path: "oauth/:service",
            },
        },
    },
};

(async () => {

    // Get API URL and TOKEN.
    Store.API_URL   = await AsyncStorage.getItem("API_URL");
    Store.TOKEN     = await AsyncStorage.getItem("TOKEN");

    // Show verbose infos.
    console.log("Loading...");
    console.log("CURRENT_URL:\t"    , Linking.createURL("/"));
    console.log("API_URL:\t\t"      , Store.API_URL);

    // #1 : Authenticate current user.
    if (Store.TOKEN) {
        let me = await API.fetchMe().catch(() => {});

        if (me) {
            runInAction(() => {
                Store.user = me;
            });

            console.log(`Logged as ${me.username}.`);

        } else {
            await AsyncStorage.removeItem("TOKEN");
            Store.TOKEN = null;
        }
    }

    // #2 : Fetch about.json.
    if (Store.API_URL) {
        let about = await API.fetchAbout().catch(console.error);

        if (about) {
            runInAction(() => {
                Store.about = about;
            });

            console.log(about);
        }
    }

    // #3 : Set loading state.
    runInAction(() => {
        Store.loading = false;
    });
})();

const App = observer(() => {
    let navigation = useNavigation();

    if (Store.loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text>
                    Chargement...
                </Text>
            </View>
        );

    } else if (Store.user) {
        return (
            <>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Settings" component={Settings} />
                    <Stack.Screen name="Home" component={Home} />
                    <Stack.Screen name="CreateAuto" component={CreateAuto} />
                    <Stack.Screen name="OAuth" component={OAuth} />
                </Stack.Navigator>

                <View className="flex flex-row">
                    <TouchableHighlight className="flex-1 items-center justify-center p-5" onPress={() => navigation.navigate("Home")}>
                        <Text>Home</Text>
                    </TouchableHighlight>

                    <TouchableHighlight className="flex-1 items-center justify-center p-5" onPress={() => navigation.navigate("Settings")}>
                        <Text>Settings</Text>
                    </TouchableHighlight>
                </View>
            </>
        );

    } else {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="AppSettings" component={AppSettings} />
                <Stack.Screen name="OAuth" component={OAuth} />
            </Stack.Navigator>
        );
    }
});

registerRootComponent(() => {
    return (
        <NavigationContainer linking={linking}>
            <App />
        </NavigationContainer>
    );
});
