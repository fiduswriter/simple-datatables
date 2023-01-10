import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

export default [
    {
        input: 'src/index.ts',
        plugins: [
            resolve({browser: true}),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        allowSyntheticDefaultImports: true,
                    }
                }
            }),
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
