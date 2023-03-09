import * as WebBrowser                      from "expo-web-browser";
import * as Linking                         from "expo-linking";
import { useState }                         from "react";
import { View, Button, Text, TextInput }    from "react-native";
import { observer }                         from "mobx-react-lite";
import { login }                            from "../Utils.js";
import Store                                from "../Store.js";

export default observer(({ navigation }) => {
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ error, setError ]       = useState("");

    function clickLogin() {
        setError("");
        login(username, password, navigation).catch(setError);
    }

    return (
        <View className="h-screen flex flex-col text-gray-800 justify-center items-center">
            <View className="absolute top-[40px] right-[30px]">
                <Button title="Paramètres" className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-gray-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out" onPress={() => navigation.navigate("AppSettings")}/>
            </View>

            <View className="w-screen items-center justify-center">
                <View className="w-4/5 items-center justify-center text-center my-6">
                    <Text className="text-3xl font-bold my-6">Login with</Text>

                    <Button title="Discord" className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-gray-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out"onPress={() => WebBrowser.openBrowserAsync(`${Store.API_URL}/api/oauth/discord?redirect_uri=${encodeURIComponent(Linking.createURL("oauth/discord"))}`)} />
                </View>

                <View className="justify-center items-center">
                    <Text className="text-sm">or</Text>
                </View>

                <View className="flex flex-col items-center justify-center w-4/5 my-6">
                    {error && <Text>{error}</Text>}
                    <TextInput className="border-2 border-gray-300 rounded-lg p-2 my-2 w-full" onChangeText={(username) => setUsername(username)} placeholder="Username" />
                    <TextInput secureTextEntry={true} className="border-2 border-gray-300 rounded-lg p-2 my-2 w-full" onChangeText={(password) => setPassword(password)} placeholder="Password" />
                </View>

                <View className="flex flex-col items-center justify-center w-4/5 my-4">
                    <Button title="Login" onPress={clickLogin} className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out mx-1 my-4" />
                </View>

                <View className="flex flex-col items-center justify-center w-4/5">
                    <Button title="Sign Up" className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out mx-1 my-4" onPress={() => navigation.navigate("Register")}/>
                </View>
            </View>
        </View>
    );
});
