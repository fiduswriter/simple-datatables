(function() {
	'use strict';
	var t = document.createElement('table');
	var data = {
		"headings": [
			"Name",
			"Company",
			"Ext.",
			"Start Date",
			"Email",
			"Phone No."
		],
		"rows": [
			[
				"Hedwig F. Nguyen",
				"Arcu Vel Foundation",
				"9875",
				"03/27/2017",
				"nunc.ullamcorper@metusvitae.com",
				"070 8206 9605"
			],
			[
				"Genevieve U. Watts",
				"Eget Incorporated",
				"9557",
				"07/18/2017",
				"Nullam.vitae@egestas.edu",
				"0800 025698"
			],
			[
				"Kyra S. Baldwin",
				"Lorem Vitae Limited",
				"3854",
				"04/14/2016",
				"in@elita.org",
				"0800 237 8846"
			],
			[
				"Stephen V. Hill",
				"Eget Mollis Institute",
				"8820",
				"03/03/2016",
				"eu@vel.com",
				"0800 682 4591"
			],
			[
				"Vielka Q. Chapman",
				"Velit Pellentesque Ultricies Institute",
				"2307",
				"06/25/2017",
				"orci.Donec.nibh@mauriserateget.edu",
				"0800 181 5795"
			],
			[
				"Ocean W. Curtis",
				"Eu Ltd",
				"6868",
				"08/24/2017",
				"cursus.et@cursus.edu",
				"(016977) 9585"
			],
			[
				"Kato F. Tucker",
				"Vel Lectus Limited",
				"4713",
				"11/06/2017",
				"Duis@Lorem.edu",
				"070 0981 8503"
			],
			[
				"Robin J. Wise",
				"Curabitur Dictum PC",
				"3285",
				"02/09/2017",
				"blandit@montesnascetur.edu",
				"0800 259158"
			],
			[
				"Uriel H. Guerrero",
				"Mauris Inc.",
				"2294",
				"02/11/2018",
				"vitae@Innecorci.net",
				"0500 948772"
			],
			[
				"Yasir W. Benson",
				"At Incorporated",
				"3897",
				"01/13/2017",
				"ornare.elit.elit@atortor.edu",
				"0391 916 3600"
			],
			[
				"Shafira U. French",
				"Nisi Magna Incorporated",
				"5116",
				"07/23/2016",
				"metus.In.nec@bibendum.ca",
				"(018013) 26699"
			],
			[
				"Casey E. Hood",
				"Lorem Vitae Odio Consulting",
				"7079",
				"05/05/2017",
				"justo.Praesent@sitamet.ca",
				"0800 570796"
			],
			[
				"Caleb X. Finch",
				"Elit Associates",
				"3629",
				"09/19/2016",
				"condimentum@eleifend.com",
				"056 1551 7431"
			],
		 ]
	};
	
	document.body.appendChild(t);
	
	var log = [];
	var testName;
	var dt = new DataTable(t, { data: data });
	
	QUnit.module('General');
	QUnit.test( "init", function( assert ) {
	  assert.ok( Object.prototype.toString.call(dt) === '[object Object]', "Passed!" );
	});	
	
	QUnit.done(function (test_results) {
	  var tests = [];
	  for(var i = 0, len = log.length; i < len; i++) {
	    var details = log[i];
	    tests.push({
	      name: details.name,
	      result: details.result,
	      expected: details.expected,
	      actual: details.actual,
	      source: details.source
	    });
	  }
	  test_results.tests = tests;

	  window.global_test_results = test_results;
	});
	QUnit.testStart(function(testDetails){
	  QUnit.log(function(details){
	    if (!details.result) {
	      details.name = testDetails.name;
	      log.push(details);
	    }
	  });
	});	
})();
