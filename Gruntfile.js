module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			all: ['src/vanilla-dataTables.js']
		},
		qunit: {
			all: ['tests/index.html']
		},
        uglify: {
            my_target: {
                files: {
                    'dist/vanilla-dataTables.min.js': ['src/vanilla-dataTables.js']
                }
            }
        }
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['test']);
};
