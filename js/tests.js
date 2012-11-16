var Assert = require('assert')
var Promises = require('./promises')

var testSuite = []

testSuite.push(function() {
  console.log('Test#1 Basic: get promise and resolve it')

  var d = Promises.defer()

  console.log('  Initializing testVal = 1')
  var testVal = 1

  console.log('  Getting promise')
  var p = d.promise

  p.then(function(val) {
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
    Assert.equal(testVal, 999, 'testVal: expected 3, got ' + testVal)
  })

  console.log('  Resolving promise with value = 2')
  d.resolve(2)

  console.log('  Checking testVal must not be changed yet, cause the resolution callback have to be put on the event queue NOT executed immediately')
  Assert.equal(testVal, 1)
})

testSuite.forEach(function(test, ind) {
  try {
    test.call()
  } catch(e) {
    console.error('Test#' + ind + ' failed', e)
  }
})
