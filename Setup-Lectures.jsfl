//Global variable declarations
var allLayers, lectureFile, interactionLayer, labelLayer, scriptLayer;

function main() {
	fl.showIdleMessage(false);
	fl.outputPanel.clear();

	//Capture assets.fla and all open lectures
	var assets = getFlashFiles(fl.documents, "assets")[0];
	var lectures = getFlashFiles(fl.documents, "TT");

	//Iterate over all lecture files
	for (var i in lectures) {
		if (!lectures.hasOwnProperty(i)) {
            break;
        }

        lectureFile = null;

        var boxesDirectory = "",
            lectureNumber = "",
            sceneCount = 0;

        lectureFile = lectures[i];
        sceneCount = lectureFile.timelines.length;

        fl.setActiveWindow(lectureFile);

        lectureNumber = String(Number(lectureFile.name.match(/(l)([0-9]{1,3})/i)[2].toString()));
        log("Processing lectureFile " + lectureFile.name + "...");

        //Create User Boxes folder
        boxesDirectory = createUserBoxesDirectory(lectureNumber);

        //Import _faux assets
        importAssets(assets, "_faux");

        while (--sceneCount >= 0) {
            try {
                //Initialize global variables
                allLayers = [];
                interactionLayer = null;
                labelLayer = null;

                var labels = [];

                lectureFile.editScene(sceneCount);
                log("→ Updating scene: " + (sceneCount + 1));

                allLayers = lectureFile.getTimeline().layers;
                getLabelLayer();
                labelLayer.locked = true;

                //Get all frame labels and associated numbers
                labels = getLabels(labelLayer);

                //Duplicate User Boxes for each label
                createUserBoxes(
                    lectureNumber,
                    labels,
                    "_faux/LECx_UserX",
                    boxesDirectory
                );
            } catch (error) {
                break;
            }
        }

        //Rename User Boxes linkage attributes
        updateBoxLinkages(boxesDirectory);

        log("=> Finished processing lectureFile " + lectureFile.name + "\n");
    }

	fl.showIdleMessage(true);
}

//Create a faux User Box for each interaction in the lectureFile
function createUserBoxes(lectureNumber, labels, boxName, directory) {
    var timeline = lectureFile.getTimeline(),
        newBoxName = "";

    try {
        for (var i in labels) {
            if (!labels.hasOwnProperty(i)) {
                break;
            }
            newBoxName = "LEC" + lectureNumber + "_User" + labels[i].name.slice(2);
            getInteractionLayer(labels[i].frame - 1);
            timeline.layers[interactionLayer].locked = false;
            timeline.currentLayer = interactionLayer;
            timeline.currentFrame = labels[i].frame - 1;
            lectureFile.library.duplicateItem(boxName);
            lectureFile.library.renameItem(newBoxName);
            lectureFile.library.moveToFolder(directory);
            lectureFile.library.addItemToDocument({
                x: 250,
                y: 225
            });
            lectureFile.arrange("back");
            lectureFile.library.selectNone();
            log("=> Created User Box " + newBoxName);
        }
    } catch (error) {
        log("Error in createUserBoxes()");
    }
}

//Create a folder fo the faux asset User Boxes
function createUserBoxesDirectory(num) {
	var folderName = num + "USER BOXES LECTURE";

	while (folderName.length < 21) {
		folderName = "0" + folderName;
	}

	if (!lectureFile.library.itemExists(folderName)) {
		lectureFile.library.newFolder(folderName);
		log("=> Created " + folderName + " library folder");
	}

	return folderName;
}

// Returns a list of files with .fla extension, or .fla files with a prefix somewhere in the name
function getFlashFiles(files, prefix) {
	var flashFiles;

	prefix = ((typeof prefix == "string") && (prefix.length > 0)) ? prefix : "";
	flashFiles = files.filter(function (file) {
		if ((file.name.indexOf(".fla") > -1) && (file.name.indexOf(prefix) > -1)) {
			return file;
		}
	});
	return flashFiles;
}

