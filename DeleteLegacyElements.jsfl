/**
 * DeleteLegacyElements.jsfl v0.1.3
 *
 * Description: Deletes legacy elements from the current frame in a lecture
 * Author: James McDonald
 * Last Updated: 2021-08-16 12:00 CDT
 */

(function () {
    const doc = fl.getDocumentDOM();
    const currentLayer = doc.getTimeline().currentLayer
    /** @type {Element[]} */
    var legacyElements = [];
    /** @type {Element[]} */
    const interactiveElements = [];
    /** @type {Text[]} */
    const interactiveText = [];
    /** @type {Element[]} */
    const quadrilaterals = [];
    /** @type {Instance[]} */
    const textFrameArt = [];

    // Select all elements on the stage
    doc.selectAll();

    // Collect all named Text items, interactive elements that are not the notepad, and any potential text frame art
    doc.selection.forEach(function (element) {

        // If the element is a Group
        if (element instanceof Shape && element.isGroup) {
            var isInputGroup = false;
            element.members.forEach(function (member) {
                if (member instanceof Text && member.name.length > 0) {
                    isInputGroup = true;
                }
            });
            if (isInputGroup) interactiveElements.push(element);
        }
        // If the element is named
        else if (element.name.length > 0) {

            // Collect named Text objects
            if (element instanceof Text) {
                interactiveText.push(element);
            }

            // If the element name is NOT 'questionbg' meaning it's not the notepad background
            else if (element.name !== "questionbg") {
                interactiveElements.push(element);
            }
        }
        // Collect text-colored library Instances or Shapes with 4 sides
        else if ((element instanceof Instance && element.libraryItem.name.match(/textfield_color|txtfield/i))
            || (element instanceof Shape && element.vertices.length === 4)) {
            quadrilaterals.push(element);
        }
    });

    // If a quadrilateral is also text frame art, push it to an array
    quadrilaterals.forEach(function (shape) {
        findTextFrameArt(shape);
    });

    // Group all legacy items to be deleted
    legacyElements = legacyElements.concat(interactiveText, interactiveElements, textFrameArt);

    // Deselect all items
    doc.selectNone();

    // Select all legacy items
    doc.selection = legacyElements;

    // Delete the selected legacy items
    doc.deleteSelection();

    // Return to the layer from before any selections were made
    doc.getTimeline().currentLayer = currentLayer;

    /**
     * Push shape to an array if it is roughly congruent to any interactive text elements.
     * Return the new length of the array.
     * @param shape
     * @returns {number}
     */
    function findTextFrameArt(shape) {
        interactiveText.forEach(function (text) {
            if (areCongruent(shape, text)) textFrameArt.push(shape);
        });

        return textFrameArt.length;
    }

    /**
     * Returns true if two numbers have a difference less than a given spread or 6
     * @param {number} a
     * @param {number} b
     * @param {number} [spread]
     * @returns {boolean}
     */
    function areApproximate(a, b, spread) {
        return Math.abs(a - b) < ((spread) ? spread : 6);
    }

    /**
     * Returns true if two elements are roughly congruent as well as approximate in placement
     * @param {Element} a
     * @param {Element} b
     * @returns {boolean}
     */
    function areCongruent(a, b) {
        return areApproximate(a.left, b.left, 6) && areApproximate(a.top, b.top, 6) &&
            areApproximate(a.width, b.width, 11) && areApproximate(a.height, b.height, 11);
    }
})();
