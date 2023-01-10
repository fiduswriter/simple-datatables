import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import tsc from "rollup-plugin-tsc"

export default [
    {
        input: 'src/index.ts',
        plugins: [
            tsc({
                compilerOptions: {
                    allowSyntheticDefaultImports: true
                }
            }),
            resolve({browser: true}),
            commonjs()
        ],
        output: {
            file: "docs/dist/module.js",
            inlineDynamicImports: true,
            format: "es",
            sourcemap: true
        }
    }
]
