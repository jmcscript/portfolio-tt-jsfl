var libItems = fl.getDocumentDOM().library.items;

fl.outputPanel.clear();
fl.outputPanel.trace('library total items: ' + libItems.length);

var fixFonts = confirm('Should we fix wrong fonts?');
var justHints = confirm('Should we only check hints?');
var counter = 0;

libItems.map(function (item) {
    /* any manipulations with font item occurs an error */
    if (item instanceof FontItem) return;

    //fl.outputPanel.trace('library item: ' + ind + ', ' + item + ', ' + item.symbolType + ', ' + item.name + ',
    // timeline - ' + item.timeline);

    var isHint = item.name.match(/_hint/);
    if (((justHints && isHint) || !justHints) && item instanceof SymbolItem) {
        const layers = item.timeline.layers;
        isHint && counter++;
        //fl.outputPanel.trace('library item: ' + ind + ', ' + item.timeline + ', layers - ' + layers.length);

        layers.map(function (layer) {
            if (layer.frames.length === 0) return;

            const elements = layer.frames[0].elements;
            //fl.outputPanel.trace('library item layer: ' + ind + ', elements - ' + elements.length);

            elements.map(function (element) {
                if (element instanceof Text) {
                    const font = element.getTextAttr('face');
                    const text = element.getTextString(0, element.length);

                    //fl.outputPanel.trace('library item layer: ' + ind + ', element - ' + element.elementType + ',
                    // font - ' + font);

                    if (typeof font === "string" && font.match(/Comic Sans.+\*/)) {
                        //if (font != 'Comic Sans MS Bold') {
                        fl.outputPanel.trace('library item font error: ' + item.name + ' -> ' + font + ' -> ' + text);
                        fixFonts && element.setTextAttr('face', 'Comic Sans MS Bold');
                    }
                }
            });
        });
    }
});

fl.outputPanel.trace('library total hints items: ' + counter);
