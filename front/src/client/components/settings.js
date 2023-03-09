import { toRaw }                from "vue";
import Store                    from "../store.js";
import { API }                  from "../api.js";
import { createConfirmModal }   from "../utils.js";

export default {

    render() {
        let logout = () => {
            delete localStorage.token;
            toRaw(Store).user = null;
            this.$router.replace("/");
        };

        let deleteAccount = () => {
            createConfirmModal(() => {
                API.fetch("DELETE", "/user/@me").then(logout);
            });
        };

        return (
            <section class="flex-auto flex">
                <div class="flex-auto max-w-[600px] m-auto">
                    <div class="overflow-hidden p-6">
                        <div class="text-2xl font-medium text-center mb-6">Settings</div>

                        <label class="block text-gray-700 font-medium mb-2">API link</label>

                        <div class="flex gap-2">
                            <input class="bg-gray-200 p-2 rounded-lg w-full" type="text" placeholder={`${location.origin}/api`} />

                            <button class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 flex-[0_0_96px] flex items-center justify-center">
                                <i class="fa-solid fa-floppy-disk mr-2" />
                                Save
                            </button>
                        </div>
                    </div>

                    <hr class="border-gray-200 mx-6" />

                    <div class="overflow-hidden p-6">
                        <div class="text-2xl font-medium text-center mb-6">Connections</div>

                        <ul class="list-none">
                            {Store.about.server.services.map((service, i) => {
                                let application = Store.user.applications.find((application) => (application.service == service.name));

                                let renderButton = () => {
                                    if (application) {
                                        return (
                                            <a href={`/api/oauth/${service.name}`} class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 w-[96px] flex items-center justify-center" onclick={async (e) => {
                                                e.preventDefault();

                                                await API.fetch("DELETE", `/oauth/${service.name}`);
                                                Store.user = await API.fetchMe();
                                            }}>
                                                <i class="fa-solid fa-unlink mr-2" />
                                                Unlink
                                            </a>
                                        );

                                    } else {
                                        return (
                                            <a href={`/api/oauth/${service.name}`} class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 w-[96px] flex items-center justify-center">
                                                <i class="fa-solid fa-link mr-2" />
                                                Link
                                            </a>
                                        );
                                    }
                                };

                                let renderLinked = () => {
                                    if (application) {
                                        return (
                                            <div class="block text-gray-700 font-medium ml-4 mr-auto flex flex-col justify-center leading-5">
                                                <div>{service.design.label}</div>
                                                <div class="font-bold">{application.user_name}</div>
                                            </div>
                                        );

                                    } else {
                                        return (
                                            <div class="block text-gray-700 font-medium ml-4 mr-auto">
                                                {service.design.label}
                                            </div>
                                        );
                                    }
                                };

                                return (
                                    <li>
                                        <div class="flex items-center">
                                            <div class={`p-3 rounded bg-[${service.design.color}] flex items-center`}>
                                                <img class="flex-[0_0_auto] object-contain m-auto w-[32px] h-[32px]"  src={service.design.icon} alt={service.design.label} />
                                            </div>

                                            {renderLinked()}
                                            {renderButton()}
                                        </div>

                                        {i + 1 != Store.about.server.services.length && <hr class="my-3 border-gray-200" />}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <hr class="border-gray-200 mx-6" />

                    <div class="overflow-hidden p-6 pb-12">
                        <div class="text-2xl font-medium text-center mb-6">Dangerous zone</div>

                        <button class="justify-center box-border bg-red-500 border-2 border-red-500 text-white py-2 px-4 rounded-md flex items-center mb-2 w-full" onclick={deleteAccount}>
                            <i class="fa-solid fa-triangle-exclamation mr-2" />
                            <span>Delete my account</span>
                        </button>

                        <button class="justify-center  box-border border-2 border-red-500 text-red-500 py-2 px-4 rounded-md flex items-center w-full" onclick={logout}>
                            <i class="fa-solid fa-right-from-bracket mr-2" />
                            <span>Logout, or switch account</span>
                        </button>
                    </div>
                </div>
            </section>
        );
    }
};
