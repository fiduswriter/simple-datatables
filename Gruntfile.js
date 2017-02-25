module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.initConfig({
		jshint: {
			all: ['*.js', 'src/*.js', 'test/*.js']
		},
		qunit: {
			all: ['test/index.html']
		}
	});

	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['test']);
};
