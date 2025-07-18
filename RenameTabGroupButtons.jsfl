/**
 * Provides instance names for nameless tab buttons in tabGroup symbols
 * User: James McDonald
 * Date: 10/28/2020
 * Time: 7:30 AM
 */

function editFileSet() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts
    fl.outputPanel.clear(); //Clear the Output Panel

    fl.trace("[--RENAME TABGROUP BUTTONS--]");

    var directory = fl.browseForFolderURL("Select the folder with Problem Sets to process");
    var allFiles = FLfile.listFolder(directory + "/*fla", "files");
    var problemSets = allFiles.filter(function (file) {
        return file.match(/TT\.M3|M4|M5|M6|M7|PA|A1|GE|A2|PC\.[LQ]\d{2,3}\.fla/);
    })
    var tabGroups;

    if (problemSets.length === 0) {
        alert("No Problem Sets are available in the selected folder");
    }

    //Open each Problem Set for modification
    problemSets.forEach(function (problemSet) {
        fl.openDocument(directory + "/" + problemSet);
    });

    fl.documents.forEach(function (document) {
        fl.trace("\nProcessing file " + document.name);

        tabGroups = document.library.items.filter(function (item) {
            return item.name.match(/tabGroup/);
        })

        if (tabGroups.length === 0) {
            fl.trace("=> No tabGroups found");
            fl.trace("Finished processing file " + document.name);
        }

        tabGroups.forEach(function (tabGroup) {
            renameTabGroupButtons(document, tabGroup);
        })

        fl.trace("Finished processing file " + document.name);
    });

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

function renameTabGroupButtons(document, tabGroup) {
    document.library.editItem(tabGroup.name)
    fl.trace("=> Inspecting tabGroup " + tabGroup.name);

    var timeline = document.getTimeline();
    var layers = timeline.layers;
    var oldMatch = /ButtonOption([A-E])/;
    var instancePrefix = "button";
    var instanceSuffix;

    //Iterate over every layer in the Symbol
    layers.forEach(function (layer) {
        layer.locked = false;

        //Iterate over all elements on frame 1 for each layer
        layer.frames[0].elements.forEach(function (element) {

            //If an instance without a name is found
            if (element.elementType === "instance" && element.name.length === 0) {

                //And if that instance library name matches our oldMatch regexp
                if (element.libraryItem.name.match(oldMatch)) {

                    //Build the name and apply it
                    instanceSuffix = element.libraryItem.name.match(oldMatch)[1].toString();
                    element.name = instancePrefix + instanceSuffix;
                    fl.trace("=> Renaming element " + element.libraryItem.name + " to " + element.name);
                }
            }
        })
        layer.locked = true;
    });

    document.exitEditMode();
}

editFileSet();