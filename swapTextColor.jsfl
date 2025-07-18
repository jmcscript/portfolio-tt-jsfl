/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 3/12/2020
 * Time: 10:43 AM
 */

fl.outputPanel.clear();

var doc = fl.getDocumentDOM();
var timeline = doc.getTimeline();
var layers = timeline.layers;
var changeCount = 0;

for (var i in layers) {
    if (!layers.hasOwnProperty(i)) {
        break;
    }

    var frames = layers[i].frames;

    for (var j in frames) {
        if (!frames.hasOwnProperty(j)) {
            break;
        }

        var elements = frames[j].elements;

        for (var k in elements) {
            if (!elements.hasOwnProperty(k)) {
                break;
            }

            var currentElement = elements[k];

            if (currentElement.elementType === "text") {
                var textRuns = currentElement.textRuns;

                for (var l in textRuns) {
                    if (!textRuns.hasOwnProperty(l)) {
                        break;
                    }

                    var textRun = textRuns[l];
                    var textAttributes = textRun.textAttrs;

                    if (textAttributes.fillColor === "#FFFFCE") {
                        textAttributes.fillColor += "00";
                        changeCount++;
                    }
                }
            }
        }
    }
}

fl.trace(changeCount + " texts alpha'd in " + doc.name);