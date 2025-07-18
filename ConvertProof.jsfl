/**
 * Rebuilds all of the proof library elements from a problem set to the proofAssets.fla
 * User: James McDonald
 * Date: 1/26/2021
 * Time: 7:35 AM
 */

tt = loadTTUTil();

Proof = function (document, item) {
    this.item = item;
    this.lessonNumber = Number(document.name.match(/\.l(\d{1,3})/i)[1]);
    this.proofNumber = item.name.match(/(?:p|proof)(?:_\d{1,3}-)([A-F]|\d{1,2})/i)[1];
    this.folderName = "L" + this.lessonNumber + "_Proofs";
    this.symbolName = "L" + this.lessonNumber + "_Proof" + this.proofNumber;
    this.symbolPath = this.folderName + "/" + this.symbolName;
    this.partsFolderName = this.symbolPath + "_Parts";
    this.stepsSymbolName = "Proof_L" + this.lessonNumber + "_P" + this.proofNumber + "_Steps";
    this.stepsSymbolPath = this.partsFolderName + "/" + this.stepsSymbolName;
};

ProofAssets = function (document) {
    this.PROOF_ROOT_FOLDER = 'Lnum_Proofs/'
    this.PROOF_PARTS_FOLDER = this.PROOF_ROOT_FOLDER + "Lnum_Proofnum_Parts/";
    this.PROOF_TEMPLATE_NAME = this.PROOF_ROOT_FOLDER + "Lnum_Proofnum";
    this.PROOF_STEPS_NAME = this.PROOF_PARTS_FOLDER + "Proof_Lnum_Pnum_Steps";
    this.PROOF_QUESTION_NAME = this.PROOF_PARTS_FOLDER + "Proof_Lnum_Pnum_Question";

    this.doc = document;
    this.proofs = null;
};

ProofAssets.prototype.createProofs = function (proofSet) {
    var pa = this;

    //Create and organize each Proof and ProofStep symbol
    proofSet.proofs.forEach(function (proof) {
        //Create the Proof root folder
        if (!pa.doc.library.itemExists(proof.folderName)) {
            pa.doc.library.newFolder(proof.folderName);
            tt.log("New folder created:" + proof.folderName);
        }

        //Create the Proof parts folder
        if (!pa.doc.library.itemExists(proof.partsFolderName)) {
            pa.doc.library.newFolder(proof.partsFolderName);
            tt.log("New folder created:" + proof.partsFolderName);
        }

        //Duplicate the Proof symbol
        if (!pa.doc.library.itemExists(proof.symbolPath)) {
            if (pa.doc.library.duplicateItem(pa.PROOF_TEMPLATE_NAME)) {
                pa.doc.library.selectItem(pa.PROOF_TEMPLATE_NAME + " copy");
                pa.doc.library.setItemProperty("name", proof.symbolName);
                pa.doc.library.setItemProperty("linkageClassName", proof.symbolName);
                pa.doc.library.moveToFolder(proof.folderName);
                tt.log("Created Proof symbol: " + proof.symbolName);
            } else {
                tt.log("Error duplicating item: " + pa.PROOF_TEMPLATE_NAME);
            }
        }

        //Duplicate Proof Steps symbol
        if (!pa.doc.library.itemExists(proof.stepsSymbolPath)) {
            if (pa.doc.library.duplicateItem(pa.PROOF_STEPS_NAME)) {
                pa.doc.library.selectItem(pa.PROOF_STEPS_NAME + " copy");
                pa.doc.library.setItemProperty("name", proof.stepsSymbolName);
                pa.doc.library.moveToFolder(proof.partsFolderName);
                tt.log("Created Proof Steps symbol: " + proof.stepsSymbolName);
            } else {
                tt.log("Error duplicating item: " + pa.PROOF_TEMPLATE_NAME);
            }
        }
    });

    //Create and organize each Reason symbol
    proofSet.proofReasons.forEach(function (value) {
        var lessonNumber = Number(proofSet.doc.name.match(/\.l(\d{1,3})/i)[1]);
        var proofNumber = value.name.match(/(?:p|proof)(?:_\d{1,3}-)([A-F]|\d{1,2})/i)[1];
        var reasonNumber = value.name.match(/reason(\d{1,2})/i)[1];
        var proofFolderName = "L" + lessonNumber + "_Proofs";
        var proofPartsFolderName = proofFolderName + "/L" + lessonNumber + "_Proof" + proofNumber + "_Parts";
        var reasonSymbolName = "Proof_L" + lessonNumber + "_P" + proofNumber + "_Reason" + reasonNumber;
        var reasonSymbolPath = proofPartsFolderName + "/" + reasonSymbolName;

        if (!pa.doc.library.itemExists(reasonSymbolPath)) {
            if (pa.doc.library.duplicateItem(pa.PROOF_QUESTION_NAME)) {
                pa.doc.library.selectItem(pa.PROOF_QUESTION_NAME + " copy");
                pa.doc.library.setItemProperty("name", reasonSymbolName);
                pa.doc.library.moveToFolder(proofPartsFolderName);
                tt.log("Created Proof Steps symbol: " + reasonSymbolPath);
            } else {
                tt.log("Error duplicating item: " + pa.PROOF_QUESTION_NAME);
            }
        }
    });

    //Create and organize each Statement symbol
    proofSet.proofStatements.forEach(function (value) {
        var lessonNumber = Number(proofSet.doc.name.match(/\.l(\d{1,3})/i)[1]);
        var proofNumber = value.name.match(/(?:p|proof)(?:_\d{1,3}-)([A-F]|\d{1,2})/i)[1];
        var statementNumber = value.name.match(/statement(\d{1,2})/i)[1];
        var proofFolderName = "L" + lessonNumber + "_Proofs";
        var proofPartsFolderName = proofFolderName + "/L" + lessonNumber + "_Proof" + proofNumber + "_Parts";
        var statementSymbolName = "Proof_L" + lessonNumber + "_P" + proofNumber + "_Statement" + statementNumber;
        var statementSymbolPath = proofPartsFolderName + "/" + statementSymbolName;

        if (!pa.doc.library.itemExists(statementSymbolPath)) {
            if (pa.doc.library.duplicateItem(pa.PROOF_QUESTION_NAME)) {
                pa.doc.library.selectItem(pa.PROOF_QUESTION_NAME + " copy");
                pa.doc.library.setItemProperty("name", statementSymbolName);
                pa.doc.library.moveToFolder(proofPartsFolderName);
                tt.log("Created Proof Steps symbol: " + statementSymbolPath);
            } else {
                tt.log("Error duplicating item: " + pa.PROOF_QUESTION_NAME);
            }
        }
    });
};

