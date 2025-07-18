/**
 * Created with IntelliJ IDEA.
 * User: James McDonald
 * Date: 11/23/2020
 * Time: 7:50 AM
 */

SolutionManager = function () {
    fl.outputPanel.clear();
    fl.trace("SolutionManager.jsfl [" + new Date() + "]\n");
}

SolutionManager.prototype.openNestedFiles = function (rootURI) {
    fl.trace("SolutionManager.openNestedFiles()");

    var fileList = [];
    var folderList = [];
    var folderURI = "";

    folderList = FLfile.listFolder(rootURI, "directories");

    //For each folder in folderList
    folderList.forEach(function (folderName) {
        folderURI = rootURI + "/" + folderName + "/" + "fla" + "/";
        fileList = FLfile.listFolder(folderURI + "*fla", "files");

        //Open each file in the current folder
        fileList.forEach(function (fileName) {
            fl.openDocument(folderURI + fileName);
        })
    })
}

SolutionManager.prototype.convertSolution = function () {

}

function main() {
    fl.showIdleMessage(false);

    var rootURI = fl.browseForFolderURL("Select the Solutions folder");
    var rootFolderList = FLfile.listFolder(rootURI, "directories");

    var sm = new SolutionManager();

    if (fl.documents.length === 0) sm.openNestedFiles(rootURI, rootFolderList);


    fl.showIdleMessage(true);
}

main();