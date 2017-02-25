QUnit.module("qunit-assert-close plugin unit tests");

QUnit.test("Close Numbers", function(assert) {
  var halfPi = Math.PI / 2,
      sqrt2 = Math.sqrt(2);

  assert.close(7, 7, 0);
  assert.close(7, 7.1, 0.1);
  assert.close(7, 7.1, 0.2);

  assert.close(3.141, Math.PI, 0.001);
  assert.close(3.1, Math.PI, 0.1);

  assert.close(halfPi, 1.57, 0.001);

  assert.close(sqrt2, 1.4142, 0.0001);

  assert.close(Infinity, Infinity, 1);
});

QUnit.test("Distant Numbers", function(assert) {
  var halfPi = Math.PI / 2,
      sqrt2 = Math.sqrt(2);

  assert.notClose(6, 7, 0);
  assert.notClose(7, 7.2, 0.1);
  assert.notClose(7, 7.2, 0.19999999999);

  assert.notClose(3.141, Math.PI, 0.0001);
  assert.notClose(3.1, Math.PI, 0.001);

  assert.notClose(halfPi, 1.57, 0.0001);

  assert.notClose(sqrt2, 1.4142, 0.00001);

  assert.notClose(Infinity, -Infinity, 5);
});

QUnit.test("Close Numbers, percentage based", function(assert) {
  assert.close.percent(7, 7, 0.0);
  assert.close.percent(7, 7.1, 2.0);   // ~1.43%
  assert.close.percent(7, 7.1, 1.5);   // ~1.43%
  assert.close.percent(7, 7.1, 1.43);  // ~1.43%
  assert.close.percent(Infinity, Infinity, 1.0);
  assert.close.percent(Infinity, Infinity, 0.0);
  assert.close.percent(0, 100, Infinity);
  assert.close.percent(100, 0, Infinity);
  assert.close.percent(Infinity, -Infinity, Infinity);
});

QUnit.test("Distant Numbers, percentage based", function(assert) {
  assert.notClose.percent(6, 7, 0.0);
  assert.notClose.percent(7, 7.2, 2.50);  // ~2.777%
  assert.notClose.percent(7, 7.2, 2.70);  // ~2.777%
  assert.notClose.percent(7, 7.2, 2.77);  // ~2.777%
  assert.notClose.percent(0, 100, 100.0);
  assert.notClose.percent(100, 0, 1000000.0);
  assert.notClose.percent(Infinity, -Infinity, 100.0);
});

QUnit.test("close.percent is the same as closePercent", function(assert) {
  assert.strictEqual( assert.close.percent, assert.closePercent );
});

QUnit.test("notClose.percent is the same as notClosePercent", function(assert) {
  assert.strictEqual( assert.notClose.percent, assert.notClosePercent );
});
