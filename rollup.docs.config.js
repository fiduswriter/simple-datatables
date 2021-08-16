import commonjs from 'rollup-plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import {terser} from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            nodePolyfills(),
            babel(),
            terser()
        ],
        output: {
            file: "docs/dist/module.js",
            inlineDynamicImports: true,
            format: "es",
            sourcemap: false
        }
    }
]
