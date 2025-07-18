/**
 * ConvertLecturesWithoutInteractions.jsfl v0.0.3
 *
 * Description: Convert Lectures that have no interactions for
 * deployment as DLC.
 * Author: James McDonald
 * Last Updated: 2021.08.16 12:00 CDT
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

    const lectureFiles = tt.getLectures();

    lectureFiles.forEach(function (doc) {
        const sceneCount = doc.timelines.length;
        fl.setActiveWindow(doc);

        tt.log(doc.name, "new");

        if (sceneCount > 1) {
            const sceneList = nestMultipleScenes(doc);
            reduceScenes(doc);
            createSceneStack(doc, sceneList);

            tt.log("Nested " + sceneCount + " scenes");
        } else {
            tt.findAndRemoveActionScript(doc.getTimeline());
        }

        tt.deleteLinkageItems(doc);
        updatePublishSettings(doc);
        doc.exportSWF(doc.pathURI, true);

        tt.log("Finished processing " + doc.name)

        fl.showIdleMessage(true);

    });

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
     * Clear invalid publish settings in a lecture
     * @param document Lecture being converted
     */
    function updatePublishSettings(document) {
        document.docClass = "";
        document.libraryPath = "";
        document.sourcePath = "";
        tt.log("Updated publish settings");
    }
})();