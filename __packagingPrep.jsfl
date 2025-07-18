/*
ARNOLD BIFFNA

- creates the DLCAssets.as class file which references linkages in the assets.swc, or they will not compile
- creates the DLCAssets.xml file which references Hints from assets.fla and puzzles from problemsx.fla or quizx.fla
*/

fl.showIdleMessage(false);


//SETTING
var debugLessonCount = 0; //only output this many lessons when debugging, otherwise 0


//CONST
var NODE_ASSETS = "assets";
var NODE_PUZZLES = "puzzles";
var NODE_HINTS = "hints";
var NODE_PUZZLE = "puzzle";
var NODE_HINT = "hint";
var XMLHEADER = '<?xml version="1.0" encoding="UTF-8"?>';
var labelPrefixes = "problems,quiz,problem,practice,hint,L,Q".split(",");
//VAR
var reportXML = [];
var hintList = [];
var linkages = {}; //array of comma seperated linkage names, one for each lesson

//MAIN program
fl.outputPanel.clear();
/*var folder = getCurrentFolder();
var assetsFLA = getFLAList(folder, "assets.fla");*/

var assets = fl.getDocumentDOM();
var folder = assets.pathURI.slice(0, assets.pathURI.lastIndexOf("/"));

fl.trace(folder);

processAssetsFLA(folder, assets);
makeDLCAssetsClass(folder, linkages);

// var problemsFLA = getFLAList(folder,"problems");
// var quizFLA = getFLAList(folder,"quiz");
// var lessonsFLA=problemsFLA.concat( quizFLA );
// reportXML.push( xmlOpenNode(NODE_ASSETS) );	
// createHintsData();
// processLessons(folder, lessonsFLA);
// reportXML.push( xmlCloseNode(NODE_ASSETS) );	
// makeXMLFile("DLCAssets");


//-------------------------------------------------------------------------problems and quiz .fla processing


/*
Open, process, and close each LESSON file
 extract puzzle asset information on the timeline to create XML data in the format

		<puzzle contenttype="lesson" id="10">[3,13]</puzzle>
		<puzzle contenttype="quiz" id="1">[3,11]</puzzle>

*/
function processLessons(dir, fileList) {
    var folder = getCurrentFolder();
    var filesLen = fileList.length;

    if (debugLessonCount > 0) filesLen = debugLessonCount;

    reportXML.push(xmlOpenNode(NODE_PUZZLES));
    for (var i = 0; i < filesLen; i++) {
        var fileN = dir + "/" + fileList[i];
        var lessonN = fileList[i].split(".")[0];
        var isQuiz = (fileList[i].indexOf("quiz") != -1);

        var currDoc = fl.openDocument(fileN);
        var courseData = processLessonTimeline(currDoc, isQuiz);

        //XML Data for Puzzle if one exists
        if (courseData.length > 0) {
            var contenttype = "lesson";
            if (isQuiz) contenttype = "quiz";
            var removeExtension = fileList[i].split(".")[0];
            var id = getLabelSuffix(removeExtension);
            var valu = courseData.join(",");
            var entry = xmlOpenNode(NODE_PUZZLE, {
                contenttype: contenttype,
                id: id
            }, true, valu);
            reportXML.push(entry);
        }

        fl.closeDocument(currDoc, true);
        delete currDoc;

    }
    reportXML.push(xmlCloseNode(NODE_PUZZLES));

}


//find the starting and ending problem numbers for puzzles
function processLessonTimeline(doc, isQuiz) {


    var results = [];
    var labelIndex = doc.getTimeline().findLayerIndex("label");
    var puzzleIndex = doc.getTimeline().findLayerIndex("puzzle");

    if (labelIndex != undefined && puzzleIndex != undefined) {
        //find the puzzzle
        var frameArray = fl.getDocumentDOM().getTimeline().layers[puzzleIndex].frames;
        var n = frameArray.length;
        for (i = 0; i < n; i++) {
            if (i == frameArray[i].startFrame) {

                if (i > 0) {
                    //establish the puzle start and end on the timline
                    var puzzleStartF = frameArray[i].startFrame;
                    var puzzleDuration = frameArray[i].duration;
                    if (puzzleDuration > 1) {
                        //determine the labels for start and end points
                        var endFrame = puzzleStartF + puzzleDuration - 1;
                        var startProblem = doc.getTimeline().layers[labelIndex].frames[puzzleStartF].name;
                        var endProblem = doc.getTimeline().layers[labelIndex].frames[endFrame].name;
                        var startVal = getLabelSuffix(startProblem);
                        var endVal = getLabelSuffix(endProblem);
                        results.push(startVal);
                        results.push(endVal);
                        fl.outputPanel.trace("puzzle at: frame" + puzzleStartF + " from " + startVal + " to " + endVal);
                        break;
                    }

                }
            }
        }
    }


    return results;

}