ProofAssets.prototype.getProofs = function () {
    return this.doc.library.items.filter(function (value) {
        return value.name.match(/L\d{1,3}_Proof(?:[A-F]|\d{1,2})$/i);
    });
};

ProofAssets.prototype.swapStepSymbols = function () {
    var pa = this;
    pa.proofs = pa.getProofs();

    this.proofs.forEach(function (value) {
        var lessonNumber = value.name.match(/l(\d{1,3})/i)[1];
        var proofNumber = value.name.match(/proof([A-F]|\d{1,2})/i)[1];
        var proofFolderName = "L" + lessonNumber + "_Proofs";
        var proofSymbolName = "L" + lessonNumber + "_Proof" + proofNumber;
        var proofSymbolPath = proofFolderName + "/" + proofSymbolName
        var proofPartsFolderName = proofSymbolPath + "_Parts"
        var proofStepsSymbolName = "Proof_L" + lessonNumber + "_P" + proofNumber + "_Steps";
        var proofStepsSymbolPath = proofPartsFolderName + "/" + proofStepsSymbolName;
        var proofStepsSymbol = pa.doc.library.items.filter(function (item) {
            return item.name === proofStepsSymbolPath
        })[0];

        pa.doc.library.editItem(value.name);

        if (pa.doc.selection.length === 1 && pa.doc.selection[0].name === "proofText" &&
            pa.doc.selection[0].libraryItem !== proofStepsSymbol) {
            pa.doc.selection[0].libraryItem = proofStepsSymbol;

            tt.log("Corrected symbol instance: " + proofStepsSymbol.name);
        }
    });

    pa.doc.exitEditMode();
};

ProofSet = function (document) {
    this.doc = document;
    this.proofs = this.getLegacyProofs(document);
    this.proofReasons = this.getLegacyProofReasons();
    this.proofStatements = this.getLegacyProofStatements();
};

ProofSet.prototype.getLegacyProofs = function (document) {
    var _legacyProofItems;
    var _legacyProofs = [];

    _legacyProofItems = this.doc.library.items.filter(function (value) {
        return value.name.match(/proof_\d{1,3}-(?:[A-F]|\d{1,2})$/i);
    });

    _legacyProofItems.forEach(function (value) {
        _legacyProofs.push(new Proof(document, value));
    })

    return _legacyProofs;
};

ProofSet.prototype.getLegacyProofReasons = function () {
    return this.doc.library.items.filter(function (value) {
        return value.name.match(/proof_\d{1,3}-(?:[A-F]|\d{1,2})_reason\d{1,2}$/i);
    });
};

ProofSet.prototype.getLegacyProofStatements = function () {
    return this.doc.library.items.filter(function (value) {
        return value.name.match(/proof_\d{1,3}-(?:[A-F]|\d{1,2})_statement\d{1,2}$/i);
    });
};

function convertProof() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts

    var proofAssets = new ProofAssets(tt.getFiles(/proofassets/i, true));
    var proofSet = new ProofSet(tt.getFiles(/tt\.ge/i, true));

    tt.log(proofSet.doc.name, "new");

    proofAssets.createProofs(proofSet);
    proofAssets.swapStepSymbols();

    fl.showIdleMessage(true); //Show warnings about long-running scripts
}

function loadTTUTil() {
    fl.outputPanel.clear(); //Clear the Output Panel

    var ttUtilURI = "file:///c|/git/automation/TTUtil.jsfl";

    if (fl.fileExists(ttUtilURI)) {
        fl.runScript(ttUtilURI);
        return new TTUtil();
    }

    alert("TTUtil did not load successfully");
    return null;
}

convertProof();