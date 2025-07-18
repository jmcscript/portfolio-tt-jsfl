/**
 * User: James McDonald
 * Date: 9/29/2020
 * Time: 1:27 PM
 Lists nested library folders that aren't named "_faux" or "_shared"
 */

function listNestedFolders() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts
    fl.outputPanel.clear(); //Clear the Output Panel

    fl.trace("[--NESTED FOLDERS--]");

    //Collect a filtered list of folderItems
    var folders =
        fl.getDocumentDOM().library.items.filter(function (value) {
            return (value.itemType === "folder") &&
                (value.name.indexOf("_shared") === -1) &&
                (value.name.indexOf("_faux") === -1) &&
                (value.name.indexOf("\/") > -1);
        })

    //Trace each item.name in folders
    folders.forEach(function (value) {
        fl.trace(value.name);
    })

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

listNestedFolders();