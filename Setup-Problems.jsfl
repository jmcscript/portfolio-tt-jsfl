function main() {
    fl.showIdleMessage(false);

    //Load the shared TT-Utility Library
    var ttURI = getDirectory() + "_archive/" + "TT-Utility.jsfl";
    loadUtilities(ttURI);

    //Grab the assets.fla file and problems.fla files that are currently open
    var assetsFile = getFlashFiles(fl.documents, "assets")[0];
    var lessonFiles = getFlashFiles(fl.documents, "TT");

    /**
     * Todo #1 This should be the only script in main(). A loop running all files.
     */
    //Iterate over all files containing lesson problems
    for (var i in lessonFiles) {
        if (!lessonFiles.hasOwnProperty(i)) {
            break;
        }

        /**
         * Todo #2 Determine which variables can be localized to the methods that need them.
         * Keep here if they are used in multiple methods.
         */
            //Initialize variables for each lessonFile
        var boxes = [],
            boxesDirectory,
            boxPrefix = "",
            boxSearchExp = /.*user(\d\d?|[A-F])$/i,
            hints = [],
            hintsDirectory,
            hintPrefix = "",
            hintSearchExp = /.*hint(\d\d?|[A-F])$/i,
            itemSuffix = "",
            lessonNumber = "",
            lessonPrefix = "",
            newBoxesDirectorySuffix = "USER BOXES LESSON",
            newHintsDirectorySuffix = "HINT",
            newTabsDirectorySuffix = "TABS",
            lessonFile = lessonFiles[i],
            scriptLayer,
            tabsDirectory,
            voiceDirectory;

        log("Processing file " + lessonFile.name + "...");

        //Focus Animate on the current file being processed
        fl.setActiveWindow(lessonFile);

        /**
         * Todo #3 Determine each distinct process:
         * 1. Import necessary assets for the conversion process.
         * 2. Replace all old assets with new ones.
         * 3. Remove the frame scripts on the main timeline.
         * 4. Rename the Hints folder and items
         * 5. Rename the User Boxes folder and items.
         * 6. Substitute User Box text inputs for faux inputs.
         * 7. Remove scripts from any puzzle and add some frame labels.
         * 8. Externalize the converted assets.
         * 9. Update the file Publish settings.
         * 10. Publish the converted file. Don't save files.
         */

        //Get the Voice folder so it can be deleted
        voiceDirectory = lessonFile.library.items.filter(function (item) {
            return item.name.match(/^voice$|^a$|^sounds$/i);
        });
        voiceDirectory = (voiceDirectory.length > 0) ? voiceDirectory[0] : null;

        //Delete the voice folder if it exists
        if (voiceDirectory) {
            lessonFile.library.deleteItem(voiceDirectory.name);
            log("=> Deleted '" + voiceDirectory.name + "' folder");
        }

        //Save document to reduce size after removing audio
        fl.saveDocument(lessonFile, lessonFile.pathURI);

        //Import _faux assets
        importAssets(assetsFile, lessonFile, "_faux");

        //Get lesson information from filename
        lessonPrefix = lessonFile.name.match(/[LQ]/i);
        lessonPrefix = (lessonPrefix === null) ? "" : lessonPrefix.toString();
        lessonNumber = lessonFile.name.match(/([LQ])([0-9]+)/i)[2];

        //Get the User Boxes folder to update the name and individual movie clips
        boxesDirectory = lessonFile.library.items.filter(function (item) {
            return item.name.match(/user boxes/i);
        });
        boxesDirectory = boxesDirectory.length > 0 ? boxesDirectory[0] : null;

        //Get the Hints folder to update the name and individual movie clips
        hintsDirectory = lessonFile.library.items.filter(function (item) {
            return item.name.match(/hint/i);
        });
        hintsDirectory = hintsDirectory.length > 0 ? hintsDirectory[0] : null;

        //Get the Tabs directory to update the name and move it to the library root
        tabsDirectory = lessonFile.library.items.filter(function (value) {
            return value.itemType === "folder" && value.name.match(/tabs/i);
        });
        tabsDirectory = (tabsDirectory.length > 0) ? tabsDirectory[0] : null;

        //Establish the proper naming prefix and suffix RegExp for each library item to be externalized
        boxPrefix = lessonPrefix + Number(lessonNumber).toString() + "_User";
        hintPrefix = "hint";
        itemSuffix = "([1-5]?[0-9]|[A-Z])";

        //Update Puzzle
        updatePuzzle(lessonFile);

        //Find the Script layer
        scriptLayer = getScriptLayer(lessonFile);

        //Delete the Script layer if it exists
        if (scriptLayer) {
            lessonFile.getTimeline().currentLayer =
                lessonFile.getTimeline().findLayerIndex(scriptLayer.name)[0];
            removeLayer(lessonFile, scriptLayer.name);
        }

        //Rename the Tabs directory and move it to the library root
        if (tabsDirectory) {
            tabsDirectory.name = lessonNumber + ((lessonPrefix === "Q") ? lessonPrefix : "") + newTabsDirectorySuffix;
            lessonFile.library.moveToFolder("", tabsDirectory.name);
        }

        //Convert the Hints directory and items if available
        if (hintsDirectory) {

            //Rename Hint directory
            hintsDirectory.name = lessonNumber + ((lessonPrefix === "Q") ? lessonPrefix : "") + newHintsDirectorySuffix;

            //Get Hint items for modification
            hints = getLibraryItems(lessonFile.library.items, hintSearchExp);

            //Ensure the name matches linkageClassName for all Hint items
            normalizeItemNames(hints);
        }

        //Rename USER BOXES directory
        boxesDirectory.name = lessonNumber + ((lessonPrefix === "Q") ? lessonPrefix : "") + newBoxesDirectorySuffix;

        //Get USER BOXES for modification and ensure the name matches the linkageClassName for all User items
        boxes = getLibraryItems(lessonFile.library.items, boxSearchExp);
        normalizeItemNames(boxes);
        convertBoxes(boxes);

        //Remove Document Class, Library Path, and Source Path
        updatePublishSettings(lessonFile);

        //Return to the document's main stage
        lessonFile.exitEditMode();

        log("Finished converting file " + lessonFile.name + "\n");

        fl.saveDocument(lessonFile, lessonFile.pathURI);

        //Move converted assets from the lessonFile to the assetsFile, save both files and publish the lesson
        try {
            cleanupLibrary(assetsFile, lessonFile, lessonNumber, lessonPrefix);
        } catch (e) {
            log("\n!!! ERROR: cleanupLibrary() - Failed !!!\n")
        }
    }

    fl.showIdleMessage(true);
}