//XML data file for lesson
function makeXMLFile(name) {
    fl.outputPanel.clear();
    fl.outputPanel.trace(XMLHEADER);
    for (var i = 0; i < reportXML.length; i++) {
        fl.outputPanel.trace(reportXML[i]);
    }
    fl.outputPanel.save(folder + "/" + name + ".xml");

}

//-------------------------------------------------------------------------Assets.fla processing


//Open, process, and close each file
function processAssetsFLA(dir, fileList) {
    var folder = getCurrentFolder();

    reportXML = [];
    /*var fileN = dir + "/" + fileList[0];

    var currDoc = fl.openDocument(fileN);*/
    var currDoc = fl.getDocumentDOM();
    var courseData = processAssetsLibrary(currDoc);

    linkages = organizeCourseData(courseData);
}

//create as3 array names in the DLCAssets.as class based on the prefix before underscore
function organizeCourseData(courseData) {
    var result = {};
    result.extra = [];
    for (var i = 0; i < courseData.length; i++) {
        var nm = courseData[i];
        var parts = nm.split("_");
        if (parts.length == 1) {
            result.extra.push(nm);
        } else {
            var group = parts[0];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(nm);
        }
    }

    return result;
}

/*
	process the library 
*/
function processAssetsLibrary(doc) {

    var linkageNames = [];
    /*var itemArray = doc.library.items;*/
    var itemArray = [];

    fl.documents.forEach(function (doc) {
        itemArray = itemArray.concat(doc.library.items);
    });


    // var itemArray = fl.getDocumentDOM().library.items;


    for (var i = 0; i < itemArray.length; i++) {
        var itemObj = itemArray[i];

        if (itemObj.linkageClassName !== undefined && itemObj.linkageClassName.length > 0) {
            var libLinkageName = itemObj.linkageClassName;
            linkageNames.push(libLinkageName);

            fl.trace(libLinkageName);

            if (libLinkageName.indexOf("hint") != -1) {
                hintList.push(libLinkageName);
            }

            //fl.getDocumentDOM().library.items[i].linkageExportInFirstFrame=true;
            //fl.outputPanel.trace("found "+libLinkageName);
        } else {
            //NEW: fix LECTURES with missing Linkage names
            /*
            var nm=itemObj.name;
            if (itemObj.name.indexOf("_User") !=-1)
            {

                var parts=nm.split("/");
                var symName=parts[parts.length-1];
                fl.outputPanel.trace("found possible missing linkage for symbol:"+itemObj.name+" use "+symName);
                //itemObj.linkageBaseClass=symName;
                fl.getDocumentDOM().library.items[i].linkageExportForRS=false;
                fl.getDocumentDOM().library.items[i].linkageExportForAS=true;
                fl.getDocumentDOM().library.items[i].linkageExportInFirstFrame=true;
                fl.getDocumentDOM().library.items[i].linkageIdentifier=symName;
                fl.getDocumentDOM().library.items[i].linkageClassName=symName;
                linkageNames.push(symName);
            }
            */
        }


    }

    linkageNames.sort();
    return linkageNames;
}

function makeDLCAssetsClass(dir, linkageList) {
    fl.outputPanel.clear();
    fl.outputPanel.trace("package com.tt.productSpecific");
    fl.outputPanel.trace("{");
    fl.outputPanel.trace("\t //this asset class is auto-generated. Do Not Edit. Its purpose is to register classes from the assets.swc file for content.");
    fl.outputPanel.trace("\tpublic class DLCAssets");
    fl.outputPanel.trace("\t{");

    for (var a in linkageList) {
        var str = "\t\tpublic var ";
        str += a;
        str += ":Array=[";
        str += linkageList[a];
        str += "];";
        //
        fl.outputPanel.trace(str);
    }

    fl.outputPanel.trace("\t\tpublic function DLCAssets(){}");
    fl.outputPanel.trace("\t}");
    fl.outputPanel.trace("}");


    fl.outputPanel.save(dir + "/DLCAssets.as");
}


