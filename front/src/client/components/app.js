import Store from "../store.js";

export default {

    render() {
        if (Store.loading)
            return (
                <div class="h-screen grid place-items-center">
                    <div class="fulfilling-square-spinner">
                        <div class="spinner-inner" />
                    </div>
                </div>
            );

        if (Store.user && this.$route.matched[0].path != "/oauth/:service")
            return (
                <div class="overflow-auto bg-white flex flex-col h-screen justify-between">
                    <header class="flex p-6 ">
                        <router-link  to="/" class="text-2xl my-auto mr-auto font-medium font-poppins">
                            Welcome, {Store.user.username}
                        </router-link>

                        <router-link to="/settings" class="box-border bg-white border-2 border-blue-500 text-blue-500 py-2 px-4 rounded-md flex items-center">
                            <i class="fa-solid fa-sliders sm:mr-2" />
                            <div class="max-sm:hidden">Settings</div>
                        </router-link>

                        <router-link to="/create" class="bg-blue-500 text-white ml-2 py-2 px-4 rounded-md flex items-center">
                            <div class="sm:mr-2 max-sm:hidden">Create an Automation</div>
                            <i class="fas fa-angle-right" />
                        </router-link>
                    </header>

                    <router-view />
                </div>
            );

        else
            return <router-view />;
    },
};
