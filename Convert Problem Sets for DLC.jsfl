/**
 * Convert Problem Sets for DLC.jsfl v0.1.2
 *
 * Description: Convert Problem Sets for deployment as DLC
 * Author: James McDonald
 * Last Updated: 2021.08.17 10:07 CDT
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

    fl.showIdleMessage(false); //Hide warnings about long-running scripts

    const problemSetFiles = tt.getProblemSets();

    problemSetFiles.forEach(function (doc) {
        tt.log(doc.name + " is now processing", "new");

        removeProofs(doc);
        tt.deleteLinkageItems(doc);
        tt.findAndRemoveActionScript(doc.getTimeline());
        updatePuzzle(doc);
        updatePublishSettings(doc);

        doc.exportSWF(doc.pathURI, true);
        tt.log(doc.name + " is finished");
    });

    fl.showIdleMessage(true); //Show warnings about long-running scripts

    /**
     * Delete the Proofs folder in the document library
     * @param {Document} doc
     */
    function removeProofs(doc) {
        const proofs = doc.library.items.filter(function (item) {
            return item.name.match(/proof/i) && item.itemType === "folder";
        });

        proofs.forEach(function (proof) {
            doc.library.deleteItem(proof.name);
        })
    }

    /**
     * Clear document publish settings
     * @param doc
     */
    function updatePublishSettings(doc) {
        doc.docClass = "";
        doc.libraryPath = "";
        doc.sourcePath = "";
        tt.log("Updated publish settings");
    }

    /**
     * Convert a puzzle by adding frame labels and removing any ActionScript
     * @param {Document} doc
     */
    function updatePuzzle(doc) {
        var puzzle = doc.library.items.filter(function (item) {
            return item.name.match(/.+puzzle/i);
        });

        if (puzzle.length === 1) {
            puzzle = puzzle[0];

            doc.library.editItem(puzzle.name);

            var labelLayerIndex,
                scriptLayerIndex,
                timeline = doc.getTimeline();

            if (timeline.findLayerIndex("label") === undefined) {
                timeline.addNewLayer("label");
            }

            labelLayerIndex = timeline.findLayerIndex("label")[0];
            scriptLayerIndex = timeline.findLayerIndex("script")[0];

            timeline.setSelectedLayers(labelLayerIndex);
            timeline.layers[labelLayerIndex].frames[0].name = "begin";
            timeline.convertToBlankKeyframes(44);
            timeline.layers[labelLayerIndex].frames[44].name = "finish";
            timeline.deleteLayer(scriptLayerIndex);

            doc.exitEditMode();

            tt.log("Updated 'puzzle'");
        }
    }
})();