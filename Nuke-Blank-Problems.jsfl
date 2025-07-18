/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 9/23/2019
 * Time: 1:08 PM
 */

var directory = "file:///C|/dlc/batch/";
var allFiles = FLfile.listFolder(directory, "files");
allFiles = allFiles.slice(0);
var file = null;
var allLayers = null;
var labelLayer = null;
var scriptLayer = null;
var deadFrames = null;

function main() {
    fl.outputPanel.clear();

    for (var i in allFiles) {

        if (i >= 20) break;

        deadFrames = [];
        file = fl.openDocument(directory + allFiles[i]);
        fl.setActiveWindow(file);
        allLayers = file.getTimeline().layers;
        fl.outputPanel.trace(file.name);
        getWorkLayers();
        getDeadFrames();
        nukeDeadFrames();
    }
}

function getDeadFrames() {
    var labelFrames = labelLayer.frames;
    var scriptFrames = scriptLayer.frames;

    for (var i = 0; i < labelFrames.length; i++) {
        if (typeof scriptFrames[i] === "undefined" || scriptFrames[i].actionScript.length === 0) {
            deadFrames.push(i);
        }
    }
}

function getWorkLayers() {
    //Iterate each layer in the current file
    for (var i in allLayers) {
        var frames = allLayers[i].frames;

        //Iterate each frame on the current layer
        for (var j in frames) {

            if ((!scriptLayer) && frames[j].actionScript.length > 0) {
                scriptLayer = allLayers[i];
                break;
            }

            if ((!labelLayer) && frames[j].name.length > 0) {
                labelLayer = allLayers[i];
                break;
            }
        }

        if (scriptLayer && labelLayer) {
            return;
        }
    }
}

function nukeDeadFrames() {
    for (var i in allLayers) {
        allLayers[i].locked = false;
        file.getTimeline().setSelectedLayers(Number(i), false);
        file.getTimeline().clearKeyframes(deadFrames[0], deadFrames[Number(deadFrames.length - 1)] + 1);
        file.getTimeline().clearFrames();
    }
}

main();