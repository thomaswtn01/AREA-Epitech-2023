import React                                from "react";
import { ScrollView, View, Text, Button }   from "react-native";
import { Svg, SvgUri, Path }                from "react-native-svg";
import { observer }                         from "mobx-react-lite";
import Store                                from "../Store.js";

export default observer(({ navigation }) => {
    let getService = (name) => {
        for (let service of Store.about.server.services) {
            for (let action of service.actions)
                if (action.name == name)
                    return service;

            for (let reaction of service.reactions)
                if (reaction.name == name)
                    return service;
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
            <View className="flex-1 items-center justify-center py-16">
                <Text className="text-3xl text-center mb-6">
                    List of Action/Reaction
                </Text>

                <View className="gap-3">
                    {Store.user.triggers.map(({ trigger, actions: [action] }, i) => {
                        let serviceTrigger = getService(trigger.name);
                        let serviceAction = getService(action.name);

                        return (
                            <View className="items-center justify-center" key={i}>
                                <View className="flex flex-row rounded h-[150px]">
                                    <View className="flex items-center justify-center p-6 flex-[0_0_200px] pr-12" style={{
                                        backgroundColor: serviceTrigger.design.color
                                    }}>
                                        <SvgUri uri={`${Store.API_URL}/${serviceTrigger.design.icon}`} width="56px" height="56px" fill="white" />
                                        <Text className="text-white font-bold text-xl mt-2">{serviceTrigger.design.label}</Text>
                                    </View>

                                    <View className="flex items-center justify-center p-6 flex-[0_0_200px] pl-12" style={{
                                        backgroundColor: serviceAction.design.color
                                    }}>
                                        <SvgUri className="flex-1" uri={`${Store.API_URL}/${serviceAction.design.icon}`} width="56px" height="56px" fill="white" />
                                        <Text className="text-white font-bold text-xl mt-2">{serviceAction.design.label}</Text>
                                    </View>
                                </View>

                                {/* <View className="z-9999 absolute top-0 right-0 translate-x-[16px] translate-y-[-16px] rounded-full bg-red-500 text-white p-2 w-[32px] h-[32px] flex items-center justify-center" /> */}

                                <View className="absolute rounded-full bg-white p-2">
                                    <Svg width="48" height="48" viewBox="0 0 24 24"><Path d="M15.7071 5.29289C15.3166 4.90237 14.6834 4.90237 14.2929 5.29289C13.9024 5.68342 13.9024 6.31658 14.2929 6.70711L18.5858 11L3 11C2.44772 11 2 11.4477 2 12C2 12.5523 2.44772 13 3 13L18.5858 13L14.2929 17.2929C13.9024 17.6834 13.9024 18.3166 14.2929 18.7071C14.6834 19.0976 15.3166 19.0976 15.7071 18.7071L21.7071 12.7071C22.0976 12.3166 22.0976 11.6834 21.7071 11.2929L15.7071 5.29289Z" fill="black"/></Svg>
                                </View>
                            </View>
                        );
                    })}

                    <View>
                        <Button title="Create new action/reaction" onPress={() => navigation.navigate("CreateAuto")} />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
});
