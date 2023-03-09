import babel    from "@rollup/plugin-babel";
import terser   from "@rollup/plugin-terser";


////////////////////////////////////////////////
//  ROLLUP
////////////////////////////////////////////////


export default {
    input: "src/client/index.js",
    output: {
        format  : "iife",
        file    : "public/assets/js/script.js",
        globals: {
            "vue"           : "Vue",
            "vue-router"    : "VueRouter",
        },
    },
    plugins: [
        babel({
            babelrc         : false,
            babelHelpers    : "bundled",
            plugins: [
                "@vue/babel-plugin-jsx",
            ],
        }),
        terser(),
    ],
    external: [
        "vue",
        "vue-router",
    ],
}
