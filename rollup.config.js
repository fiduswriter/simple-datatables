import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import {terser} from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            nodePolyfills(),
            babel({babelHelpers: 'bundled'}),
            terser()
        ],
        output: // ES module version, for modern browsers with days split into separate file
        {
            dir: "dist/module",
            format: "es",
            sourcemap: true
        }
    },
    {
        input: 'src/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            nodePolyfills(),
            babel({babelHelpers: 'bundled'}),
            terser()
        ],
        output: // SystemJS version, for older browsers
        {
            dir: "dist/nomodule",
            format: "system",
            sourcemap: true
        },
    },
    {
        input: 'src/index.js',
        plugins: [
            resolve({browser: true}),
            commonjs(),
            nodePolyfills(),
            babel({babelHelpers: 'bundled'}),
            terser()
        ],
        output: // CJS version
        {
            dir: "dist",
            format: "cjs",
            sourcemap: true
        }
    }
]
