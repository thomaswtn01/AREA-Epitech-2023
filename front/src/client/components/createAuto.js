import Store from "../store.js";
import { API } from "../api.js";

export default {

    data() {
        return {
            mode: 0,
            action: {
                service: Store.about.server.services[1],
                action: Store.about.server.services[1].actions[0],
                params: [],
            },
            reaction: {
                service: Store.about.server.services[1],
                reaction: Store.about.server.services[1].reactions[0],
                params: [],
            },
        };
    },

    render() {
        let onFinal = async () => {
            let res = await API.fetch("POST", "/actions", {
                json: {
                    trigger: {
                        name    : this.action.action.name,
                        params  : this.action.params,
                    },
                    action: {
                        name    : this.reaction.reaction.name,
                        params  : this.reaction.params,
                    },
                },
            });

            console.log(res);
            window.location = "/";
        };

        let renderServices = (title, services, next) => {
            return (
                <section class="flex flex-auto">
                    <div class="m-auto max-w-full">
                        <div class="text-4xl text-center mb-8">
                            {title}
                        </div>

                        <div class="flex overflow-x-auto">
                            <div class="flex gap-5 p-4 mx-auto">
                                {services.map((service) => (
                                    <div class={`transition-[border-color] duration-200 border-8 border-transparent hover:border-[#dbdbdb] overflow-hidden flex flex-col rounded p-6 cursor-pointer text-center flex-[0_0_200px] w-[200px] h-[200px] bg-[${service.design.color}]`} onclick={() => next(service)} key={service.name}>
                                        <img class="flex-[0_0_auto] object-contain m-auto w-[84px] h-[84px]" src={service.design.icon} alt={service.design.label} />
                                        <p class="text-white font-bold text-xl mt-2">{service.design.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            );
        };

        let renderWidgets = (title, service, widgets, next) => {
            return (
                <section class="flex flex-auto">
                    <div class="m-auto max-w-full">
                        <div class="text-4xl text-center mb-8">
                            {title}
                        </div>

                        <div class="flex overflow-x-auto">
                            <div class="flex gap-5 p-4 mx-auto">
                                {widgets.map((widget) => (
                                    <div class={`bg-[${service.design.color}] text-white overflow-hidden flex flex-col items-center justify-center rounded p-6 cursor-pointer text-center flex-[0_0_200px] w-[200px] h-[200px]`} onclick={() => next(widget)}>
                                        {widget.description}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            );
        };

        let renderParams = (title, params, onSubmit) => {
            return (
                <section class="flex flex-auto">
                    <div class="m-auto max-w-full">
                        <div class="text-4xl text-center mb-8">
                            {title}
                        </div>

                        <form class="flex flex-col items-center overflow-x-auto gap-5 p-4" onSubmit={onSubmit}>
                            {params.map((param) => {
                                switch (param.type) {
                                    case "string":
                                        return <input name={param.name} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder={param.name} />;

                                    case "long_string":
                                        return <textarea name={param.name} rows="4" class="block shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder={param.name} />;
                                }
                            })}

                            <button class="w-full bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
                                Submit
                            </button>
                        </form>
                    </div>
                </section>
            );
        };

        switch (this.mode) {
            case 0:
                return renderServices(
                    "Choose an action service",
                    Store.about.server.services.filter((service) => service.actions.length),
                    (service) => {
                        this.action.service = service;
                        this.mode++;
                    }
                );

            case 1:
                return renderWidgets("Choose an action", this.action.service, this.action.service.actions, (action) => {
                    this.action.action = action;
                    this.mode += action.params.in.length
                        ? 1
                        : 2;
                });

            case 2:
                return renderParams("Configure action parameters", this.action.action.params.in, (e) => {
                    e.preventDefault();

                    this.action.params = [...new FormData(e.target).entries()].map((entry) => ({
                        name    : entry[0],
                        value   : entry[1],
                    }));

                    this.mode++;
                });

            case 3:
                return renderServices(
                    "Choose a reaction service",
                    Store.about.server.services.filter((service) => service.reactions.length),
                    (service) => {
                        this.reaction.service = service;
                        this.mode++;
                    }
                );

            case 4:
                return renderWidgets("Choose a reaction", this.reaction.service, this.reaction.service.reactions, (reaction) => {
                    this.reaction.reaction = reaction;

                    if (reaction.params.length) {
                        this.mode++;

                    } else {
                        onFinal();
                    }
                });

            case 5:
                return renderParams("Configure reaction parameters", this.reaction.reaction.params, (e) => {
                    e.preventDefault();

                    this.reaction.params = [...new FormData(e.target).entries()].map((entry) => ({
                        name    : entry[0],
                        value   : entry[1],
                    }));

                    onFinal();
                });
        }
    },
};
