var parser = require("bookmarks-parser");

function toTitleCase(str) {
  return str.replace(/(?:^|\s)\w/g, function(match) {
    return match.toUpperCase();
  });
}

function flatten(l) {
  var r = [];
  l.forEach(function (subl) { r = r.concat(subl); });
  return r;
}

function importList(l, tags) {
  return flatten(l.map(function (e) { return importRec(e, tags); }));
}

function importRec(e, tags) {
  if (e.type === 'bookmark') {
    return [ { link: e.url, description: [ e.title ].concat(tags).join(' ') } ];
  } else if (e.children) {
    if (e.type === 'folder') tags = tags.concat(["#" + toTitleCase(e.title).replace(/\s/g, '')]);
    return importList(e.children, tags);
  } else {
    // ignore
    return [];
  }
}

exports.import = function (html, callback) {
  parser(html, function(err, res) {
    if (err) {
      callback(err);
    } else {
      callback(null, importList(res.bookmarks, []));
    }
  });
};
