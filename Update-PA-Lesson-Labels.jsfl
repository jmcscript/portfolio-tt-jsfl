/**
 * Created with IntelliJ IDEA.
 * User: James McDonald
 * Date: 9/17/2020
 * Time: 10:26 AM
 */

//Allow for long script processes, clear any output, and notify that this file is running
fl.showIdleMessage(false);
fl.outputPanel.clear();
fl.trace("Update-PA-Lesson-Labels.jsfl is running...");

var lessonDocs;
var lessonNames = [];

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

//Return the array of docs with only matching PA problem set LTIs
function getPALessons(docs) {
    var paRegExp = /TT\.PA\.L\d{3}\.fla/;

    return docs.filter(function (doc) {
        if (typeof doc === "object") {
            return doc.name.match(paRegExp);
        } else if (typeof doc === "string") {
            return doc.match(paRegExp);
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
        default:
            return name
    }
}

//Get relevant lessonDocs from open files or a selected folder
if (fl.documents.length === 0) {
    var lessonPathURI = fl.browseForFolderURL("Select the PA lessons folder");
    var lessonPathFLAs =
        FLfile.listFolder(lessonPathURI + "/" + "TT.PA.L*.fla", "files");

    if (lessonPathFLAs.length > 0) {
        lessonNames = getPALessons(lessonPathFLAs);
    }

    for (var item in lessonNames) {
        if (!lessonNames.hasOwnProperty(item)) {
            break;
        }

        fl.openDocument(lessonPathURI + "/" + lessonNames[item]);
    }

    lessonDocs = fl.documents;
} else {
    lessonDocs = getPALessons(fl.documents);
}

//Alert the user if no docs are available to work on
if (lessonDocs.length === 0) {
    alert("ERROR: No PA Lesson Files are available to modify.");
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

//Reset the long script process warning
fl.showIdleMessage(true);
