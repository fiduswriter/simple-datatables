import commonjs from 'rollup-plugin-commonjs'
import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
import resolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify-es'

export default {
    plugins: [
        commonjs(),
        globals(),
        builtins(),
        resolve(),
        buble(),
        uglify()
    ],
    output: {
        format: 'cjs'
    }
}
