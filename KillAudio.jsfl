/**
 * Removes narration audio from Problem Sets
 * User: James McDonald
 * Date: 11/6/2020
 * Time: 1:12 PM
 */

function killAudio() {
    var audioDirectory;

    fl.outputPanel.clear();
    fl.trace("[-----KILL AUDIO-----]");

    //For each open document
    fl.documents.forEach(function (doc) {

        //If the current document is a Problem Set
        if (doc.name.match(/TT.+[LQ]\d{2,3}\.fla/i)) {
            fl.trace("\nInspecting " + doc.name);

            //Get the audio directory so it can be deleted
            audioDirectory = doc.library.items.filter(function (item) {
                return item.name.match(/^voice$|^a$|^sounds$/i);
            });
            audioDirectory = (audioDirectory.length > 0) ? audioDirectory[0] : null;

            //If the audio directory exists and is successfully deleted
            if (audioDirectory && doc.library.deleteItem(audioDirectory.name)) {

                //Log the deletion and save the document
                fl.trace("=> Deleted the '" + audioDirectory.name + "' directory");
                fl.saveDocument(doc, doc.pathURI);
            }
        }
    })
}

killAudio();