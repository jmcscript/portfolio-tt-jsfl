/**
 * ConvertLectures.jsfl v0.1.3
 *
 * Description: Convert Lectures for deployment as DLC
 * Author: James McDonald
 * Last Updated: 2021.08.16 1:18 CDT
 */

(function () {
    const tt = (function () {
        const ttUtilURI = "file:///c|/git/automation/TTUtil.jsfl";
        if (fl.fileExists(ttUtilURI)) {
            fl.runScript(ttUtilURI);
            return new TTUtil();
        }
        alert("TTUtil.js did not load successfully");
        return null;
    })();

    fl.showIdleMessage(false);

    var sceneCount;
    var sceneList = [];

    const lectureFiles = tt.getLectures();

    //For each open document
    lectureFiles.forEach(function (document) {
        tt.log(document.name, "new");

        fl.setActiveWindow(document);

        sceneCount = document.timelines.length;

        //Iterate over all scenes, remove legacy interactions, and remove the notepad background
        removeInteractions(document);

        //If multi-scene, remove ActionScript, create symbols for each scene, stack layers with no frames, and add
        //scene movie clips
        if (sceneCount > 1) {
            sceneList = nestMultipleScenes(document);
            reduceScenes(document);
            createSceneStack(document, sceneList);
            tt.log("Nested " + sceneCount + " scenes");

            //If single-scene, just remove ActionScript
        } else {
            tt.findAndRemoveActionScript(document.getTimeline());
        }

        //Delete linkage items
        tt.deleteLinkageItems(document);

        //Update publish settings
        updatePublishSettings(document);

        //Export the current Lecture
        document.exportSWF(document.pathURI, true);
        tt.log("Finished processing " + document.name);
    });

    fl.showIdleMessage(true);

    /**
     * Deletes all layers and removes frames. Then, creates a layer per scene symbol and adds the corresponding symbol
     * @param document Lecture being converted
     * @param sceneList Name of each timeline corresponding to a scene
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
     * Return the layer containing frame labels if LP doesn't exist or null
     * @param {Timeline} timeline
     * @returns {null|Layer|*}
     */
    function getLabelLayer(timeline) {

        var quickIndex = timeline.findLayerIndex("LP");
        if (quickIndex && quickIndex.length === 1) return timeline.layers[quickIndex];

        var numLayers = timeline.layerCount;
        for (var i = 0; i < numLayers; i++) {

            var numFrames = timeline.layers[i].frameCount;
            for (var j = 0; j < numFrames; j++) {

                if (timeline.layers[i].frames[j].name.length > 0) {
                    return timeline.layers[i];
                }
            }
        }

        return null;
    }

    /**
     * Moves scene into movie clips and returns a list of the library item names
     * @param document Lecture being converted
     * @returns {[String]} List of library names representing each scene movie clip
     */
    function nestMultipleScenes(document) {
        var sceneName = "";
        var sceneList = [];

        document.timelines.forEach(function (timeline, index) {
            sceneName = "Scene " + (index + 1);
            sceneList.push(sceneName);

            tt.findAndRemoveActionScript(timeline);
            timeline.selectAllFrames();
            timeline.copyFrames();

            document.library.addNewItem("movie clip", sceneName);
            document.library.editItem(sceneName);
            document.getTimeline().pasteFrames(0);
        });

        document.exitEditMode();
        return sceneList;
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

    /**
     * Returns true if all the interactive and legacy elements corresponding to each frame label found are
     * deleted successfully
     * @param {Document} document
     * @returns {boolean}
     */
    function removeInteractions(document) {
        document.timelines.forEach(function (timeline, sceneIndex) {
            document.editScene(sceneIndex);

            const labelLayer = getLabelLayer(timeline);
            if (!labelLayer) {
                tt.log("Can't identify the label layer");
                return false;
            }

            //Unlock all layers so that interactions are accessible
            unlockAllLayers(timeline);

            const labels = [];
            const numFrames = labelLayer.frames.length;

            for (var i = 0; i < numFrames; i++) {
                const frame = labelLayer.frames[i];

                if (frame.name.length > 0 && labels.indexOf(frame.name) === -1) {
                    timeline.currentFrame = i;

                    try {
                        fl.runScript(tt.automationURI + "DeleteLegacyElements.jsfl");
                        tt.log("Deleted Legacy Elements from '" + frame.name + "'");
                    } catch (e) {
                        tt.log("DeleteLegacyElements.jsfl is unavailable or failed encountered an error.");
                        return false;
                    }

                    labels.push(frame.name);
                }
            }
        });

        return true;
    }

    /**
     * Clear invalid publish settings in a lecture
     * @param document Lecture being converted
     */
    function updatePublishSettings(document) {
        document.docClass = "";
        document.libraryPath = "";
        document.sourcePath = "";
        tt.log("Updated publish settings");
    }

    /**
     * Unlocks all layers for the current scene
     * @param {Timeline} timeline
     */
    function unlockAllLayers(timeline) {
        timeline.layers.forEach(function (layer) {
            layer.locked = false;
        });
    }
})();