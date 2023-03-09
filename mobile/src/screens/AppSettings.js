import React, { useState }                  from "react";
import { View, Text, TextInput, Button }    from "react-native";
import AsyncStorage                         from "@react-native-async-storage/async-storage";
import { observer }                         from "mobx-react-lite";
import { runInAction }                      from "mobx";
import Store                                from "../Store.js";
import { API }                              from "../API.js";
import { executableOnce }                   from "../Utils.js";

export default observer(({ navigation }) => {
    let [ url, setURL ] = useState(Store.API_URL);

    let onSave = executableOnce(async () => {
        url = url.replace(/[\/]+$/, "");

        // #1 : Persist API_URL.
        await AsyncStorage.setItem("API_URL", url);

        // #2 : Set in Store.
        runInAction(() => {
            Store.API_URL = url;
        });

        // #3 : Update about.json.
        await API.fetchAbout()
            .then((about) => {
                runInAction(() => {
                    Store.about = about;
                    console.log(about);
                });
            })
            .catch(console.error);

        navigation.navigate("Login");
    });

    return (
        <View className="flex-1 justify-center p-4">
            <Text className="text-3xl text-center mb-6">
                App Settings
            </Text>

            <View className="gap-3">
                <TextInput className="border-2 border-gray-300 rounded-lg p-2 my-2" placeholder={"http://127.0.0.1:3000/api"} value={url} onChangeText={setURL} />

                <View>
                    <Button title="Retour à l'accueil" onPress={onSave} />
                </View>
            </View>
        </View>
    );
});
