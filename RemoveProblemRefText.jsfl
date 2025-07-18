/**
 * RemoveProblemRefText.jsfl v0.0.1
 *
 * Remove static text boxes that indicate a problem's origin
 * Author: James McDonald
 * Last Updated: 2021.08.23 07:09 CDT
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

    const docs = fl.documents;

    docs.forEach(function (doc) {
        tt.log(doc.name, "new");
        removeRefText(doc)
    });

    /**
     * For each frame label, check for and remove REF text boxes
     * @param {Document} doc
     */
    function removeRefText(doc) {
        // Get all frame labels
        const labels = tt.getLabels(doc);

        // Iterate over each frame
        labels.forEach(function (label) {
            if (label.lti) {

                // Open the scene for the current label
                if (doc.currentTimeline !== label.timelineIndex) doc.editScene(label.timelineIndex);
                var timeline = doc.getTimeline();
                var layerCount = timeline.layerCount;

                // Iterate over each layer for a label's frameIndex
                while (layerCount--) {
                    if (label.ref) break;
                    var layer = timeline.layers[layerCount];

                    // Skip layers that don't have the current frame
                    if (layer.frames[label.frameIndex] === undefined) continue;

                    var frame = layer.frames[label.frameIndex];
                    var textElements =
                        frame.elements.filter(function (element) {
                            return (element instanceof Text) && (element.length > 0);
                        });

                    // Set the playhead to the frame being edited to allow for proper deletion
                    doc.getTimeline().currentFrame = label.frameIndex;

                    // Iterate over all Text elements at the given layer and frame
                    var elementCount = textElements.length;
                    while (elementCount--) {
                        if (label.ref) break;

                        /** @type {Text} */
                        var element = textElements[elementCount];
                        var text = element.getTextString();

                        // Delete text elements with reference language or clear the text itself
                        if (text.indexOf("first taught in") > -1) {
                            label.ref = Number(text.match(/\d+/));
                            element.selected = true;

                            try {
                                doc.deleteSelection();
                                doc.selectNone();
                                tt.log("Deleted text ref element for " + label.lti);
                            } catch (e) {
                                element.setTextString("");
                                element.selected = false;
                                tt.log("Cleared text ref for " + label.lti);
                            }
                        }
                    }
                }
            }
        });
    }
})();