"use strict";

let winston = require('winston');

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ],
  exitOnError: false
});