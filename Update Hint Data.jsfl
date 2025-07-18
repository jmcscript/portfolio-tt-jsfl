// noinspection SqlNoDataSourceInspection

/**
 * Create SQL Update Statements for all hint symbols in an assets library
 * User: James McDonald
 * Date: 7/23/2021
 * Time: 10:07 AM
 */

// noinspection SpellCheckingInspection
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

    const readOnly = false;

    // noinspection SpellCheckingInspection
    const hintLetters = "ABCDEF";
    const courseLTI = "TT.PA";
    const assetFiles = fl.documents;
    const statements = [];

    fl.outputPanel.clear();

    assetFiles.forEach(function (assets) {
        const hints = assets.library.items.filter(function (item) {
            return item.itemType === "movie clip" && item.name.match(/[LQ]\d+_hint/);
        });

        hints.forEach(function (hint) {
            const parts = hint.name.match(/.+\/([LQ])(\d+)_hint((?:\d+)|(?:[A-F]))/);
            const lessonLTI = normalizeLessonID(parts[1], parts[2]);
            const problemLTI = normalizeProblemID(parts[3]);
            const lti = courseLTI + "." + lessonLTI + "." + problemLTI;
            statements.push(createSQLStatement(lti));
        });
    });

    if (readOnly) {
        const last = statements.length - 1;
        statements[0] = statements[0].slice(6); // Remove Union from first Select statement
        statements[last] = statements[last] + ";" // Add semicolon to last Select statement
    }

    fl.trace(statements.join("\n"));

    function createSQLStatement(lti) {
        var table = "";

        if (lti.indexOf("X") > -1) {
            table = "praxprob";
        } else if (lti.indexOf("L") > -1) {
            table = "lssnprob";
        } else if (lti.indexOf("Q") > -1) {
            table = "quizprob";
        }

        if (readOnly) {
            return "UNION SELECT `lti` FROM `" + table + "` WHERE `hint` IS NULL AND `lti` = correct_lti('" + lti + "')";
        } else {
            return "UPDATE `" + table + "` SET `hint` = 'yes' WHERE `lti` = correct_lti('" + lti + "');";
        }
    }

    /**
     * Pad the lesson number to three digits
     * @param {string} type
     * @param {string} id
     * @returns {string}
     */
    function normalizeLessonID(type, id) {
        const padCount = (type === "Q") ? 2 : 3;

        while (id.length < padCount) {
            id = "0" + id;
        }

        return type + id;
    }

    /**
     * Pads graded problem hints to 2 numbers or converts practice hints to X# format
     * @param {string} id
     * @returns {string}
     */
    function normalizeProblemID(id) {
        if (id.match(/^[A-F]$/)) return "X" + (hintLetters.indexOf(id) + 1);

        while (id.length < 2) {
            id = "0" + id;
        }

        return "P" + id;
    }
})();