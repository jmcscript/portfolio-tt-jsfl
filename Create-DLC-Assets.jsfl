/*
$ Author: Arnold Biffna
$ Description: Uses assets.fla to create the DLCAssets.as class file,
which references linkages in the assets.swc
*/

// Todo: Finish this script because it no work!

fl.showIdleMessage(false);
fl.outputPanel.clear();

// if ((fl.documents.length > 0) && (fl.findDocumentIndex("assets.fla") > -1) {
//     var assets = fl.documents[fl.findDocumentIndex(assets.fla)]
// } else {
//     var assetsURI = fl.browseForFileURL("open", "Select the assets file",
//         "FLA Document (*.fla)", "fla");
//     var assets = fl.openDocument(assetsURI);
//     fl.trace(fl.findDocumentIndex(assets.name));
// }

var assets; //Document object

function openAssetsFile() {
    var assetsIndex = fl.findDocumentIndex("assets.fla");

    if (assetsIndex.length > 1 || assetsIndex.length === 0) {
        var assetsURI = fl.browseForFileURL("open", "Select the assets file",
            "FLA Document (*.fla)", "fla");
        assets = fl.openDocument(assetsURI);
    } else {
        assets = fl.documents[assetsIndex];
    }
}

openAssetsFile();

fl.showIdleMessage(true);