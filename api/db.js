'use strict';

let mongodb = require('mongodb');
let conf = require('./conf');

const id = (_id) => (
    new mongodb.ObjectID(_id)
);

let real_collection;

const collection = () => {
  if (!real_collection) throw "db.init not done";
  return real_collection;
};

const exists = (criteria) => (
    collection().find(criteria).limit(1).next()
);

exports.get = (_id) => (
    collection().find({ _id: id(_id) }).limit(1).next()
);

exports.find = (criteria) => (
    collection().find(criteria).sort({ modifyTimestamp: -1 }).toArray()
);

exports.findOne = (criteria) => (
    collection().findOne(criteria)
);

exports.delete = (_id) => (
    collection().deleteOne({ _id: id(_id) }).then(result => {
        //console.log("delete " + _id, result);
        return result.deletedCount ? true : Promise.reject("not found");
    })
);

exports.save = (bookmark) => {
    console.log("saving in DB:", bookmark);
    bookmark.modifyTimestamp = new Date();
    bookmark._id = id(bookmark._id);
    return collection().updateOne({ _id: bookmark._id }, bookmark, {upsert: true}).then(r => bookmark);
};

exports.init = () => {
    return mongodb.MongoClient.connect(conf.mongodb.url).then(client => {
        real_collection = client.collection('bookmarks');
    }).then(() => {
        return collection().createIndex({ user: 1 });
    }).then(() => {
        return collection().createIndex({ publicName: 1 }, { unique: true, sparse: true });
    }).catch((error) => {
        console.error(error);
        process.exit(1);
    });
};
