export default {
    plugins: [
        require('rollup-plugin-commonjs')(),
        require('rollup-plugin-node-globals')(),
        require('rollup-plugin-node-builtins')(),
        require('rollup-plugin-node-resolve')(),
//    require('rollup-plugin-json')(),
        require('rollup-plugin-buble')(),
        require('rollup-plugin-uglify-es')()
    ],
    output: {
        format: 'iife',
        sourcemap: 'inline'
    }
}
