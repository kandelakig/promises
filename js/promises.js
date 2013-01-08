"use strict"

var defer = function() {
    var handlers = []
    var resolutionValue

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
          if(success) execute(callback, resolutionValue)
          else execute(errback, resolutionValue)
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
        if(complete && !success) throw resolutionValue
        else handlers.push({})
      }
    }

    function runHandler(handler) {

      if(handler.defered) {
        var callback = success ? handler.callback : handler.errback
        var next = success ? handler.defered.fulfill : handler.defered.reject
        try {
          if(callback instanceof Function) handler.defered.fulfill(callback(resolutionValue))
          else next(resolutionValue)
        } catch(e) {
          handler.defered.reject(e)
        }
      } else if(!success) throw resolutionValue

    }

    function runHandlers() {
      handlers.forEach(function(handler) {
        process.nextTick(function() {
          runHandler(handler, success)
        })
      })
    }

    function fulfill(val) {
      if(complete) return

      if(val && val.then instanceof Function) {
        // If value is a promise itself, wait to it's resolution
        val.then(fulfill, reject)
      } else {
        // If value is not a promise, resolve the promise immediately
        resolutionValue = val
        complete = success = true
        runHandlers()
      }
    }

    function reject(err) {
      if(complete) return

      resolutionValue = err
      complete = true
      runHandlers()
    }

    var defered = {
      promise: promise,

      fulfill: fulfill,

      reject: reject
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