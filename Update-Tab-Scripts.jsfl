/**
 * Iterate over Problem Sets and strip tabGroup interactions of ActionScript
 * User: James McDonald
 * Date: 10/13/2020
 * Time: 8:00 AM
 */

//Remove ActionScript from tabGroup elements for a number of documents
function updateTabScripts() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts
    fl.outputPanel.clear(); //Clear the Output Panel

    var lessonDocs, lessonNames;

    //If there are no open documents
    if (fl.documents.length === 0) {

        //Prompt the user to select a folder
        var lessonPathURI = fl.browseForFolderURL("Select the folder containing Lessons");

        //Get a list of all files in the selected folder
        var lessonPathFLAs =
            FLfile.listFolder(lessonPathURI, "files");

        //If there are FLA files found
        if (lessonPathFLAs.length > 0) {

            //Get valid lesson file names
            lessonNames = getLessons(lessonPathFLAs);

            //Open each valid lesson name
            lessonNames.forEach(function (lessonName) {
                fl.openDocument(lessonPathURI + "/" + lessonName);
            });
        }

        //Get all open documents, previously validated
        lessonDocs = fl.documents;
    } else {
        //Get all open documents that are valid lessons
        //lessonDocs = getFiles(fl.documents);
        lessonDocs = fl.documents;
    }

    //Alert the user if no docs are available to work on, otherwise process each lesson
    if (lessonDocs.length === 0) {
        alert("ERROR: No Lesson files are available to modify.");
    } else {
        lessonDocs.forEach(function (lessonDoc) {
            var currentDocName = lessonDoc.name;
            var isDirty = updateLessonTabs(lessonDoc);

            if (isDirty) {
                fl.saveDocument(lessonDoc, lessonDoc.pathURI);
                fl.trace("=> Saved file " + currentDocName);
            }

            fl.closeDocument(lessonDoc);
            fl.trace("=> Closed file " + currentDocName);
        });
    }

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

//Return the array of docs with only lesson LTIs
function getLessons(docs) {
    var lessonRegExp = /TT.+\.L|Q\d{2,3}\.fla/;

    return docs.filter(function (doc) {
        if (typeof doc === "object") {
            return doc.name.match(lessonRegExp);
        } else if (typeof doc === "string") {
            return doc.match(lessonRegExp);
        }
    });
}

//Check each tabGroup library item in a lesson, and remove all ActionScript
function updateLessonTabs(lesson) {
    fl.trace("\nInspecting lesson " + lesson.name);

    var isLessonModified = false;

    //Get all tabGroup items from the library of the current lesson
    var tabGroups = lesson.library.items.filter(function (value) {
        return value.name.match(/tabgroup/i);
    });

    if (tabGroups.length === 0) {
        fl.closeDocument(lesson);
        return false;
    }

    //For each tabGroup
    tabGroups.forEach(function (tabGroup) {

        //Edit the tabGroup
        lesson.library.editItem(tabGroup.name);
        fl.trace("=> Inspecting " + tabGroup.name);

        //For each Layer
        lesson.getTimeline().layers.forEach(function (layer) {

            //For each frame
            layer.frames.forEach(function (frame) {

                //If the frame has actionScript, remove it
                if (frame.actionScript.length > 0) {
                    frame.actionScript = "";
                    if (isLessonModified === false) {
                        isLessonModified = true;
                    }
                }
            })
        })

        //Return to the lesson's main timeline
        lesson.exitEditMode();
    });

    if (isLessonModified) {
        fl.trace("=> Updated lesson " + lesson.name);
        return true;
    }
}

updateTabScripts();