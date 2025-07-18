/**
 * Batch publish all files in a Solutions folder under lesson###
 * User: James McDonald
 * Date: 12/5/2019
 * Time: 11:19 AM
 * To change this template use File | Settings | File Templates.
 */

fl.showIdleMessage(false);

fl.outputPanel.clear();

function publishSolutions() {
    fl.trace("Publishing Solutions...");

    var folderURI, filesURI, documentNames;

    var rootPathURI = fl.browseForFolderURL("Select the Solutions folder");
    var folders = FLfile.listFolder(rootPathURI, "directories");

    folders.forEach(function (folder) {
        folderURI = rootPathURI + "/" + folder + "/";
        filesURI = folderURI + "*fla";
        documentNames = FLfile.listFolder(filesURI, "files");

        //Open all documents in the current folder
        documentNames.forEach(function (name) {
            fl.openDocument(folderURI + name);
        })

        //Export each open document
        fl.documents.forEach(function (document) {
            document.exportSWF(document.pathURI, true);
        })

        //Close all documents now that export is complete
        while (fl.documents.length > 0) {
            fl.documents[0].close();
        }
    });
}

publishSolutions();

fl.showIdleMessage(true);