// mongodb script to import tsv exported esup-canal-signet2

function toTitleCase(str) {
    return str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

db.bookmarks.remove({ source: "import signet2" });

db.signet2.find().forEach(function (bm) {
    if (bm.folders) {
	var folders = bm.folders.split(" xxxx ").map(function (s) {
	    return "#" + toTitleCase(s).replace(/\s/g, '');
	});
	delete bm.folders;
	bm.description = [bm.description].concat(folders).filter(function (s) { return s }).join(" ");
    }
    bm.name = "" + bm.name; // ensure type
    bm.modifyTimestamp = new Date();
    bm.source = "import signet2";
    db.bookmarks.insert(bm);
});
