"use strict";

let bodyParser = require('body-parser');
let routes = require('./routes');

function express_auth(req, res, next) {
  let id = req.header('REMOTE_USER');
  let mail = req.header('mail');
  if (!id) res.json({error: "missing auth"});
  if (id) req.user = { id, mail };
  next();
}

module.exports = function (app) {
    app.use(bodyParser.json({type: '*/*'})); // do not bother checking, everything we will get is JSON :)
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express_auth);
    app.use('/api', routes);
}
