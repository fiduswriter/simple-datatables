module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			all: ['src/vanilla-dataTables.js']
		},
		qunit: {
			all: ['tests/index.html']
		},
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');


	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['test']);
};
