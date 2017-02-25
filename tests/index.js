QUnit.module('General');

QUnit.test( "init", function( assert ) {
    assert.ok( Object.prototype.toString.call({ foo: 'bar' }) === '[object Object]', "Passed!" );
});	
