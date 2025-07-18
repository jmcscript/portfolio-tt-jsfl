/**
 * Provides instance names for nameless tab buttons in tab group symbols for the currently opened file
 * User: v4ri4
 * Date: 10/28/2020
 * Time: 6:41 AM
 */

function renameTabGroupButtonsInFile() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts
    fl.outputPanel.clear(); //Clear the Output Panel
    fl.trace("[--RENAME TABGROUP BUTTONS IN FILE--]");


    //Find all tabGroup symbols in the current library
    var tabGroups = fl.getDocumentDOM().library.items.filter(function (item) {
        return item.name.match(/tabgroup/i);
    })

    //Iterate over every tabGroup symbol
    tabGroups.forEach(function (tabGroup) {
        renameTabGroupButtons(tabGroup);
    });

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

function renameTabGroupButtons (tabGroup) {
    fl.getDocumentDOM().library.editItem(tabGroup.name)
    fl.trace("=> Inspecting tabGroup " + tabGroup.name);

    var timeline = fl.getDocumentDOM().getTimeline();
    var layers = timeline.layers;
    var oldMatch = /btnTab([A-E])/;
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

    fl.getDocumentDOM().exitEditMode();
}

renameTabGroupButtonsInFile();