/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 10/23/2019
 * Time: 1:01 PM
 */

var ttURI = getDirectory() + "TT-Utility.jsfl";
var puzzleColumns = "lnum, " + "start, " + "end";
//var directory = fl.browseForFolderURL("Select the Problems folder");
//var allFiles = FLfile.listFolder(directory + "/*fla", "files");
//allFiles = allFiles.slice(0);
var allFiles = fl.documents;
var file = null;

// Primary function for this script
function main() {
    loadUtilities();

    fl.showIdleMessage(false);

    fl.trace(puzzleColumns);

    for (var i in allFiles) {
        if (!allFiles.hasOwnProperty(i)) {
            break;
        }

        var startFrame = null;
        var endFrame = null;
        //file = fl.openDocument(directory + "/" + allFiles[i]);
        file = allFiles[i];
        fl.setActiveWindow(file);
        getWorkLayers(file);

        if (puzzleLayer == null) {
            //file.close(false);
            continue;
        } else {
            for (var j in puzzleLayer.frames) {
                if(puzzleLayer.frames[j].elements.length > 0) {
                    if (startFrame == null) {
                        startFrame = labelLayer.frames[j].name.match(/[0-9]+/);
                    }
                    endFrame = labelLayer.frames[j].name.match(/[0-9]+/);
                }
            }
            fl.trace(lesson() + ", " + startFrame + ", " + endFrame);
        }
        //file.close(false);
    }

    fl.showIdleMessage(true);
}

// Returns the directory path of the running script or provided uri
function getDirectory(uri) {
    uri = ((typeof uri == "string") && (uri.length > 0)) ? uri : fl.scriptURI;
    return uri.substring(0, (uri.lastIndexOf("/") + 1));
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

main();