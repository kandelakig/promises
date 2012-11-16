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
          resolved: callback,
          rejected: errback,
          defered: d
        })
      }

      return d.promise;
    }
  }


  var defered = {
    promise: promise,

    resolve: function(val) {
      value = val;
      handlers.forEach(function(handler) {
        try {
          if(handler.resolved) {
            handler.defered.resolve(handler.resolved(val));
          } else {
            handler.defered.resolve(val);
          }
        } catch(e) {
          handler.defered.reject(e);
        }
      })
    },

    reject: function(err) {
      error = err;
      handlers.forEach(function(handler) {
        try {
          if(handler.rejected) {
            handler.defered.resolve(handler.rejected(val));
          } else {
            handler.defered.reject(val);
          }
        } catch(e) {
          handler.defered.reject(e);
        }
      })
    }
  }

  return defered;

}