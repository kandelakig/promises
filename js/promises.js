exports.defer = function defer() {
  "use strict";

  var handlers = [];
  var value, error;

  var promise = {
    then: function(callback, errback) {
      var d = defer()

      if(value) {
        if(callback) {
          try {
            d.resolve(callback(value));
          } catch(e) {
            d.reject(e);
          }
        } else {
          d.resolve(value);
        }
      } else if(error) {
        if(errback) {
          try {
            d.resolve(errback(error));
          } catch(e) {
            d.reject(e);
          }
        } else {
          d.reject(e);
        }
      } else {
        handlers.push({
          callback: callback,
          errback: errback,
          defered: d
        })
      }

      return d.promise;
    }
  }

  function runHandler(handler, val, fulfilled) {
    var callback = fulfilled ? handler.callback : handler.errback;
    var next = fulfilled ? handler.defered.resolve : handler.defered.reject;

    try {
      if(callback) {
        handler.defered.resolve(callback(val));
      } else {
        next(val);
      }
    } catch(e) {
      handler.defered.reject(e);
    }
  }

  var defered = {
    _handlers: handlers,
    _value: value,
    _error: error,
    promise: promise,

    resolve: function(val) {
      value = val;
      handlers.forEach(function(h) {
        process.nextTick(function() {
          runHandler(h, val, true);
        })
      })
    },

    reject: function(err) {
      error = err;
      handlers.forEach(function(h) {
        process.nextTick(function() {
          runHandler(h, err, false);
        })
      })
    }
  }

  return defered;

}