import { API }  from "../api.js";
import Store    from "../store.js";

export default {

    data() {
        return {
            error: null,
        };
    },

    render() {
        let onSubmit = async (e) => {
            let form = new FormData(e.target);
            let data = Object.fromEntries([...form.entries()]);

            e.preventDefault();

            try {
                // Reset error message.
                this.error = null;

                // Register account.
                await API.register(data.username, data.password);

                // Register account.
                localStorage.token = await API.login(data.username, data.password);

                // Fetch self user.
                Store.user = await API.fetchMe();

                // Redirect to home.
                this.$router.replace("/");

            } catch (err) {

                // Remove token.
                delete localStorage.token;

                // Set error message.
                this.error = err?.error?.error || "Une erreur inconnue est survenue, contacte un administrateur.";
            }
        };

        return (
            <section class="h-screen">
                <div class="px-6 h-full text-gray-800">
                    <div class="flex xl:justify-center justify-center items-center flex-row flex-wrap h-full g-6">
                        <div class="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-6/12 sm:hidden lg:flex lg:flex-row lg:w-6/12 md:w-9/12 mb-12 md:mb-0">
                            <img
                                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
                                class="w-full"
                                alt="Sample image"
                            />
                        </div>

                        <div class="xl:ml-20 xl:w-5/12 lg:w-5/12 md:w-8/12 mb-12 md:mb-0 lg:flex lg:flex-row">
                            <form onsubmit={onSubmit}>
                                <div class="mb-6">
                                    <div class="text-center mb-6">{this.error}</div>

                                    <input
                                        type="text"
                                        class="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                                        name="username"
                                        placeholder="Username"
                                    />
                                </div>

                                <div class="mb-6">
                                    <input
                                        type="password"
                                        class="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                                        name="password"
                                        placeholder="Password"
                                    />
                                </div>

                                <div class="flex flex-col items-center align-center text-center lg:text-left">
                                    <button type="submit" class="items-center px-7 py-3 bg-blue-600 text-white font-medium text-sm leading-snug uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
                                        Register
                                    </button>

                                    <p class="text-sm font-semibold mt-2 pt-1 mb-0">
                                        Don't have an account?

                                        <a href="/login" class="text-red-600 hover:text-red-700 focus:text-red-700 transition duration-200 ease-in-out">
                                            Log in
                                        </a>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        );
    },
};
