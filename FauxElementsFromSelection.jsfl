function fauxElementsFromSelection() {
    var currentSelection = fl.getDocumentDOM().selection;
    var fauxSelection = [];

    for (var i in currentSelection) {
        if (!currentSelection.hasOwnProperty(i)) {
            alert("You must first make a selection.");
            break;
        }

        fl.getDocumentDOM().selectNone();

        var name = "";
        var xPosition = 0;
        var yPosition = 0;
        var GO_BUTTON_NAME = "_shared/btnGo";

        if (currentSelection[i].textType === "input" || currentSelection[i].symbolType === "button") {
            name = currentSelection[i].name;
        } else {
            alert("Please select Input Text fields and Go Buttons only.");
            break;
        }

        if (currentSelection[i].textType === "input") {
            var fontSize = currentSelection[i].getTextAttr("size");
            var maxCharacters = currentSelection[i].maxCharacters;
            var fauxInputName = getFauxInputName(maxCharacters);
            xPosition = currentSelection[i].x + (currentSelection[i].width / 2);
            yPosition = currentSelection[i].y + (currentSelection[i].height / 2);
            currentSelection[i].selected = true;
            fl.getDocumentDOM().deleteSelection();
            fl.getDocumentDOM().library.addItemToDocument({x: xPosition, y: yPosition}, fauxInputName);

            if (fontSize === 15) {
                fl.getDocumentDOM().selection[0].scaleX = 7/8;
                fl.getDocumentDOM().selection[0].scaleY = 7/8;
            } else if (fontSize === 16) {
                fl.getDocumentDOM().selection[0].scaleX = 0.68;
                fl.getDocumentDOM().selection[0].scaleY = 0.68;
            } else if (fontSize === 18) {
                fl.getDocumentDOM().selection[0].scaleX = 0.75;
                fl.getDocumentDOM().selection[0].scaleY = 0.75;
            } else if (fontSize === 20) {
                fl.getDocumentDOM().selection[0].scaleX = 0.84;
                fl.getDocumentDOM().selection[0].scaleY = 0.84;
            }

            fl.getDocumentDOM().selection[0].name = name;
            fauxSelection.push(fl.getDocumentDOM().selection[0]);

        } else if (currentSelection[i].symbolType === "button") {
            xPosition = currentSelection[i].x;
            yPosition = currentSelection[i].y;
            currentSelection[i].selected = true;
            fl.getDocumentDOM().deleteSelection();
            fl.getDocumentDOM().library.addItemToDocument({x: xPosition, y: yPosition}, GO_BUTTON_NAME);
            fl.getDocumentDOM().selection[0].name = name;
            fauxSelection.push(fl.getDocumentDOM().selection[0]);
        }
        fl.getDocumentDOM().selection = fauxSelection;
    }
}

function getFauxInputName(maxCharacters) {
    var prefix = "_faux/lectureTxtNumeric";

    if (maxCharacters === 0 || maxCharacters === 1) {
        return prefix + "01";
    } else if (maxCharacters > 1 && maxCharacters < 7) {
        return prefix + "0" + maxCharacters;
    } else if (maxCharacters > 6 && maxCharacters < 11) {
        return prefix + "10";
    } else if (maxCharacters > 10 && maxCharacters < 16) {
        return prefix + "15";
    } else if (maxCharacters > 15 && maxCharacters < 21) {
        return prefix + "20";
    } else {
        alert("Max Characters for one of the fields is out of range");
        return;
    }
}

fauxElementsFromSelection();