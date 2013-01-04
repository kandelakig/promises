"use strict"

var defer = function() {
    var handlers = []
    var value, error

    var complete = false
    var success = false

    var promise = {
      then: function(callback, errback) {
        var d = defer()

        function execute(fn, val) {
            var next = success ? d.fulfill : d.reject
            process.nextTick(function() {
              if(fn instanceof Function) {
                try {
                  d.fulfill(fn(val))
                } catch(e) {
                  d.reject(e)
                }
              } else {
                next(val)
              }
            })
          }

        if(complete) {
          if(success) execute(callback, value)
          else execute(errback, error)
        } else handlers.push({
          callback: callback,
          errback: errback,
          defered: d
        })

        return d.promise
      },

      get: function(property) {
        return this.then(function(val) {
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
          if(callback instanceof Function) handler.defered.fulfill(callback(val))
          else next(val)
        } catch(e) {
          handler.defered.reject(e)
        }
      }
    }

    var defered = {
      promise: promise,

      fulfill: function(val) {
        if(complete) return
        value = val
        complete = success = true
        if(value && value.then instanceof Function) {
          // If resolution value is a promise itself
          // run handers only when it resolves
          value.then(function(newValue) {
            handlers.forEach(function(handler) {
              process.nextTick(function() {
                runHandler(handler, newValue, true)
              })
            })
          }, function(newError) {
            handlers.forEach(function(handler) {
              if(!handler.defered) throw newError
              process.nextTick(function() {
                runHandler(handler, newError, false)
              })
            })
          })
        } else {
          // If resolution value is not a promise
          // just run handlers with that value
          handlers.forEach(function(handler) {
            process.nextTick(function() {
              runHandler(handler, value, true)
            })
          })
        }
      },

      reject: function(err) {
        if(complete) return
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