import Store                    from "../store.js";
import { API }                  from "../api.js";
import { createConfirmModal }   from "../utils.js";

export default {

    render() {
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
            <section class="flex flex-auto">
                <div class="flex flex-col items-center m-auto max-w-full gap-5">
                    <div class="text-4xl text-center mb-4">
                        List of Action/Reaction
                    </div>

                    {Store.user.triggers.map(({ id, trigger, actions: [action] }) => {
                        let serviceTrigger  = getService(trigger.name);
                        let serviceAction   = getService(action.name);

                        let deleteActionReaction = () => {
                            createConfirmModal(async () => {
                                await API.fetch("DELETE", `/actions/${id}`);
                                await API.fetchMe().then(res => (Store.user = res));
                            });
                        };

                        return (
                            <div class="relative">
                                <button class="absolute top-0 right-0 translate-x-[50%] translate-y-[-50%] rounded-full bg-red-500 text-white p-2 w-[32px] h-[32px] flex items-center justify-center" onclick={deleteActionReaction}>
                                    <i class="fa-solid fa-times" />
                                </button>

                                <svg class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-full bg-white p-2 w-[48px] h-[48px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.7071 5.29289C15.3166 4.90237 14.6834 4.90237 14.2929 5.29289C13.9024 5.68342 13.9024 6.31658 14.2929 6.70711L18.5858 11L3 11C2.44772 11 2 11.4477 2 12C2 12.5523 2.44772 13 3 13L18.5858 13L14.2929 17.2929C13.9024 17.6834 13.9024 18.3166 14.2929 18.7071C14.6834 19.0976 15.3166 19.0976 15.7071 18.7071L21.7071 12.7071C22.0976 12.3166 22.0976 11.6834 21.7071 11.2929L15.7071 5.29289Z" fill="currentColor"/></svg>

                                <div class="overflow-hidden bg-black rounded flex h-[150px]">
                                    <div class={`overflow-hidden flex flex-col p-6 cursor-pointer text-center flex-[0_0_200px] w-[200px] bg-[${serviceTrigger.design.color}]`}>
                                        <img class="flex-[0_0_auto] object-contain m-auto w-[56px] h-[56px]" src={serviceTrigger.design.icon} alt={serviceTrigger.design.label} />
                                        <p class="text-white font-bold text-xl mt-2">{serviceTrigger.design.label}</p>
                                    </div>

                                    <div class={`overflow-hidden flex flex-col p-6 cursor-pointer text-center flex-[0_0_200px] w-[200px] bg-[${serviceAction.design.color}]`}>
                                        <img class="flex-[0_0_auto] object-contain m-auto w-[56px] h-[56px]" src={serviceAction.design.icon} alt={serviceAction.design.label} />
                                        <p class="text-white font-bold text-xl mt-2">{serviceAction.design.label}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    },
};
