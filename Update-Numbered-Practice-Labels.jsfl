/**
 * Renames practice problems 1-5 to A-E for PA and A2 courses
 * User: James McDonald
 * Date: 10/11/2020
 * Time: 7:32 PM
 */

//Allow for long script processes, clear any output, and notify that this file is running
fl.showIdleMessage(false);
fl.outputPanel.clear();
fl.trace("Update-Numbered-Practice-Labels.jsfl is running...");

function updateLabels() {
    var lessonDocs, lessonNames;

    //Get relevant lessonDocs from open files or a selected folder
    if (fl.documents.length === 0) {
        var lessonPathURI = fl.browseForFolderURL("Select the Problem Sets folder");
        var lessonPathFLAs =
            FLfile.listFolder(lessonPathURI + "/" + "TT.*.L*.fla", "files");

        if (lessonPathFLAs.length > 0) {
            lessonNames = getLessons(lessonPathFLAs);
        }

        for (var item in lessonNames) {
            if (!lessonNames.hasOwnProperty(item)) {
                break;
            }

            fl.openDocument(lessonPathURI + "/" + lessonNames[item]);
        }

        //Get all open documents, previously validated
        lessonDocs = fl.documents;
    } else {
        //Get all open documents that are valid lessons
        lessonDocs = getLessons(fl.documents);
    }

    //Alert the user if no docs are available to work on
    if (lessonDocs.length === 0) {
        alert("ERROR: No PA or A2 Lesson Files are available to modify.");
    }

    //Update incorrect labels for each document in lessonDocs
    for (var d in lessonDocs) {
        if (!lessonDocs.hasOwnProperty(d)) {
            break;
        }

        var currentDocName = lessonDocs[d].name;

        if (!lessonDocs.hasOwnProperty(d)) {
            break;
        }

        fl.trace("\t=> Inspecting file " + lessonDocs[d].name);

        //Find the layer that has labels
        var labelLayer = getLabelLayer(lessonDocs[d]);

        //Iterate over all frames in the labelLayer
        for (var f in labelLayer.frames) {
            if (!labelLayer.frames.hasOwnProperty(f)) {
                break;
            }

            var frame = labelLayer.frames[f];

            if (frame.name.length > 0 && (frame.name !== getProperName(frame.name))) {
                frame.name = getProperName(frame.name);
                fl.trace("\t\t=> " + frame.name + " labeled correctly");
            }
        }

        fl.saveDocument(lessonDocs[d], lessonDocs[d].pathURI);
        fl.trace("\t=> Saved file " + currentDocName);
        fl.closeDocument(lessonDocs[d]);
        fl.trace("\t=> Closed file " + currentDocName);
    }
}

//Return the first Layer object in doc with a named frame
function getLabelLayer(doc) {
    var allFrames = [];
    var allLayers = doc.getTimeline().layers;

    for (var l in allLayers) {
        if (!allLayers.hasOwnProperty(l)) {
            break;
        }

        allFrames = allLayers[l].frames;

        for (var f in allFrames) {
            if (!allFrames.hasOwnProperty(f)) {
                break;
            }

            if (allFrames[f].name.length > 0) {
                return allLayers[l];
            }
        }
    }
}

//Return the array of docs with only matching problem set LTIs
function getLessons(docs) {
    var lessonRegExp = /TT\.M3|M4|M5|M6|M7|PA|A1|GE|A2|PC\.L\d{3}\.fla/;

    return docs.filter(function (doc) {
        if (typeof doc === "object") {
            return doc.name.match(lessonRegExp);
        } else if (typeof doc === "string") {
            return doc.match(lessonRegExp);
        }
    });
}

//Return standard frame names when incorrect ones are found
function getProperName(name) {
    switch (name) {
        case "practice1":
            return "practiceA"
        case "practice2":
            return "practiceB"
        case "practice3":
            return "practiceC"
        case "practice4":
            return "practiceD"
        case "practice5":
            return "practiceE"
        case "practice6":
            return "practiceF"
        default:
            return name
    }
}

//Start the primary routine
updateLabels();

//Reset the long script process warning
fl.showIdleMessage(true);
