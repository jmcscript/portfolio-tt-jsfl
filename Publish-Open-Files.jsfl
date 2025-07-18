/**
 * User: James McDonald
 * Date: 11/27/2019
 * Time: 3:58 PM
 */

function publishAndClose() {
    var numDocs = fl.documents.length;

    for (var i = 0; i < numDocs; i++) {
        fl.documents[i].publish();
    }

    for (var j = 0; j < numDocs; j++) {
        fl.closeDocument(fl.getDocumentDOM());
    }
}

publishAndClose();