import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import { DEFAULT_EXTENSIONS } from '@babel/core';
import terser from '@rollup/plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import dts from 'rollup-plugin-dts'

export default [
    {
        input: 'src/index.ts',
        plugins: [
            typescript({
                useTsconfigDeclarationDir: true,
                tsconfigDefaults: {
                    compilerOptions: {
                        allowSyntheticDefaultImports: true,
                        declaration: true,
                        //emitDeclarationOnly: true,
                        declarationDir: "dist/dts"
                    }
                }
            }),
            resolve({browser: true}),
            commonjs(),
            nodePolyfills(),
            babel({
                babelHelpers: 'bundled',
                extensions: [
			        ...DEFAULT_EXTENSIONS,
			        '.ts',
			        '.tsx'
		        ],
            }),
            terser()
        ],
        output: // ES module version, for modern browsers
        {
            dir: "dist/module",
            format: "es",
            sourcemap: true
        }
    },
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
            commonjs(),
            nodePolyfills(),
            babel({
                babelHelpers: 'bundled',
                extensions: [
                    ...DEFAULT_EXTENSIONS,
                    '.ts',
                    '.tsx'
                ],
            }),
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
            commonjs(),
            nodePolyfills(),
            babel({
                babelHelpers: 'bundled',
                extensions: [
                    ...DEFAULT_EXTENSIONS,
                    '.ts',
                    '.tsx'
                ],
            }),
            terser()
        ],
        output: // CJS version
        {
            dir: "dist",
            format: "cjs",
            sourcemap: true
        }
    },
    {
        // path to your declaration files root
        input: './dist/dts/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts()],
    },
]