/*
convert list of linkage names L4_hint15  Q2_hintA in to XML data in the format 

		<hint contenttype="lesson" id="10">B,C,D,E,19,20,21,22</hint>
		<hint contenttype="quiz" id="1">18</hint>

*/
function createHintsData() {
    reportXML.push(xmlOpenNode(NODE_HINTS));
    var groupedHints = {};
    //first regroup the hints into their lessons or quizzes to build a grouped list
    for (var i = 0; i < hintList.length; i++) {
        var hintStr = hintList[i];

        var hintName = hintStr.split("_")[1];
        var groupName = hintStr.split("_")[0];
        var hintNumber = getLabelSuffix(hintName);
        if (!groupedHints[groupName]) groupedHints[groupName] = [];
        groupedHints[groupName].push(hintNumber);


    }

    for (var a in groupedHints) {
        var contenttype = "lesson";
        if (a.charAt(0) == "Q") contenttype = "quiz";
        var id = getLabelSuffix(a);
        var listStr = groupedHints[a].join(",");
        var entry = xmlOpenNode(NODE_HINT, {
            contenttype: contenttype,
            id: id
        }, true, listStr);
        //fl.outputPanel.trace( entry );
        reportXML.push(entry);

    }

    reportXML.push(xmlCloseNode(NODE_HINTS));
}


//-------------------------------------------------------------------------COMMON
//gets the 1..9 or A..E out of problem1, practiceB, problems97, quiz18 etc


function getLabelSuffix(labelStr) {
    var retval = "";
    var keyword = "";
    var i = -1;
    while (++i < labelPrefixes.length && retval == "") {
        var prefix = labelPrefixes[i];
        if (labelStr.indexOf(prefix) > -1) {
            var parts = labelStr.split(prefix);
            retval = parts[1];
        }
    }
    return retval;
}


//get the parent folder of the script's location
//assumes the scipt is in the same folder as the lesson .flas
function getCurrentFolder() {
    var path = fl.scriptURI;
    var parts = path.split("/");
    parts.pop();
    var newPath = parts.join("/");
    return newPath;
}

//get assets.fla files in this dir
function getFLAList(dir, keyword) {

    var files = FLfile.listFolder(dir, "files");

    var i = 0;
    var len = files.length;
    var flaFiles = [];

    //filter only "assets" .fla,
    while (i < len) {
        var f = files[i];
        if (f.indexOf("(") == -1 && f.indexOf("RECOVER") == -1) {
            if (f.indexOf(keyword) != -1 && f.indexOf(".fla") == f.length - 4) {
                flaFiles.push(files[i]);
            }
        }

        i++;
    }

    return flaFiles;
}

//create an XML Node with optional attributes based on an object
function xmlOpenNode(name, attributes, close, strValue) {
    var str = "";

    str += "<" + name;
    for (var a in attributes) {
        str += " " + a + "=\"" + attributes[a] + "\"";
    }
    if (strValue != null) str += ">" + strValue + "<";
    if (close) str += "/" + name;
    str += ">";
    return xmlIndent(name, str);
}

//close an XML Node
function xmlCloseNode(name, skipIndent) {
    var str = "</" + name + ">";
    if (skipIndent == null) {
        return xmlIndent(name, str);
    } else {
        return str;
    }

}

//enclose var data with CDATA tags for XML compatibility
function xmlCDATA(data) {
    return "<![CDATA[" + data + "]]>";
}

//indent XML with tabs according to node name
function xmlIndent(name, str) {
    if (name == NODE_PUZZLES || name == NODE_HINTS) {
        str = "\t" + str;
    } else if (name == NODE_ASSETS) {
        //no indentation on root node
    } else {
        str = "\t\t" + str;
    }
    //if (name==NODE_VAR)

    return str;
}

fl.showIdleMessage(true);