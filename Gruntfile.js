module.exports = function (grunt) {
	var browsers = [
		{
			browserName: 'firefox',
			version: '19',
			platform: 'XP'
		},
		{
			browserName: 'googlechrome',
			platform: 'XP'
		},
		{
			browserName: 'googlechrome',
			platform: 'linux'
		},
		{
			browserName: 'internet explorer',
			platform: 'WIN8',
			version: '10'
		},
		{
			browserName: 'internet explorer',
			platform: 'VISTA',
			version: '9'
		}
	];

	grunt.initConfig({
		jshint: {
			all: ['vanilla-dataTables.js']
		},
		qunit: {
			all: ['tests/index.html']
		},
		pkg: grunt.file.readJSON('package.json'),
		connect: {
			server: {
				options: {
					base: '',
					port: 9999
				}
			}
		},

		'saucelabs-qunit': {
			all: {
				options: {
					username: 'Mobius1',
					key: 'e9f5a604-efc3-4c94-b79c-51da2ed37004',
					urls: [
						'http://127.0.0.1:9999/index.html'
					],
					browsers: browsers,
					build: process.env.TRAVIS_JOB_ID,
					testname: 'qunit tests',
					throttled: 3,
					sauceConfig: {
						'video-upload-on-pass': false
					}
				}
			}
		},
		watch: {}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-saucelabs');

	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['test', 'connect', 'saucelabs-qunit']);
};
