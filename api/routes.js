"use strict";
let express = require('express')
let db = require('./db')

let router = express.Router();

const respondError = (res, err) => {
    let msg = {error: "" + err};
    if (err.stack) msg.stack = err.stack;
    res.status(400).json(msg);
};

const respondJson = (req, res, p) => {
    let logPrefix = req.method + " " + req.path + ":";
    p.then(r => {
        //console.log(logPrefix, r);
        res.json(r || {});
    }, err => {
        console.error(logPrefix, err + err.stack);
        respondError(res, err);
    });
};

const removeUser = (l) => {
    l.forEach(bookmark => delete bookmark.user);
    return l;
};

const checkNewOrOwns = (req, id) => (
    id ? checkOwns(req, id) : Promise.resolve(null)
);

const checkOwns = (req, id) => (    
    db.get(id).then(bookmark => {
        if (bookmark.user === req.user.id)
            return null;
        else
            return Promise.reject("not allowed");
    })
);


router.get("/", (req, res) => (
    respondJson(req, res,
                db.find({ user: req.user.id }).then(removeUser))
));

router.post("/", (req, res) => {
    let bookmark = req.body;
    bookmark.user = req.user.id;
    respondJson(req, res,
                checkNewOrOwns(req, bookmark._id).then(() => db.save(bookmark)));
});

router.delete("/:id", (req, res) => {
    let id = req.params.id;
    if (!id) return respondError("missing parameter id");
    respondJson(req, res,
                checkOwns(req, id).then(() => db.delete(id)));
});

module.exports = router;
