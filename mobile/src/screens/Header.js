import { observer }             from "mobx-react-lite";
import { View, Text, Button }   from "react-native";
import Store                    from "../Store.js";

export default observer(() => {
    return (
        <View className="flex p-6">
            <Text className="text-2xl my-auto mr-auto font-medium font-poppins">{`Welcome, ${Store.user.username}`}</Text>
            <Button title="Settings" className="box-border bg-white border-2 border-blue-500 text-blue-500 py-2 px-4 rounded-md flex items-center"></Button>
            <Button title="Create an automation" className="bg-blue-500 text-white ml-2 py-2 px-4 rounded-md flex items-center"></Button>
        </View>
    );
});
