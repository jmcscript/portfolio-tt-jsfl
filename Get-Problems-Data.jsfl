/**
 * Writes SQL statements based on data in Teaching Textbook lectures and problem sets
 * Author: James McDonald
 * Date: 10/8/2019
 * Time: 10:25 AM
 */

// Primary function for this script
function main() {
    loadUtilities(getDirectory() + "./_archive/TT-Utility.jsfl");
    fl.showIdleMessage(false);

    const allFiles = fl.documents;
    var currentPrefix, prefix = "";
    var file = null;
    var sceneCounter = 0;

    for (var i in allFiles) {
        if (!allFiles.hasOwnProperty(i)) {
            break;
        }

        file = allFiles[i];
        currentPrefix = file.name.match(/[lq]/i).toString().toLowerCase();

        if (prefix.length === 0 || prefix !== currentPrefix) {
            prefix = currentPrefix;
        }

        var sceneLength = file.timelines.length;

        fl.setActiveWindow(file);

        sceneCounter = 0;
        while (sceneCounter < sceneLength) {
            try {
                file.editScene(sceneCounter);
                labels = [];
                scripts = [];
                getWorkLayers(file);
                getLabels();
                getProblemData(file, sceneCounter, false);
            } catch (error) {
                break;
            }
            sceneCounter++;
        }
    }

    fl.showIdleMessage(true);
}

function formatForSQL(value) {
    var doubleQuoteRegExp = /^"|"$/g;

    if (typeof value === "string") {
        if (value.match(doubleQuoteRegExp)) value = value.replace(doubleQuoteRegExp, "");
        if (value.charAt(0) !== "'" && value.charAt(value.length - 1) !== "'") return "'" + value + "'";
    }

    return value;
}

// Returns the directory path of the running script or provided uri
function getDirectory(uri) {
    uri = ((typeof uri == "string") && (uri.length > 0)) ? uri : fl.scriptURI;
    return uri.substring(0, (uri.lastIndexOf("/") + 1));
}

function getSQLTable(probPrefix, set) {
    if (probPrefix === "X") return "praxprob";
    if (probPrefix === "P") return (set.toString().indexOf("Q") > -1) ? "quizprob" : "lssnprob";
    if (probPrefix === "N") return "lectprob";
    return null;
}

function getProblemNumber(probPrefix, probID) {
    var letters = ["A", "B", "C", "D", "E", "F"];
    if (probPrefix === "X") return probPrefix + (letters.indexOf(probID) + 1);
    if (probPrefix === "P" || probPrefix === "N") return probPrefix + ((probID.length === 1) ? "0" : "") + probID;
    return null;
}

function getProblemPrefix(labelPrefix) {
    if (labelPrefix === "practice") return "X";
    if (labelPrefix === "problem") return "P";
    if (labelPrefix === "LP") return "N";
    return null;
}

function getInitialSet(probTable, frameNum) {
    if (probTable === "lectprob") return "SET \`frame\` = " + frameNum + ", ";
    return "SET ";
}

function getProblemTypePrefix(probTable) {
    if (probTable === "lectprob") return "LC";
    return "PS";
}

function getCustomFB(script, exGroupsRegEx, sigRegEx, fbRegEx) {
    var choices = '{';

    if (script.match(exGroupsRegEx)) {
        choices += '"exchangeableGroups":' + toArrayLiteral(script.match(exGroupsRegEx)[1]) + ', ';
    }

    if (script.match(sigRegEx)) {
        choices += '"sig0":' + script.match(sigRegEx)[1] + ', ';
    }

    if (script.match(fbRegEx)) {
        choices += '"fbFormat":' + script.match(fbRegEx)[1];
    }

    if (choices === '{') {
        return null;
    }

    return choices + '}';
}

function getDisplayText(value, inputRegEx) {
    if (value) {
        value = String(value[1]).replace(/^"|"$/g, "`");
        return value.replace(inputRegEx, '\$\{val$1\}');
    }
    return null;
}

function killPIVariable(script) {
    return script
        .replace(/(")(.+)(")\+pi/g, "$1$2\\u03C0$3")        //Example: ["2"+pi,"3"]
        .replace(/([\[, ])(pi)([,\]])/g, "$1\"\\u03C0\"$3") //Example: ["2", pi, "3"]
        .replace(/("\d*)(pi)(")/g, "$1\\u03C0$3");          //Example: ["2pi", "3"]
}

