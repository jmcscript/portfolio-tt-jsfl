/**
 * When working with Proofs, this script will adjust the height of the proofDrag element
 * User: James McDonald
 * Date: 1/22/2021
 * Time: 6:49 AM
 */

function proofScale() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts
    fl.outputPanel.clear(); //Clear the Output Panel

    var tt;
    var ttUtilURI = "file:///c|/git/automation/TTUtil.jsfl";

    if (fl.fileExists(ttUtilURI)) {
        fl.runScript(ttUtilURI);
        tt = new TTUtil();
    } else {
        alert("TTUtil did not load successfully");
    }

    var document = fl.getDocumentDOM();
    var proofSteps;
    var proofDrag;
    var proofHeight;

    proofSteps = document.library.items.filter(function (item) {
        return item.name.match(/proof.+steps$/i)
    });

    for (var i = 0; i < proofSteps.length; i++) {
        scaleProofDrag(proofSteps[i]);
    }

    function positionProofSteps() {
        var requiredYPosition = 0;
        var sortedSelection = document.selection.sort(function (a, b) {
            return a.y > b.y;
        });

        var topLibraryItem = (sortedSelection[0].libraryItem) ? sortedSelection[0].libraryItem.name : null;
        var isQuestionBox = (topLibraryItem && topLibraryItem.length > 0) ?
            Boolean(topLibraryItem.match(/statement|reason/i)) : false;

        if (isQuestionBox) {
            requiredYPosition = 30 - document.getSelectionRect().top;
        } else {
            requiredYPosition = 15 - document.getSelectionRect().top;
        }

        if (requiredYPosition) {
            document.moveSelectionBy({x: 0, y: requiredYPosition});
            tt.log("Moved Proof Steps selection: " + requiredYPosition);
        }
    }

    function scaleProofDrag(item) {
        document.library.editItem(item.name);
        tt.log("Editing " + item.name, "new");

        document.getTimeline().layers.forEach(function (layer) {
            layer.locked = false;
        });
        tt.log("Unlocked All Layers");

        document.selectAll();
        tt.log("Selected All Elements");

        proofDrag = document.selection.filter(function (element) {
            return element.name === "proofDrag";
        });

        if (proofDrag.length > 0) {
            proofDrag = proofDrag[0];
            tt.log("Identified proofDrag element");
        } else {
            tt.log("Couldn't find proofDrag element");
            return;
        }

        proofDrag.selected = false;
        tt.log("De-selected proofDrag Element");

        positionProofSteps();

        proofHeight = Math.round(document.getSelectionRect().bottom) + 10;
        tt.log("Computing necessary height: " + proofHeight);

        if (proofHeight !== Math.round(proofDrag.height)) {
            proofDrag.height = proofHeight;
            proofDrag.y = 0;
            tt.log("proofDrag element resized");
        } else {
            tt.log("proofDrag doesn't need resizing")
        }

        document.exitEditMode();

        tt.log("Finished editing " + item.name);
    }

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

proofScale();