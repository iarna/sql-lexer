'use strict';
module.exports = function (obj) {
   var objclass = function () {};
   objclass.prototype = obj;
   return new objclass();
}
