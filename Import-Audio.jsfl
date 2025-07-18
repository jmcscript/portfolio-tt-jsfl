/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 1/24/2020
 * Time: 11:55 AM
 */


function main() {
    fl.outputPanel.clear();

    var directory = fl.browseForFolderURL("Select the desired folder containing FLAs and audio");
    var allFlashFiles = FLfile.listFolder(directory + "/*fla", "files");
    var allAudioFiles = FLfile.listFolder(directory + "/*mp3", "files");

    var lessonAudio = [], lessonFlash = [], practiceAudio = [], practiceFlash = [], quizAudio = [], quizFlash = [];
    var numLesson = 0, numPractice = 0, numQuiz = 0;
    var lessonPrefix = "", practicePrefix = "", quizPrefix = "";

    lessonFlash = allFlashFiles.filter(function(value) { return getProbType(value) == "lesson"; });
    practiceFlash = allFlashFiles.filter(function(value) { return getProbType(value) == "practice"; });
    quizFlash = allFlashFiles.filter(function(value) { return getProbType(value) == "quiz"; });

    lessonAudio = allAudioFiles.filter(function(value) { return getProbType(value) == "lesson"; });
    practiceAudio = allAudioFiles.filter(function(value) { return getProbType(value) == "practice"; });
    quizAudio = allAudioFiles.filter(function(value) { return getProbType(value) == "quiz"; });

    numLesson = Math.max(lessonFlash.length, lessonAudio.length);
    numPractice = Math.max(practiceFlash.length, practiceAudio.length);
    numQuiz = Math.max(quizFlash.length, quizAudio.length);

    if (numLesson > 0) {
        checkForMissingFiles(numLesson, lessonFlash, getLTIFullPrefix(lessonFlash[0]), ".fla");
        checkForMissingFiles(numLesson, lessonAudio, getLTIFullPrefix(lessonFlash[0]), ".mp3");
        importAudio(directory, lessonFlash, lessonAudio);
    }

    if (numPractice > 0) {
        checkForMissingFiles(numPractice, practiceFlash, getLTIFullPrefix(practiceFlash[0]), ".fla");
        checkForMissingFiles(numPractice, practiceAudio, getLTIFullPrefix(practiceFlash[0]), ".mp3");
        importAudio(directory, practiceFlash, practiceAudio);
    }

    if (numQuiz > 0) {
        checkForMissingFiles(numQuiz, quizFlash, getLTIFullPrefix(quizFlash[0]), ".fla");
        checkForMissingFiles(numQuiz, quizAudio, getLTIFullPrefix(quizFlash[0]), ".mp3");
        importAudio(directory, quizFlash, quizAudio);
    }
}

function checkForMissingFiles(num, files, prefix, type) {
    for (var i = 1; i <= num; i++) {
        if ((i < 10) && (num > 9) && (files.indexOf(prefix + 0 + i + type) == -1)) {
            fl.trace(prefix + 0 + i + type + " is missing.");
        } else if ((i < 10) && (num < 9) && (files.indexOf(prefix + i + type) == -1)) {
            fl.trace(prefix + i + type + " is missing.");
        } else if ((i >= 10) && (files.indexOf(prefix + i + type) == -1)) {
            fl.trace(prefix + i + type + " is missing.");
        }
    }
}

function getLTIFullPrefix(file) {
    return file.match(/(.+[PX])(\d+\.)(fla|mp3)/i)[1];
}

function getProbType(file) {
    if (file.match(/L.+P\d{2}/i)) {
        return "lesson";
    } else if (file.match(/L.+X\d+/i)) {
        return "practice";
    } else if (file.match(/Q.+P\d{2}/i)) {
        return "quiz";
    } else {
        return "unknown";
    }
}

function importAudio(directory, flashFiles, audioFiles) {
    for (var i in flashFiles) {
        var audioName = flashFiles[i].split(".fla")[0] + ".mp3";

        if (audioFiles.indexOf(audioName) == -1) {
            continue;
        }

        var file = fl.openDocument(directory + "/" + flashFiles[i]);
        fl.trace("\n" + "Processing file " + file.name);

        file.importFile(directory + "/" + audioName, true);
        var sound = file.library.items[file.library.findItemIndex(audioName)];
        fl.trace("=> Imported audio");

        file.getTimeline().currentLayer = 0;
        var layerIndex = file.getTimeline().addNewLayer("audio", "normal", true);
        fl.trace("=> Created audio layer");

        file.getTimeline().layers[layerIndex].frames[0].soundLibraryItem = sound;
        file.getTimeline().layers[layerIndex].frames[0].soundSync = "stream";
        fl.trace("=> Added mp3 to new audio layer");
        fl.trace("=> Finished processing file " + file.name);
    }
}

main();