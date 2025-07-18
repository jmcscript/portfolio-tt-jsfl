/**
 * Output SQL Update statements for all refs in each open Problem Set document
 * User: James McDonald
 * Date: 7/17/2021
 * Time: 10:12 AM
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
    const SQLUpdates = [];

    docs.forEach(function (doc) {
        createRefSQLUpdates(doc, SQLUpdates);
    });

    /**
     * Populates an array with SQL Update statements for each ref corresponding to an lti
     * @param {Document} doc
     * @param {string[]} arr
     */
    function createRefSQLUpdates(doc, arr) {
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

                    // Iterate over all Text elements at the given layer and frame
                    var elementCount = textElements.length;
                    while (elementCount--) {
                        if (label.ref) break;

                        /** @type {Text} */
                        var element = textElements[elementCount];
                        var text = element.getTextString();

                        if (text.indexOf("first taught in") > -1) {
                            label.ref = Number(text.match(/\d+/));
                        }
                    }
                }

                // Create SQL query for valid data
                if (label.lti && label.ref) {
                    var statement = "UPDATE `" + tt.getSQLTable(label.lti) + "` SET `ref` = " + label.ref +
                        " WHERE `lti` = '" + label.lti + "' LIMIT 1;";

                    arr.push(statement);
                }
            }
        });
    }

    // Send all data to the Output panel
    fl.trace(SQLUpdates.join("\n"));

})();