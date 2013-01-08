"use strict"

function defer() {
  var handlers = []
  var resolutionValue
  var complete = false
  var success = false

  function executeHandlerFn(fn, next) {
    if(fn instanceof Function) try {
      next.fulfill(fn(resolutionValue))
    } catch(e) {
      next.reject(e)
    } else {
      (success ? next.fulfill : next.reject)(resolutionValue)
    }
  }

  function runHandlers() {
    handlers.forEach(function(handler) {
      if(handler.deferred) {
        var fn = success ? handler.callback : handler.errback
        executeHandlerFn(fn, handler.deferred)
      } else if(!success) throw resolutionValue
    })
  }

  function then(callback, errback) {
    var next = defer()
    if(complete) {
      process.nextTick(function() {
        var fn = success ? callback : errback
        executeHandlerFn(fn, next)
      })
    } else handlers.push({
      callback: callback,
      errback: errback,
      deferred: next
    })
    return next.promise
  }

  function get(property) {
    return this.then(function(val) {
      return val[property]
    })
  }

  function end() {
    if(complete && !success) throw resolutionValue
    else handlers.push({})
  }

  function fulfill(val) {
    if(complete) return
    if(val && val.then instanceof Function) { // If value is a promise itself, wait to it's resolution
      val.then(fulfill, reject)
    } else { // If value is not a promise, resolve the promise immediately
      resolutionValue = val
      complete = success = true
      process.nextTick(runHandlers)
    }
  }

  function reject(err) {
    if(complete) return
    resolutionValue = err
    complete = true
    process.nextTick(runHandlers)
  }

  return {
    promise: {
      then: then,
      get: get,
      end: end
    },
    fulfill: fulfill,
    reject: reject
  }
}

function fulfilled(val) {
  var d = defer()
  d.fulfill(val)
  return d.promise
}

function rejected(err) {
  var d = defer()
  d.reject(err)
  return d.promise
}

exports.pending = exports.defer = defer
exports.fulfilled = fulfilled
exports.rejected = rejected