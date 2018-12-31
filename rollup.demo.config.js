import commonjs from 'rollup-plugin-commonjs'
import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
import resolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'
import {terser} from 'rollup-plugin-terser'

export default [
    {
        input: 'demo/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            builtins(),
            globals(),
            buble(),
            terser()
        ],
        // ES module version, for modern browsers
        output: {
            dir: "demo/dist/module",
            format: "es",
            sourcemap: true
        }
    },
    {
        input: 'demo/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            builtins(),
            globals(),
            buble(),
            terser()
        ],
        // SystemJS version, for older browsers
        output: {
            dir: "demo/dist/nomodule",
            format: "system",
            sourcemap: true
        }
    }
]
