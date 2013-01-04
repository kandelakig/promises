var Assert = require('assert')
var Promises = require('./promises')

var testSuite = []

testSuite.push(function(testCallback) {
  var name = 'Get promise, add the callback and fulfill it'

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
  }).then(function(val) {
    testCallback(name)
  }, function(err) {
    testCallback(name, err)
  }).end()

  console.log('  Resolving promise with value = 2')
  d.fulfill(2)

  console.log('  Checking testVal must not be changed yet, cause the resolution callback have to be put on the event queue NOT executed immediately')
  Assert.equal(testVal, 1)
})

testSuite.push(function(testCallback) {
  var name = 'Add the callback to the already resolved promise'

  var d = Promises.defer()

  console.log('  Resolving promise with value = \'Hello\'')
  d.fulfill('Hello')

  console.log('  Getting promise and registering callback')
  d.promise.then(function(val) {
    try {
      Assert.equal(val, 'Hello', 'val: expected \'Hello\' got \'' + val + '\'')
      testCallback(name)
    } catch(err) {
      testCallback(name, err)
    }
  }).end()
})

testSuite.push(function(testCallback) {
  var name = 'Resolve promise twice'

  var d = Promises.defer()

  d.promise.then(function(val) {
    Assert.equal(val, 1, 'val: expected 1 got ' + val)
    testCallback(name)
  })

  d.fulfill(1)
  d.fulfill(2)
})

testSuite.push(function(testCallback) {
  var name = 'Return nothing from `then` callback'

  var d = Promises.defer()

  d.promise.then(function(val) {
    console.log('  [Inside the callback] Doing nothing and not returning anything')
  }).then(function(val) {
    console.log('  [Inside the "chained" callback] `val` must be `undefined`')
    Assert.strictEqual(val, undefined, 'Next callback in chain must get `undefined` callback')
  }).then(function(val) {
    testCallback(name)
  }, function(err) {
    testCallback(name, err)
  })

  d.fulfill(0)
})

testSuite.push(function(testCallback) {
  var name = 'Return nothing from `then` callback; V2 with already resolved promise'

  console.log('  Getting promise and resolving it at once')
  var d = Promises.defer()
  d.fulfill(0)

  d.promise.then(function(val) {
    console.log('  [Inside the callback] Doing nothing and not returning anything')
  }).then(function(val) {
    console.log('  [Inside the "chained" callback] `val` must be `undefined`')
    Assert.strictEqual(val, undefined, 'Next callback in chain must get `undefined` callback')
  }).then(function(val) {
    testCallback(name)
  }, function(err) {
    testCallback(name, err)
  })
})

testSuite.push(function(testCallback) {
  var name = 'Reject, catch and handle'

  var d = Promises.defer()

  d.promise.then(null, function(err) {
    Assert.equal(err, 'BOOM!', 'err: expected \'BOOM!\' got \'' + err + '\'')
  }).then(function(val) {
    testCallback(name)
  }, function(err) {
    testCallback(name, err)
  }).end()

  d.reject('BOOM!')
})

testSuite.push(function(testCallback) {
  var name = 'Reject and pass in chain, then catch'

  var d = Promises.defer()

  d.promise.then(console.log).then().then(null, function(err) {
    Assert.equal(err, 'BOOM!', 'err: expected \'BOOM!\' got \'' + err + '\'')
  }).then(function(val) {
    testCallback(name)
  }, function(err) {
    testCallback(name, err)
  }).end()

  d.reject('BOOM!')
})

testSuite.push(function(testCallback) {
  var name = 'Reject and do not catch'

  var d = Promises.defer()

  d.reject('BOOM!')

  try {
    d.promise.then().then().end()
    Assert.fail()
  } catch(e) {
    Assert.equal(e, 'BOOM!')
    testCallback(name)
  }
})

testSuite.push(function(testCallback) {
  var name = 'Get property of resolution value'

  var d = Promises.defer()

  var p = d.promise.get('foo').then(function(val) {
    console.log('  foo must be \'bar\'')
    Assert.equal(val, 'bar')
  })

  d.fulfill({
    foo: 'bar',
    baz: 7
  })

  d.promise.get('baz').then(function(val) {
    console.log('  baz must be 7')
    Assert.equal(val, 7)
  }).then(function(val) {
    p.then(function(val2) {
      testCallback(name)
    }, function(err) {
      testCallback(name, err)
    }).end()
  }, function(err) {
    p.then(null, function(e) {}).then(function(val) {
      testCallback(name, err)
    })
  }).end()
})

var totalTests = testSuite.length
var testCount = 0
var success = 0
var failed = 0

console.info('-----------------------------')
console.info('Tests to run totally: ' + totalTests)
console.info('-----------------------------')

function run() {
    var test = testSuite.shift()
    if(test) {
      try {
        console.info('')
        console.info('Running test #' + (testCount + 1) + '...')
        test(function(testName, err) {
          testCount++;
          if(err) {
            failed++;
            console.info('Test #' + testCount + ' (' + testName + '): FAILED, cause:')
            console.info(err)
          } else {
            success++;
            console.info('Test #' + testCount + ' (' + testName + '): SUCCESS')
          }
          run()
        })
      } catch(err) {
        testCount++;
        failed++;
        console.info('Test #' + testCount + ' : FAILED')
        console.info('  cause:', err)
        run()
      }
    } else {
      console.info('')
      console.info('-----------------------------')
      console.info('Successful tests: ' + success)
      console.info('Failed tests: ' + failed)
      console.info('')
      if(failed > 0) {
        console.info('TESTS FAILED!')
      } else {
        console.info('TESTS PASSED SUCCESSFULLY')
      }
      console.info('-----------------------------')
    }
  }

run()