//Import a folder from a lessonFile to the assetsFile and nest any dependent legacy folders
function cleanupFolder(folder, lessonFile, assetsFile) {
    if (!assetsFile.library.itemExists(folder)) {
        importAssets(lessonFile, assetsFile, folder);

        var legacyFolderNames = ["ASSETS", "BMP", "Graph Images", "Graphs", "INTERACTIONS", "interactions",
            "IMAGES", "images", "PROOFS", "Proofs", "proofs"];

        for (var i in legacyFolderNames) {
            if (!legacyFolderNames.hasOwnProperty(i)) {
                break;
            }

            var legacyFolder = legacyFolderNames[i];
            assetsFile.library.moveToFolder(folder, legacyFolder, false);
        }

        lessonFile.library.deleteItem(folder);
    }
}

//Move converted assets from the lessonFile to the assetsFile, save both files and publish the lesson
function cleanupLibrary(assetsFile, lessonFile, lessonNumber, lessonPrefix) {
    log("Beginning cleanup on " + lessonFile.name + "...");
    var hintFolder = lessonNumber + ((lessonPrefix === "Q") ? lessonPrefix : "") + "HINT";
    var lessonFolder = lessonNumber + ((lessonPrefix === "Q") ? lessonPrefix : "") + "USER BOXES LESSON";
    var tabsFolder = lessonFile.library.items.filter(function (value) {
        return value.itemType === "folder" && value.name.match(/tabs/i);
    });

    tabsFolder = (tabsFolder.length > 0) ? tabsFolder[0] : null;

    try {
        cleanupFolder(hintFolder, lessonFile, assetsFile);
        cleanupFolder(lessonFolder, lessonFile, assetsFile);
    } catch (e) {
        log(e);
        return;
    }

    if (lessonFile.library.deleteItem("_faux")) {
        log("=> Deleted '_faux' folder from lessonFile library");
    }

    if (lessonFile.library.deleteItem("_shared")) {
        log("=> Deleted '_shared' folder from lessonFile library");
    }

    if (tabsFolder && lessonFile.library.deleteItem(tabsFolder.name)) {
        log("=> Deleted 'TABS' folder from lessonFile library");
    }

    var filePathURIasSWF = lessonFile.pathURI.replace("fla", "swf");
    lessonFile.exportSWF(filePathURIasSWF);
    log("Finished externalizing " + lessonFile.name + " assets\n");
}

