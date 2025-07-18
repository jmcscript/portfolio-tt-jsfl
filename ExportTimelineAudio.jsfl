/**
 * Export timeline audio to their native format for modification
 * User: James McDonald
 * Date: 6/22/2021
 * Time: 12:47 PM
 */
(function () {
    /**
     * Load the TTUtil library for use throughout
     * @type {TTUtil|null}
     */
    const tt = (function () {
        const ttUtilURI = "file:///c|/git/automation/TTUtil.jsfl";
        if (fl.fileExists(ttUtilURI)) {
            fl.runScript(ttUtilURI);
            return new TTUtil();
        }
        alert("TTUtil did not load successfully");
        return null;
    })();

    fl.showIdleMessage(false);

    const filesPathURI = fl.browseForFolderURL("Select the FLA folder");
    const files = [];
    tt.getAllFlaFiles(filesPathURI, files);
    const badFiles = [];
    var count = files.length;

    while (count--) {

        /**
         * Open files in batches of 10
         */
        if (fl.documents.length < 10) fl.openDocument(files[count]);

        /**
         * Process the current batch of 10 files or the remainder when the list is exhausted
         */
        if (fl.documents.length === 10 || count === 0) {
            fl.documents.forEach(function (file) {
                tt.log(file.name, "new");

                const path = file.pathURI.slice(0, -4) + "/";

                /**
                 * A list of timeline audio from the library
                 * @type {SoundItem[]}
                 */
                const audio = file.library.items.filter(function (item) {
                    return item.itemType === "sound" &&
                        file.library.unusedItems.indexOf(item) === -1 &&
                        item.name.match(/^((?!correct|wrong).)*$/gi);
                })

                /**
                 * Create output directory if necessary
                 */
                if (!FLfile.exists(path)) FLfile.createFolder(path);

                /**
                 * Export all designated audio
                 */
                audio.forEach(function (item) {
                    const audioRegEx = /\.mp3$|\.wav$/gi;
                    const fileExt = item.sourceFilePath.match(audioRegEx);
                    const fileName = item.name.match(audioRegEx) ? item.name : item.name + fileExt;
                    const filePath = path + fileName;

                    try {
                        if (item.exportToFile(filePath)) tt.log(filePath);
                    } catch (e) {
                        if (badFiles.indexOf(file.name) === -1) badFiles.push("\n" + file.name);
                        badFiles.push(filePath);
                    }
                });

                file.close(false);
            });
        }
    }
    FLfile.write((fl.scriptURI.slice(0, fl.scriptURI.lastIndexOf("/")) + "/error-log.txt"),
        badFiles.join("\n"), "append");
    fl.showIdleMessage(true);
})();