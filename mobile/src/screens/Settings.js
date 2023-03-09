import * as WebBrowser                      from "expo-web-browser";
import * as Linking                         from "expo-linking";
import React                                from "react";
import { Pressable, View, Text, Button }    from "react-native";
import { SvgUri }                           from "react-native-svg";
import AsyncStorage                         from "@react-native-async-storage/async-storage";
import { observer }                         from "mobx-react-lite";
import { runInAction }                      from "mobx";
import { API }                              from "../API.js";
import Store                                from "../Store.js";

export default observer(({ navigation }) => {

    async function UnlinkAction(application) {
        await API.fetch("DELETE", `/oauth/${application.service}`);

        API.fetchMe().then((me) => {
            runInAction(() => {
                Store.user = me;
            });
        });
    }

    async function DeleteAccount() {
        await API.fetch("DELETE", "/user/@me");
        await AsyncStorage.removeItem("token");

        runInAction(() => {
            Store.user = null;
            navigation.navigate("Login");
        });
    }

    async function Logout() {
        await AsyncStorage.removeItem("TOKEN");

        runInAction(() => {
            Store.TOKEN = null;
            Store.user  = null;
            navigation.navigate("Login");
        });
    }

    return (
        <View className="flex-1 justify-center p-4">
            <Text className="text-3xl text-center mb-6">
                Settings
            </Text>

            <View className="gap-3">
                {Store.about.server.services.map((service, i) => {
                    let application = Store.user.applications.find((application) => (application.service == service.name));

                    let renderButton = () => {
                        if (application)
                            return (
                                <Pressable className="bg-red-500 rounded flex-[0_0_96px] p-4" onPress={() => UnlinkAction(application)}>
                                    <Text className="text-white">Unlink</Text>
                                </Pressable>
                            );

                        else
                            return (
                                <Pressable className="bg-blue-500  rounded flex-[0_0_96px] p-4" onPress={() => WebBrowser.openBrowserAsync(`${Store.API_URL}/api/oauth/${service.name}?redirect_uri=${encodeURIComponent(Linking.createURL(`oauth/${service.name}`))}`)}>
                                    <Text className="text-white">Link</Text>
                                </Pressable>
                            );
                    };

                    let renderLinked = () => {
                        if (application) {
                            return (
                                <View className="flex-1 ml-4">
                                    <Text className="text-gray-700 font-medium">{service.design.label}</Text>
                                    <Text className="text-gray-700 font-bold">{application.user_name}</Text>
                                </View>
                            );

                        } else {
                            return (
                                <View className="flex-1 ml-4">
                                    <Text className="text-gray-700 font-medium">{service.design.label}</Text>
                                </View>
                            );
                        }
                    };

                    return (
                        <View className="flex flex-row items-center" key={i}>
                            <View className="p-3 rounded flex items-center" style={{
                                backgroundColor: service.design.color
                            }}>
                                <SvgUri uri={Store.API_URL + service.design.icon} width="32" height="32" fill="white" />
                            </View>

                            {renderLinked()}
                            {renderButton()}
                        </View>
                    );
                })}

                <View className="flex flex-col justify-start space-x-4">
                    <Button title="Supprime ton compte" onPress={DeleteAccount}/>
                    <Button title="Déconnexion" onPress={Logout} />
                </View>
            </View>
        </View>
    );
});