function convertBoxes(boxes) {
    for (var i in boxes) {
        if (!boxes.hasOwnProperty(i)) {
            break;
        }

        updateBox(boxes[i].name);
        log("=> Updated User Box: " + boxes[i].name);
    }
}

// Returns the directory path of the running script or provided uri
function getDirectory(uri) {
    uri = ((typeof uri == "string") && (uri.length > 0)) ? uri : fl.scriptURI;
    return uri.substring(0, (uri.lastIndexOf("/") + 1));
}

// Returns an array of files with .fla extension, or .fla files with a prefix somewhere in the name
function getFlashFiles(files, prefix) {
    var flashFiles;
    prefix = ((typeof prefix === "string") && (prefix.length > 0)) ? prefix : "";
    flashFiles = files.filter(function (file) {
        if ((file.name.indexOf(".fla") > -1) && (file.name.indexOf(prefix) > -1)) {
            return file;
        }
    });
    return flashFiles;
}

function getFauxInputName(maxCharacters) {
    var prefix = "_faux/txtNumeric";

    if (maxCharacters === 0 || maxCharacters === 1) {
        return prefix + "01";
    } else if (1 < maxCharacters && maxCharacters < 6) {
        return prefix + "0" + maxCharacters;
    } else if (5 < maxCharacters && maxCharacters < 11) {
        return prefix + "10";
    } else if (10 < maxCharacters && maxCharacters < 16) {
        return prefix + "15";
    } else if (15 < maxCharacters && maxCharacters < 21) {
        return prefix + "20";
    } else {
        alert("Max Characters for one of the fields is out of range");
    }
}

//Return the scale needed for faux inputs for different font sizes
function getFauxInputScale(fontSize) {
    if (fontSize === 15) return 7 / 8;
    return 1;
}

//Return an array of library items matching a specific name or regular expression
function getLibraryItems(items, searchExp) {

    items = items.filter(function (item) {
        //Todo: Fix this regular expression to pick up user boxes named "User" or "L#_User"
        return item.name.match(searchExp);
        //return item.name.match(new RegExp(directory + "\/" + prefix + suffix));
    });

    return items;
}

//Find the ActionScript layer
function getScriptLayer(file) {
    var allLayers = file.getTimeline().layers;

    //Iterate each layer in the current file
    for (var i in allLayers) {
        if (!allLayers.hasOwnProperty(i)) {
            break;
        }

        var frames = allLayers[i].frames;

        //Iterate each frame on the current layer
        for (var j in frames) {
            if (!frames.hasOwnProperty(j)) {
                break;
            }

            if (frames[j].actionScript.length > 0) {
                log("=> ActionScript found on '" + allLayers[i].name + "' layer");
                return allLayers[i];
            }
        }
    }

    return null;
}

//Import a directory(path) of assets from sFile to dFile
function importAssets(sFile, dFile, path) {
    try {
        if (!dFile.library.itemExists(path) && sFile.library.itemExists(path)) {
            fl.copyLibraryItem(sFile.pathURI, path);
            dFile.getTimeline().getSelectedLayers()[0].locked = true;
            dFile.clipPaste();

            if (dFile.selection.length > 0) {
                dFile.deleteSelection();
            }

            if (!dFile.library.itemExists(path)) {
                log("!!! ERROR: importAssets() - Path doesn't exist in destination file !!!");
            } else {
                log("=> " + path + " assets imported successfully");
            }
        }
    } catch (e) {
        log(e.message);
    }
}

//Load shared methods and properties
function loadUtilities(file) {
    if (fl.fileExists(file)) {
        fl.runScript(file);
    } else {
        fl.outputPanel.clear();
        fl.trace("TT-Utility library is unavailable...");
    }
}

//Ensure that all library names match any given linkage name
function normalizeItemNames(items) {
    for (var i in items) {
        if (!items.hasOwnProperty(i)) {
            break;
        }

        if (items[i].name !== items[i].linkageClassName) {
            items[i].name = items[i].linkageClassName;
            log("=> Normalized name for " + items[i].name);
        }
    }
}

//Remove a layer based on name from a file
function removeLayer(file, name) {
    var index = (file.getTimeline().findLayerIndex(name) !== undefined) ?
        file.getTimeline().findLayerIndex(name)[0] : -1;

    if (index > -1) {
        file.getTimeline().deleteLayer(index);
        log("=> Removed '" + name + "' layer");
    }
}