function getAnswer(script, aRegEx) {
    var _answer = null;

    if (script.match(aRegEx) && script.match(aRegEx)[1]) {
        _answer = toArrayLiteral(script.match(aRegEx)[1]);
        _answer = killPIVariable(_answer);
        _answer = killTinyArrays(_answer);
        _answer = (trim(_answer));
    }

    return _answer;
}

function getCommutative(script, oRegEx) {
    if (script.match(oRegEx)) {
        if (script.match(oRegEx)[1] === "true") {
            return 0;
        } else if (script.match(oRegEx)[1] === "false") {
            return 1;
        }
    }
    return null;
}

function getChoices(script, cRegEx, displayRegEx, inputRegEx, exGroupsRegEx, sigRegEx, fbRegEx) {
    try {
        //Attempt standard choices search
        if (script.match(cRegEx)) return script.match(cRegEx)[1];

        //Attempt displayText search
        if (getDisplayText(script.match(displayRegEx), inputRegEx))
            return getDisplayText(script.match(displayRegEx), inputRegEx);

        //Attempt customFB text search
        return getCustomFB(script, exGroupsRegEx, sigRegEx, fbRegEx);
    } catch (e) {
        fl.trace(e);
    }
}

function getProblemData(file, sceneCount, updateMode) {

    //If there is no scriptLayer or there are no labels, return false
    if (!scriptLayer || labels.length === 0) return false;

    var lti = "";
    var mySQLStatement = "";
    var firstSet = ""
    const courses = ["M3", "M4", "M5", "M6", "M7", "PA", "A1", "A2", "GE", "PC"];
    var course_id = 0;
    const pub = "TT";
    const prod = file.name.match(/M3|M4|M5|M6|M7|PA|A1|GE|A2|PC/);
    const set = file.name.match(/[LQ]\d{2,3}/);
    var pnum = "";
    var probPrefix = "";
    var probTable = "";
    var script = "";
    var problemTypePrefix;
    var problemType = "";
    var hint;
    var choices;
    var answer;
    var commutative;
    const exGroupsRegEx = /(?:exchangableGroups)(?:\s*=\s*)(new Array\(".+"\))(?:;)/i
    const sigRegEx = /(?:sig0)(?::Boolean\s*=\s*)(.+)(?:;)/i
    const fbRegEx = /(?:fbFormat)(?::String\s*=\s*)(.+)(?:;)/i
    const displayRegEx = /(?:displayText\s*=\s*)(.+)(?:;)/i
    const inputRegEx = /(?:\[input)(\d)(?:])/gi;
    const probRegEx = /(practice|problem|LP)(.+)/i;
    const ptRegEx = /(?:problemType.+)(["']?PS.+|LC.+)(?:["']?;)/i;
    const cRegEx = /(?:Options.+)(\[.+])(?:;)/i;
    const aRegEx = /(?:correctArray|correctAnswer|correctChoices:Array)(?:\d?)(?: = )(.+)(?:;)/i;
    const oRegEx = /(?:ordered\s*=\s*)(.+)(?:;)/i;
    const qTypeRegEx = /(qType.+= )(\d+|_parent.+)(?:;)/i;

    //For each label
    const numLabels = labels.length;
    for (var i = 0; i < numLabels; i++) {

        //Bail if there is no label or the scriptLayer frame is undefined
        if (scriptLayer.frames[labels[i].frame] === undefined) break;

        //Get the ActionScript from the current frame
        script = scriptLayer.frames[labels[i].frame].actionScript;

        //Check for labels that don't have scripts and ignore them
        if (script.length === 0) continue;

        //Check for labels with script that can't be matched
        if ((script.match(ptRegEx) === null && script.match(qTypeRegEx) === null)) {
            fl.trace("ERROR: no match in script " + file.name + ", " + labels[i].name);
            continue;
        }

        script = script.replace(/[/]{2}.+/gi, "");
        probPrefix = getProblemPrefix(labels[i].name.match(probRegEx)[1]);
        pnum = getProblemNumber(probPrefix, labels[i].name.match(probRegEx)[2]);
        probTable = getSQLTable(probPrefix, set);
        problemType = (script.match(ptRegEx)) ? script.match(ptRegEx)[1] : script.match(qTypeRegEx)[2];
        problemTypePrefix = getProblemTypePrefix(probTable);
        firstSet = getInitialSet(probTable, (Number(labels[i].frame) + 1));
        problemType = problemType.replace(/_parent/, problemTypePrefix);
        hint = (hasHint(pnum, probTable)) ? "yes" : null;
        choices = getChoices(script, cRegEx, displayRegEx, inputRegEx, exGroupsRegEx, sigRegEx, fbRegEx);

        commutative = getCommutative(script, oRegEx);

        //Construct a valid LTI
        lti = pub + "\." + prod + "\." + set + "\." + pnum;

        try {
            answer = getAnswer(script, aRegEx);
        } catch (e) {
            answer = null;
            fl.trace("ERROR: 'answer' is unavailable for " + lti + " → " + e);
            continue;
        }

        //If Lecture Problems
        if (probTable === "lectprob") {

            //Get the course_id from the product prefix
            course_id = courses.indexOf(prod.toString());

            if (!updateMode) {
                //Construct a valid SQL INSERT statement
                mySQLStatement = "INSERT IGNORE INTO \`ttv4db\`.\`" + probTable + "\` " +
                    "(\`course_id\`, \`lnum\`, \`pnum\`, \`problemset\`, \`lti\`, \`scene\`, \`frame\`, " +
                    "\`problemtype\`, \`choices\`, \`commutative\`, \`answer\`) " +
                    "VALUES(" + course_id + ", " + Number(String(set).substring(1)) + ", " + Number(String(pnum).substring(1)) + ", " +
                    formatForSQL(lti.match(/TT.+L\d{2,3}/i).toString()) + ", " + "correct_lti(\'" + lti + "\'), " +
                    (Number(sceneCount) + 1) + ", " + (Number(labels[i].frame) + 1) + ", " +
                    formatForSQL(problemType) + ", " + formatForSQL(choices) + ", " + formatForSQL(commutative) + ", " +
                    formatForSQL(answer) + ");";
            } else {
                mySQLStatement =
                    "UPDATE \`ttv4db\`.\`" + probTable + "\` " +
                    firstSet +
                    "\`problemtype\` = " + formatForSQL(problemType) + ", " +
                    "\`scene\` = " + (Number(sceneCount) + 1) + ", " +
                    "\`choices\` = " + formatForSQL(choices) + ", " +
                    "\`commutative\` = " + formatForSQL(commutative) + ", " +
                    "\`answer\` = " + formatForSQL(answer) + " " +
                    "WHERE \`lti\` = correct_lti(\'" + lti + "\') LIMIT 1\;";
            }

            //If NOT Lecture Problems
        } else {

            //Construct a valid SQL UPDATE statement
            mySQLStatement =
                "UPDATE \`ttv4db\`.\`" + probTable + "\` " +
                firstSet +
                "\`problemtype\` = " + formatForSQL(problemType) + ", " +
                "\`hint\` = " + formatForSQL(hint) + ", " +
                "\`choices\` = " + formatForSQL(choices) + ", " +
                "\`commutative\` = " + formatForSQL(commutative) + ", " +
                "\`answer\` = " + formatForSQL(answer) + " " +
                "WHERE \`lti\` = correct_lti(\'" + lti + "\') LIMIT 1\;";
        }

        fl.trace(mySQLStatement);
    }

    return true;
}

function toArrayLiteral(arr) {
    return arr.replace("new Array(", "[").replace(/\)$/, "]");
}

function hasHint(problem, table) {
    var suffix = problem.match(/[A-F]|[0-9]{1,2}/).toString();

    if (table === "praxprob" && suffix.match(/[1-6]/).length > 0) {
        suffix = String.fromCharCode(64 + Number(suffix));
    }

    suffix = suffix.replace(/0(\d)/, "$1");

    return currentDoc().library.itemExists("hint/hint" + suffix);
}

function killTinyArrays(value) {
    if (typeof value === "string" && value.indexOf("\[") > -1 && value.indexOf("\]") > -1) {
        var asArray = eval(value); //Converts a string with brackets to an array
        if (asArray.length > 1) {
            return "'" + value + "'";
        }
        return "'" + asArray[0] + "'";
    }
    return value.replace(/["]/g, "'");
}

function trim(value) {
    if (typeof value === "string") {
        return value
            .replace(/^(['"])\s+/, "$1")
            .replace(/\s+(['"])$/, "$1");
    }
}

// Load shared methods and properties
function loadUtilities(uri) {
    if (fl.fileExists(uri)) {
        fl.runScript(uri);
    } else {
        fl.outputPanel.clear();
    }
}

main();