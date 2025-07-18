/**
 * Created with IntelliJ IDEA.
 * User: James McDonald
 * Date: 12/5/2019
 * Time: 11:19 AM
 */

fl.showIdleMessage(false);

fl.outputPanel.clear();

fl.trace("Processing Solutions...");

var solutionsPathURI = fl.browseForFolderURL("Select the Solutions folder");
var solutionsFolders = FLfile.listFolder(solutionsPathURI, "directories");
var currentFolderURI;
var flaFilesURI;
var currentDocuments;

function setupSolutions() {
    for (var f in solutionsFolders) {
        if (!solutionsFolders.hasOwnProperty(f)) {
            break;
        }

        currentFolderURI = solutionsPathURI + "/" + solutionsFolders[f] + "/" + "fla" + "/";
        flaFilesURI = currentFolderURI + "*fla";
        currentDocuments = FLfile.listFolder(flaFilesURI, "files");

        for (var i = 0; i < currentDocuments.length; i++) {
            fl.openDocument(currentFolderURI + currentDocuments[i].toString());
        }

        for (var j in fl.documents) {
            if (!fl.documents.hasOwnProperty(j)) {
                break;
            }

            setupSolution(fl.documents[j]);
            fl.documents[j].exportSWF(fl.documents[j].pathURI, true);
        }

        fl.saveAll();

        while (fl.documents.length > 0) {
            fl.documents[0].close();
        }
    }
}

function setupSolutionsFolder(folderURI) {
    flaFilesURI = folderURI + "/" + "*fla";
    currentDocuments = FLfile.listFolder(flaFilesURI, "files");

    //Open all files in the designated folder
    currentDocuments.forEach(function (docURI) {
        fl.openDocument(folderURI + "/" + docURI);
    });

    //Setup each solution document and export it
    fl.documents.forEach(function (solution) {
        setupSolution(solution);
        solution.exportSWF(solution.pathURI, true);
    });

    //Save all converted documents
    fl.saveAll();

    //Close all open documents
    fl.documents.forEach(function (solution) {
        solution.close();
    });
}

/**
 * Convert a Solution document as needed
 * @param {Document} document
 */
function setupSolution(document) {
    var sceneCount = 0;

    while (sceneCount < document.timelines.length) {
        try {
            document.editScene(sceneCount);

            if (sceneCount > 0) {
                fl.trace(document.name + ", " + String(sceneCount + 1));
            }

            var layers = document.getTimeline().layers;

            for (var j in layers) {
                if (!layers.hasOwnProperty(j)) {
                    break;
                }

                var isNotepadLayer =
                    (layers[j].layerType === "folder") && Boolean(layers[j].name.match(/bg/i));

                if (isNotepadLayer) {
                    document.getTimeline().deleteLayer(Number(j));
                    continue;
                }

                if (layers[j].frames.length > 0) {
                    layers[j].frames[0].actionScript = "";
                    layers[j].frames[layers[j].frames.length - 1].actionScript = "";
                }
            }
            sceneCount++;

        } catch (e) {
            break;
        }
    }
}

setupSolutionsFolder(solutionsPathURI);

//setupSolutions();

fl.showIdleMessage(true);