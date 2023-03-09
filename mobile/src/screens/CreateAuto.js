import React, { useState }  from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    ScrollView,
    TouchableHighlight
} from "react-native";
import { SvgUri }           from "react-native-svg";
import { observer }         from "mobx-react-lite";
import { runInAction }      from "mobx";
import Store                from "../Store.js";
import { API }              from "../API.js";


export default observer(({ navigation }) => {
    let [ state, setState ] = useState(() => ({
        mode: 0,
        action: {
            service     : Store.about.server.services[1],
            action      : Store.about.server.services[1].actions[0],
            params      : [],
        },
        reaction: {
            service     : Store.about.server.services[1],
            reaction    : Store.about.server.services[1].reactions[0],
            params      : [],
        },
    }));

    let onFinal = async () => {
        await API.fetch("POST", "/actions", {
            json: {
                trigger: {
                    name: state.action.action.name,
                    params: state.action.params,
                },
                action: {
                    name: state.reaction.reaction.name,
                    params: state.reaction.params,
                },
            },
        });

        let me = await API.fetchMe();

        runInAction(() => {
            Store.user = me;
        });

        navigation.navigate("Home");
    };

    let renderServices = (title, services, next) => {
        return (
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
                <View className="items-center justify-center gap-4 py-16">
                    <Text className="text-2xl text-center mb-2">{title}</Text>

                    {services.map((service, i) => (
                        <TouchableHighlight className="rounded items-center justify-center p-5 flex w-[200px] h-[200px]" style={{ backgroundColor: service.design.color }} onPress={() => next(service)} key={i}>
                            <View>
                                <SvgUri uri={`${Store.API_URL}/${service.design.icon}`} width="84" height="84" fill="white" />
                                <Text className="text-white text-center font-bold text-xl mt-2">{service.design.label}</Text>
                            </View>
                        </TouchableHighlight>
                    ))}
                </View>
            </ScrollView>
        );
    };

    let renderWidgets = (title, service, widgets, next) => {
        return (
            <View className="flex-1 items-center justify-center gap-4">
                <Text className="text-2xl text-center mb-2">{title}</Text>

                {widgets.map((widget, i) => (
                    <TouchableHighlight className="rounded items-center justify-center p-5 flex w-[200px] h-[200px]" style={{ backgroundColor: service.design.color }} onPress={() => next(widget)} key={i}>
                        <Text className="text-white text-center">{widget.description}</Text>
                    </TouchableHighlight>
                ))}
            </View>
        );
    };

    let renderParams = (title, params, onSubmit) => {
        let fields = {};

        return (
            <View className="flex-1 items-center justify-center gap-4 p-4">
                <Text className="text-2xl text-center mb-2">{title}</Text>
                    {params.map((param, i) => {
                        switch (param.type) {
                            case "string":
                                return <TextInput className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder={param.name} key={i} onChangeText={(value) => (fields[param.name] = value)} />;

                            case "long_string":
                                return <TextInput numberOfLines={4} className="block shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder={param.name} key={i} onChangeText={(value) => (fields[param.name] = value)} />;
                        }
                    })}

                    <View>
                        <Button title="Submit" onPress={() => onSubmit(fields)} />
                    </View>
            </View>
        );
    };

    switch (state.mode) {
        case 0:
            return renderServices(
                "Choose an action service",
                Store.about.server.services.filter((service) => service.actions.length),
                (service) => {
                    state.action.service = service;
                    state.mode++;
                    setState({ ...state });
                }
            );

        case 1:
            return renderWidgets("Choose an action", state.action.service, state.action.service.actions, (action) => {
                state.action.action = action;
                state.mode += action.params.in.length
                    ? 1
                    : 2;
                setState({ ...state });
            });

        case 2:
            return renderParams("Configure action parameters", state.action.action.params.in, (e) => {
                e.preventDefault();

                state.action.params = [...new FormData(e.target).entries()].map((entry) => ({
                    name: entry[0],
                    value: entry[1],
                }));

                state.mode++;
                setState({ ...state });
            });

        case 3:
            return renderServices(
                "Choose a reaction service",
                Store.about.server.services.filter((service) => service.reactions.length),
                (service) => {
                    state.reaction.service = service;
                    state.mode++;
                    setState({ ...state });
                }
            );

        case 4:
            return renderWidgets("Choose a reaction", state.reaction.service, state.reaction.service.reactions, (reaction) => {
                state.reaction.reaction = reaction;

                if (reaction.params.length) {
                    state.mode++;
                    setState({ ...state });

                } else {
                    onFinal();
                }
            });

        case 5:
            return renderParams("Configure reaction parameters", state.reaction.reaction.params, (fields) => {
                state.reaction.params = [...Object.entries(fields)].map((entry) => ({
                    name: entry[0],
                    value: entry[1],
                }));

                setState({ ...state });
                onFinal();
            });
    }
});
