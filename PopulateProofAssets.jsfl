/**
 * Uses proofAssets.fla to update the linkage item array called proofs in ProofAssets.as
 * User: v4ri4
 * Date: 1/28/2021
 * Time: 7:28 AM
 */

tt = loadTTUTil();

function populateProofAssets() {
    fl.showIdleMessage(false); //Hide warnings about long-running scripts

    var linkageItems = fl.getDocumentDOM().library.items.filter(function (item) {
        return item.linkageClassName && (item.linkageClassName.match(/[lq]\d{1,3}_proof/i));
    });

    var proofAssetsArray = [];

    linkageItems.forEach(function (item) {
        proofAssetsArray.push(item.linkageClassName);
    });

    var documentPathURI = fl.getDocumentDOM().pathURI;
    var documentParentURI = documentPathURI.slice(0, documentPathURI.lastIndexOf("/"));
    var proofAssetsFileURI = documentParentURI + "/ProofAssets.as";
    var proofAssetsFileString;
    var didWrite;

    if (FLfile.exists(proofAssetsFileURI)) {
        proofAssetsFileString = FLfile.read(proofAssetsFileURI);
        proofAssetsFileString = proofAssetsFileString.replace(
            /(proofs:Array\s?=\s?\[).+(])/i, "$1" + proofAssetsArray + "$2");
        didWrite = FLfile.write(proofAssetsFileURI, proofAssetsFileString);
    } else {
        proofAssetsFileString =
            "package com.tt.productSpecific.proofEngine {" + "\n" +
            "\t" + "public class ProofAssets {" + "\n" +
            "\t\t" + "public function ProofAssets() {" + "\n" +
            "\t\t" + "}" + "\n" +
            "\t\t" + "public var proofs:Array = [" + proofAssetsArray + "];" + "\n" +
            "\t" + "}" + "\n" +
            "}"
        didWrite = FLfile.write(proofAssetsFileURI, proofAssetsFileString);
    }

    if (didWrite) {
        tt.log("Successfully updated ProofAssets.as", "new");
    } else {
        tt.log("Error updating ProofAssets.as" + "\n\n" + proofAssetsFileString, "new");
    }

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

populateProofAssets();