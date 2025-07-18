/**
 * Iterate over FLAs and Publish as MP4s
 * User: James McDonald
 * Date: 10/13/2020
 * Time: 8:00 AM
 */

//Publish all open FLA files or a folder of FLA files as MP4s
function publishAsMP4s() {
    fl.showIdleMessage(false);
    fl.outputPanel.clear(); //Clear the Output Panel

    var documents, frameCount;
    var scenes = [];

    //If there are no open documents
    if (fl.documents.length === 0) {

        //Prompt the user to select a folder
        var documentPathURI = fl.browseForFolderURL("Select the folder containing FLA files");

        //Get a list of all files in the selected folder
        var documentNames =
            FLfile.listFolder(documentPathURI + "/" + "*fla", "files");

        //If there are FLA files found
        if (documentNames.length > 0) {

            //Open each FLA document
            documentNames.forEach(function (name) {
                fl.openDocument(documentPathURI + "/" + name);
                fl.trace("=> Opened file " + name);
            });
        }
    }

    //Get all open documents
    documents = fl.documents;

    //Alert the user if no docs are available to work on, otherwise process each file
    if (documents.length === 0) {
        alert("ERROR: No FLA files are available to modify.");
    } else {
        frameCount = 0;
        documents.forEach(function (document) {

            document.timelines.forEach(function (timeline, index) {

                scenes.push(new SceneCounter(index, frameCount, timeline.frameCount));
                frameCount += timeline.frameCount;
            });

            scenes.forEach(function (scene) {
                fl.trace(scene.name + ": start = " + scene.start +
                    ", duration = " + scene.duration);

                //Export to media encoder
                document.exportMedia(document.pathURI + scene.name, "H.264", "Default",
                    false, true, scene.name, scene.start, scene.duration);
            })
        });
    }

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

SceneCounter = function (index, startTime, duration) {
    this.name = "Scene " + (index + 1);
    this.start = Math.round(startTime * (1000 / 24));
    this.duration = Math.round(duration * (1000 / 24));
};

publishAsMP4s();