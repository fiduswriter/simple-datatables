import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from "@rollup/plugin-typescript"

export default [
    {
        input: 'src/index.ts',
        plugins: [
            resolve({browser: true}),
            typescript({
                compilerOptions: {
                    declaration: false,
                    declarationDir: undefined
                }
            }),
            commonjs()
        ],
        output: {
            file: "docs/demos/dist/module.js",
            inlineDynamicImports: true,
            format: "es",
            sourcemap: true
        }
    }
]
