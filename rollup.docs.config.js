import commonjs from 'rollup-plugin-commonjs'
import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import {terser} from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            builtins(),
            globals(),
            babel({plugins: ['@babel/plugin-syntax-dynamic-import']}),
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
