/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 6/5/2019
 * Time: 11:37 AM
 */

var ttURI = getDirectory() + "./_archive/TT-Utility.jsfl";

// Classes
/**
 * This object represents a frame including its label, layer, and position.
 * @param {string} label - The label assigned to the frame. Accessible from the frame's name property.
 * @param {number} layer - The current layer, probably indicated by a for-loop iterator.
 * @param {number} position - The current frame number, probably indicated by a for-loop iterator.
 * @constructor
 */
var LabelFrame = function (label, layer, position) {
    this.label = label;
    this.layer = layer;
    this.position = position;
};

/**
 * This object represents a problem concept in the current lesson with that was taught in a previous lesson
 * @param problem - The current problem
 * @param origin - The lesson origin of the current problem's concept
 * @constructor
 */
var ProblemOrigin = function (problem, origin) {
    this.problem = problem;
    this.origin = origin;
};

/**
 * Global variables
 */
var allFiles, directory, file, frames, labelLayerIndex, labelFrames, layers, currentLesson, logText, logURI, originLayerIndex,
    origins, problems;

/**
 * The primary script routine
 */
function main() {
    log("Starting main()", true);

    loadUtilities();

    fl.showIdleMessage(false);

    allFiles = [];
    labelFrames = [];
    origins = [];
    problems = [];

    //directory = fl.browseForFolderURL("Select the Problems or Quizzes folder");
    //allFiles = FLfile.listFolder(directory + "/*fla", "files");
    allFiles = fl.documents;
    logText = "qnum, pnum, ref";

    log(logText);

    //allFiles = allFiles.slice(0);

    for (var f in allFiles) {
        if (!allFiles.hasOwnProperty(f)) {
            break;
        }

        labelFrames = [];
        origins = [];
        problems = [];

        //file = fl.openDocument(directory + "/" + allFiles[f]);
        file = allFiles[f];
        fl.setActiveWindow(file);

        currentLesson = lesson();
        layers = file.getTimeline().layers;

        getWorkLayers(file);
        getFrameLabels();
        getProblemOrigins();

        exportData();

        //file.close(false);
    }

    fl.showIdleMessage(true);
}

/**
 * Writes the data to a CSV text file
 */
function exportData() {
    for (var o in origins) {
        logText = currentLesson + ", " + origins[o].problem + ", " + origins[o].origin;
        log(logText);
    }
}

/**
 * Returns the directory uri of the file uri provided, else the uri of the running script
 *
 * @param {string} [uri] - The file uri from which to produce a directory uri
 * @returns {string} - The directory uri for this script, or provided file uri
 */
function getDirectory(uri) {
    uri = ((typeof uri == "string") && (uri.length > 0)) ? uri : fl.scriptURI;
    return uri.substring(0, (uri.lastIndexOf("/") + 1));
}

/**
 * Collects all the timeline frame labels
 */
function getFrameLabels() {
    var currentFrame = "";
    var currentLabel = "";
    var labelFrame = {};
    var previousLabel = "";

   for (var i in layers) {
        frames = layers[i].frames;

        for (var j in frames) {
            if (frames[j].labelType === "name") {
                currentFrame = frames[j];

                currentLabel = (frames[j].name.length > 0 && frames[j].name !== "Start") ?
                    frames[j].name.match(/[A-Z]|\d+/).toString() :
                    null;

                if (currentLabel && (currentLabel !== previousLabel) && scriptLayer.frames[j]) {
                    labelFrame = new LabelFrame(currentLabel, Number(i), Number(j));

                    if (labelFrames.indexOf(labelFrame) < 0) {
                        labelFrames.push(labelFrame);
                    }
                    previousLabel = currentLabel;
                }
            }
        }

        labelLayerIndex = Number(i);

        if (labelFrames.length > 0) return;
    }
}

/**
 * Collects all the problem lesson origins
 */
function getProblemOrigins() {
    var elementText = "";
    var layerElements = [];

    //Iterate over all layers except the label layer
    for (var i in layers) {
        if (i !== labelLayerIndex.toString()) {
            file.getTimeline().currentLayer = Number(i); //Select the layer if it isn't named LABEL

            //Iterate over each frame that corresponds to a label
            for (var j in labelFrames) {

                //If there is no ActionScript, the frame is a placeholder and should be skipped.
                if (scriptLayer.frames[labelFrames[j].position].actionScript.length === 0) {
                    continue;
                }

                file.getTimeline().currentFrame = labelFrames[j].position;

                layerElements = file.getTimeline().layers[i].frames[labelFrames[j].position].elements;

                for (var k in layerElements) {
                    if (layerElements[k].elementType === "text") {
                        elementText = layerElements[k].getTextString(0, layerElements[k].length);

                        if (elementText.indexOf("(first taught in") > -1) {
                            var problemOrigin =
                                new ProblemOrigin(labelFrames[j].label, elementText.match(/\d+/));
                            origins.push(problemOrigin);
                        }
                    }
                }
            }
        }
    }
}

// Load shared methods and properties
function loadUtilities() {
    if (fl.fileExists(ttURI)) {
        fl.runScript(ttURI);
    } else {
        fl.outputPanel.clear();
        fl.trace("TT-Utility library is unavailable...");
    }
}


/**
 * Sends a message to the Output panel in Animate
 *
 * @param {string} msg - The message sent to the Output panel
 * @param {boolean} [init] - True if the Output panel should be cleared first
 */
function log(msg, init) {
    if (init) fl.outputPanel.clear();
    fl.outputPanel.trace(msg + " at " + Date.now());
}

main();