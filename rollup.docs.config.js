import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default [
    {
        input: 'src/index.js',
        plugins: [
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
