/**
 * Swaps User Box answerframes that are too short with ones of necessary height
 * User: James McDonald
 * Date: 10/5/2020
 * Time: 9:17 AM
 */

function scaleUserBoxes() {
	var answerFrames, framesFile, files, folderURI, lessons;

	fl.showIdleMessage(false);
	fl.outputPanel.clear();
	folderURI = fl.browseForFolderURL("Select the folder to process frames");
	files = FLfile.listFolder(folderURI, "files");
	framesFile = fl.openDocument(folderURI + "\/" + "frames.fla");
	answerFrames = framesFile.library.items.filter(isAnswerFrame);

	lessons = files.filter(function (value) {
		return value.match(/TT.+L|Q\d{2,3}\.fla/);
	})

	// For each lesson FLA in the selected directory
	lessons.forEach(function (name) {
		var cFrame, elements, height, lessonFile, nFrame, nFrameHeight, userBoxes;

		// Open the first lesson in the selected folder
		lessonFile = fl.openDocument(folderURI + "\/" + name);
		fl.trace("Processing Lesson " + lessonFile.name);

		// Get a list of all User Boxes in the current lesson
		userBoxes = lessonFile.library.items.filter(function (value) {
			return value.name.match(/(L|Q)(\d{1,3})_user/i);
		});

		// For each User Box in the current lesson
		userBoxes.forEach(function (userBox) {
			fl.trace("=> Analyzing User Box " + userBox.name.split("/")[1]);
			//lessonFile.editItem(userBox.name);
			/*elements = lessonFile.getTimeline().layers[0].frames[0].elements;
			cFrame = lessonFile.getTimeline().layers[1].frames[0].elements[0]*/;
		});
	})

	return;

	// For each Problem FLA in the current directory
	for (var i in lessons) {
		if (!lessons.hasOwnProperty(i)) {
			break;
		}

		var badBoxes, boxes, cFrame, elements, height, nFrame, nFrameHeight, lesson;

		lesson = fl.openDocument(folderURI + "\/" + lessons[i]);

		fl.trace(lesson.name + " is processing...")

		badBoxes = [];
		boxes = lesson.library.items.filter(isUserBox);

		// For each User Box in the current document library
		for (var j in boxes) {
			lesson.library.editItem(boxes[j].name);
			elements = lesson.getTimeline().layers[0].frames[0].elements;
			cFrame = lesson.getTimeline().layers[1].frames[0].elements[0];
			height = getRequiredHeight(elements);

			nFrame = getRequiredBackground(answerFrames, height)
			nFrameHeight = Number(nFrame.name.replace("ASSETS/answerframe", ""));

			if (nFrameHeight !== cFrame.height) {

				// Check if the frame exists in the lesson library.
				var hasFrame = lesson.library.itemExists(nFrame.name);

				lesson.getTimeline().layers[1].locked = false;

				if (!hasFrame) {
					lesson.addItem({
						x: 0,
						y: 0
					}, nFrame);
					lesson.clipCut();
				}

				lesson.selection = [cFrame];
				lesson.swapElement(nFrame.name);
				
				fl.trace(lesson.name + " swapped " + nFrame.name + " for a required height of " + height + " in " + boxes[i].name);
			}
		}
		
		fl.trace(lesson.name + " complete.\n");
		
		lesson.save();
		lesson.close();
	}

	framesFile.close();

	fl.showIdleMessage(false);
}

function getRequiredBackground(backgrounds, height) {
	var bgHeight, bgName;

	for (var i in backgrounds) {
		if (!backgrounds.hasOwnProperty(i)) {
			break;
		}

		bgName = backgrounds[i].name;
		bgHeight = Number(bgName.replace("ASSETS/answerframe", ""));

		if (bgHeight >= height) {
			return backgrounds[i];
		}
	}
}

// Checks a User Box movieclip's required height
function getRequiredHeight(elements) {
	var topText = null;
	var goButton = null;

	elements.forEach(
		function (element) {
			if (element.elementType === "text") {
				if (topText !== null) {
					topText = (topText.top < element.top) ? topText : element;
				} else {
					topText = element;
				}
			}

			if (element.name.indexOf("button") > -1) {
				goButton = element;
			}
		});

	return goButton.top + goButton.height - topText.top + 20;
}

function isAnswerFrame(item) {
	return item.name.indexOf("answerframe") > -1;
}

function isUserBox(item) {
	return item.name.indexOf("_User") > -1;
}

scaleUserBoxes();