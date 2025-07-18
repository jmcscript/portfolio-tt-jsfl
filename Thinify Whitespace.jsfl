/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 6/18/2019
 * Time: 11:32 AM
 * To change this template use File | Settings | File Templates.
 */

try {
    fl.setActiveWindow(fl.getDocumentDOM());

    if (fl.getDocumentDOM().getTextString() === undefined) {
        alert("Please select the text boxes you'd like to Thinify.")
    } else {
        for (var i in fl.getDocumentDOM().getTextString()) {
            if (fl.getDocumentDOM().getTextString()[i] === " ") {
                fl.getDocumentDOM().setElementTextAttr(
                    "characterPosition", "superscript", Number(i));
            }
        }
    }

} catch (e) {
    alert("An error has occurred: " + e.toString());
}