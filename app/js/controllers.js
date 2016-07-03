function objectSlice(o, fields) {
    var r = {};
    angular.forEach(fields, function (field) {
        r[field] = o[field];
    });
    return r;
}

function toTitleCase(str) {
    return str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

function parseNetscapeBookmarks(html) {
    var elt = document.createElement("div");
    elt.innerHTML = html; // wow, we have a nice HTML parser :)
    var r = [];
    var current;

    function extractRec(path, elt) {
        var tag = elt.tagName.toLowerCase();
        if (tag === "a") {
            if (elt.href.match(/^http/)) {
                current = { name: elt.innerText, link: elt.href };
		if (path.length) current.description = path.join(" ");
		r.push(current);
            }
	} else if (tag === "dd") {
	    if (current && elt.innerText.match(/\S/)) {
		current.description = elt.innerText.trim() + (current.description ? " " + current.description : '');
	    }
        } else if (tag === "dt") {
	    current = null;
            var first = elt.children[0];
            if (first.tagName.match(/h3/i)) {
                path = path.concat(["#" + toTitleCase(first.innerText).replace(/\s/g, '')]);
            }
        }
        angular.forEach(elt.children, function (sub) {
            extractRec(path, sub);
        });
    }
    
    extractRec([], elt);
    return r;
} 

var netscapeBookmarks_header = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '',
].join('\n');

function exportNetscapeBookmarks(bookmarks) {
    var l = bookmarks.map(function (bookmark) {
        return '<DT><A HREF="' + window.encodeURI(bookmark.link) + '">' + bookmark.name + '</A>' +
	    '<DD>' + (bookmark.description || '');
    });
    
    return [ netscapeBookmarks_header, '<DL><p>' ].concat(l).concat('</DL><p>').join("\n");
}

function parseDescription(description) {
    if (!description) return [ { name : "" } ];
    return description.split(/(#[\w\x80-\xff-]+)/).filter(function (s) { return !s.match(/^\s*$/) }).map(function (s) {
	return { name: s, tag: s.match(/^#/) };
    })
}

function parseBookmark(bookmark) {
    bookmark = angular.copy(bookmark);
    bookmark.desc = parseDescription(bookmark.description);
    bookmark.addtext = {};
    return bookmark;
}

function computeTags(bookmarks) {
    var l = {};
    bookmarks.forEach(function (bookmark) {
        bookmark.desc.forEach(function (e) {
            if (e.tag) l[e.name] = true;
        });
    });
    return Object.keys(l);
}

function computeHash(bookmark) {
    return [ bookmark.link, bookmark.name, bookmark.description ].join('|');
}
function computeHashes(bookmarks) {
    var h = {};
    angular.forEach(bookmarks, function (bookmark) {
        h[computeHash(bookmark)] = bookmark;
    });
    return h;
}

app.controller('BookmarkCtrl', function($scope, $http, $location, $window) {
    var emptyBookmark = { link: "", description: "", addtext: {} };

    $scope.bookmarks = [];
    $scope.bookmark = angular.copy(emptyBookmark);
    $scope.search = {};
    $scope.maxBookmarks = 40;

    function normalizeLink(link) {
        return link.match(/^https?:/) ? link : "http://" + link;
    }
    function toWS(bookmark) {
        return objectSlice(bookmark, [ 'link', 'name', 'description', 'code', '_id' ]);
    }
    function computeBookmarksToDisplay(bookmarks, search) {
        var l = bookmarks;
 	var regex = new RegExp(search, "i");
 	if (search) l = l.filter(function (bm) {
	    return regex.test(bm.name) || regex.test(bm.link) || regex.test(bm.description);
	});
        $scope.bookmarksToDisplay = l.slice(0, $scope.maxBookmarks);
	$scope.allBookmarksDisplayed = l.length <= $scope.maxBookmarks;
    }

    $scope.$watch('bookmarks', function (bookmarks) {
        //console.log("bookmarks modified");
        $scope.tags = computeTags(bookmarks);
	$scope.haveDescriptions = bookmarks.filter(function (b) { return b.name || b.description; }).length > 0;
	computeBookmarksToDisplay(bookmarks, $scope.search.text);
    }, true);

    $scope.$watch('search.text', function (search_text) {
	computeBookmarksToDisplay($scope.bookmarks, search_text);
    });

    $scope.$watch('toImport', function (html) {
        //console.log("importing", html);
        var exists = computeHashes($scope.bookmarks);
        parseNetscapeBookmarks(html).filter(function (b) {
            return !exists[computeHash(b)];
        }).forEach($scope.addBookmark);
    });

    $scope.computeExport = function () {
        return "data:text/html;charset=utf-8," + $window.encodeURIComponent(exportNetscapeBookmarks($scope.bookmarks));
    }
    
    $http.get('api').success(function(data) {
	$scope.bookmarks = data.map(parseBookmark);
    });

    $scope.addBookmark = function(bookmark) {
        bookmark.link = normalizeLink(bookmark.link);
        $http.post('api', toWS(bookmark)).success(function(bookmark) {
	    $scope.bookmarks.unshift(parseBookmark(bookmark));
            // empty the form:
	    angular.copy(emptyBookmark, bookmark);
        });
    }
    $scope.editBookmark = function (bookmark) {
	delete bookmark.backup;
	bookmark.backup = angular.copy(bookmark);
	bookmark.edit = true;
    }
    $scope.cancelBookmark = function (bookmark) {
	angular.copy(bookmark.backup, bookmark);
    }

    $scope.saveBookmark = function (bookmark) {
        bookmark.link = normalizeLink(bookmark.link);
	bookmark.desc = parseDescription(bookmark.description);

        $http.post('api', toWS(bookmark)).success(function() {
	    bookmark.edit = false;
        });
    };
    $scope.deleteBookmark = function(bookmark) {
        $http.delete('api/' + bookmark._id).success(function() {
	    $scope.bookmarks = $scope.bookmarks.filter(function (b) { return b !== bookmark; });
        });
    }

});
