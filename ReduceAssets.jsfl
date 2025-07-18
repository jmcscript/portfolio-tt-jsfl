var hintList = [];
var linkages = {}; //array of comma separated linkage names, one for each lesson
var linkageMap = {};

//Main Program
function reduceAssets() {
    fl.showIdleMessage(false);
    fl.outputPanel.clear();

    var start = new Date().valueOf();
    var courseData = processAssetsLibrary();
    linkages = organizeCourseData(courseData);

    makeDLCAssetsClass(linkages);

    fl.trace("Elapsed time: " + (new Date().valueOf() - start));
    fl.showIdleMessage(true);
}

/**
 * Returns AS3 arrays grouped by prefix
 * @param {Array<String>} courseData
 * @returns {{}}
 */
function organizeCourseData(courseData) {
    var result = {};
    result.extra = [];

    for (var i = 0; i < courseData.length; i++) {
        var nm = courseData[i];
        var parts = nm.split("_");

        if (parts.length === 1) {
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

/**
 * Returns simplified object from element
 * @param {Element} element
 * @returns {{}}
 */
function expandElement(element) {
    var expanded = {};

    expanded.width = element.width;
    expanded.height = element.height;
    expanded.x = element.x;
    expanded.y = element.y;
    expanded.depth = element.depth;
    expanded.name = element.name;
    expanded.type = element.elementType;

    if (element.elementType === "text") {
        expanded.text = element.getTextString();

    } else if (element.elementType === "instance" && element.instanceType === "symbol") {

        if (element.name) {
            expanded[element.name] = getItemElements(element.libraryItem);
        } else {
            expanded.child = getItemElements(element.libraryItem)
        }
    } else if (element.elementType === "shape") {
        if(element.isGroup && element.members.length) {
            for (var i = 0; i < element.members.length; i++) {
                expanded["groupMember"+i] = expandElement(element.members[i]);
            }
        }
    }
    return expanded;
}

/**
 * Returns simplified object from library item
 * @param box
 * @returns {{}}
 */
function getItemElements(box) {
    var childTimeline = box.timeline;
    var layers = childTimeline.layers;
    var boxElements = {};

    for (var i in layers) {
        if (!layers.hasOwnProperty(i)) {
            break;
        }

        //Check if the current layer is locked. If so, unlock it.
        if (layers[i].locked === true) {
            layers[i].locked = false;
        }

        boxElements["layers" + i] = {};
        var frames = layers[i].frames;

        for (var j in frames) {
            if (!frames.hasOwnProperty(j)) {
                break;
            }

            var elements = frames[j].elements;
            boxElements["layers" + i]["frame" + j] = {};
            boxElements["layers" + i]["frame" + j].elements = [];
            //boxElements["layers"+i]["frame"+j].elements = frames[j].elements;

            // fl.outputPanel.trace("frames: "+j+" elements: "+elements)
            for (var k in elements) {
                if (!elements.hasOwnProperty(k)) {
                    break;
                }

                boxElements["layers" + i]["frame" + j].elements[k] = expandElement(elements[k])
            }
        }
    }

    return boxElements;
}

/**
 * Compare objects
 * @param obj1
 * @param obj2
 * @returns {boolean}
 */
function compareObjects(obj1, obj2) {

    //Loop through properties in object 1
    for (var p in obj1) {
        if (!obj1.hasOwnProperty(p)) {
            break;
        }

        //Check property exists on both objects
        if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

        switch (typeof (obj1[p])) {
            //Deep compare objects
            case 'object':
                if (!compareObjects(obj1[p], obj2[p])) return false;
                break;
            //Compare function code
            case 'function':
                if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
                break;
            //Compare values
            default:
                if (obj1[p] != obj2[p]) return false;
        }
    }

    //Check object 2 for any extra properties
    for (var p in obj2) {
        if (typeof (obj1[p]) == 'undefined') return false;
    }
    return true;
}

/**
 * Trace object
 * @param {Object} obj
 */
function iterate(obj) {
    var walked = [];
    var stack = [{obj: obj, stack: ''}];

    while (stack.length > 0) {
        var item = stack.pop();
        var itemObj = item.obj;

        for (var property in itemObj) {
            if (itemObj.hasOwnProperty(property)) {
                if (typeof itemObj[property] == "object") {
                    var alreadyFound = false;
                    for (var i = 0; i < walked.length; i++) {
                        if (walked[i] === itemObj[property]) {
                            alreadyFound = true;
                            break;
                        }
                    }
                    if (!alreadyFound) {
                        walked.push(itemObj[property]);
                        stack.push({obj: itemObj[property], stack: item.stack + '.' + property});
                    }
                } else {
                    fl.trace(item.stack + '.' + property + "=" + itemObj[property]);
                }
            }
        }
    }
}

/**
 * Returns the index of first matching object occurrence
 * @param containerArray
 * @param containObj
 * @returns {number}
 */
function containsObject(containerArray, containObj) {
    for (var i = 0; i < containerArray.length; i++) {
        if (compareObjects(containerArray[i], containObj)) {
            return i;
        }
    }
    return -1;
}

/**
 * Reduces redundant linkage items in the libraries for all open documents, and maps the linkageNames from those removed
 * to ones kept. Returns an array of linkageNames.
 * @returns {[]}
 */
function processAssetsLibrary() {
    var linkageNames = [];
    var itemArray = [];
    var itemsElements = [];
    var itemsNames = [];
    var itemsMap = {}

    var itemObj;
    var linkageIndex;

    //Populate itemsArray with {doc, item} objects from all open files
    fl.documents.forEach(function (doc) {
        doc.library.items
            .filter(function (item) {
                return item.linkageClassName && item.linkageClassName.match(/user|hint/i)
            })
            .forEach(function (item) {
                itemArray.push({'doc': doc, 'item': item});
            });
    });

    fl.trace("First iteration over itemArray");
    //Iterate over the itemArray
    for (var i = 0; i < itemArray.length; i++) {
        itemObj = itemArray[i].item;

        if (itemObj.linkageClassName !== undefined && itemObj.linkageClassName.length > 0) {
            var libLinkageName = itemObj.linkageClassName;

            if (libLinkageName.indexOf("User") !== -1) {
                var elementsObj = getItemElements(itemObj);

                if (!itemsElements.length || !containsObject(itemsElements, elementsObj) > -1) {
                    itemsElements.push(elementsObj);
                    itemsNames.push(libLinkageName);
                }
            }

            linkageNames.push(libLinkageName);

            if (libLinkageName.indexOf("hint") !== -1) {
                hintList.push(libLinkageName);
            }
        }
    }
    fl.trace("linkageNames before: " + linkageNames.length);

    //Iterate a second time of the itemArray
    for (var j = 0; j < itemArray.length; j++) {

        itemObj = itemArray[j].item;

        if (itemObj.linkageClassName !== undefined && itemObj.linkageClassName.length > 0) {

            libLinkageName = itemObj.linkageClassName;

            if (libLinkageName.indexOf("User") !== -1) {

                elementsObj = getItemElements(itemObj);
                linkageIndex = containsObject(itemsElements, elementsObj);

                if (linkageIndex > -1) {

                    itemsMap[libLinkageName] = itemsNames[linkageIndex];
                    linkageNames.splice(linkageNames.indexOf(libLinkageName), 1);

                    if (libLinkageName !== itemsNames[linkageIndex]) {
                        itemArray[j].doc.library.deleteItem(itemObj.name);
                    }
                }
            }
        }
    }
    fl.trace("linkageNames after: " + linkageNames.length);

    linkageMap = itemsMap;
    linkageNames.sort();

    return linkageNames;
}

/**
 * Creates an ActionsScript file that provides registration for linkage items in the assets files
 * @param {String} linkageList
 */
function makeDLCAssetsClass(linkageList) {
    var doc = fl.getDocumentDOM();
    var dir = doc.pathURI.split(doc.name)[0];
    var matches = dir.match(/\/(?:v4)?(M3|M4|M5|M6|M7|PA|A1|GE|A2|PC)(?:_src)?/i);
    var courseID = matches[1].toUpperCase();

    fl.outputPanel.clear();
    fl.outputPanel.trace("package com.tt.productSpecific");
    fl.outputPanel.trace("{");
    fl.outputPanel.trace("\t //this asset class is auto-generated. Do Not Edit. Its purpose is to register classes from the assets.swc file for content.");
    fl.outputPanel.trace("\tpublic class DLCAssetMap" + courseID);
    fl.outputPanel.trace("\t{");
    fl.outputPanel.trace("\t\tpublic static const MAP:Object = ");
    fl.outputPanel.trace("\t\t{");

    var n = 0
    var str = "\t\t\t";

    for (var p in linkageMap) {
        if (!linkageMap.hasOwnProperty(p)) {
            break;
        }

        str += p + ":" + linkageMap[p] + ",";

        if (n === 6) {
            n = 0;
            str += "\n\t\t\t";
        } else {
            n++
        }
    }

    fl.outputPanel.trace(str.slice(0, str.lastIndexOf(",")));
    fl.outputPanel.trace("\t\t}");

    for (var a in linkageList) {
        if (!linkageList.hasOwnProperty(a)) {
            break;
        }

        str = "\t\tpublic var ";
        str += a;
        str += ":Array=[";
        str += linkageList[a];
        str += "];";
        fl.outputPanel.trace(str);
    }

    fl.outputPanel.trace("\t}");
    fl.outputPanel.trace("}");

    fl.outputPanel.save(dir + "/DLCAssetMap" + courseID + ".as");
}

reduceAssets();