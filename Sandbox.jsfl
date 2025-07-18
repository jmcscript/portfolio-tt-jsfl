/**
 * Sandbox is MY SANDBOX!
 * User: James McDonald
 * Date: 7/8/2021
 * Time: 7:08 AM
 */

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

    // Code here

})();