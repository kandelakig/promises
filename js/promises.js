var defer = function() {
  "use strict"

  var handlers = []
  var value, error

  var complete = false
  var success = false

  var promise = {
    then: function(callback, errback) {
      var d = defer()

      function execute(fn, val) {
        var next = success ? d.fulfill : d.reject
        if(fn) {
          try {
            d.fulfill(fn(val))
          } catch(e) {
            d.reject(e)
          }
        } else {
          next(val)
        }
      }

      if(complete && success) execute(callback, value)
      else if(complete) execute(errback, error)
      else handlers.push({
        callback: callback,
        errback: errback,
        defered: d
      })

      return d.promise
    },

    get: function(property) {
      return this.then(function(val){
        return val[property]
      })
    },

    end: function() {
      if(complete && !success) throw error
      else handlers.push({})
    }
  }

  function runHandler(handler, val, fulfilled) {
    if(handler.defered) {
      var callback = fulfilled ? handler.callback : handler.errback
      var next = fulfilled ? handler.defered.fulfill : handler.defered.reject

      try {
        if(callback) handler.defered.fulfill(callback(val))
        else next(val)
      } catch(e) {
        handler.defered.reject(e)
      }
    }
  }

  var defered = {
    promise: promise,

    fulfill: function(val) {
      if (complete) throw 'Promise can be resolved only once'
      value = val
      complete = success = true
      handlers.forEach(function(handler) {
        process.nextTick(function() {
          runHandler(handler, value, true)
        })
      })
    },

    reject: function(err) {
      if (complete) throw 'Promise can be resolved only once'
      error = err
      complete = true
      handlers.forEach(function(handler) {
        if(!handler.defered) throw error
        process.nextTick(function() {
          runHandler(handler, error, false)
        })
      })
    }
  }

  return defered
}

exports.pending = exports.defer = defer

exports.fulfilled = function(val) {
  var d = defer()
  d.fulfill(val)
  return d.promise
}

exports.rejected = function(err) {
  var d = defer()
  d.reject(err)
  return d.promise
}