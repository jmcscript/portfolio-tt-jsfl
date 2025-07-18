/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 6/5/2019
 * Time: 11:37 AM
 */


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
var directory, file, frames, labelLayerIndex, labelFrames, layers, currentLesson, logText, logURI, originLayerIndex,
    origins, problems;

/**
 * The primary script routine
 */
function main() {
    log("Starting main()", true);

    labelFrames = [];
    origins = [];
    problems = [];

    directory = "file:///C|/dlc/batch/";
    logURI = directory + "lesson-problem-origin-singlefile.txt";
    logText = "lesson, problem, origin";

    write(logURI.toString(), logText, true);
    log("=> Column labels written");

    file = fl.getDocumentDOM();

    log("=> Processing file " + file.name);

    exportData();
}

/**
 * Writes the data to a CSV text file
 */
function exportData() {
    //file = fl.getDocumentDOM();
    currentLesson = file.name.match(/\d+/g).toString();
    layers = file.getTimeline().layers;

    getLabels();
    getOrigins();

    for (var o in origins) {
        logText = currentLesson + ", " + origins[o].problem + ", " + origins[o].origin;
        write(logURI.toString(), logText);
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
 * Collects all the problem lesson origins
 */
function getOrigins() {
    var elementText = "";
    var layerElements = [];

    //Iterate over all layers except the label layer
    for (var i in layers) {
        if (i !== labelLayerIndex.toString()) {
            file.getTimeline().currentLayer = Number(i); //Select the layer if it isn't named LABEL

            //Iterate over each frame that corresponds to a label
            for (var j in labelFrames) {
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

/**
 * Collects all the timeline frame labels
 */
function getLabels() {
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

                if (currentLabel && currentLabel !== previousLabel) {
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
 * Sends a message to the Output panel in Animate
 *
 * @param {string} msg - The message sent to the Output panel
 * @param {boolean} [init] - True if the Output panel should be cleared first
 */
function log(msg, init) {
    if (init) fl.outputPanel.clear();
    fl.outputPanel.trace(msg + " at " + Date.now());
}

/**
 * Writes a line of text to an external file
 *
 * @param {string} file - URI of the file
 * @param {string} txt - Text to write
 * @param {boolean} [overwrite] - If True, replaces all the contents of the file. If False, appends to the file
 */
function write(file, txt, overwrite) {
    txt += "\n";

    if (overwrite) {
        FLfile.write(file, txt);
    } else {
        FLfile.write(file, txt, "append");
    }
}

main();