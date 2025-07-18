/**
 * Convert Solutions to DLC.jsfl v0.0.1
 *
 * Convert Solutions in a chosen directory, or in a directory with child directories, to be used as DLC content
 * Author: James McDonald
 * Last Updated: 2021.08.23 11:45 CDT
 */

var tt;

/**
 * Convert a number of Solution FLA files
 */
function convertSolutions() {
    fl.showIdleMessage(false);

    const solutionMatcher = /tt\.(?:a1|a2|ge|m3|m4|m5|m6|m7|pa|pc)\.[lq]\d{2,3}\.[px]\d{1,2}/i;
    var solutions;

    //Load utilities
    const ttUtilURI = "file:///C|/git/automation/TTUtil.jsfl";
    if (fl.fileExists(ttUtilURI)) {
        fl.runScript(ttUtilURI);
        tt = new TTUtil();
    } else {
        alert("TTUtil did not load successfully");
    }

    //If documents are currently open
    if (fl.documents.length > 0) {

        //Check for valid Solution files
        solutions = fl.documents.filter(function (file) {
            return file.name.match(solutionMatcher);
        });

        //Convert and export all open Solutions
        solutions.forEach(function (solution) {
            convertSolution(solution);
            solution.save();
            solution.close();
        });

    } else {
        //Prompt the user for the Solutions folder and collect a list of the files.
        const solutionsPathURI = fl.browseForFolderURL("Select the Solutions folder");
        const files = [];

        tt.getAllFlaFiles(solutionsPathURI, files);

        solutions = files.filter(function (file) {
            return file.match(/tt\.(?:a1|a2|ge|m3|m4|m5|m6|m7|pa|pc)\.[lq]\d{2,3}\.[px]\d{1,2}/i);
        });

        //For each solution, open and convert in batches of 20
        var sc = solutions.length;
        while (--sc >= 0) {
            fl.openDocument(solutions[sc]);

            if (fl.documents.length > 19 || sc === 0) {
                fl.documents.forEach(function (solution) {
                    convertSolution(solution);
                    solution.close(false);
                });
            }
        }
    }

    fl.showIdleMessage(true);
}

/**
 * Convert a single Solution FLA
 * @param {Document} solution
 */
function convertSolution(solution) {
    tt.log(solution.name + " is processing...", "new");
    fl.setActiveWindow(solution);

    const sceneCount = solution.timelines.length;
    var sceneName = "";
    var sceneList = [];

    if (sceneCount > 1) {
        //For each Scene in the Solution
        solution.timelines.forEach(function (timeline, index) {
            sceneName = "Scene " + (index + 1);
            sceneList.push(sceneName);

            //Remove ActionScript
            tt.findAndRemoveActionScript(timeline);

            //Remove Notepad
            findAndRemoveNotepad(timeline);

            //Create Scene MC
            createSceneMC(solution, timeline, sceneName);
        });

        //Remove excess scenes
        reduceScenes(solution);

        //Create SceneStack on Frame 1
        createSceneStack(solution, sceneList);

    } else {
        //Remove ActionScript
        tt.findAndRemoveActionScript(solution.getTimeline());

        //Remove Notepad
        findAndRemoveNotepad(solution.getTimeline());
    }

    solution.exportSWF(solution.pathURI, true);

    tt.log("Finished with " + solution.name);
}

/**
 * Clone the current scene's timeline into a new library movie clip
 * @param {Document} document
 * @param {Timeline} timeline
 * @param {String} sceneName
 */
function createSceneMC(document, timeline, sceneName) {
    timeline.selectAllFrames();
    timeline.copyFrames();
    document.library.addNewItem("movie clip", sceneName);
    document.library.editItem(sceneName);
    document.getTimeline().pasteFrames(0);
    tt.log("Created Scene movie clip: " + sceneName);
}

/**
 * Deletes all layers and removes frames on the current timeline.
 * Then, creates a layer per scene symbol and adds the corresponding symbol
 * @param document {Document}
 * @param sceneList {String[]}
 */
function createSceneStack(document, sceneList) {
    var sceneName = "";

    while (document.getTimeline().layers.length > 1) {
        document.getTimeline().deleteLayer();
    }

    document.getTimeline().selectAllFrames();
    document.getTimeline().removeFrames();

    for (var i = sceneList.length; i > 0; i--) {
        sceneName = "Scene " + i;

        if (i === sceneList.length) {
            document.getTimeline().layers[0].locked = false;
            document.getTimeline().insertBlankKeyframe(0);
            document.getTimeline().layers[0].name = (sceneName);
        } else {
            document.getTimeline().addNewLayer(sceneName);
        }

        document.library.addItemToDocument({x: 250, y: 225}, (sceneName));
    }
}

/**
 * Search for the notepad layer and remove it
 * @param {Timeline} timeline
 */
function findAndRemoveNotepad(timeline) {
    timeline.layers.forEach(function (layer, index) {
        if (layer.layerType === "folder" && Boolean(layer.name.match(/bg/i))) {
            timeline.deleteLayer(index);
            tt.log("Removed Notepad layer in " + timeline.name);
        }
    });
}

/**
 * Removes all scenes except 1
 * @param {Document} document Lecture being converted
 */
function reduceScenes(document) {
    while (document.timelines.length > 1) {
        document.editScene(document.timelines.length - 1);
        document.deleteScene();
    }
    document.exitEditMode();
}

convertSolutions();