/**
 * Return an array with all layer names and associated frame numbers
 * @param {Layer} layer
 * @returns {*[]}
 */
function getLabels(layer) {
    /*var currentLabel,
        labelNames = [];*/

    var labelArray = [];

    if (layer.layerType === "normal") {
        var f = layer.frameCount;
        var frame;

        while (--f >= 0) {
            f = layer.frames[f].startFrame;
            frame = layer.frames[f];

            if (frame.name.length > 0) {
                //labelNames.push(frame.name);
                labelArray.push(
                    {
                        name: frame.name,
                        frame: Number(f) + 1
                    }
                );
            }
        }
    }

    // for (var i in labelLayer.frames) {
    //     if (!labelLayer.frames.hasOwnProperty(i)) {
    //         break;
    //     }
    //
    // 	currentLabel =
    // 		(labelLayer.frames[i].name.length > 0) ? labelLayer.frames[i].name : null;
    //
    // 	if (currentLabel && labelNames.indexOf(currentLabel) === -1) {
    // 		labelNames.push(currentLabel);
    // 		labelArray.push({
    // 			name: currentLabel,
    // 			frame: Number(i) + 1
    // 		});
    // 	}
    // }
    // log("=> Captured all labels");
    return labelArray;
}

function getLabelLayer() {
	//Iterate each layer in the current lectureFile
	for (var i in allLayers) {
        if (!allLayers.hasOwnProperty(i)) {
            break;
        }

		var frames = allLayers[i].frames;

		//Iterate each element on the current frame
		for (var j in frames) {
            if (!frames.hasOwnProperty(j)) {
                break;
            }

			if ((!labelLayer) && frames[j].name.length > 0) {
				labelLayer = allLayers[i];
				log("=> Label layer: " + labelLayer.name);
			}
		}
	}
}

function getInteractionLayer(frame) {
	for (var i in allLayers) {
        if (!allLayers.hasOwnProperty(i)) {
            break;
        }

		if (allLayers[i].frames[frame]) {
			var elements = allLayers[i].frames[frame].elements;

			//Iterate each element on the current frame
			for (var j in elements) {
                if (!elements.hasOwnProperty(j)) {
                    break;
                }

				var name = elements[j].name;

				if ((name.indexOf("input") > -1) || (name.indexOf("button") > -1)) {
					interactionLayer = Number(i);
					return;
				}
			}
		}
	}
}

function importAssets(sFile, path) {

	//If the desired path doesn't exist in the lecture file, copy them to its library
	if (!lectureFile.library.itemExists(path)) {
		fl.copyLibraryItem(sFile.pathURI, path);
		lectureFile.getTimeline().getSelectedLayers()[0].locked = true;
		lectureFile.clipPaste();
		log("=> Imported '" + path + "' assets to library");

		//If the imported assets are on the stage, remove them
		if (lectureFile.selection.length > 0) {
			lectureFile.deleteSelection();
		}
	}
}

// Send a message to the Output panel
function log(msg, init) {
	if (init) fl.outputPanel.clear();
	fl.outputPanel.trace(msg);
}

//Update User Boxes linkage names to match the symbol names
function updateBoxLinkages(boxesDirectory) {
    /*var boxSearchExp = /.*user(\d\d?)$/i;
    var boxes = lectureFile.library.items.filter(function (item) {
        return item.name.match(boxSearchExp);
    });

    var boxName = boxes[1].name.split("/")[1];

    if (boxes[1].linkageClassName !== boxName) {
        boxes[1].linkageClassName = boxName;
    }

    return;*/

    try {
        lectureFile.library.items.forEach(function (item, index) {
            if (item.name.indexOf(boxesDirectory + "/") > -1) {
                item.linkageClassName = item.name.split("/")[1];
                log(item.name);
                item.linkageBaseClass = "flash.display.MovieClip";
            }
        });
        log("=> Updated User Box linkages");
    } catch (error) {
        log("Error in updateBoxLinkages()");
    }
}

main();