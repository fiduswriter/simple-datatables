import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from "@rollup/plugin-typescript"

export default [
    {
        input: 'src/index.ts',
        plugins: [
            resolve({browser: true}),
            typescript(),
            commonjs(),
            terser()
        ],
        output: // ES module version, for modern browsers
        [
            {
                file: "dist/index.js",
                format: "cjs",
                sourcemap: true,
            },
            {
                file: "dist/module.js",
                format: "es",
                sourcemap: true,
            },
            {
                file: "dist/nomodule.js",
                format: "system",
                sourcemap: true,
            },
        ],
    },
    {
        // path to your declaration files root
        input: './dist/dts/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts()],
    },
]
