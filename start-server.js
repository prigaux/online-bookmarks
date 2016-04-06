#!/usr/bin/env node

"use strict";

if (!process.env.NODE_ENV) {
   process.env.NODE_ENV = 'production';
}
let express = require('express')
let api_init = require('./api/init');
let db = require('./api/db');

let app = express();

app.use("/node_modules", express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/app'));
api_init(app);

let port = process.env.PORT || 8080;
db.init().then(() => {
    app.listen(port);
    console.log('Started on port ' + port);
});

