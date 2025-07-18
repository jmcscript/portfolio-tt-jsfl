/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 7/3/2019
 * Time: 4:06 PM
 * To change this template use File | Settings | File Templates.
 */

//Trick to help prevent the app from crashing when processing multiple files
fl.setActiveWindow(fl.getDocumentDOM());

//Clear the output panel
fl.outputPanel.clear();

//1. Get the audio file from the timeline or the library
var document = fl.getDocumentDOM();
var fileSize = "";
var framesNeeded;
var jmc = .00301;
var layers = document.getTimeline().layers;
var libItems = document.library.items;
var newFrameCount;
var oldFrameCount = document.getTimeline().frameCount;
var problemAudio = "";
var scriptLayer;

for (var i in libItems) {
    var itemName = libItems[i].name;

    if (((itemName.indexOf("practice") > -1) || (itemName.indexOf("problem") > -1)) &&
        itemName.indexOf("mp3") > -1){
        problemAudio = libItems[i];
        break;
    }
}

//2. Determine the number of frames required to reach the end of the audio
var fileSize = Number(FLfile.getSize(problemAudio.sourceFilePath));
newFrameCount = Math.ceil(fileSize * jmc);

//3. Pad the timeline with the requisite number of frames
document.getTimeline().insertFrames(
    (newFrameCount - oldFrameCount), true, oldFrameCount - 1);

//4. Alert the user if the new frame count exceeds 16,000
if (document.getTimeline().frameCount > 16000) {
    alert("Your file exceeds the 16,000 frame maximum.");
}

//5. Detect which layer is using ActionScript
for (var j in layers) {
    if (layers[j].frames[0].actionScript.length > 0) {
        scriptLayer = Number(j);
        break;
    }
}

//6. Add a keyframe on the last frame of the Script layer, and then add a stop() command to that keyframe's scripts
document.getTimeline().currentLayer = scriptLayer;
document.getTimeline().insertKeyframe(newFrameCount-1);

layers[scriptLayer].frames[newFrameCount-1].actionScript = "stop();";