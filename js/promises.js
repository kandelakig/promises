exports.defer = function defer() {
  "use strict"

  var handlers = []
  var value, error

  var promise = {
    then: function(callback, errback) {
      var d = defer()

      function execute(fn, val) {
        var next = error ? d.reject : d.resolve
        if(fn) {
          try {
            d.resolve(fn(val))
          } catch(e) {
            d.reject(e)
          }
        } else {
          next(val)
        }
      }

      if(value) execute(callback, value)
      else if(error) execute(errback, error)
      else handlers.push({
        callback: callback,
        errback: errback,
        defered: d
      })

      return d.promise
    },

    end: function() {
      if(error) throw error
      else handlers.push({})
    }
  }

  function runHandler(handler, val, fulfilled) {
    if(handler.defered) {
      var callback = fulfilled ? handler.callback : handler.errback
      var next = fulfilled ? handler.defered.resolve : handler.defered.reject

      try {
        if(callback) handler.defered.resolve(callback(val))
        else next(val)
      } catch(e) {
        handler.defered.reject(e)
      }
    }
  }

  var defered = {
    _handlers: handlers,
    _value: value,
    _error: error,
    promise: promise,

    resolve: function(val) {
      value = val
      handlers.forEach(function(handler) {
        process.nextTick(function() {
          runHandler(handler, val, true)
        })
      })
    },

    reject: function(err) {
      error = err
      handlers.forEach(function(handler) {
        if(!handler.defered) throw err
        process.nextTick(function() {
          runHandler(handler, err, false)
        })
      })
    }
  }

  return defered
}