/**
 * TTUtil JSFL Library v4.0.2
 *
 * Description: Provides common methods and variables for processing Lectures, Lessons, Quizzes and Solutions
 * Author: James McDonald
 * Last Updated: 2021.08.08 08:13 CDT
 */

TTUtil = function () {
    fl.outputPanel.clear();

    this.automationURI = "file:///C|/git/automation/";

    fl.outputPanel.clear();
    fl.trace("TTUTil.jsfl [" + new Date() + "]");
    fl.trace("Running script: " + fl.scriptURI);
};


/**
 *
 * @param {Document} document
 * @param {RegExp} regExp
 */
TTUtil.prototype.deleteDirectory = function (document, regExp) {
    var directory = document.library.items.filter(function (item) {
        return item.name.match(regExp);
    });

    if (directory.length === 1) {
        document.library.deleteItem(directory[0].name)
        this.log("Deleted the " + directory[0].name + " folder");
    }
}

TTUtil.prototype.deleteLayer = function (document, layer) {
    var layerIndex = (document.getTimeline().findLayerIndex(layer.name) !== undefined) ?
        document.getTimeline().findLayerIndex(layer.name)[0] : -1;

    if (layerIndex > -1) {
        document.getTimeline().deleteLayer(layerIndex);
        this.log("Removed '" + layer.name + "' layer");
    }
}

/**
 * Remove items with the linkageIdentifier set
 * @param document {Document}
 */
TTUtil.prototype.deleteLinkageItems = function (document) {
    const tt = this;

    const linkageItems = document.library.items.filter(function (item) {
        return !!(item.linkageClassName && item.linkageClassName.length > 0);
    });

    linkageItems.forEach(function (lItem) {
        document.library.deleteItem(lItem.name);
        tt.log("Deleted linkage item: " + lItem.name);
    });
}

TTUtil.prototype.getFiles = function (regExp, single) {
    var _fileArray = fl.documents.filter(function (value) {
        return value.name.match(regExp);
    });

    if (single === true) {
        return (_fileArray.length === 1) ? _fileArray[0] : null;
    } else {
        return (_fileArray.length > 0) ? _fileArray : null;
    }
};

/**
 * Search for any frame scripts and remove them
 * @param {Timeline} timeline
 */
TTUtil.prototype.findAndRemoveActionScript = function (timeline) {

    // Iterate over every layer
    timeline.layers.forEach(function (layer) {

        // Check for and delete ActionScript on 'normal' layers
        if (layer.layerType === "normal") {
            var f = layer.frameCount;
            var frame;

            while (--f >= 0) {
                f = layer.frames[f].startFrame;
                frame = layer.frames[f];

                if (frame.actionScript.length > 0) {
                    frame.actionScript = "";
                    TTUtil.prototype.log("Deleted ActionScript: " + timeline.name + " » " + layer.name + " (" + f + ")");
                }
            }
        }
    });
}

/**
 * Updates the provided fileList array with any <ext> files found in the parentFolder or any children using recursion
 * @param {string} ext
 * @param {string} parentFolder
 * @param {Array<FileInfo>} fileList
 */
TTUtil.prototype.getAllFilesByExtension = function (ext, parentFolder, fileList) {
    const children = FLfile.listFolder(parentFolder);

    if (children.length > 0) {
        String(children).split(",").forEach(function (child) {
            const childURI = parentFolder + "/" + child;

            /**
             * If the child is a Directory, run recursion, else if a FileInfo has the extension, update fileList
             */
            if (FLfile.getAttributes(childURI).indexOf("D") > -1) {
                TTUtil.prototype.getAllFilesByExtension(ext, childURI, fileList);
            } else if (childURI.indexOf("." + ext) > -1) {
                fileList.push(new FileInfo(childURI));
            }
        });
    }
};

/**
 * Updates the provided fileList array with any FLA files found in the parentFolder or any children using recursion
 * @param {string} parentFolder
 * @param {Array<string>} fileList
 */
TTUtil.prototype.getAllFlaFiles = function (parentFolder, fileList) {
    var children = FLfile.listFolder(parentFolder);
    var childURI = "";

    if (children.length > 0) {
        String(children).split(",").forEach(function (child) {
            childURI = parentFolder + "/" + child;

            /**
             * If the child is a Directory, run recursion, else if a File has the FLA extension, update fileList
             */
            if (FLfile.getAttributes(childURI).indexOf("D") > -1) {
                TTUtil.prototype.getAllFlaFiles(childURI, fileList);
            } else if (childURI.indexOf(".fla") > -1) {
                fileList.push(childURI);
            }
        });
    }
};

/**
 * Provides an array of all open documents that are lectures OR opens those files from a selected folder
 * and provides the same
 * @returns {Array<Document>}
 */
TTUtil.prototype.getLectures = function () {
    var _lectureFiles;
    const lectureMatcher = /tt\.(?:a1|a2|ge|m3|m4|m5|m6|m7|pa|pc)\.l\d{2,3}\.n/i

    //If documents are already open, check for matching file names, else prompt for a directory
    if (fl.documents.length > 0) {
        _lectureFiles = fl.documents.filter(function (document) {
            return document.name.match(lectureMatcher);
        });

    } else {
        const lecturesPathURI = fl.browseForFolderURL("Select the Lectures folder");
        const fileURIs = [];

        this.getAllFlaFiles(lecturesPathURI, fileURIs);

        fileURIs.forEach(function (fileURI) {
            if (fileURI.match(lectureMatcher)) {
                fl.openDocument(fileURI);
            }
        });

        _lectureFiles = fl.documents;
    }

    if (_lectureFiles.length === 0) {
        alert("No available Lectures for processing");
        return [];
    }

    return _lectureFiles;
};

