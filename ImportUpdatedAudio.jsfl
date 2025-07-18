/**
 * Import audio into each FLA to update the library items they were exported from
 * User: James McDonald
 * Date: 07/10/2021
 * Time: 08:00 AM
 * Version: 4.0.0
 */

(function () {
    fl.showIdleMessage(false);

    const tt = (function () {
        const ttUtilURI = "file:///c|/git/automation/TTUtil.jsfl";
        if (fl.fileExists(ttUtilURI)) {
            fl.runScript(ttUtilURI);
            return new TTUtil();
        }
        alert("TTUtil.js did not load successfully");
        return null;
    })();

    const failedFiles = [];
    const libraryPath = "_vmAudio";
    const filesPathURI = fl.browseForFolderURL("Select the desired folder");

    /** @type {FileInfo[]} */
    const animateFiles = [];
    /** @type {FileInfo[]} */
    var audioFiles = [];

    tt.getAllFilesByExtension("fla", filesPathURI, animateFiles);
    tt.getAllFilesByExtension("mp3", filesPathURI, audioFiles);

    const limit = 5;
    var count = animateFiles.length;
    while (count--) {

        /**
         * Open files in batches determined by the limit
         */
        if (limit > fl.documents.length) fl.openDocument(animateFiles[count].uri);

        /**
         * Process the current batch of 10 files or the remainder when the list is exhausted
         */
        if (fl.documents.length === limit || count === 0) {
            fl.documents.forEach(function (doc) {

                tt.log(doc.name, "new");

                // Filter audio for those nested in a folder named for the current Document
                const docAudioFiles = audioFiles.filter(function (audio) {
                    return audio.uri.indexOf("/" + doc.name.slice(0, -4) + "/") > -1;
                });

                docAudioFiles.forEach(function (audio) {
                    try {
                        findAndReplaceInLibrary(doc, audio, libraryPath);
                    } catch (e) {
                        tt.log("ERROR: findAndReplaceInLibrary() failed > " + e.message);
                    }
                });

                doc.save(true);
                doc.close();
            });
        }
    }

    if (failedFiles.length > 0) updateErrorLog(failedFiles);

    /**
     * Given a FileInfo object, look for a match in the Document and overwrite it using move operations.
     * @param {Document} doc
     * @param {FileInfo} file
     * @param {string} path
     */
    function findAndReplaceInLibrary(doc, file, path) {
        // Find an acceptable replacement candidate in the doc library
        const libraryItem = matchInLibrary(doc, file.relativePath);

        // If a matching item exists, attempt to update it with the external file in the libraryPath destination
        if (libraryItem) {
            try {
                updateLibraryItem(doc, libraryItem, file, libraryPath);
            } catch (e) {
                tt.log("ERROR: Failed to update item: " + libraryItem + " > " + e.message);
                if (failedFiles.indexOf(file.uri) === -1) failedFiles.push("\n" + file.uri);
            }
        } else {
            tt.log("No matching library item found for file: " + file.uri);
            if (failedFiles.indexOf(file.uri) === -1) failedFiles.push("\n" + file.uri);
        }
    }

    /**
     * Searches the doc Library for and returns an Item with an exact or very similar audio name.
     * If no match is found, null is returned.
     * @param doc {Document}
     * @param audioPath {string}
     * @returns {Item|null}
     */
    function matchInLibrary(doc, audioPath) {

        const exactMatch = doc.library.items.filter(function (item) {
            return doc.library.unusedItems.indexOf(item) === -1 &&
                item.name === audioPath;
        });

        if (exactMatch.length === 1) return exactMatch[0];

        const fuzzyMatch = doc.library.items.filter(function (item) {
            return doc.library.unusedItems.indexOf(item) === -1 &&
                (item.name === audioPath.slice(0, -4) ||
                    item.name === audioPath.slice(0, -4) + ".wav");
        });

        if (fuzzyMatch.length === 1) return fuzzyMatch[0];

        return null;
    }

    /**
     * Swaps a library item with a matching file by placing them in the same folder
     * @param doc {Document}
     * @param item {Item}
     * @param file {FileInfo}
     * @param folder {string}
     */
    function updateLibraryItem(doc, item, file, folder) {
        const hasFolder = doc.library.itemExists(folder);

        // Create the destination folder if necessary
        if (!hasFolder) {
            if (doc.library.newFolder(folder)) tt.log("New folder created in library: " + folder);
        }

        // Rename the original library item to match the updated file
        item.name = file.fullName;
        if (item.name === file.fullName) tt.log("Successfully renamed legacy item");

        // Move the original library item to the destination folder
        if (item.name.indexOf(folder) === -1) {
            if (doc.library.moveToFolder(folder, item.name, true)) tt.log("Moved item: " + item.name);
        }

        // Import the updated audio file to the library
        if (doc.importFile(file.uri, true)) {
            tt.log("Imported file to the library: " + file.fullName);
        }

        // Move the imported audio to the destination folder, replacing the legacy audio
        if (doc.library.moveToFolder(folder, file.fullName, true)) {
            tt.log("Audio updated successfully");
        } else {
            tt.log("Audio not updated successfully");
        }

        doc.save(true);
    }

    /**
     * Given an array of file URIs, output each to a new line in a text file
     * @param {string[]} files
     */
    function updateErrorLog(files) {
        FLfile.write((fl.scriptURI.slice(0, fl.scriptURI.lastIndexOf("/")) + "/error-log.txt"),
            files.join("\n"), "append");
    }

    fl.showIdleMessage(true);
})();