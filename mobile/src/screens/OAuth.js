import React, { useEffect, useState }   from "react";
import { View, Text }                   from "react-native";
import { SvgUri }                       from "react-native-svg";
import { observer }                     from "mobx-react-lite";
import { runInAction }                  from "mobx";
import Store                            from "../Store.js";
import { API }                          from "../API.js";

export default observer(({ route, navigation }) => {
    const service                   = Store.about.server.services.find(service => service.name == route.params.service);
    const [ message, setMessage ]   = useState("Loading...");

    useEffect(() => {
        if (service) {
            (async () => {
                try {
                    let res = await API.fetch("POST", `/oauth/${service.name}`, {
                        json: {
                            code: route.params.code,
                        },
                    });

                    // If the response returns a token, the user was not logged in.
                    // This token allows to connect to the AREA account linked to this service.
                    if (res.token)
                        Store.TOKEN = res.token;

                    // Set error message.
                    setMessage("Success, redirecting to settings...");

                    // Redirect to settings.
                    setTimeout(() => {
                        API.fetchMe().then((me) => {
                            runInAction(() => {
                                Store.user = me;
                                navigation.navigate("Settings");
                            });
                        });
                    }, 1_000);

                } catch (err) {
                    setMessage(err?.error?.description || "Une erreur inconnue est survenue, contacte un administrateur.");

                    // Redirect to settings.
                    setTimeout(() => {
                        navigation.navigate("Settings");
                    }, 5_000);
                }
            })();
        }
    }, []);

    if (service) {
        return (
            <View className="w-screen h-screen flex flex-col items-center justify-center " style={{
                backgroundColor: service.design.color,
            }}>
                <View className="flex flex-col items-center justify-center">
                    <SvgUri uri={Store.API_URL + service.design.icon} width="84" height="84" fill="white" />

                    <Text className="text-white text-2xl mt-4 text-center">
                        {message}
                    </Text>
                </View>
            </View>
        );

    } else {
        return (
            <View className="flex-1 justify-center p-4">
                <Text className="text-3xl text-center mb-6">
                    Error, redirecting to home...
                </Text>
            </View>
        );
    }
});