//Change text inputs in a User Box to faux inputs
function updateBox(box) {
    fl.getDocumentDOM().library.editItem(box);

    var layers = fl.getDocumentDOM().getTimeline().layers;
    var fauxElements = [];
    var otherElements = [];

    for (var i in layers) {
        if (!layers.hasOwnProperty(i)) {
            break;
        }

        //Check if the current layer is locked. If so, unlock it.
        if (layers[i].locked === true) {
            layers[i].locked = false;
        }

        var frames = layers[i].frames;

        for (var j in frames) {
            if (!frames.hasOwnProperty(j)) {
                break;
            }

            var elements = frames[j].elements;

            for (var k in elements) {
                if (!elements.hasOwnProperty(k)) {
                    break;
                }

                /** @type {Element} */
                var element = elements[k];

                fl.getDocumentDOM().selectNone();
                element.selected = true;

                if (element instanceof Text && element.name.indexOf("textBox") > -1) {

                    /** @type {Text} */
                    var text = element;

                    var fontSize = text.getTextAttr("size");
                    var fauxInput = getFauxInputName(text.maxCharacters);
                    var fauxInputIndex = fl.getDocumentDOM().library.findItemIndex(fauxInput);
                    var fauxInputItem = fl.getDocumentDOM().library.items[fauxInputIndex];
                    var fauxScale = getFauxInputScale(fontSize);
                    var name = text.name;
                    var xPos = text.x;
                    var yPos = text.y;

                    if (fl.getDocumentDOM().selection.length > 0) {
                        fl.getDocumentDOM().deleteSelection();
                    }

                    fl.getDocumentDOM().addItem({
                        x: 0,
                        y: 0
                    }, fauxInputItem);

                    if (!fl.getDocumentDOM().selection[0]) {
                        fauxInputItem.selection = true;
                        fl.trace("!!! ERROR: No selection available !!!");
                    }

                    /** @type {Element} */
                    var newElement = fl.getDocumentDOM().selection[0];
                    newElement.name = name;
                    newElement.x = xPos - 5;
                    newElement.y = yPos - 5;
                    newElement.scaleX = fauxScale;
                    newElement.scaleY = fauxScale;

                    fauxElements.push(newElement);
                }

                if (element.elementType === "shape" || element.symbolType === "graphic") {
                    otherElements.push(elements[k]);
                }
            }
        }
    }

    for (var l in fauxElements) {
        if (!fauxElements.hasOwnProperty(l)) {
            break;
        }

        fl.getDocumentDOM().selectNone();

        var fauxLeft = fauxElements[l].left.toFixed(0);
        var fauxTop = fauxElements[l].top.toFixed(0);

        for (var m in otherElements) {
            if (!otherElements.hasOwnProperty(m)) {
                break;
            }

            if (fauxLeft === otherElements[m].left.toFixed(0) &&
                fauxTop === otherElements[m].top.toFixed(0)) {
                otherElements[m].selected = true;

                if (fl.getDocumentDOM().selection.length > 0) {
                    fl.getDocumentDOM().deleteSelection();
                }
            }
        }
    }
}

//Prepare the  publish settings
function updatePublishSettings(file) {
    file.docClass = "";
    file.libraryPath = "";
    file.sourcePath = "";
    log("=> Updated 'Publish Settings'");
}

//Convert a puzzle by adding frame labels and removing any ActionScript
function updatePuzzle(file) {
    var puzzle = file.library.items.filter(function (item) {
        return item.name.match(/.+puzzle/i);
    })[0];

    if (puzzle) {
        var labelLayerIndex,
            scriptLayerIndex,
            timeline;

        file.library.editItem(puzzle.name);

        if (file.getTimeline().findLayerIndex("label") === undefined) {
            file.getTimeline().addNewLayer("label");
        }

        labelLayerIndex = file.getTimeline().findLayerIndex("label")[0];
        scriptLayerIndex = file.getTimeline().findLayerIndex("script")[0];

        //Add a `begin` and `finish` frame label to the `label` layer, and then delete the `script` layer
        timeline = file.getTimeline();
        timeline.setSelectedLayers(labelLayerIndex);
        timeline.layers[labelLayerIndex].frames[0].name = "begin";
        timeline.convertToBlankKeyframes(44);
        timeline.layers[labelLayerIndex].frames[44].name = "finish";
        timeline.deleteLayer(scriptLayerIndex);

        file.exitEditMode();

        log("=> Updated 'puzzle'");
    }
}

main();
  