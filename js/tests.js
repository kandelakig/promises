var Assert = require('assert')
var Promises = require('./promises')

var testSuite = []

testSuite.push(function() {
  console.log('Test#1 : Get promise, add the callback and resolve it')

  var d = Promises.defer()

  console.log('  Initializing testVal = 1')
  var testVal = 1

  console.log('  Getting promise and registering callback')
  d.promise.then(function(val) {
    console.log('  [Inside the callback] Checking resolution value')
    Assert.equal(val, 2, 'val: expected 2 got ' + val)

    console.log('  [Inside the callback] Assigning testVal = 3')
    testVal = 3

    console.log('  [Inside the callback] Returning 5')
    return 5
  }).then(function(val) {
    console.log('  [Inside the "chained" callback] Checking resolution value, must be the value that was returned from previous callback')
    Assert.equal(val, 5, 'val: expected 5 got ' + val)

    console.log('  [Inside the "chained" callback] Checking testVal, must be already changed')
    Assert.equal(testVal, 3, 'testVal: expected 3, got ' + testVal)
  }).end()

  console.log('  Resolving promise with value = 2')
  d.resolve(2)

  console.log('  Checking testVal must not be changed yet, cause the resolution callback have to be put on the event queue NOT executed immediately')
  Assert.equal(testVal, 1)
})

testSuite.push(function() {
  console.log('Test#2 : Add the callback to the already resolved promise')

  var d = Promises.defer()

  console.log('  Resolving promise with value = 2')
  d.resolve('Hello')

  console.log('  Getting promise and registering callback')
  d.promise.then(function(val) {
    Assert.equal(val, 'Hello', 'val: expected \'Hello\' got \'' + val + '\'')
  }).end()
})

testSuite.push(function() {
  console.log('Test#3 : Reject, catch and handle')

  var d = Promises.defer()

  d.promise.then(null, function(err) {
    Assert.equal(err, 'BOOM!', 'err: expected \'BOOM!\' got \'' + err + '\'')
  }).end()

  d.reject('BOOM!')
})

testSuite.push(function() {
  console.log('Test#4 : Reject and pass in chain, then catch')

  var d = Promises.defer()

  d.promise.then(console.log).then().then(null, function(err) {
    Assert.equal(err, 'BOOM!', 'err: expected \'BOOM!\' got \'' + err + '\'')
  }).end()

  d.reject('BOOM!')
})

testSuite.push(function() {
  console.log('Test#5 : Reject and do not catch')

  var d = Promises.defer()

  d.reject('BOOM!')

  try {
    d.promise.then().then().end()
    Assert.fail()
  } catch (e) {
    Assert.equal(e, 'BOOM!')
  }
  
})

testSuite.forEach(function(test, ind) {
  try {
    test.call()
  } catch(e) {
    console.error('Test#' + ind + ' failed', e)
  }
})