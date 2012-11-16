var Assert = require('assert');
var Promises = require('./promises');

var d = Promises.defer();

var p = d.promise;

var test = 1;

p.then(function(val) {
  test = 2;
  return 5;
}).then(function(val) {
  Assert.equal(val, 5);
  Assert.equal(test, 2);
})

d.resolve(null);