/**
 * Provides an array of all open documents that are problem sets OR opens those files from a selected folder
 * and provides the same
 * @returns {null|Array<Document>}
 */
TTUtil.prototype.getProblemSets = function () {
    var _problemSetFiles;
    const problemSetMatcher = /tt\.(?:a1|a2|ge|m3|m4|m5|m6|m7|pa|pc)\.[lq]\d{2,3}/i

    //If documents are already open, check for matching file names, else prompt for a directory
    if (fl.documents.length > 0) {
        _problemSetFiles = fl.documents.filter(function (document) {
            return document.name.match(problemSetMatcher);
        });

    } else {
        const problemSetsPathURI = fl.browseForFolderURL("Select the Problem Sets folder");
        var fileURIs = [];

        TTUtil.prototype.getAllFlaFiles(problemSetsPathURI, fileURIs);

        fileURIs.forEach(function (fileURI) {
            if (fileURI.match(problemSetMatcher)) {
                fl.openDocument(fileURI);
            }
        });

        _problemSetFiles = fl.documents;
    }

    if (_problemSetFiles.length === 0) {
        alert("No available Problem Sets for processing");
        return null;
    }

    return _problemSetFiles;
};

/**
 * Get an array of all named frames
 * @param doc
 * @returns {Label[]}
 */
TTUtil.prototype.getLabels = function (doc) {

    const self = this;

    /** @type {[Label]} */
    const labels = [];

    // Iterate over each Timeline (Scene) in the doc
    doc.timelines.forEach(function (timeline, timelineIndex) {

        // Iterate over each Layer on the current Timeline
        timeline.layers.forEach(function (layer, layerIndex) {

            // Iterate over each Frame on the current Layer
            layer.frames.forEach(function (frame, frameIndex) {
                if ((frameIndex === frame.startFrame) && frame.name.length > 0) {
                    labels.push(
                        new Label(frame.name, timelineIndex, frameIndex, layerIndex, self.getLTI(doc, frame.name)));
                }
            });
        });
    });

    return labels;
}

/**
 * Shortcut for tracing a new message with an indent
 * @param msg
 * @param type
 */
TTUtil.prototype.log = function (msg, type) {
    if (type === "new") {
        fl.trace("\n§→ " + msg);
    } else {
        fl.trace("\t» " + msg);
    }
};

/**
 * Returns an LTI based on the file name along with any valid label provided
 * @param {Document} doc
 * @param {string} [labelName]
 * @returns {null|string}
 */
TTUtil.prototype.getLTI = function (doc, labelName) {
    const ltiRegExp = /TT\.(?:M3|M4|M5|M6|M7|PA|A1|GE|A2|PC)\.[LQ]\d{2,3}(?:\.N|\.P\d\d|\.X\d)?/;
    const practiceLetters = ["A", "B", "C", "D", "E", "F"];
    var prob = "";

    if (labelName && labelName.length > 0) {

        // Handle Practice Problems, else handle Lesson or Quiz Problems, else handle Lecture Problems
        if (labelName.indexOf("practice") > -1) {
            const practiceLetter = labelName.split("practice")[1];
            const practiceNumber = practiceLetters.indexOf(practiceLetter) + 1;
            prob = "." + "X" + practiceNumber;
        } else if (labelName.indexOf("problem") > -1) {
            var problemNumber = labelName.split("problem")[1];
            problemNumber = (problemNumber.length > 1) ? problemNumber : "0" + problemNumber;
            prob = "." + "P" + problemNumber;
        } else if (labelName.indexOf("lp")) {
            // Todo handle lectures
            return null;
        } else {
            return null;
        }
    }

    return doc.name.match(ltiRegExp).toString() + prob;
};


TTUtil.prototype.getSQLTable = function (lti) {
    if (lti.match(/TT.+X\d/)) return "praxprob";
    if (lti.match(/TT.+L.+P\d\d/)) return "lssnprob";
    if (lti.match(/TT.+Q.+P\d\d/)) return "quizprob";
    return null;
};

/**
 * Represents a named frame
 * @param {string} name
 * @param {number} timelineIndex
 * @param {number} frameIndex
 * @param {number} layerIndex
 * @param {string} lti
 * @constructor
 */
Label = function (name, timelineIndex, frameIndex, layerIndex, lti) {
    this.name = name;
    this.timelineIndex = timelineIndex;
    this.frameIndex = frameIndex;
    // noinspection JSUnusedGlobalSymbols
    this.layerIndex = layerIndex;
    this.lti = lti;
    this.ref = undefined;
};

/**
 * Provide valuable information about an external File given its URI
 * @param uri {string}
 * @constructor
 */
FileInfo = function (uri) {
    const ltiMatches = uri.match(/TT\.(?:M3|M4|M5|M6|M7|PA|A1|A2|GE|PC)\.[LQ]\d{2,3}(?:\.N|(?:\.[PQX]\d+)?)/);
    const fileMatches = uri.match(/.+\/(.+)\.(fla|mp3|wav)/);

    this.uri = uri;
    this.lti = (ltiMatches.length > 0) ? ltiMatches[0] : undefined;
    this.name = fileMatches[1];
    this.fullName = fileMatches[1] + "." + fileMatches[2];
    this.type = fileMatches[2];

    this.relativePath = (this.lti && fileMatches[2] !== "fla") ?
        uri.split("/" + this.lti + "/")[1] : undefined;
};

