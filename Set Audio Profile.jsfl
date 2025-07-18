/**
 * Set Audio Profile.jsfl v0.0.2
 *
 * Set library audio compression and file publish settings
 * Author: James McDonald
 * Last Updated: 2021.11.10 12:45 CST
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

    const profileName = "Lecture";
    const profileURI = tt.automationURI + "publish-profiles" + "/" + profileName + ".xml";
    const defaultCompression = "Default";
    const docsPathURI = fl.browseForFolderURL("Select the folder");
    /** @type {string[]} */
    const docs = [];
    const limit = 20;

    tt.getAllFlaFiles(docsPathURI, docs);

    var index = docs.length;
    while (index--) {
        fl.openDocument(docs[index]);

        if (fl.documents.length >= limit || index === 0) {
            fl.documents.forEach(function (doc) {
                tt.log(doc.name, "new");
                setAudioProfile(doc, profileName, defaultCompression);
            })
        }
    }

    /**
     * Set the doc Publish Profile to profileName after importing it. Set all timeline audio to the defaultCompression.
     */
    function setAudioProfile(doc, profileName, defaultCompression) {
        const library = doc.library;
        var errorCount = 0;

        // Apply Lecture publish profiles
        doc.importPublishProfile(profileURI);
        doc.currentPublishProfile = profileName;

        if (doc.currentPublishProfile === profileName) {
            tt.log("Publish Profile set to '" + profileName + "'");
        } else {
            tt.log("ERROR: Failed to set the Publish Profile to " + profileName);
            errorCount++;
        }

        // Apply proper compression setting to library audio items
        /** @type {SoundItem[]} */
        const usedSounds = library.items.filter(function (item) {
            return item.itemType === "sound" &&
                library.unusedItems.indexOf(item) === -1 &&
                !item.linkageClassName;
        });

        usedSounds.forEach(function (sound) {
            sound.compressionType = defaultCompression;

            if (sound.compressionType === defaultCompression) {
                tt.log(sound.name + " set to " + defaultCompression + " compression");
            } else {
                tt.log("ERROR: Failed to set compressionType on " + sound.name);
                errorCount++;
            }
        })

        // Save and close the document if there were no errors
        doc.save(errorCount === 0);
        doc.close(false);
    }
})();