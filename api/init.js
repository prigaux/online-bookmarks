"use strict";

let byPublicName = require('./byPublicName');

module.exports = function (app) {
    app.use('/public-name', byPublicName);    
}
