/**
 * Created with IntelliJ IDEA.
 * User: james.mcdonald
 * Date: 7/13/2020
 * Time: 3:51 PM
 */

fl.showIdleMessage(false);

fl.outputPanel.clear();

var assets = fl.getDocumentDOM();

for (var i in assets.library.items) {
    if (!assets.library.items.hasOwnProperty(i)) {
        break;
    }

    var item = assets.library.items[i];
    var name = item.linkageClassName || "";
    var paddingRegExp = /LEC[0]{1,2}/;

    var hasPadding = Boolean(name.search(paddingRegExp) > -1);

    if (hasPadding) {
        item.linkageClassName = name.replace(paddingRegExp, "LEC");
        item.name = item.linkageClassName;
    }
}