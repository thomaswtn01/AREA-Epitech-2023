import { useState }                         from "react";
import { View, Text, Button, TextInput }    from "react-native";
import { observer }                         from "mobx-react-lite";
import { register }                         from "../Utils.js";

export default observer(({ navigation }) => {
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ error, setError ]       = useState("");

    function clickRegister() {
        setError("");
        register(username, password, navigation).catch(setError);
    }

    return (
        <View className="h-screen flex flex-col text-gray-800 justify-center items-center">
            <View className="absolute top-[40px] right-[30px]">
                <Button title="Paramètres" className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-gray-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out" onPress={() => navigation.navigate("AppSettings")}/>
            </View>

            <View className="w-screen items-center justify-center">
                <View className="w-4/5 items-center justify-center text-center my-6">
                    <Text className="text-3xl font-bold my-6">Register with</Text>
                    <Button title="Discord" className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-gray-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out" />
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
                    <Button title="Sign Up" onPress={clickRegister} className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out mx-1" />
                </View>

                <View className="flex flex-col items-center justify-center w-4/5">
                    <Button title="Login" onPress={() => navigation.navigate("Login")} className="p-3 bg-gray-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg transition duration-150 ease-in-out mx-1" />
                </View>
            </View>
        </View>
    );
});
