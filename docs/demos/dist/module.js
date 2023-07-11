/**
 * Check is item is object
 */
const isObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
/**
 * Check for valid JSON string
 */
const isJson = (str) => {
    let t = !1;
    try {
        t = JSON.parse(str);
    }
    catch (e) {
        return !1;
    }
    return !(null === t || (!Array.isArray(t) && !isObject(t))) && t;
};
/**
 * Create DOM element node
 */
const createElement = (nodeName, attrs) => {
    const dom = document.createElement(nodeName);
    if (attrs && "object" == typeof attrs) {
        for (const attr in attrs) {
            if ("html" === attr) {
                dom.innerHTML = attrs[attr];
            }
            else {
                dom.setAttribute(attr, attrs[attr]);
            }
        }
    }
    return dom;
};
const objToText = (obj) => {
    if (["#text", "#comment"].includes(obj.nodeName)) {
        return obj.data;
    }
    if (obj.childNodes) {
        return obj.childNodes.map((childNode) => objToText(childNode)).join("");
    }
    return "";
};
const escapeText = function (text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
};
const visibleToColumnIndex = function (visibleIndex, columns) {
    let counter = 0;
    let columnIndex = 0;
    while (counter < (visibleIndex + 1)) {
        const columnSettings = columns[columnIndex];
        if (!columnSettings.hidden) {
            counter += 1;
        }
        columnIndex += 1;
    }
    return columnIndex - 1;
};
const columnToVisibleIndex = function (columnIndex, columns) {
    let visibleIndex = columnIndex;
    let counter = 0;
    while (counter < columnIndex) {
        const columnSettings = columns[counter];
        if (columnSettings.hidden) {
            visibleIndex -= 1;
        }
        counter++;
    }
    return visibleIndex;
};

function objToNode(objNode, insideSvg, options) {
    var node;
    if (objNode.nodeName === "#text") {
        node = options.document.createTextNode(objNode.data);
    }
    else if (objNode.nodeName === "#comment") {
        node = options.document.createComment(objNode.data);
    }
    else {
        if (insideSvg) {
            node = options.document.createElementNS("http://www.w3.org/2000/svg", objNode.nodeName);
        }
        else if (objNode.nodeName.toLowerCase() === "svg") {
            node = options.document.createElementNS("http://www.w3.org/2000/svg", "svg");
            insideSvg = true;
        }
        else {
            node = options.document.createElement(objNode.nodeName);
        }
        if (objNode.attributes) {
            Object.entries(objNode.attributes).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                return node.setAttribute(key, value);
            });
        }
        if (objNode.childNodes) {
            node = node;
            objNode.childNodes.forEach(function (childNode) {
                return node.appendChild(objToNode(childNode, insideSvg, options));
            });
        }
        if (options.valueDiffing) {
            if (objNode.value &&
                (node instanceof HTMLButtonElement ||
                    node instanceof HTMLDataElement ||
                    node instanceof HTMLInputElement ||
                    node instanceof HTMLLIElement ||
                    node instanceof HTMLMeterElement ||
                    node instanceof HTMLOptionElement ||
                    node instanceof HTMLProgressElement ||
                    node instanceof HTMLParamElement)) {
                node.value = objNode.value;
            }
            if (objNode.checked && node instanceof HTMLInputElement) {
                node.checked = objNode.checked;
            }
            if (objNode.selected && node instanceof HTMLOptionElement) {
                node.selected = objNode.selected;
            }
        }
    }
    return node;
}

// ===== Apply a diff =====
var getFromRoute = function (node, route) {
    route = route.slice();
    while (route.length > 0) {
        var c = route.splice(0, 1)[0];
        node = node.childNodes[c];
    }
    return node;
};
function applyDiff(tree, diff, options // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    var action = diff[options._const.action];
    var route = diff[options._const.route];
    var node;
    if (![options._const.addElement, options._const.addTextElement].includes(action)) {
        // For adding nodes, we calculate the route later on. It's different because it includes the position of the newly added item.
        node = getFromRoute(tree, route);
    }
    var newNode;
    var reference;
    var nodeArray;
    // pre-diff hook
    var info = {
        diff: diff,
        node: node
    };
    if (options.preDiffApply(info)) {
        return true;
    }
    switch (action) {
        case options._const.addAttribute:
            if (!node || !(node instanceof Element)) {
                return false;
            }
            node.setAttribute(diff[options._const.name], diff[options._const.value]);
            break;
        case options._const.modifyAttribute:
            if (!node || !(node instanceof Element)) {
                return false;
            }
            node.setAttribute(diff[options._const.name], diff[options._const.newValue]);
            if (node instanceof HTMLInputElement &&
                diff[options._const.name] === "value") {
                node.value = diff[options._const.newValue];
            }
            break;
        case options._const.removeAttribute:
            if (!node || !(node instanceof Element)) {
                return false;
            }
            node.removeAttribute(diff[options._const.name]);
            break;
        case options._const.modifyTextElement:
            if (!node || !(node instanceof Text)) {
                return false;
            }
            options.textDiff(node, node.data, diff[options._const.oldValue], diff[options._const.newValue]);
            if (node.parentNode instanceof HTMLTextAreaElement) {
                node.parentNode.value = diff[options._const.newValue];
            }
            break;
        case options._const.modifyValue:
            if (!node || typeof node.value === "undefined") {
                return false;
            }
            node.value = diff[options._const.newValue];
            break;
        case options._const.modifyComment:
            if (!node || !(node instanceof Comment)) {
                return false;
            }
            options.textDiff(node, node.data, diff[options._const.oldValue], diff[options._const.newValue]);
            break;
        case options._const.modifyChecked:
            if (!node || typeof node.checked === "undefined") {
                return false;
            }
            node.checked = diff[options._const.newValue];
            break;
        case options._const.modifySelected:
            if (!node || typeof node.selected === "undefined") {
                return false;
            }
            node.selected = diff[options._const.newValue];
            break;
        case options._const.replaceElement: {
            var insideSvg = diff[options._const.newValue].nodeName.toLowerCase() === "svg" ||
                node.parentNode.namespaceURI === "http://www.w3.org/2000/svg";
            node.parentNode.replaceChild(objToNode(diff[options._const.newValue], insideSvg, options), node);
            break;
        }
        case options._const.relocateGroup:
            nodeArray = Array.apply(void 0, new Array(diff[options._const.groupLength])).map(function () {
                return node.removeChild(node.childNodes[diff[options._const.from]]);
            });
            nodeArray.forEach(function (childNode, index) {
                if (index === 0) {
                    reference =
                        node.childNodes[diff[options._const.to]];
                }
                node.insertBefore(childNode, reference || null);
            });
            break;
        case options._const.removeElement:
            node.parentNode.removeChild(node);
            break;
        case options._const.addElement: {
            var parentRoute = route.slice();
            var c = parentRoute.splice(parentRoute.length - 1, 1)[0];
            node = getFromRoute(tree, parentRoute);
            if (!(node instanceof Element)) {
                return false;
            }
            node.insertBefore(objToNode(diff[options._const.element], node.namespaceURI === "http://www.w3.org/2000/svg", options), node.childNodes[c] || null);
            break;
        }
        case options._const.removeTextElement: {
            if (!node || node.nodeType !== 3) {
                return false;
            }
            var parentNode = node.parentNode;
            parentNode.removeChild(node);
            if (parentNode instanceof HTMLTextAreaElement) {
                parentNode.value = "";
            }
            break;
        }
        case options._const.addTextElement: {
            var parentRoute = route.slice();
            var c = parentRoute.splice(parentRoute.length - 1, 1)[0];
            newNode = options.document.createTextNode(diff[options._const.value]);
            node = getFromRoute(tree, parentRoute);
            if (!node.childNodes) {
                return false;
            }
            node.insertBefore(newNode, node.childNodes[c] || null);
            if (node.parentNode instanceof HTMLTextAreaElement) {
                node.parentNode.value = diff[options._const.value];
            }
            break;
        }
        default:
            console.log("unknown action");
    }
    // if a new node was created, we might be interested in its
    // post diff hook
    options.postDiffApply({
        diff: info.diff,
        node: info.node,
        newNode: newNode
    });
    return true;
}
function applyDOM(tree, diffs, options) {
    return diffs.every(function (diff) {
        return applyDiff(tree, diff, options);
    });
}

// ===== Undo a diff =====
function swap(obj, p1, p2) {
    var tmp = obj[p1];
    obj[p1] = obj[p2];
    obj[p2] = tmp;
}
function undoDiff(tree, diff, options // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            diff[options._const.action] = options._const.removeAttribute;
            applyDiff(tree, diff, options);
            break;
        case options._const.modifyAttribute:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.removeAttribute:
            diff[options._const.action] = options._const.addAttribute;
            applyDiff(tree, diff, options);
            break;
        case options._const.modifyTextElement:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.modifyValue:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.modifyComment:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.modifyChecked:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.modifySelected:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.replaceElement:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break;
        case options._const.relocateGroup:
            swap(diff, options._const.from, options._const.to);
            applyDiff(tree, diff, options);
            break;
        case options._const.removeElement:
            diff[options._const.action] = options._const.addElement;
            applyDiff(tree, diff, options);
            break;
        case options._const.addElement:
            diff[options._const.action] = options._const.removeElement;
            applyDiff(tree, diff, options);
            break;
        case options._const.removeTextElement:
            diff[options._const.action] = options._const.addTextElement;
            applyDiff(tree, diff, options);
            break;
        case options._const.addTextElement:
            diff[options._const.action] = options._const.removeTextElement;
            applyDiff(tree, diff, options);
            break;
        default:
            console.log("unknown action");
    }
}
function undoDOM(tree, diffs, options) {
    diffs = diffs.slice();
    diffs.reverse();
    diffs.forEach(function (diff) {
        undoDiff(tree, diff, options);
    });
}

var elementDescriptors = function (el) {
    var output = [];
    output.push(el.nodeName);
    if (el.nodeName !== "#text" && el.nodeName !== "#comment") {
        el = el;
        if (el.attributes) {
            if (el.attributes["class"]) {
                output.push("".concat(el.nodeName, ".").concat(el.attributes["class"].replace(/ /g, ".")));
            }
            if (el.attributes.id) {
                output.push("".concat(el.nodeName, "#").concat(el.attributes.id));
            }
        }
    }
    return output;
};
var findUniqueDescriptors = function (li) {
    var uniqueDescriptors = {};
    var duplicateDescriptors = {};
    li.forEach(function (node) {
        elementDescriptors(node).forEach(function (descriptor) {
            var inUnique = descriptor in uniqueDescriptors;
            var inDupes = descriptor in duplicateDescriptors;
            if (!inUnique && !inDupes) {
                uniqueDescriptors[descriptor] = true;
            }
            else if (inUnique) {
                delete uniqueDescriptors[descriptor];
                duplicateDescriptors[descriptor] = true;
            }
        });
    });
    return uniqueDescriptors;
};
var uniqueInBoth = function (l1, l2) {
    var l1Unique = findUniqueDescriptors(l1);
    var l2Unique = findUniqueDescriptors(l2);
    var inBoth = {};
    Object.keys(l1Unique).forEach(function (key) {
        if (l2Unique[key]) {
            inBoth[key] = true;
        }
    });
    return inBoth;
};
var removeDone = function (tree) {
    delete tree.outerDone;
    delete tree.innerDone;
    delete tree.valueDone;
    if (tree.childNodes) {
        return tree.childNodes.every(removeDone);
    }
    else {
        return true;
    }
};
var cleanNode = function (diffNode) {
    if (Object.prototype.hasOwnProperty.call(diffNode, "data")) {
        var textNode = {
            nodeName: diffNode.nodeName === "#text" ? "#text" : "#comment",
            data: diffNode.data
        };
        return textNode;
    }
    else {
        var elementNode = {
            nodeName: diffNode.nodeName
        };
        diffNode = diffNode;
        if (Object.prototype.hasOwnProperty.call(diffNode, "attributes")) {
            elementNode.attributes = diffNode.attributes;
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "checked")) {
            elementNode.checked = diffNode.checked;
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "value")) {
            elementNode.value = diffNode.value;
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "selected")) {
            elementNode.selected = diffNode.selected;
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "childNodes")) {
            elementNode.childNodes = diffNode.childNodes.map(function (diffChildNode) {
                return cleanNode(diffChildNode);
            });
        }
        return elementNode;
    }
};
var isEqual = function (e1, e2) {
    if (!["nodeName", "value", "checked", "selected", "data"].every(function (element) {
        if (e1[element] !== e2[element]) {
            return false;
        }
        return true;
    })) {
        return false;
    }
    if (Object.prototype.hasOwnProperty.call(e1, "data")) {
        // Comment or Text
        return true;
    }
    e1 = e1;
    e2 = e2;
    if (Boolean(e1.attributes) !== Boolean(e2.attributes)) {
        return false;
    }
    if (Boolean(e1.childNodes) !== Boolean(e2.childNodes)) {
        return false;
    }
    if (e1.attributes) {
        var e1Attributes = Object.keys(e1.attributes);
        var e2Attributes = Object.keys(e2.attributes);
        if (e1Attributes.length !== e2Attributes.length) {
            return false;
        }
        if (!e1Attributes.every(function (attribute) {
            if (e1.attributes[attribute] !==
                e2.attributes[attribute]) {
                return false;
            }
            return true;
        })) {
            return false;
        }
    }
    if (e1.childNodes) {
        if (e1.childNodes.length !== e2.childNodes.length) {
            return false;
        }
        if (!e1.childNodes.every(function (childNode, index) {
            return isEqual(childNode, e2.childNodes[index]);
        })) {
            return false;
        }
    }
    return true;
};
var roughlyEqual = function (e1, e2, uniqueDescriptors, sameSiblings, preventRecursion) {
    if (preventRecursion === void 0) { preventRecursion = false; }
    if (!e1 || !e2) {
        return false;
    }
    if (e1.nodeName !== e2.nodeName) {
        return false;
    }
    if (["#text", "#comment"].includes(e1.nodeName)) {
        // Note that we initially don't care what the text content of a node is,
        // the mere fact that it's the same tag and "has text" means it's roughly
        // equal, and then we can find out the true text difference later.
        return preventRecursion
            ? true
            : e1.data === e2.data;
    }
    e1 = e1;
    e2 = e2;
    if (e1.nodeName in uniqueDescriptors) {
        return true;
    }
    if (e1.attributes && e2.attributes) {
        if (e1.attributes.id) {
            if (e1.attributes.id !== e2.attributes.id) {
                return false;
            }
            else {
                var idDescriptor = "".concat(e1.nodeName, "#").concat(e1.attributes.id);
                if (idDescriptor in uniqueDescriptors) {
                    return true;
                }
            }
        }
        if (e1.attributes["class"] &&
            e1.attributes["class"] === e2.attributes["class"]) {
            var classDescriptor = "".concat(e1.nodeName, ".").concat(e1.attributes["class"].replace(/ /g, "."));
            if (classDescriptor in uniqueDescriptors) {
                return true;
            }
        }
    }
    if (sameSiblings) {
        return true;
    }
    var nodeList1 = e1.childNodes ? e1.childNodes.slice().reverse() : [];
    var nodeList2 = e2.childNodes ? e2.childNodes.slice().reverse() : [];
    if (nodeList1.length !== nodeList2.length) {
        return false;
    }
    if (preventRecursion) {
        return nodeList1.every(function (element, index) {
            return element.nodeName === nodeList2[index].nodeName;
        });
    }
    else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        // was not set, we must explicitly force it to true for child iterations.
        var childUniqueDescriptors_1 = uniqueInBoth(nodeList1, nodeList2);
        return nodeList1.every(function (element, index) {
            return roughlyEqual(element, nodeList2[index], childUniqueDescriptors_1, true, true);
        });
    }
};
/**
 * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
 */
var findCommonSubsets = function (c1, c2, marked1, marked2) {
    var lcsSize = 0;
    var index = [];
    var c1Length = c1.length;
    var c2Length = c2.length;
    var // set up the matching table
    matches = Array.apply(void 0, new Array(c1Length + 1)).map(function () { return []; });
    var uniqueDescriptors = uniqueInBoth(c1, c2);
    var // If all of the elements are the same tag, id and class, then we can
    // consider them roughly the same even if they have a different number of
    // children. This will reduce removing and re-adding similar elements.
    subsetsSame = c1Length === c2Length;
    if (subsetsSame) {
        c1.some(function (element, i) {
            var c1Desc = elementDescriptors(element);
            var c2Desc = elementDescriptors(c2[i]);
            if (c1Desc.length !== c2Desc.length) {
                subsetsSame = false;
                return true;
            }
            c1Desc.some(function (description, i) {
                if (description !== c2Desc[i]) {
                    subsetsSame = false;
                    return true;
                }
            });
            if (!subsetsSame) {
                return true;
            }
        });
    }
    // fill the matches with distance values
    for (var c1Index = 0; c1Index < c1Length; c1Index++) {
        var c1Element = c1[c1Index];
        for (var c2Index = 0; c2Index < c2Length; c2Index++) {
            var c2Element = c2[c2Index];
            if (!marked1[c1Index] &&
                !marked2[c2Index] &&
                roughlyEqual(c1Element, c2Element, uniqueDescriptors, subsetsSame)) {
                matches[c1Index + 1][c2Index + 1] = matches[c1Index][c2Index]
                    ? matches[c1Index][c2Index] + 1
                    : 1;
                if (matches[c1Index + 1][c2Index + 1] >= lcsSize) {
                    lcsSize = matches[c1Index + 1][c2Index + 1];
                    index = [c1Index + 1, c2Index + 1];
                }
            }
            else {
                matches[c1Index + 1][c2Index + 1] = 0;
            }
        }
    }
    if (lcsSize === 0) {
        return false;
    }
    return {
        oldValue: index[0] - lcsSize,
        newValue: index[1] - lcsSize,
        length: lcsSize
    };
};
var makeBooleanArray = function (n, v) {
    return Array.apply(void 0, new Array(n)).map(function () { return v; });
};
/**
 * Generate arrays that indicate which node belongs to which subset,
 * or whether it's actually an orphan node, existing in only one
 * of the two trees, rather than somewhere in both.
 *
 * So if t1 = <img><canvas><br>, t2 = <canvas><br><img>.
 * The longest subset is "<canvas><br>" (length 2), so it will group 0.
 * The second longest is "<img>" (length 1), so it will be group 1.
 * gaps1 will therefore be [1,0,0] and gaps2 [0,0,1].
 *
 * If an element is not part of any group, it will stay being 'true', which
 * is the initial value. For example:
 * t1 = <img><p></p><br><canvas>, t2 = <b></b><br><canvas><img>
 *
 * The "<p></p>" and "<b></b>" do only show up in one of the two and will
 * therefore be marked by "true". The remaining parts are parts of the
 * groups 0 and 1:
 * gaps1 = [1, true, 0, 0], gaps2 = [true, 0, 0, 1]
 *
 */
var getGapInformation = function (t1, t2, stable) {
    var gaps1 = t1.childNodes
        ? makeBooleanArray(t1.childNodes.length, true)
        : [];
    var gaps2 = t2.childNodes
        ? makeBooleanArray(t2.childNodes.length, true)
        : [];
    var group = 0;
    // give elements from the same subset the same group number
    stable.forEach(function (subset) {
        var endOld = subset.oldValue + subset.length;
        var endNew = subset.newValue + subset.length;
        for (var j = subset.oldValue; j < endOld; j += 1) {
            gaps1[j] = group;
        }
        for (var j = subset.newValue; j < endNew; j += 1) {
            gaps2[j] = group;
        }
        group += 1;
    });
    return {
        gaps1: gaps1,
        gaps2: gaps2
    };
};
/**
 * Find all matching subsets, based on immediate child differences only.
 */
var markBoth = function (marked1, marked2, subset, i) {
    marked1[subset.oldValue + i] = true;
    marked2[subset.newValue + i] = true;
};
var markSubTrees = function (oldTree, newTree) {
    // note: the child lists are views, and so update as we update old/newTree
    var oldChildren = oldTree.childNodes ? oldTree.childNodes : [];
    var newChildren = newTree.childNodes ? newTree.childNodes : [];
    var marked1 = makeBooleanArray(oldChildren.length, false);
    var marked2 = makeBooleanArray(newChildren.length, false);
    var subsets = [];
    var returnIndex = function () {
        return arguments[1];
    };
    var foundAllSubsets = false;
    var _loop_1 = function () {
        var subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
        if (subset) {
            subsets.push(subset);
            var subsetArray = Array.apply(void 0, new Array(subset.length)).map(returnIndex);
            subsetArray.forEach(function (item) {
                return markBoth(marked1, marked2, subset, item);
            });
        }
        else {
            foundAllSubsets = true;
        }
    };
    while (!foundAllSubsets) {
        _loop_1();
    }
    oldTree.subsets = subsets;
    oldTree.subsetsAge = 100;
    return subsets;
};
var DiffTracker = /** @class */ (function () {
    function DiffTracker() {
        this.list = [];
    }
    DiffTracker.prototype.add = function (diffs) {
        var _a;
        (_a = this.list).push.apply(_a, diffs);
    };
    DiffTracker.prototype.forEach = function (fn) {
        this.list.forEach(function (li) { return fn(li); });
    };
    return DiffTracker;
}());
//export const elementHasValue = (element: Element) : boolean => element instanceof HTMLButtonElement || element instanceof HTMLDataElement || element instanceof HTMLInputElement || element instanceof HTMLLIElement || element instanceof HTMLMeterElement || element instanceof HTMLOptionElement || element instanceof HTMLProgressElement || element instanceof HTMLParamElement

var Diff = /** @class */ (function () {
    function Diff(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        Object.entries(options).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            return (_this[key] = value);
        });
    }
    Diff.prototype.toString = function () {
        return JSON.stringify(this);
    };
    Diff.prototype.setValue = function (aKey, aValue) {
        this[aKey] = aValue;
        return this;
    };
    return Diff;
}());

// ===== Apply a virtual diff =====
function getFromVirtualRoute(tree, route) {
    var node = tree;
    var parentNode;
    var nodeIndex;
    route = route.slice();
    while (route.length > 0) {
        nodeIndex = route.splice(0, 1)[0];
        parentNode = node;
        node = node.childNodes ? node.childNodes[nodeIndex] : undefined;
    }
    return {
        node: node,
        parentNode: parentNode,
        nodeIndex: nodeIndex
    };
}
function applyVirtualDiff(tree, diff, options // {preVirtualDiffApply, postVirtualDiffApply, _const}
) {
    var _a;
    var node, parentNode, nodeIndex;
    if (![options._const.addElement, options._const.addTextElement].includes(diff[options._const.action])) {
        // For adding nodes, we calculate the route later on. It's different because it includes the position of the newly added item.
        var routeInfo = getFromVirtualRoute(tree, diff[options._const.route]);
        node = routeInfo.node;
        parentNode = routeInfo.parentNode;
        nodeIndex = routeInfo.nodeIndex;
    }
    var newSubsets = [];
    // pre-diff hook
    var info = {
        diff: diff,
        node: node
    };
    if (options.preVirtualDiffApply(info)) {
        return true;
    }
    var newNode;
    var nodeArray;
    var route;
    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            if (!node.attributes) {
                node.attributes = {};
            }
            node.attributes[diff[options._const.name]] =
                diff[options._const.value];
            if (diff[options._const.name] === "checked") {
                node.checked = true;
            }
            else if (diff[options._const.name] === "selected") {
                node.selected = true;
            }
            else if (node.nodeName === "INPUT" &&
                diff[options._const.name] === "value") {
                node.value = diff[options._const.value];
            }
            break;
        case options._const.modifyAttribute:
            node.attributes[diff[options._const.name]] =
                diff[options._const.newValue];
            break;
        case options._const.removeAttribute:
            delete node.attributes[diff[options._const.name]];
            if (Object.keys(node.attributes).length === 0) {
                delete node.attributes;
            }
            if (diff[options._const.name] === "checked") {
                node.checked = false;
            }
            else if (diff[options._const.name] === "selected") {
                delete node.selected;
            }
            else if (node.nodeName === "INPUT" &&
                diff[options._const.name] === "value") {
                delete node.value;
            }
            break;
        case options._const.modifyTextElement:
            node.data = diff[options._const.newValue];
            if (parentNode.nodeName === "TEXTAREA") {
                parentNode.value = diff[options._const.newValue];
            }
            break;
        case options._const.modifyValue:
            node.value = diff[options._const.newValue];
            break;
        case options._const.modifyComment:
            node.data = diff[options._const.newValue];
            break;
        case options._const.modifyChecked:
            node.checked = diff[options._const.newValue];
            break;
        case options._const.modifySelected:
            node.selected = diff[options._const.newValue];
            break;
        case options._const.replaceElement:
            newNode = diff[options._const.newValue];
            parentNode.childNodes[nodeIndex] = newNode;
            break;
        case options._const.relocateGroup:
            nodeArray = node.childNodes
                .splice(diff[options._const.from], diff[options._const.groupLength])
                .reverse();
            nodeArray.forEach(function (movedNode) {
                return node.childNodes.splice(diff[options._const.to], 0, movedNode);
            });
            if (node.subsets) {
                node.subsets.forEach(function (map) {
                    if (diff[options._const.from] < diff[options._const.to] &&
                        map.oldValue <= diff[options._const.to] &&
                        map.oldValue > diff[options._const.from]) {
                        map.oldValue -= diff[options._const.groupLength];
                        var splitLength = map.oldValue + map.length - diff[options._const.to];
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue: diff[options._const.to] +
                                    diff[options._const.groupLength],
                                newValue: map.newValue + map.length - splitLength,
                                length: splitLength
                            });
                            map.length -= splitLength;
                        }
                    }
                    else if (diff[options._const.from] > diff[options._const.to] &&
                        map.oldValue > diff[options._const.to] &&
                        map.oldValue < diff[options._const.from]) {
                        map.oldValue += diff[options._const.groupLength];
                        var splitLength = map.oldValue + map.length - diff[options._const.to];
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue: diff[options._const.to] +
                                    diff[options._const.groupLength],
                                newValue: map.newValue + map.length - splitLength,
                                length: splitLength
                            });
                            map.length -= splitLength;
                        }
                    }
                    else if (map.oldValue === diff[options._const.from]) {
                        map.oldValue = diff[options._const.to];
                    }
                });
            }
            break;
        case options._const.removeElement:
            parentNode.childNodes.splice(nodeIndex, 1);
            if (parentNode.subsets) {
                parentNode.subsets.forEach(function (map) {
                    if (map.oldValue > nodeIndex) {
                        map.oldValue -= 1;
                    }
                    else if (map.oldValue === nodeIndex) {
                        map["delete"] = true;
                    }
                    else if (map.oldValue < nodeIndex &&
                        map.oldValue + map.length > nodeIndex) {
                        if (map.oldValue + map.length - 1 === nodeIndex) {
                            map.length--;
                        }
                        else {
                            newSubsets.push({
                                newValue: map.newValue + nodeIndex - map.oldValue,
                                oldValue: nodeIndex,
                                length: map.length - nodeIndex + map.oldValue - 1
                            });
                            map.length = nodeIndex - map.oldValue;
                        }
                    }
                });
            }
            node = parentNode;
            break;
        case options._const.addElement: {
            route = diff[options._const.route].slice();
            var c_1 = route.splice(route.length - 1, 1)[0];
            node = (_a = getFromVirtualRoute(tree, route)) === null || _a === void 0 ? void 0 : _a.node;
            newNode = diff[options._const.element];
            if (!node.childNodes) {
                node.childNodes = [];
            }
            if (c_1 >= node.childNodes.length) {
                node.childNodes.push(newNode);
            }
            else {
                node.childNodes.splice(c_1, 0, newNode);
            }
            if (node.subsets) {
                node.subsets.forEach(function (map) {
                    if (map.oldValue >= c_1) {
                        map.oldValue += 1;
                    }
                    else if (map.oldValue < c_1 &&
                        map.oldValue + map.length > c_1) {
                        var splitLength = map.oldValue + map.length - c_1;
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c_1 + 1,
                            length: splitLength
                        });
                        map.length -= splitLength;
                    }
                });
            }
            break;
        }
        case options._const.removeTextElement:
            parentNode.childNodes.splice(nodeIndex, 1);
            if (parentNode.nodeName === "TEXTAREA") {
                delete parentNode.value;
            }
            if (parentNode.subsets) {
                parentNode.subsets.forEach(function (map) {
                    if (map.oldValue > nodeIndex) {
                        map.oldValue -= 1;
                    }
                    else if (map.oldValue === nodeIndex) {
                        map["delete"] = true;
                    }
                    else if (map.oldValue < nodeIndex &&
                        map.oldValue + map.length > nodeIndex) {
                        if (map.oldValue + map.length - 1 === nodeIndex) {
                            map.length--;
                        }
                        else {
                            newSubsets.push({
                                newValue: map.newValue + nodeIndex - map.oldValue,
                                oldValue: nodeIndex,
                                length: map.length - nodeIndex + map.oldValue - 1
                            });
                            map.length = nodeIndex - map.oldValue;
                        }
                    }
                });
            }
            node = parentNode;
            break;
        case options._const.addTextElement: {
            route = diff[options._const.route].slice();
            var c_2 = route.splice(route.length - 1, 1)[0];
            newNode = {};
            newNode.nodeName = "#text";
            newNode.data = diff[options._const.value];
            node = getFromVirtualRoute(tree, route).node;
            if (!node.childNodes) {
                node.childNodes = [];
            }
            if (c_2 >= node.childNodes.length) {
                node.childNodes.push(newNode);
            }
            else {
                node.childNodes.splice(c_2, 0, newNode);
            }
            if (node.nodeName === "TEXTAREA") {
                node.value = diff[options._const.newValue];
            }
            if (node.subsets) {
                node.subsets.forEach(function (map) {
                    if (map.oldValue >= c_2) {
                        map.oldValue += 1;
                    }
                    if (map.oldValue < c_2 && map.oldValue + map.length > c_2) {
                        var splitLength = map.oldValue + map.length - c_2;
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c_2 + 1,
                            length: splitLength
                        });
                        map.length -= splitLength;
                    }
                });
            }
            break;
        }
        default:
            console.log("unknown action");
    }
    if (node.subsets) {
        node.subsets = node.subsets.filter(function (map) { return !map["delete"] && map.oldValue !== map.newValue; });
        if (newSubsets.length) {
            node.subsets = node.subsets.concat(newSubsets);
        }
    }
    options.postVirtualDiffApply({
        node: info.node,
        diff: info.diff,
        newNode: newNode
    });
    return;
}
function applyVirtual(tree, diffs, options) {
    diffs.forEach(function (diff) {
        applyVirtualDiff(tree, diff, options);
    });
    return true;
}

function nodeToObj(aNode, options) {
    if (options === void 0) { options = { valueDiffing: true }; }
    var objNode = {
        nodeName: aNode.nodeName
    };
    if (aNode instanceof Text || aNode instanceof Comment) {
        objNode.data = aNode.data;
    }
    else {
        if (aNode.attributes && aNode.attributes.length > 0) {
            objNode.attributes = {};
            var nodeArray = Array.prototype.slice.call(aNode.attributes);
            nodeArray.forEach(function (attribute) {
                return (objNode.attributes[attribute.name] = attribute.value);
            });
        }
        if (aNode.childNodes && aNode.childNodes.length > 0) {
            objNode.childNodes = [];
            var nodeArray = Array.prototype.slice.call(aNode.childNodes);
            nodeArray.forEach(function (childNode) {
                return objNode.childNodes.push(nodeToObj(childNode, options));
            });
        }
        if (options.valueDiffing) {
            if (aNode instanceof HTMLTextAreaElement) {
                objNode.value = aNode.value;
            }
            if (aNode instanceof HTMLInputElement &&
                ["radio", "checkbox"].includes(aNode.type.toLowerCase()) &&
                aNode.checked !== undefined) {
                objNode.checked = aNode.checked;
            }
            else if (aNode instanceof HTMLButtonElement ||
                aNode instanceof HTMLDataElement ||
                aNode instanceof HTMLInputElement ||
                aNode instanceof HTMLLIElement ||
                aNode instanceof HTMLMeterElement ||
                aNode instanceof HTMLOptionElement ||
                aNode instanceof HTMLProgressElement ||
                aNode instanceof HTMLParamElement) {
                objNode.value = aNode.value;
            }
            if (aNode instanceof HTMLOptionElement) {
                objNode.selected = aNode.selected;
            }
        }
    }
    return objNode;
}

// from html-parse-stringify (MIT)
var tagRE = /<\s*\/*[a-zA-Z:_][a-zA-Z0-9:_\-.]*\s*(?:"[^"]*"['"]*|'[^']*'['"]*|[^'"/>])*\/*\s*>|<!--(?:.|\n|\r)*?-->/g;
var attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
function unescape(string) {
    return string
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}
// create optimized lookup object for
// void elements as listed here:
// https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
var lookup = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    menuItem: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
};
var parseTag = function (tag) {
    var res = {
        nodeName: "",
        attributes: {}
    };
    var voidElement = false;
    var type = "tag";
    var tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);
    if (tagMatch) {
        res.nodeName = tagMatch[1];
        if (lookup[tagMatch[1]] || tag.charAt(tag.length - 2) === "/") {
            voidElement = true;
        }
        // handle comment tag
        if (res.nodeName.startsWith("!--")) {
            var endIndex = tag.indexOf("-->");
            return {
                type: "comment",
                node: {
                    nodeName: "#comment",
                    data: endIndex !== -1 ? tag.slice(4, endIndex) : ""
                },
                voidElement: voidElement
            };
        }
    }
    var reg = new RegExp(attrRE);
    var result = null;
    var done = false;
    while (!done) {
        result = reg.exec(tag);
        if (result === null) {
            done = true;
        }
        else if (result[0].trim()) {
            if (result[1]) {
                var attr = result[1].trim();
                var arr = [attr, ""];
                if (attr.indexOf("=") > -1)
                    { arr = attr.split("="); }
                res.attributes[arr[0]] = arr[1];
                reg.lastIndex--;
            }
            else if (result[2])
                { res.attributes[result[2]] = result[3]
                    .trim()
                    .substring(1, result[3].length - 1); }
        }
    }
    return {
        type: type,
        node: res,
        voidElement: voidElement
    };
};
var stringToObj = function (html, options) {
    if (options === void 0) { options = { valueDiffing: true }; }
    var result = [];
    var current;
    var level = -1;
    var arr = [];
    var inComponent = false;
    // handle text at top level
    if (html.indexOf("<") !== 0) {
        var end = html.indexOf("<");
        result.push({
            nodeName: "#text",
            data: end === -1 ? html : html.substring(0, end)
        });
    }
    html.replace(tagRE, function (tag, index) {
        var isOpen = tag.charAt(1) !== "/";
        var isComment = tag.startsWith("<!--");
        var start = index + tag.length;
        var nextChar = html.charAt(start);
        if (isComment) {
            var comment = parseTag(tag).node;
            // if we're at root, push new base node
            if (level < 0) {
                result.push(comment);
                return "";
            }
            var parent_1 = arr[level];
            if (parent_1 && comment.nodeName) {
                if (!parent_1.node.childNodes) {
                    parent_1.node.childNodes = [];
                }
                parent_1.node.childNodes.push(comment);
            }
            return "";
        }
        if (isOpen) {
            current = parseTag(tag);
            level++;
            if (!current.voidElement &&
                !inComponent &&
                nextChar &&
                nextChar !== "<") {
                if (!current.node.childNodes) {
                    current.node.childNodes = [];
                }
                var data = unescape(html.slice(start, html.indexOf("<", start)));
                current.node.childNodes.push({
                    nodeName: "#text",
                    data: data
                });
                if (options.valueDiffing &&
                    current.node.nodeName === "TEXTAREA") {
                    current.node.value = data;
                }
            }
            // if we're at root, push new base node
            if (level === 0 && current.node.nodeName) {
                result.push(current.node);
            }
            var parent_2 = arr[level - 1];
            if (parent_2 && current.node.nodeName) {
                if (!parent_2.node.childNodes) {
                    parent_2.node.childNodes = [];
                }
                parent_2.node.childNodes.push(current.node);
            }
            arr[level] = current;
        }
        if (!isOpen || current.voidElement) {
            if (level > -1 &&
                (current.voidElement ||
                    current.node.nodeName.toUpperCase() ===
                        tag.slice(2, -1).toUpperCase())) {
                level--;
                // move current up a level to match the end tag
                if (level > -1) {
                    current = arr[level];
                }
            }
            if (nextChar !== "<" && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                var childNodes = level === -1 ? result : arr[level].node.childNodes || [];
                // calculate correct end of the data slice in case there's
                // no tag after the text node.
                var end = html.indexOf("<", start);
                var data = unescape(html.slice(start, end === -1 ? undefined : end));
                childNodes.push({
                    nodeName: "#text",
                    data: data
                });
            }
        }
        return "";
    });
    return result[0];
};

// ===== Create a diff =====
var DiffFinder = /** @class */ (function () {
    function DiffFinder(t1Node, t2Node, options) {
        this.options = options;
        this.t1 = (typeof Element !== "undefined" && t1Node instanceof Element
            ? nodeToObj(t1Node, this.options)
            : typeof t1Node === "string"
                ? stringToObj(t1Node, this.options)
                : JSON.parse(JSON.stringify(t1Node)));
        this.t2 = (typeof Element !== "undefined" && t2Node instanceof Element
            ? nodeToObj(t2Node, this.options)
            : typeof t2Node === "string"
                ? stringToObj(t2Node, this.options)
                : JSON.parse(JSON.stringify(t2Node)));
        this.diffcount = 0;
        this.foundAll = false;
        if (this.debug) {
            this.t1Orig =
                typeof Element !== "undefined" && t1Node instanceof Element
                    ? nodeToObj(t1Node, this.options)
                    : typeof t1Node === "string"
                        ? stringToObj(t1Node, this.options)
                        : JSON.parse(JSON.stringify(t1Node));
            this.t2Orig =
                typeof Element !== "undefined" && t2Node instanceof Element
                    ? nodeToObj(t2Node, this.options)
                    : typeof t2Node === "string"
                        ? stringToObj(t2Node, this.options)
                        : JSON.parse(JSON.stringify(t2Node));
        }
        this.tracker = new DiffTracker();
    }
    DiffFinder.prototype.init = function () {
        return this.findDiffs(this.t1, this.t2);
    };
    DiffFinder.prototype.findDiffs = function (t1, t2) {
        var diffs;
        do {
            if (this.options.debug) {
                this.diffcount += 1;
                if (this.diffcount > this.options.diffcap) {
                    throw new Error("surpassed diffcap:".concat(JSON.stringify(this.t1Orig), " -> ").concat(JSON.stringify(this.t2Orig)));
                }
            }
            diffs = this.findNextDiff(t1, t2, []);
            if (diffs.length === 0) {
                // Last check if the elements really are the same now.
                // If not, remove all info about being done and start over.
                // Sometimes a node can be marked as done, but the creation of subsequent diffs means that it has to be changed again.
                if (!isEqual(t1, t2)) {
                    if (this.foundAll) {
                        console.error("Could not find remaining diffs!");
                    }
                    else {
                        this.foundAll = true;
                        removeDone(t1);
                        diffs = this.findNextDiff(t1, t2, []);
                    }
                }
            }
            if (diffs.length > 0) {
                this.foundAll = false;
                this.tracker.add(diffs);
                applyVirtual(t1, diffs, this.options);
            }
        } while (diffs.length > 0);
        return this.tracker.list;
    };
    DiffFinder.prototype.findNextDiff = function (t1, t2, route) {
        var diffs;
        var fdiffs;
        if (this.options.maxDepth && route.length > this.options.maxDepth) {
            return [];
        }
        // outer differences?
        if (!t1.outerDone) {
            diffs = this.findOuterDiff(t1, t2, route);
            if (this.options.filterOuterDiff) {
                fdiffs = this.options.filterOuterDiff(t1, t2, diffs);
                if (fdiffs)
                    { diffs = fdiffs; }
            }
            if (diffs.length > 0) {
                t1.outerDone = true;
                return diffs;
            }
            else {
                t1.outerDone = true;
            }
        }
        if (Object.prototype.hasOwnProperty.call(t1, "data")) {
            // Comment or Text
            return [];
        }
        t1 = t1;
        t2 = t2;
        // inner differences?
        if (!t1.innerDone) {
            diffs = this.findInnerDiff(t1, t2, route);
            if (diffs.length > 0) {
                return diffs;
            }
            else {
                t1.innerDone = true;
            }
        }
        if (this.options.valueDiffing && !t1.valueDone) {
            // value differences?
            diffs = this.findValueDiff(t1, t2, route);
            if (diffs.length > 0) {
                t1.valueDone = true;
                return diffs;
            }
            else {
                t1.valueDone = true;
            }
        }
        // no differences
        return [];
    };
    DiffFinder.prototype.findOuterDiff = function (t1, t2, route) {
        var diffs = [];
        var attr;
        var attr1;
        var attr2;
        var attrLength;
        var pos;
        var i;
        if (t1.nodeName !== t2.nodeName) {
            if (!route.length) {
                throw new Error("Top level nodes have to be of the same kind.");
            }
            return [
                new Diff()
                    .setValue(this.options._const.action, this.options._const.replaceElement)
                    .setValue(this.options._const.oldValue, cleanNode(t1))
                    .setValue(this.options._const.newValue, cleanNode(t2))
                    .setValue(this.options._const.route, route) ];
        }
        if (route.length &&
            this.options.diffcap <
                Math.abs((t1.childNodes || []).length - (t2.childNodes || []).length)) {
            return [
                new Diff()
                    .setValue(this.options._const.action, this.options._const.replaceElement)
                    .setValue(this.options._const.oldValue, cleanNode(t1))
                    .setValue(this.options._const.newValue, cleanNode(t2))
                    .setValue(this.options._const.route, route) ];
        }
        if (Object.prototype.hasOwnProperty.call(t1, "data") &&
            t1.data !== t2.data) {
            // Comment or text node.
            if (t1.nodeName === "#text") {
                return [
                    new Diff()
                        .setValue(this.options._const.action, this.options._const.modifyTextElement)
                        .setValue(this.options._const.route, route)
                        .setValue(this.options._const.oldValue, t1.data)
                        .setValue(this.options._const.newValue, t2.data) ];
            }
            else {
                return [
                    new Diff()
                        .setValue(this.options._const.action, this.options._const.modifyComment)
                        .setValue(this.options._const.route, route)
                        .setValue(this.options._const.oldValue, t1.data)
                        .setValue(this.options._const.newValue, t2.data) ];
            }
        }
        t1 = t1;
        t2 = t2;
        attr1 = t1.attributes ? Object.keys(t1.attributes).sort() : [];
        attr2 = t2.attributes ? Object.keys(t2.attributes).sort() : [];
        attrLength = attr1.length;
        for (i = 0; i < attrLength; i++) {
            attr = attr1[i];
            pos = attr2.indexOf(attr);
            if (pos === -1) {
                diffs.push(new Diff()
                    .setValue(this.options._const.action, this.options._const.removeAttribute)
                    .setValue(this.options._const.route, route)
                    .setValue(this.options._const.name, attr)
                    .setValue(this.options._const.value, t1.attributes[attr]));
            }
            else {
                attr2.splice(pos, 1);
                if (t1.attributes[attr] !== t2.attributes[attr]) {
                    diffs.push(new Diff()
                        .setValue(this.options._const.action, this.options._const.modifyAttribute)
                        .setValue(this.options._const.route, route)
                        .setValue(this.options._const.name, attr)
                        .setValue(this.options._const.oldValue, t1.attributes[attr])
                        .setValue(this.options._const.newValue, t2.attributes[attr]));
                }
            }
        }
        attrLength = attr2.length;
        for (i = 0; i < attrLength; i++) {
            attr = attr2[i];
            diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.addAttribute)
                .setValue(this.options._const.route, route)
                .setValue(this.options._const.name, attr)
                .setValue(this.options._const.value, t2.attributes[attr]));
        }
        return diffs;
    };
    DiffFinder.prototype.findInnerDiff = function (t1, t2, route) {
        var t1ChildNodes = t1.childNodes ? t1.childNodes.slice() : [];
        var t2ChildNodes = t2.childNodes ? t2.childNodes.slice() : [];
        var last = Math.max(t1ChildNodes.length, t2ChildNodes.length);
        var childNodesLengthDifference = Math.abs(t1ChildNodes.length - t2ChildNodes.length);
        var diffs = [];
        var index = 0;
        if (!this.options.maxChildCount || last < this.options.maxChildCount) {
            var cachedSubtrees = Boolean(t1.subsets && t1.subsetsAge--);
            var subtrees = cachedSubtrees
                ? t1.subsets
                : t1.childNodes && t2.childNodes
                    ? markSubTrees(t1, t2)
                    : [];
            if (subtrees.length > 0) {
                /* One or more groups have been identified among the childnodes of t1
                 * and t2.
                 */
                diffs = this.attemptGroupRelocation(t1, t2, subtrees, route, cachedSubtrees);
                if (diffs.length > 0) {
                    return diffs;
                }
            }
        }
        /* 0 or 1 groups of similar child nodes have been found
         * for t1 and t2. 1 If there is 1, it could be a sign that the
         * contents are the same. When the number of groups is below 2,
         * t1 and t2 are made to have the same length and each of the
         * pairs of child nodes are diffed.
         */
        for (var i = 0; i < last; i += 1) {
            var e1 = t1ChildNodes[i];
            var e2 = t2ChildNodes[i];
            if (childNodesLengthDifference) {
                /* t1 and t2 have different amounts of childNodes. Add
                 * and remove as necessary to obtain the same length */
                if (e1 && !e2) {
                    if (e1.nodeName === "#text") {
                        diffs.push(new Diff()
                            .setValue(this.options._const.action, this.options._const.removeTextElement)
                            .setValue(this.options._const.route, route.concat(index))
                            .setValue(this.options._const.value, e1.data));
                        index -= 1;
                    }
                    else {
                        diffs.push(new Diff()
                            .setValue(this.options._const.action, this.options._const.removeElement)
                            .setValue(this.options._const.route, route.concat(index))
                            .setValue(this.options._const.element, cleanNode(e1)));
                        index -= 1;
                    }
                }
                else if (e2 && !e1) {
                    if (e2.nodeName === "#text") {
                        diffs.push(new Diff()
                            .setValue(this.options._const.action, this.options._const.addTextElement)
                            .setValue(this.options._const.route, route.concat(index))
                            .setValue(this.options._const.value, e2.data));
                    }
                    else {
                        diffs.push(new Diff()
                            .setValue(this.options._const.action, this.options._const.addElement)
                            .setValue(this.options._const.route, route.concat(index))
                            .setValue(this.options._const.element, cleanNode(e2)));
                    }
                }
            }
            /* We are now guaranteed that childNodes e1 and e2 exist,
             * and that they can be diffed.
             */
            /* Diffs in child nodes should not affect the parent node,
             * so we let these diffs be submitted together with other
             * diffs.
             */
            if (e1 && e2) {
                if (!this.options.maxChildCount ||
                    last < this.options.maxChildCount) {
                    diffs = diffs.concat(this.findNextDiff(e1, e2, route.concat(index)));
                }
                else if (!isEqual(e1, e2)) {
                    if (t1ChildNodes.length > t2ChildNodes.length) {
                        if (e1.nodeName === "#text") {
                            diffs.push(new Diff()
                                .setValue(this.options._const.action, this.options._const.removeTextElement)
                                .setValue(this.options._const.route, route.concat(index))
                                .setValue(this.options._const.value, e1.data));
                        }
                        else {
                            diffs.push(new Diff()
                                .setValue(this.options._const.action, this.options._const.removeElement)
                                .setValue(this.options._const.element, cleanNode(e1))
                                .setValue(this.options._const.route, route.concat(index)));
                        }
                        t1ChildNodes.splice(i, 1);
                        i -= 1;
                        index -= 1;
                        childNodesLengthDifference -= 1;
                    }
                    else if (t1ChildNodes.length < t2ChildNodes.length) {
                        var cloneChild = cleanNode(e2);
                        diffs = diffs.concat([
                            new Diff()
                                .setValue(this.options._const.action, this.options._const.addElement)
                                .setValue(this.options._const.element, cloneChild)
                                .setValue(this.options._const.route, route.concat(index)) ]);
                        t1ChildNodes.splice(i, 0, cloneChild);
                        childNodesLengthDifference -= 1;
                    }
                    else {
                        diffs = diffs.concat([
                            new Diff()
                                .setValue(this.options._const.action, this.options._const.replaceElement)
                                .setValue(this.options._const.oldValue, cleanNode(e1))
                                .setValue(this.options._const.newValue, cleanNode(e2))
                                .setValue(this.options._const.route, route.concat(index)) ]);
                    }
                }
            }
            index += 1;
        }
        t1.innerDone = true;
        return diffs;
    };
    DiffFinder.prototype.attemptGroupRelocation = function (t1, t2, subtrees, route, cachedSubtrees) {
        /* Either t1.childNodes and t2.childNodes have the same length, or
         * there are at least two groups of similar elements can be found.
         * attempts are made at equalizing t1 with t2. First all initial
         * elements with no group affiliation (gaps=true) are removed (if
         * only in t1) or added (if only in t2). Then the creation of a group
         * relocation diff is attempted.
         */
        var gapInformation = getGapInformation(t1, t2, subtrees);
        var gaps1 = gapInformation.gaps1;
        var gaps2 = gapInformation.gaps2;
        var shortest = Math.min(gaps1.length, gaps2.length);
        var destinationDifferent;
        var toGroup;
        var group;
        var node;
        var similarNode;
        var testI;
        var diffs = [];
        for (var index2 = 0, index1 = 0; index2 < shortest; index1 += 1, index2 += 1) {
            if (cachedSubtrees &&
                (gaps1[index2] === true || gaps2[index2] === true)) ;
            else if (gaps1[index2] === true) {
                node = t1.childNodes[index1];
                if (node.nodeName === "#text") {
                    if (t2.childNodes[index2].nodeName === "#text") {
                        if (node.data !==
                            t2.childNodes[index2].data) {
                            testI = index1;
                            while (t1.childNodes.length > testI + 1 &&
                                t1.childNodes[testI + 1].nodeName === "#text") {
                                testI += 1;
                                if (t2.childNodes[index2]
                                    .data ===
                                    t1.childNodes[testI]
                                        .data) {
                                    similarNode = true;
                                    break;
                                }
                            }
                            if (!similarNode) {
                                diffs.push(new Diff()
                                    .setValue(this.options._const.action, this.options._const
                                    .modifyTextElement)
                                    .setValue(this.options._const.route, route.concat(index2))
                                    .setValue(this.options._const.oldValue, node.data)
                                    .setValue(this.options._const.newValue, t2.childNodes[index2].data));
                                return diffs;
                            }
                        }
                    }
                    else {
                        diffs.push(new Diff()
                            .setValue(this.options._const.action, this.options._const.removeTextElement)
                            .setValue(this.options._const.route, route.concat(index2))
                            .setValue(this.options._const.value, node.data));
                        gaps1.splice(index2, 1);
                        shortest = Math.min(gaps1.length, gaps2.length);
                        index2 -= 1;
                    }
                }
                else {
                    diffs.push(new Diff()
                        .setValue(this.options._const.action, this.options._const.removeElement)
                        .setValue(this.options._const.route, route.concat(index2))
                        .setValue(this.options._const.element, cleanNode(node)));
                    gaps1.splice(index2, 1);
                    shortest = Math.min(gaps1.length, gaps2.length);
                    index2 -= 1;
                }
            }
            else if (gaps2[index2] === true) {
                node = t2.childNodes[index2];
                if (node.nodeName === "#text") {
                    diffs.push(new Diff()
                        .setValue(this.options._const.action, this.options._const.addTextElement)
                        .setValue(this.options._const.route, route.concat(index2))
                        .setValue(this.options._const.value, node.data));
                    gaps1.splice(index2, 0, true);
                    shortest = Math.min(gaps1.length, gaps2.length);
                    index1 -= 1;
                }
                else {
                    diffs.push(new Diff()
                        .setValue(this.options._const.action, this.options._const.addElement)
                        .setValue(this.options._const.route, route.concat(index2))
                        .setValue(this.options._const.element, cleanNode(node)));
                    gaps1.splice(index2, 0, true);
                    shortest = Math.min(gaps1.length, gaps2.length);
                    index1 -= 1;
                }
            }
            else if (gaps1[index2] !== gaps2[index2]) {
                if (diffs.length > 0) {
                    return diffs;
                }
                // group relocation
                group = subtrees[gaps1[index2]];
                toGroup = Math.min(group.newValue, t1.childNodes.length - group.length);
                if (toGroup !== group.oldValue) {
                    // Check whether destination nodes are different than originating ones.
                    destinationDifferent = false;
                    for (var j = 0; j < group.length; j += 1) {
                        if (!roughlyEqual(t1.childNodes[toGroup + j], t1.childNodes[group.oldValue + j], {}, false, true)) {
                            destinationDifferent = true;
                        }
                    }
                    if (destinationDifferent) {
                        return [
                            new Diff()
                                .setValue(this.options._const.action, this.options._const.relocateGroup)
                                .setValue(this.options._const.groupLength, group.length)
                                .setValue(this.options._const.from, group.oldValue)
                                .setValue(this.options._const.to, toGroup)
                                .setValue(this.options._const.route, route) ];
                    }
                }
            }
        }
        return diffs;
    };
    DiffFinder.prototype.findValueDiff = function (t1, t2, route) {
        // Differences of value. Only useful if the value/selection/checked value
        // differs from what is represented in the DOM. For example in the case
        // of filled out forms, etc.
        var diffs = [];
        if (t1.selected !== t2.selected) {
            diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.modifySelected)
                .setValue(this.options._const.oldValue, t1.selected)
                .setValue(this.options._const.newValue, t2.selected)
                .setValue(this.options._const.route, route));
        }
        if ((t1.value || t2.value) &&
            t1.value !== t2.value &&
            t1.nodeName !== "OPTION") {
            diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.modifyValue)
                .setValue(this.options._const.oldValue, t1.value || "")
                .setValue(this.options._const.newValue, t2.value || "")
                .setValue(this.options._const.route, route));
        }
        if (t1.checked !== t2.checked) {
            diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.modifyChecked)
                .setValue(this.options._const.oldValue, t1.checked)
                .setValue(this.options._const.newValue, t2.checked)
                .setValue(this.options._const.route, route));
        }
        return diffs;
    };
    return DiffFinder;
}());

var DEFAULT_OPTIONS = {
    debug: false,
    diffcap: 10,
    maxDepth: false,
    maxChildCount: 50,
    valueDiffing: true,
    // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
    textDiff: function (node, currentValue, expectedValue, newValue) {
        node.data = newValue;
        return;
    },
    // empty functions were benchmarked as running faster than both
    // `f && f()` and `if (f) { f(); }`
    preVirtualDiffApply: function () { },
    postVirtualDiffApply: function () { },
    preDiffApply: function () { },
    postDiffApply: function () { },
    filterOuterDiff: null,
    compress: false,
    _const: false,
    document: typeof window !== "undefined" && window.document
        ? window.document
        : false,
    components: []
};
var DiffDOM = /** @class */ (function () {
    function DiffDOM(options) {
        if (options === void 0) { options = {}; }
        // IE11 doesn't have Object.assign and buble doesn't translate object spreaders
        // by default, so this is the safest way of doing it currently.
        Object.entries(DEFAULT_OPTIONS).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (!Object.prototype.hasOwnProperty.call(options, key)) {
                options[key] = value;
            }
        });
        if (!options._const) {
            var varNames = [
                "addAttribute",
                "modifyAttribute",
                "removeAttribute",
                "modifyTextElement",
                "relocateGroup",
                "removeElement",
                "addElement",
                "removeTextElement",
                "addTextElement",
                "replaceElement",
                "modifyValue",
                "modifyChecked",
                "modifySelected",
                "modifyComment",
                "action",
                "route",
                "oldValue",
                "newValue",
                "element",
                "group",
                "groupLength",
                "from",
                "to",
                "name",
                "value",
                "data",
                "attributes",
                "nodeName",
                "childNodes",
                "checked",
                "selected" ];
            var constNames_1 = {};
            if (options.compress) {
                varNames.forEach(function (varName, index) { return (constNames_1[varName] = index); });
            }
            else {
                varNames.forEach(function (varName) { return (constNames_1[varName] = varName); });
            }
            options._const = constNames_1;
        }
        this.options = options;
    }
    DiffDOM.prototype.apply = function (tree, diffs) {
        return applyDOM(tree, diffs, this.options);
    };
    DiffDOM.prototype.undo = function (tree, diffs) {
        return undoDOM(tree, diffs, this.options);
    };
    DiffDOM.prototype.diff = function (t1Node, t2Node) {
        var finder = new DiffFinder(t1Node, t2Node, this.options);
        return finder.init();
    };
    return DiffDOM;
}());

const headingsToVirtualHeaderRowDOM = (headings, columnSettings, columnsState, { classes, format, hiddenHeader, sortable, scrollY, type }, { noColumnWidths, unhideHeader }) => ({
    nodeName: "TR",
    childNodes: headings.map((heading, index) => {
        const column = columnSettings[index] || {
            type,
            format,
            sortable: true,
            searchable: true
        };
        if (column.hidden) {
            return;
        }
        const attributes = {};
        if (column.sortable && sortable && (!scrollY.length || unhideHeader)) {
            if (column.filter) {
                attributes["data-filterable"] = "true";
            }
            else {
                attributes["data-sortable"] = "true";
            }
        }
        if (column.headerClass) {
            attributes.class = column.headerClass;
        }
        if (columnsState.sort && columnsState.sort.column === index) {
            const directionClass = columnsState.sort.dir === "asc" ? classes.ascending : classes.descending;
            attributes.class = attributes.class ? `${attributes.class} ${directionClass}` : directionClass;
            attributes["aria-sort"] = columnsState.sort.dir === "asc" ? "ascending" : "descending";
        }
        else if (columnsState.filters[index]) {
            attributes.class = attributes.class ? `${attributes.class} ${classes.filterActive}` : classes.filterActive;
        }
        let style = "";
        if (columnsState.widths[index] && !noColumnWidths) {
            style += `width: ${columnsState.widths[index]}%;`;
        }
        if (scrollY.length && !unhideHeader) {
            style += "padding-bottom: 0;padding-top: 0;border: 0;";
        }
        if (style.length) {
            attributes.style = style;
        }
        const headerNodes = heading.type === "html" ?
            heading.data :
            [
                {
                    nodeName: "#text",
                    data: heading.text ?? String(heading.data)
                }
            ];
        return {
            nodeName: "TH",
            attributes,
            childNodes: ((hiddenHeader || scrollY.length) && !unhideHeader) ?
                [
                    { nodeName: "#text",
                        data: "" }
                ] :
                !column.sortable || !sortable ?
                    headerNodes :
                    [
                        {
                            nodeName: "a",
                            attributes: {
                                href: "#",
                                class: column.filter ? classes.filter : classes.sorter
                            },
                            childNodes: headerNodes
                        }
                    ]
        };
    }).filter((column) => column)
});
const dataToVirtualDOM = (tableAttributes, headings, rows, columnSettings, columnsState, rowCursor, { classes, hiddenHeader, header, footer, format, sortable, scrollY, type, rowRender, tabIndex }, { noColumnWidths, unhideHeader, renderHeader }) => {
    const table = {
        nodeName: "TABLE",
        attributes: { ...tableAttributes },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(({ row, index }) => {
                    const tr = {
                        nodeName: "TR",
                        attributes: {
                            "data-index": String(index)
                        },
                        childNodes: row.map((cell, cIndex) => {
                            const column = columnSettings[cIndex] || {
                                type,
                                format,
                                sortable: true,
                                searchable: true
                            };
                            if (column.hidden) {
                                return;
                            }
                            const td = column.type === "html" ?
                                {
                                    nodeName: "TD",
                                    childNodes: cell.data
                                } :
                                {
                                    nodeName: "TD",
                                    childNodes: [
                                        {
                                            nodeName: "#text",
                                            data: cell.text ?? String(cell.data)
                                        }
                                    ]
                                };
                            if (!header && !footer && columnsState.widths[cIndex] && !noColumnWidths) {
                                td.attributes = {
                                    style: `width: ${columnsState.widths[cIndex]}%;`
                                };
                            }
                            if (column.cellClass) {
                                if (!td.attributes) {
                                    td.attributes = {};
                                }
                                td.attributes.class = column.cellClass;
                            }
                            if (column.render) {
                                const renderedCell = column.render(cell.data, td, index, cIndex);
                                if (renderedCell) {
                                    if (typeof renderedCell === "string") {
                                        // Convenience method to make it work similarly to what it did up to version 5.
                                        const node = stringToObj(`<td>${renderedCell}</td>`);
                                        if (node.childNodes.length !== 1 || !["#text", "#comment"].includes(node.childNodes[0].nodeName)) {
                                            td.childNodes = node.childNodes;
                                        }
                                        else {
                                            td.childNodes[0].data = renderedCell;
                                        }
                                    }
                                    else {
                                        return renderedCell;
                                    }
                                }
                            }
                            return td;
                        }).filter((column) => column)
                    };
                    if (index === rowCursor) {
                        tr.attributes.class = classes.cursor;
                    }
                    if (rowRender) {
                        const renderedRow = rowRender(row, tr, index);
                        if (renderedRow) {
                            if (typeof renderedRow === "string") {
                                // Convenience method to make it work similarly to what it did up to version 5.
                                const node = stringToObj(`<tr>${renderedRow}</tr>`);
                                if (node.childNodes && (node.childNodes.length !== 1 || !["#text", "#comment"].includes(node.childNodes[0].nodeName))) {
                                    tr.childNodes = node.childNodes;
                                }
                                else {
                                    tr.childNodes[0].data = renderedRow;
                                }
                            }
                            else {
                                return renderedRow;
                            }
                        }
                    }
                    return tr;
                })
            }
        ]
    };
    table.attributes.class = table.attributes.class ? `${table.attributes.class} ${classes.table}` : classes.table;
    if (header || footer || renderHeader) {
        const headerRow = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnsState, { classes,
            hiddenHeader,
            sortable,
            scrollY }, { noColumnWidths,
            unhideHeader });
        if (header || renderHeader) {
            const thead = {
                nodeName: "THEAD",
                childNodes: [headerRow]
            };
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                thead.attributes = { style: "height: 0px;" };
            }
            table.childNodes.unshift(thead);
        }
        if (footer) {
            const footerRow = header ? structuredClone(headerRow) : headerRow;
            const tfoot = {
                nodeName: "TFOOT",
                childNodes: [footerRow]
            };
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                tfoot.attributes = { style: "height: 0px;" };
            }
            table.childNodes.push(tfoot);
        }
    }
    if (tabIndex !== false) {
        table.attributes.tabindex = String(tabIndex);
    }
    return table;
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var dayjs_minExports = {};
var dayjs_min = {
  get exports(){ return dayjs_minExports; },
  set exports(v){ dayjs_minExports = v; },
};

(function (module, exports) {
	!function(t,e){module.exports=e();}(commonjsGlobal,(function(){var t=1e3,e=6e4,n=36e5,r="millisecond",i="second",s="minute",u="hour",a="day",o="week",f="month",h="quarter",c="year",d="date",l="Invalid Date",$=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(t){var e=["th","st","nd","rd"],n=t%100;return "["+t+(e[(n-20)%10]||e[n]||e[0])+"]"}},m=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},v={s:m,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+m(r,2,"0")+":"+m(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,f),s=n-i<0,u=e.clone().add(r+(s?-1:1),f);return +(-(r+(n-i)/(s?i-u:u-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return {M:f,y:c,w:o,d:a,D:d,h:u,m:s,s:i,ms:r,Q:h}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},g="en",D={};D[g]=M;var p=function(t){return t instanceof _},S=function t(e,n,r){var i;if(!e)return g;if("string"==typeof e){var s=e.toLowerCase();D[s]&&(i=s),n&&(D[s]=n,i=s);var u=e.split("-");if(!i&&u.length>1)return t(u[0])}else {var a=e.name;D[a]=e,i=a;}return !r&&i&&(g=i),i||!r&&g},w=function(t,e){if(p(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new _(n)},O=v;O.l=S,O.i=p,O.w=function(t,e){return w(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var _=function(){function M(t){this.$L=S(t.locale,null,!0),this.parse(t);}var m=M.prototype;return m.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(O.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match($);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init();},m.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},m.$utils=function(){return O},m.isValid=function(){return !(this.$d.toString()===l)},m.isSame=function(t,e){var n=w(t);return this.startOf(e)<=n&&n<=this.endOf(e)},m.isAfter=function(t,e){return w(t)<this.startOf(e)},m.isBefore=function(t,e){return this.endOf(e)<w(t)},m.$g=function(t,e,n){return O.u(t)?this[e]:this.set(n,t)},m.unix=function(){return Math.floor(this.valueOf()/1e3)},m.valueOf=function(){return this.$d.getTime()},m.startOf=function(t,e){var n=this,r=!!O.u(e)||e,h=O.p(t),l=function(t,e){var i=O.w(n.$u?Date.UTC(n.$y,e,t):new Date(n.$y,e,t),n);return r?i:i.endOf(a)},$=function(t,e){return O.w(n.toDate()[t].apply(n.toDate("s"),(r?[0,0,0,0]:[23,59,59,999]).slice(e)),n)},y=this.$W,M=this.$M,m=this.$D,v="set"+(this.$u?"UTC":"");switch(h){case c:return r?l(1,0):l(31,11);case f:return r?l(1,M):l(0,M+1);case o:var g=this.$locale().weekStart||0,D=(y<g?y+7:y)-g;return l(r?m-D:m+(6-D),M);case a:case d:return $(v+"Hours",0);case u:return $(v+"Minutes",1);case s:return $(v+"Seconds",2);case i:return $(v+"Milliseconds",3);default:return this.clone()}},m.endOf=function(t){return this.startOf(t,!1)},m.$set=function(t,e){var n,o=O.p(t),h="set"+(this.$u?"UTC":""),l=(n={},n[a]=h+"Date",n[d]=h+"Date",n[f]=h+"Month",n[c]=h+"FullYear",n[u]=h+"Hours",n[s]=h+"Minutes",n[i]=h+"Seconds",n[r]=h+"Milliseconds",n)[o],$=o===a?this.$D+(e-this.$W):e;if(o===f||o===c){var y=this.clone().set(d,1);y.$d[l]($),y.init(),this.$d=y.set(d,Math.min(this.$D,y.daysInMonth())).$d;}else l&&this.$d[l]($);return this.init(),this},m.set=function(t,e){return this.clone().$set(t,e)},m.get=function(t){return this[O.p(t)]()},m.add=function(r,h){var d,l=this;r=Number(r);var $=O.p(h),y=function(t){var e=w(l);return O.w(e.date(e.date()+Math.round(t*r)),l)};if($===f)return this.set(f,this.$M+r);if($===c)return this.set(c,this.$y+r);if($===a)return y(1);if($===o)return y(7);var M=(d={},d[s]=e,d[u]=n,d[i]=t,d)[$]||1,m=this.$d.getTime()+r*M;return O.w(m,this)},m.subtract=function(t,e){return this.add(-1*t,e)},m.format=function(t){var e=this,n=this.$locale();if(!this.isValid())return n.invalidDate||l;var r=t||"YYYY-MM-DDTHH:mm:ssZ",i=O.z(this),s=this.$H,u=this.$m,a=this.$M,o=n.weekdays,f=n.months,h=function(t,n,i,s){return t&&(t[n]||t(e,r))||i[n].slice(0,s)},c=function(t){return O.s(s%12||12,t,"0")},d=n.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},$={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:O.s(a+1,2,"0"),MMM:h(n.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:O.s(this.$D,2,"0"),d:String(this.$W),dd:h(n.weekdaysMin,this.$W,o,2),ddd:h(n.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:O.s(s,2,"0"),h:c(1),hh:c(2),a:d(s,u,!0),A:d(s,u,!1),m:String(u),mm:O.s(u,2,"0"),s:String(this.$s),ss:O.s(this.$s,2,"0"),SSS:O.s(this.$ms,3,"0"),Z:i};return r.replace(y,(function(t,e){return e||$[t]||i.replace(":","")}))},m.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},m.diff=function(r,d,l){var $,y=O.p(d),M=w(r),m=(M.utcOffset()-this.utcOffset())*e,v=this-M,g=O.m(this,M);return g=($={},$[c]=g/12,$[f]=g,$[h]=g/3,$[o]=(v-m)/6048e5,$[a]=(v-m)/864e5,$[u]=v/n,$[s]=v/e,$[i]=v/t,$)[y]||v,l?g:O.a(g)},m.daysInMonth=function(){return this.endOf(f).$D},m.$locale=function(){return D[this.$L]},m.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=S(t,e,!0);return r&&(n.$L=r),n},m.clone=function(){return O.w(this.$d,this)},m.toDate=function(){return new Date(this.valueOf())},m.toJSON=function(){return this.isValid()?this.toISOString():null},m.toISOString=function(){return this.$d.toISOString()},m.toString=function(){return this.$d.toUTCString()},M}(),T=_.prototype;return w.prototype=T,[["$ms",r],["$s",i],["$m",s],["$H",u],["$W",a],["$M",f],["$y",c],["$D",d]].forEach((function(t){T[t[1]]=function(e){return this.$g(e,t[0],t[1])};})),w.extend=function(t,e){return t.$i||(t(e,_,w),t.$i=!0),w},w.locale=S,w.isDayjs=p,w.unix=function(t){return w(1e3*t)},w.en=D[g],w.Ls=D,w.p={},w}));
} (dayjs_min));

var dayjs = dayjs_minExports;

var customParseFormatExports = {};
var customParseFormat$1 = {
  get exports(){ return customParseFormatExports; },
  set exports(v){ customParseFormatExports = v; },
};

(function (module, exports) {
	!function(e,t){module.exports=t();}(commonjsGlobal,(function(){var e={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},t=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|YYYY|YY?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,n=/\d\d/,r=/\d\d?/,i=/\d*[^-_:/,()\s\d]+/,o={},s=function(e){return (e=+e)+(e>68?1900:2e3)};var a=function(e){return function(t){this[e]=+t;}},f=[/[+-]\d\d:?(\d\d)?|Z/,function(e){(this.zone||(this.zone={})).offset=function(e){if(!e)return 0;if("Z"===e)return 0;var t=e.match(/([+-]|\d\d)/g),n=60*t[1]+(+t[2]||0);return 0===n?0:"+"===t[0]?-n:n}(e);}],h=function(e){var t=o[e];return t&&(t.indexOf?t:t.s.concat(t.f))},u=function(e,t){var n,r=o.meridiem;if(r){for(var i=1;i<=24;i+=1)if(e.indexOf(r(i,0,t))>-1){n=i>12;break}}else n=e===(t?"pm":"PM");return n},d={A:[i,function(e){this.afternoon=u(e,!1);}],a:[i,function(e){this.afternoon=u(e,!0);}],S:[/\d/,function(e){this.milliseconds=100*+e;}],SS:[n,function(e){this.milliseconds=10*+e;}],SSS:[/\d{3}/,function(e){this.milliseconds=+e;}],s:[r,a("seconds")],ss:[r,a("seconds")],m:[r,a("minutes")],mm:[r,a("minutes")],H:[r,a("hours")],h:[r,a("hours")],HH:[r,a("hours")],hh:[r,a("hours")],D:[r,a("day")],DD:[n,a("day")],Do:[i,function(e){var t=o.ordinal,n=e.match(/\d+/);if(this.day=n[0],t)for(var r=1;r<=31;r+=1)t(r).replace(/\[|\]/g,"")===e&&(this.day=r);}],M:[r,a("month")],MM:[n,a("month")],MMM:[i,function(e){var t=h("months"),n=(h("monthsShort")||t.map((function(e){return e.slice(0,3)}))).indexOf(e)+1;if(n<1)throw new Error;this.month=n%12||n;}],MMMM:[i,function(e){var t=h("months").indexOf(e)+1;if(t<1)throw new Error;this.month=t%12||t;}],Y:[/[+-]?\d+/,a("year")],YY:[n,function(e){this.year=s(e);}],YYYY:[/\d{4}/,a("year")],Z:f,ZZ:f};function c(n){var r,i;r=n,i=o&&o.formats;for(var s=(n=r.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(t,n,r){var o=r&&r.toUpperCase();return n||i[r]||e[r]||i[o].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(e,t,n){return t||n.slice(1)}))}))).match(t),a=s.length,f=0;f<a;f+=1){var h=s[f],u=d[h],c=u&&u[0],l=u&&u[1];s[f]=l?{regex:c,parser:l}:h.replace(/^\[|\]$/g,"");}return function(e){for(var t={},n=0,r=0;n<a;n+=1){var i=s[n];if("string"==typeof i)r+=i.length;else {var o=i.regex,f=i.parser,h=e.slice(r),u=o.exec(h)[0];f.call(t,u),e=e.replace(u,"");}}return function(e){var t=e.afternoon;if(void 0!==t){var n=e.hours;t?n<12&&(e.hours+=12):12===n&&(e.hours=0),delete e.afternoon;}}(t),t}}return function(e,t,n){n.p.customParseFormat=!0,e&&e.parseTwoDigitYear&&(s=e.parseTwoDigitYear);var r=t.prototype,i=r.parse;r.parse=function(e){var t=e.date,r=e.utc,s=e.args;this.$u=r;var a=s[1];if("string"==typeof a){var f=!0===s[2],h=!0===s[3],u=f||h,d=s[2];h&&(d=s[2]),o=this.$locale(),!f&&d&&(o=n.Ls[d]),this.$d=function(e,t,n){try{if(["x","X"].indexOf(t)>-1)return new Date(("X"===t?1e3:1)*e);var r=c(t)(e),i=r.year,o=r.month,s=r.day,a=r.hours,f=r.minutes,h=r.seconds,u=r.milliseconds,d=r.zone,l=new Date,m=s||(i||o?1:l.getDate()),M=i||l.getFullYear(),Y=0;i&&!o||(Y=o>0?o-1:l.getMonth());var p=a||0,v=f||0,D=h||0,g=u||0;return d?new Date(Date.UTC(M,Y,m,p,v,D,g+60*d.offset*1e3)):n?new Date(Date.UTC(M,Y,m,p,v,D,g)):new Date(M,Y,m,p,v,D,g)}catch(e){return new Date("")}}(t,a,r),this.init(),d&&!0!==d&&(this.$L=this.locale(d).$L),u&&t!=this.format(a)&&(this.$d=new Date("")),o={};}else if(a instanceof Array)for(var l=a.length,m=1;m<=l;m+=1){s[1]=a[m-1];var M=n.apply(this,s);if(M.isValid()){this.$d=M.$d,this.$L=M.$L,this.init();break}m===l&&(this.$d=new Date(""));}else i.call(this,e);};}}));
} (customParseFormat$1));

var customParseFormat = customParseFormatExports;

dayjs.extend(customParseFormat);
/**
 * Use dayjs to parse cell contents for sorting
 */
const parseDate = (content, format) => {
    let date;
    // Converting to YYYYMMDD ensures we can accurately sort the column numerically
    if (format) {
        switch (format) {
            case "ISO_8601":
                // ISO8601 is already lexiographically sorted, so we can just sort it as a string.
                date = content;
                break;
            case "RFC_2822":
                date = dayjs(content.slice(5), "DD MMM YYYY HH:mm:ss ZZ").unix();
                break;
            case "MYSQL":
                date = dayjs(content, "YYYY-MM-DD hh:mm:ss").unix();
                break;
            case "UNIX":
                date = dayjs(content).unix();
                break;
            // User defined format using the data-format attribute or columns[n].format option
            default:
                date = dayjs(content, format, true).valueOf();
                break;
        }
    }
    return date;
};

const readDataCell = (cell, columnSettings) => {
    if (cell?.constructor === Object && Object.prototype.hasOwnProperty.call(cell, "data") && !Object.keys(cell).find(key => !(["text", "order", "data"].includes(key)))) {
        return cell;
    }
    const cellData = {
        data: cell
    };
    switch (columnSettings.type) {
        case "string":
            if (!(typeof cell === "string")) {
                cellData.text = String(cellData.data);
                cellData.order = cellData.text;
            }
            break;
        case "date":
            if (columnSettings.format) {
                cellData.order = parseDate(String(cellData.data), columnSettings.format);
            }
            break;
        case "number":
            cellData.text = String(cellData.data);
            cellData.data = parseInt(cellData.data, 10);
            break;
        case "html": {
            const node = Array.isArray(cellData.data) ?
                { nodeName: "TD",
                    childNodes: cellData.data } : // If it is an array, we assume it is an array of nodeType
                stringToObj(`<td>${String(cellData.data)}</td>`);
            cellData.data = node.childNodes || [];
            const text = objToText(node);
            cellData.text = text;
            cellData.order = text;
            break;
        }
        case "boolean":
            if (typeof cellData.data === "string") {
                cellData.data = cellData.data.toLowerCase().trim();
            }
            cellData.data = !["false", false, null, undefined, 0].includes(cellData.data);
            cellData.order = cellData.data ? 1 : 0;
            cellData.text = String(cellData.data);
            break;
        case "other":
            cellData.text = "";
            cellData.order = 0;
            break;
        default:
            cellData.text = JSON.stringify(cellData.data);
            break;
    }
    return cellData;
};
const readDOMDataCell = (cell, columnSettings) => {
    let cellData;
    switch (columnSettings.type) {
        case "string":
            cellData = {
                data: cell.innerText
            };
            break;
        case "date": {
            const data = cell.innerText;
            cellData = {
                data,
                order: parseDate(data, columnSettings.format)
            };
            break;
        }
        case "number":
            cellData = {
                data: parseInt(cell.innerText, 10),
                text: cell.innerText
            };
            break;
        case "boolean": {
            const data = !["false", "0", "null", "undefined"].includes(cell.innerText.toLowerCase().trim());
            cellData = {
                data,
                order: data ? 1 : 0,
                text: data ? "1" : "0"
            };
            break;
        }
        default: { // "html", "other"
            const node = nodeToObj(cell, { valueDiffing: false });
            cellData = {
                data: node.childNodes || [],
                text: cell.innerText,
                order: cell.innerText
            };
            break;
        }
    }
    return cellData;
};
const readHeaderCell = (cell) => {
    if (cell instanceof Object &&
        cell.constructor === Object &&
        cell.hasOwnProperty("data") &&
        (typeof cell.text === "string" || typeof cell.data === "string")) {
        return cell;
    }
    const cellData = {
        data: cell
    };
    if (typeof cell === "string") {
        if (cell.length) {
            const node = stringToObj(`<th>${cell}</th>`);
            if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                cellData.data = node.childNodes;
                cellData.type = "html";
                const text = objToText(node);
                cellData.text = text;
            }
        }
    }
    else if ([null, undefined].includes(cell)) {
        cellData.text = "";
    }
    else {
        cellData.text = JSON.stringify(cell);
    }
    return cellData;
};
const readDOMHeaderCell = (cell) => {
    const node = nodeToObj(cell, { valueDiffing: false });
    let cellData;
    if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
        cellData = {
            data: node.childNodes,
            type: "html",
            text: objToText(node)
        };
    }
    else {
        cellData = {
            data: cell.innerText,
            type: "string"
        };
    }
    return cellData;
};
const readTableData = (dataOption, dom = undefined, columnSettings, defaultType, defaultFormat) => {
    const data = {
        data: [],
        headings: []
    };
    if (dataOption.headings) {
        data.headings = dataOption.headings.map((heading) => readHeaderCell(heading));
    }
    else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map((th, index) => {
            const heading = readDOMHeaderCell(th);
            if (!columnSettings[index]) {
                columnSettings[index] = {
                    type: defaultType,
                    format: defaultFormat,
                    searchable: true,
                    sortable: true,
                    isSplitQueryWord: true
                };
            }
            const settings = columnSettings[index];
            if (th.dataset.sortable?.trim().toLowerCase() === "false" || th.dataset.sort?.trim().toLowerCase() === "false") {
                settings.sortable = false;
            }
            if (th.dataset.searchable?.trim().toLowerCase() === "false") {
                settings.searchable = false;
            }
            if (th.dataset.hidden?.trim().toLowerCase() === "true" || th.getAttribute("hidden")?.trim().toLowerCase() === "true") {
                settings.hidden = true;
            }
            if (["number", "string", "html", "date", "boolean", "other"].includes(th.dataset.type)) {
                settings.type = th.dataset.type;
                if (settings.type === "date" && th.dataset.format) {
                    settings.format = th.dataset.format;
                }
            }
            return heading;
        });
    }
    else if (dataOption.data?.length) {
        data.headings = dataOption.data[0].map((_cell) => readHeaderCell(""));
    }
    else if (dom?.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map((_cell) => readHeaderCell(""));
    }
    for (let i = 0; i < data.headings.length; i++) {
        // Make sure that there are settings for all columns
        if (!columnSettings[i]) {
            columnSettings[i] = {
                type: defaultType,
                format: defaultFormat,
                sortable: true,
                searchable: true
            };
        }
    }
    if (dataOption.data) {
        data.data = dataOption.data.map((row) => row.map((cell, index) => readDataCell(cell, columnSettings[index])));
    }
    else if (dom?.tBodies?.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(row => Array.from(row.cells).map((cell, index) => {
            const cellData = cell.dataset.content ?
                readDataCell(cell.dataset.content, columnSettings[index]) :
                readDOMDataCell(cell, columnSettings[index]);
            if (cell.dataset.order) {
                cellData.order = isNaN(parseFloat(cell.dataset.order)) ? cell.dataset.order : parseFloat(cell.dataset.order);
            }
            return cellData;
        }));
    }
    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error("Data heading length mismatch.");
    }
    return data;
};

/**
 * Rows API
 */
class Rows {
    constructor(dt) {
        this.dt = dt;
        this.cursor = false;
    }
    setCursor(index = false) {
        if (index === this.cursor) {
            return;
        }
        const oldCursor = this.cursor;
        this.cursor = index;
        this.dt._renderTable();
        if (index !== false && this.dt.options.scrollY) {
            const cursorDOM = this.dt.dom.querySelector(`tr.${this.dt.options.classes.cursor}`);
            if (cursorDOM) {
                cursorDOM.scrollIntoView({ block: "nearest" });
            }
        }
        this.dt.emit("datatable.cursormove", this.cursor, oldCursor);
    }
    /**
     * Add new row
     */
    add(data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columns.settings[index];
            return readDataCell(cell, columnSettings);
        });
        this.dt.data.data.push(row);
        // We may have added data to an empty table
        if (this.dt.data.data.length) {
            this.dt.hasRows = true;
        }
        this.dt.update(true);
    }
    /**
     * Remove row(s)
     */
    remove(select) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.dt.data.data.filter((_row, index) => !select.includes(index));
            // We may have emptied the table
            if (!this.dt.data.data.length) {
                this.dt.hasRows = false;
            }
            this.dt.update(true);
        }
        else {
            return this.remove([select]);
        }
    }
    /**
     * Find index of row by searching for a value in a column
     */
    findRowIndex(columnIndex, value) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex((row) => (row[columnIndex].text ?? String(row[columnIndex].data)).toLowerCase().includes(String(value).toLowerCase()));
    }
    /**
     * Find index, row, and column data by searching for a value in a column
     */
    findRow(columnIndex, value) {
        // get the row index
        const index = this.findRowIndex(columnIndex, value);
        // exit if not found
        if (index < 0) {
            return {
                index: -1,
                row: null,
                cols: []
            };
        }
        // get the row from data
        const row = this.dt.data.data[index];
        // return innerHTML of each td
        const cols = row.map((cell) => cell.data);
        // return everything
        return {
            index,
            row,
            cols
        };
    }
    /**
     * Update a row with new data
     */
    updateRow(select, data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columns.settings[index];
            return readDataCell(cell, columnSettings);
        });
        this.dt.data.data.splice(select, 1, row);
        this.dt.update(true);
    }
}

const readColumnSettings = (columnOptions = [], defaultType, defaultFormat) => {
    let columns = [];
    let sort = false;
    const filters = [];
    // Check for the columns option
    columnOptions.forEach(data => {
        // convert single column selection to array
        const columnSelectors = Array.isArray(data.select) ? data.select : [data.select];
        columnSelectors.forEach((selector) => {
            if (!columns[selector]) {
                columns[selector] = {
                    type: data.type || defaultType,
                    sortable: true,
                    searchable: true,
                    isSplitQueryWord: true,
                    searchQuerySeparator: " "
                };
            }
            const column = columns[selector];
            if (data.render) {
                column.render = data.render;
            }
            if (data.format) {
                column.format = data.format;
            }
            else if (data.type === "date") {
                column.format = defaultFormat;
            }
            if (data.cellClass) {
                column.cellClass = data.cellClass;
            }
            if (data.headerClass) {
                column.headerClass = data.headerClass;
            }
            if (data.locale) {
                column.locale = data.locale;
            }
            if (data.sortable === false) {
                column.sortable = false;
            }
            else {
                if (data.numeric) {
                    column.numeric = data.numeric;
                }
                if (data.caseFirst) {
                    column.caseFirst = data.caseFirst;
                }
            }
            if (data.searchable === false) {
                column.searchable = false;
            }
            else {
                if (data.sensitivity) {
                    column.sensitivity = data.sensitivity;
                }
            }
            if (column.searchable || column.sortable) {
                if (data.ignorePunctuation) {
                    column.ignorePunctuation = data.ignorePunctuation;
                }
            }
            if (data.hidden) {
                column.hidden = true;
            }
            if (data.filter) {
                column.filter = data.filter;
            }
            if (data.sortSequence) {
                column.sortSequence = data.sortSequence;
            }
            if (data.sort) {
                if (data.filter) {
                    filters[selector] = data.sort;
                }
                else {
                    // We only allow one. The last one will overwrite all other options
                    sort = { column: selector,
                        dir: data.sort };
                }
            }
            if (typeof data.isSplitQueryWord !== "undefined") {
                column.isSplitQueryWord = data.isSplitQueryWord;
            }
            if (typeof data.searchQuerySeparator !== "undefined") {
                column.searchQuerySeparator = data.searchQuerySeparator;
            }
        });
    });
    columns = columns.map(column => column ?
        column :
        { type: defaultType,
            format: defaultType === "date" ? defaultFormat : undefined,
            sortable: true,
            searchable: true,
            isSplitQueryWord: true,
            searchQuerySeparator: " " });
    const widths = []; // Width are determined later on by measuring on screen.
    return [
        columns, { filters,
            sort,
            widths }
    ];
};

class Columns {
    constructor(dt) {
        this.dt = dt;
        this.init();
    }
    init() {
        [this.settings, this._state] = readColumnSettings(this.dt.options.columns, this.dt.options.type, this.dt.options.format);
    }
    /**
     * Swap two columns
     */
    swap(columns) {
        if (columns.length === 2) {
            // Get the current column indexes
            const cols = this.dt.data.headings.map((_node, index) => index);
            const x = columns[0];
            const y = columns[1];
            const b = cols[y];
            cols[y] = cols[x];
            cols[x] = b;
            return this.order(cols);
        }
    }
    /**
     * Reorder the columns
     */
    order(columns) {
        this.dt.data.headings = columns.map((index) => this.dt.data.headings[index]);
        this.dt.data.data = this.dt.data.data.map((row) => columns.map((index) => row[index]));
        this.settings = columns.map((index) => this.settings[index]);
        // Update
        this.dt.update();
    }
    /**
     * Hide columns
     */
    hide(columns) {
        if (!columns.length) {
            return;
        }
        columns.forEach((index) => {
            if (!this.settings[index]) {
                this.settings[index] = {
                    type: "string"
                };
            }
            const column = this.settings[index];
            column.hidden = true;
        });
        this.dt.update();
    }
    /**
     * Show columns
     */
    show(columns) {
        if (!columns.length) {
            return;
        }
        columns.forEach((index) => {
            if (!this.settings[index]) {
                this.settings[index] = {
                    type: "string",
                    sortable: true
                };
            }
            const column = this.settings[index];
            delete column.hidden;
        });
        this.dt.update();
    }
    /**
     * Check column(s) visibility
     */
    visible(columns) {
        if (columns === undefined) {
            columns = [...Array(this.dt.data.headings.length).keys()];
        }
        if (Array.isArray(columns)) {
            return columns.map(index => !this.settings[index]?.hidden);
        }
        return !this.settings[columns]?.hidden;
    }
    /**
     * Add a new column
     */
    add(data) {
        const newColumnSelector = this.dt.data.headings.length;
        this.dt.data.headings = this.dt.data.headings.concat([readHeaderCell(data.heading)]);
        this.dt.data.data = this.dt.data.data.map((row, index) => row.concat([readDataCell(data.data[index], data)]));
        this.settings[newColumnSelector] = {
            type: data.type || "string",
            sortable: true,
            searchable: true
        };
        if (data.type || data.format || data.sortable || data.render || data.filter) {
            const column = this.settings[newColumnSelector];
            if (data.render) {
                column.render = data.render;
            }
            if (data.format) {
                column.format = data.format;
            }
            if (data.cellClass) {
                column.cellClass = data.cellClass;
            }
            if (data.headerClass) {
                column.headerClass = data.headerClass;
            }
            if (data.locale) {
                column.locale = data.locale;
            }
            if (data.sortable === false) {
                column.sortable = false;
            }
            else {
                if (data.numeric) {
                    column.numeric = data.numeric;
                }
                if (data.caseFirst) {
                    column.caseFirst = data.caseFirst;
                }
            }
            if (data.searchable === false) {
                column.searchable = false;
            }
            else {
                if (data.sensitivity) {
                    column.sensitivity = data.sensitivity;
                }
            }
            if (column.searchable || column.sortable) {
                if (data.ignorePunctuation) {
                    column.ignorePunctuation = data.ignorePunctuation;
                }
            }
            if (data.hidden) {
                column.hidden = true;
            }
            if (data.filter) {
                column.filter = data.filter;
            }
            if (data.sortSequence) {
                column.sortSequence = data.sortSequence;
            }
        }
        this.dt.update(true);
    }
    /**
     * Remove column(s)
     */
    remove(columns) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter((_heading, index) => !columns.includes(index));
            this.dt.data.data = this.dt.data.data.map((row) => row.filter((_cell, index) => !columns.includes(index)));
            this.dt.update(true);
        }
        else {
            return this.remove([columns]);
        }
    }
    /**
     * Filter by column
     */
    filter(column, init = false) {
        if (!this.settings[column]?.filter?.length) {
            // There is no filter to apply.
            return;
        }
        const currentFilter = this._state.filters[column];
        let newFilterState;
        if (currentFilter) {
            let returnNext = false;
            newFilterState = this.settings[column].filter.find((filter) => {
                if (returnNext) {
                    return true;
                }
                if (filter === currentFilter) {
                    returnNext = true;
                }
                return false;
            });
        }
        else {
            const filter = this.settings[column].filter;
            newFilterState = filter ? filter[0] : undefined;
        }
        if (newFilterState) {
            this._state.filters[column] = newFilterState;
        }
        else if (currentFilter) {
            this._state.filters[column] = undefined;
        }
        this.dt._currentPage = 1;
        this.dt.update();
        if (!init) {
            this.dt.emit("datatable.filter", column, newFilterState);
        }
    }
    /**
     * Sort by column
     */
    sort(index, dir = undefined, init = false) {
        const column = this.settings[index];
        if (!init) {
            this.dt.emit("datatable.sorting", index, dir);
        }
        if (!dir) {
            const currentDir = this._state.sort && this._state.sort.column === index ? this._state.sort?.dir : false;
            const sortSequence = column?.sortSequence || ["asc", "desc"];
            if (!currentDir) {
                dir = sortSequence.length ? sortSequence[0] : "asc";
            }
            else {
                const currentDirIndex = sortSequence.indexOf(currentDir);
                if (currentDirIndex === -1) {
                    dir = sortSequence[0] || "asc";
                }
                else if (currentDirIndex === sortSequence.length - 1) {
                    dir = sortSequence[0];
                }
                else {
                    dir = sortSequence[currentDirIndex + 1];
                }
            }
        }
        const collator = ["string", "html"].includes(column.type) ?
            new Intl.Collator(column.locale || this.dt.options.locale, {
                usage: "sort",
                numeric: column.numeric || this.dt.options.numeric,
                caseFirst: column.caseFirst || this.dt.options.caseFirst,
                ignorePunctuation: column.ignorePunctuation || this.dt.options.ignorePunctuation
            }) :
            false;
        this.dt.data.data.sort((row1, row2) => {
            let order1 = row1[index].order || row1[index].data, order2 = row2[index].order || row2[index].data;
            if (dir === "desc") {
                const temp = order1;
                order1 = order2;
                order2 = temp;
            }
            if (collator) {
                return collator.compare(String(order1), String(order2));
            }
            if (order1 < order2) {
                return -1;
            }
            else if (order1 > order2) {
                return 1;
            }
            return 0;
        });
        this._state.sort = { column: index,
            dir };
        if (this.dt._searchQueries.length) {
            this.dt.multiSearch(this.dt._searchQueries);
            this.dt.emit("datatable.sort", index, dir);
        }
        else if (!init) {
            this.dt._currentPage = 1;
            this.dt.update();
            this.dt.emit("datatable.sort", index, dir);
        }
    }
    /**
     * Measure the actual width of cell content by rendering the entire table with all contents.
     * Note: Destroys current DOM and therefore requires subsequent dt.update()
     */
    _measureWidths() {
        const activeHeadings = this.dt.data.headings.filter((heading, index) => !this.settings[index]?.hidden);
        if ((this.dt.options.scrollY.length || this.dt.options.fixedColumns) && activeHeadings?.length) {
            this._state.widths = [];
            const renderOptions = {
                noPaging: true
            };
            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.dt.options.header || this.dt.options.footer) {
                if (this.dt.options.scrollY.length) {
                    renderOptions.unhideHeader = true;
                }
                if (this.dt.headerDOM) {
                    // Remove headerDOM for accurate measurements
                    this.dt.headerDOM.parentElement.removeChild(this.dt.headerDOM);
                }
                // Reset widths
                renderOptions.noColumnWidths = true;
                this.dt._renderTable(renderOptions);
                const activeDOMHeadings = Array.from(this.dt.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || []);
                let domCounter = 0;
                const absoluteColumnWidths = this.dt.data.headings.map((_heading, index) => {
                    if (this.settings[index]?.hidden) {
                        return 0;
                    }
                    const width = activeDOMHeadings[domCounter].offsetWidth;
                    domCounter += 1;
                    return width;
                });
                const totalOffsetWidth = absoluteColumnWidths.reduce((total, cellWidth) => total + cellWidth, 0);
                this._state.widths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100);
            }
            else {
                renderOptions.renderHeader = true;
                this.dt._renderTable(renderOptions);
                const activeDOMHeadings = Array.from(this.dt.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || []);
                let domCounter = 0;
                const absoluteColumnWidths = this.dt.data.headings.map((_heading, index) => {
                    if (this.settings[index]?.hidden) {
                        return 0;
                    }
                    const width = activeDOMHeadings[domCounter].offsetWidth;
                    domCounter += 1;
                    return width;
                });
                const totalOffsetWidth = absoluteColumnWidths.reduce((total, cellWidth) => total + cellWidth, 0);
                this._state.widths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100);
            }
            // render table without options for measurements
            this.dt._renderTable();
        }
    }
}

// Template for custom layouts
const layoutTemplate = (options, dom) => `<div class='${options.classes.top}'>
    ${options.paging && options.perPageSelect ?
    `<div class='${options.classes.dropdown}'>
            <label>
                <select class='${options.classes.selector}'></select> ${options.labels.perPage}
            </label>
        </div>` :
    ""}
    ${options.searchable ?
    `<div class='${options.classes.search}'>
            <input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='search' title='${options.labels.searchTitle}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
        </div>` :
    ""}
</div>
<div class='${options.classes.container}'${options.scrollY.length ? ` style='height: ${options.scrollY}; overflow-Y: auto;'` : ""}></div>
<div class='${options.classes.bottom}'>
    ${options.paging ?
    `<div class='${options.classes.info}'></div>` :
    ""}
    <nav class='${options.classes.pagination}'></nav>
</div>`;

/**
 * Default configuration
 */
const defaultConfig$1 = {
    // for sorting
    sortable: true,
    locale: "en",
    numeric: true,
    caseFirst: "false",
    // for searching
    searchable: true,
    sensitivity: "base",
    ignorePunctuation: true,
    destroyable: true,
    isSplitQueryWord: true,
    searchQuerySeparator: " ",
    // data
    data: {},
    type: "html",
    format: "YYYY-MM-DD",
    columns: [],
    // Pagination
    paging: true,
    perPage: 10,
    perPageSelect: [5, 10, 15, 20, 25],
    nextPrev: true,
    firstLast: false,
    prevText: "‹",
    nextText: "›",
    firstText: "«",
    lastText: "»",
    ellipsisText: "…",
    truncatePager: true,
    pagerDelta: 2,
    scrollY: "",
    fixedColumns: true,
    fixedHeight: false,
    footer: false,
    header: true,
    hiddenHeader: false,
    rowNavigation: false,
    tabIndex: false,
    // for overriding rendering
    pagerRender: false,
    rowRender: false,
    tableRender: false,
    diffDomOptions: {
        valueDiffing: false
    },
    // Customise the display text
    labels: {
        placeholder: "Search...",
        searchTitle: "Search within table",
        perPage: "entries per page",
        noRows: "No entries found",
        noResults: "No results match your search query",
        info: "Showing {start} to {end} of {rows} entries" //
    },
    // Customise the layout
    template: layoutTemplate,
    // Customize the class names used by datatable for different parts
    classes: {
        active: "datatable-active",
        ascending: "datatable-ascending",
        bottom: "datatable-bottom",
        container: "datatable-container",
        cursor: "datatable-cursor",
        descending: "datatable-descending",
        disabled: "datatable-disabled",
        dropdown: "datatable-dropdown",
        ellipsis: "datatable-ellipsis",
        filter: "datatable-filter",
        filterActive: "datatable-filter-active",
        empty: "datatable-empty",
        headercontainer: "datatable-headercontainer",
        hidden: "datatable-hidden",
        info: "datatable-info",
        input: "datatable-input",
        loading: "datatable-loading",
        pagination: "datatable-pagination",
        paginationList: "datatable-pagination-list",
        paginationListItem: "datatable-pagination-list-item",
        paginationListItemLink: "datatable-pagination-list-item-link",
        search: "datatable-search",
        selector: "datatable-selector",
        sorter: "datatable-sorter",
        table: "datatable-table",
        top: "datatable-top",
        wrapper: "datatable-wrapper"
    }
};

/**
 * Pager truncation algorithm
 */
const truncate = (paginationListItems, currentPage, pagesLength, options) => {
    const pagerDelta = options.pagerDelta;
    const classes = options.classes;
    const ellipsisText = options.ellipsisText;
    const doublePagerDelta = 2 * pagerDelta;
    let previousPage = currentPage - pagerDelta;
    let nextPage = currentPage + pagerDelta;
    if (currentPage < 4 - pagerDelta + doublePagerDelta) {
        nextPage = 3 + doublePagerDelta;
    }
    else if (currentPage > pagesLength - (3 - pagerDelta + doublePagerDelta)) {
        previousPage = pagesLength - (2 + doublePagerDelta);
    }
    const paginationListItemsToModify = [];
    for (let k = 1; k <= pagesLength; k++) {
        if (1 == k || k == pagesLength || (k >= previousPage && k <= nextPage)) {
            const li = paginationListItems[k - 1];
            paginationListItemsToModify.push(li);
        }
    }
    let previousLi;
    const modifiedLis = [];
    paginationListItemsToModify.forEach(li => {
        const pageNumber = parseInt(li.childNodes[0].attributes["data-page"], 10);
        if (previousLi) {
            const previousPageNumber = parseInt(previousLi.childNodes[0].attributes["data-page"], 10);
            if (pageNumber - previousPageNumber == 2) {
                modifiedLis.push(paginationListItems[previousPageNumber]);
            }
            else if (pageNumber - previousPageNumber != 1) {
                const newLi = {
                    nodeName: "LI",
                    attributes: {
                        class: `${classes.paginationListItem} ${classes.ellipsis} ${classes.disabled}`
                    },
                    childNodes: [
                        {
                            nodeName: "A",
                            attributes: {
                                class: classes.paginationListItemLink
                            },
                            childNodes: [
                                {
                                    nodeName: "#text",
                                    data: ellipsisText
                                }
                            ]
                        }
                    ]
                };
                modifiedLis.push(newLi);
            }
        }
        modifiedLis.push(li);
        previousLi = li;
    });
    return modifiedLis;
};
const paginationListItem = (page, label, options, state = {}) => ({
    nodeName: "LI",
    attributes: {
        class: (state.active && !state.hidden) ?
            `${options.classes.paginationListItem} ${options.classes.active}` :
            state.hidden ?
                `${options.classes.paginationListItem} ${options.classes.hidden} ${options.classes.disabled}` :
                options.classes.paginationListItem
    },
    childNodes: [
        {
            nodeName: "A",
            attributes: {
                "data-page": String(page),
                class: options.classes.paginationListItemLink
            },
            childNodes: [
                {
                    nodeName: "#text",
                    data: label
                }
            ]
        }
    ]
});
const createVirtualPagerDOM = (onFirstPage, onLastPage, currentPage, totalPages, options) => {
    let pagerListItems = [];
    // first button
    if (options.firstLast) {
        pagerListItems.push(paginationListItem(1, options.firstText, options));
    }
    // prev button
    if (options.nextPrev) {
        const prev = onFirstPage ? 1 : currentPage - 1;
        pagerListItems.push(paginationListItem(prev, options.prevText, options, { hidden: onFirstPage }));
    }
    let pages = [...Array(totalPages).keys()].map(index => paginationListItem(index + 1, String(index + 1), options, { active: (index === (currentPage - 1)) }));
    if (options.truncatePager) {
        // truncate the paginationListItems
        pages = truncate(pages, currentPage, totalPages, options);
    }
    // append the paginationListItems
    pagerListItems = pagerListItems.concat(pages);
    // next button
    if (options.nextPrev) {
        const next = onLastPage ? totalPages : currentPage + 1;
        pagerListItems.push(paginationListItem(next, options.nextText, options, { hidden: onLastPage }));
    }
    // last button
    if (options.firstLast) {
        pagerListItems.push(paginationListItem(totalPages, options.lastText, options));
    }
    const pager = {
        nodeName: "UL",
        attributes: {
            class: options.classes.paginationList
        },
        childNodes: pages.length > 1 ? pagerListItems : [] // Don't show single page
    };
    return pager;
};

class DataTable {
    constructor(table, options = {}) {
        const dom = typeof table === "string" ?
            document.querySelector(table) :
            table;
        if (dom instanceof HTMLTableElement) {
            this.dom = dom;
        }
        else {
            this.dom = document.createElement("table");
            dom.appendChild(this.dom);
        }
        const diffDomOptions = {
            ...defaultConfig$1.diffDomOptions,
            ...options.diffDomOptions
        };
        const labels = {
            ...defaultConfig$1.labels,
            ...options.labels
        };
        const classes = {
            ...defaultConfig$1.classes,
            ...options.classes
        };
        // user options
        this.options = {
            ...defaultConfig$1,
            ...options,
            diffDomOptions,
            labels,
            classes
        };
        this._initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : ""; // preserve in case of later destruction
        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex;
        }
        else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0;
        }
        this._listeners = {
            onResize: () => this._onResize()
        };
        this._dd = new DiffDOM(this.options.diffDomOptions || {});
        this.initialized = false;
        this._events = {};
        this._currentPage = 0;
        this.onFirstPage = true;
        this.hasHeadings = false;
        this.hasRows = false;
        this._searchQueries = [];
        this.init();
    }
    /**
     * Initialize the instance
     */
    init() {
        if (this.initialized || this.dom.classList.contains(this.options.classes.table)) {
            return false;
        }
        this._virtualDOM = nodeToObj(this.dom, this.options.diffDomOptions || {});
        this._tableAttributes = { ...this._virtualDOM.attributes };
        this.rows = new Rows(this);
        this.columns = new Columns(this);
        this.data = readTableData(this.options.data, this.dom, this.columns.settings, this.options.type, this.options.format);
        this._render();
        setTimeout(() => {
            this.emit("datatable.init");
            this.initialized = true;
        }, 10);
    }
    /**
     * Render the instance
     */
    _render() {
        // Build
        this.wrapperDOM = createElement("div", {
            class: `${this.options.classes.wrapper} ${this.options.classes.loading}`
        });
        this.wrapperDOM.innerHTML = this.options.template(this.options, this.dom);
        const selector = this.wrapperDOM.querySelector(`select.${this.options.classes.selector}`);
        // Per Page Select
        if (selector && this.options.paging && this.options.perPageSelect) {
            // Create the options
            this.options.perPageSelect.forEach((choice) => {
                const [lab, val] = Array.isArray(choice) ? [choice[0], choice[1]] : [String(choice), choice];
                const selected = val === this.options.perPage;
                const option = new Option(lab, String(val), selected, selected);
                selector.appendChild(option);
            });
        }
        else if (selector) {
            selector.parentElement.removeChild(selector);
        }
        this.containerDOM = this.wrapperDOM.querySelector(`.${this.options.classes.container}`);
        this._pagerDOMs = [];
        Array.from(this.wrapperDOM.querySelectorAll(`.${this.options.classes.pagination}`)).forEach(el => {
            if (!(el instanceof HTMLElement)) {
                return;
            }
            // We remove the inner part of the pager containers to ensure they are all the same.
            el.innerHTML = `<ul class="${this.options.classes.paginationList}"></ul>`;
            this._pagerDOMs.push(el.firstElementChild);
        });
        this._virtualPagerDOM = {
            nodeName: "UL",
            attributes: {
                class: this.options.classes.paginationList
            }
        };
        this._label = this.wrapperDOM.querySelector(`.${this.options.classes.info}`);
        // Insert in to DOM tree
        this.dom.parentElement.replaceChild(this.wrapperDOM, this.dom);
        this.containerDOM.appendChild(this.dom);
        // Store the table dimensions
        this._rect = this.dom.getBoundingClientRect();
        // // Fix height
        this._fixHeight();
        //
        // Class names
        if (!this.options.header) {
            this.wrapperDOM.classList.add("no-header");
        }
        if (!this.options.footer) {
            this.wrapperDOM.classList.add("no-footer");
        }
        if (this.options.sortable) {
            this.wrapperDOM.classList.add("sortable");
        }
        if (this.options.searchable) {
            this.wrapperDOM.classList.add("searchable");
        }
        if (this.options.fixedHeight) {
            this.wrapperDOM.classList.add("fixed-height");
        }
        if (this.options.fixedColumns) {
            this.wrapperDOM.classList.add("fixed-columns");
        }
        this._bindEvents();
        if (this.columns._state.sort) {
            this.columns.sort(this.columns._state.sort.column, this.columns._state.sort.dir, true);
        }
        this.update(true);
    }
    _renderTable(renderOptions = {}) {
        let newVirtualDOM = dataToVirtualDOM(this._tableAttributes, this.data.headings, (this.options.paging || this._searchQueries.length || this.columns._state.filters.length) && this._currentPage && this.pages.length && !renderOptions.noPaging ?
            this.pages[this._currentPage - 1] :
            this.data.data.map((row, index) => ({
                row,
                index
            })), this.columns.settings, this.columns._state, this.rows.cursor, this.options, renderOptions);
        if (this.options.tableRender) {
            const renderedTableVirtualDOM = this.options.tableRender(this.data, newVirtualDOM, "main");
            if (renderedTableVirtualDOM) {
                newVirtualDOM = renderedTableVirtualDOM;
            }
        }
        const diff = this._dd.diff(this._virtualDOM, newVirtualDOM);
        this._dd.apply(this.dom, diff);
        this._virtualDOM = newVirtualDOM;
    }
    /**
     * Render the page
     * @return {Void}
     */
    _renderPage(lastRowCursor = false) {
        if (this.hasRows && this.totalPages) {
            if (this._currentPage > this.totalPages) {
                this._currentPage = 1;
            }
            // Use a fragment to limit touching the DOM
            this._renderTable();
            this.onFirstPage = this._currentPage === 1;
            this.onLastPage = this._currentPage === this.lastPage;
        }
        else {
            this.setMessage(this.options.labels.noRows);
        }
        // Update the info
        let current = 0;
        let f = 0;
        let t = 0;
        let items;
        if (this.totalPages) {
            current = this._currentPage - 1;
            f = current * this.options.perPage;
            t = f + this.pages[current].length;
            f = f + 1;
            items = this._searchQueries.length ? this._searchData.length : this.data.data.length;
        }
        if (this._label && this.options.labels.info.length) {
            // CUSTOM LABELS
            const string = this.options.labels.info
                .replace("{start}", String(f))
                .replace("{end}", String(t))
                .replace("{page}", String(this._currentPage))
                .replace("{pages}", String(this.totalPages))
                .replace("{rows}", String(items));
            this._label.innerHTML = items ? string : "";
        }
        if (this._currentPage == 1) {
            this._fixHeight();
        }
        if (this.options.rowNavigation && this._currentPage) {
            if (!this.rows.cursor || !this.pages[this._currentPage - 1].find(row => row.index === this.rows.cursor)) {
                const rows = this.pages[this._currentPage - 1];
                if (rows.length) {
                    if (lastRowCursor) {
                        this.rows.setCursor(rows[rows.length - 1].index);
                    }
                    else {
                        this.rows.setCursor(rows[0].index);
                    }
                }
            }
        }
    }
    /** Render the pager(s)
     *
     */
    _renderPagers() {
        if (!this.options.paging) {
            return;
        }
        let newPagerVirtualDOM = createVirtualPagerDOM(this.onFirstPage, this.onLastPage, this._currentPage, this.totalPages, this.options);
        if (this.options.pagerRender) {
            const renderedPagerVirtualDOM = this.options.pagerRender([this.onFirstPage, this.onLastPage, this._currentPage, this.totalPages], newPagerVirtualDOM);
            if (renderedPagerVirtualDOM) {
                newPagerVirtualDOM = renderedPagerVirtualDOM;
            }
        }
        const diffs = this._dd.diff(this._virtualPagerDOM, newPagerVirtualDOM);
        // We may have more than one pager
        this._pagerDOMs.forEach((pagerDOM) => {
            this._dd.apply(pagerDOM, diffs);
        });
        this._virtualPagerDOM = newPagerVirtualDOM;
    }
    // Render header that is not in the same table element as the remainder
    // of the table. Used for tables with scrollY.
    _renderSeparateHeader() {
        const container = this.dom.parentElement;
        if (!this.headerDOM) {
            this.headerDOM = document.createElement("div");
            this._virtualHeaderDOM = {
                nodeName: "DIV"
            };
        }
        container.parentElement.insertBefore(this.headerDOM, container);
        let tableVirtualDOM = {
            nodeName: "TABLE",
            attributes: this._tableAttributes,
            childNodes: [
                {
                    nodeName: "THEAD",
                    childNodes: [
                        headingsToVirtualHeaderRowDOM(this.data.headings, this.columns.settings, this.columns._state, this.options, { unhideHeader: true })
                    ]
                }
            ]
        };
        tableVirtualDOM.attributes.class = tableVirtualDOM.attributes.class ? `${tableVirtualDOM.attributes.class} ${this.options.classes.table}` : this.options.classes.table;
        if (this.options.tableRender) {
            const renderedTableVirtualDOM = this.options.tableRender(this.data, tableVirtualDOM, "header");
            if (renderedTableVirtualDOM) {
                tableVirtualDOM = renderedTableVirtualDOM;
            }
        }
        const newVirtualHeaderDOM = {
            nodeName: "DIV",
            attributes: {
                class: this.options.classes.headercontainer
            },
            childNodes: [tableVirtualDOM]
        };
        const diff = this._dd.diff(this._virtualHeaderDOM, newVirtualHeaderDOM);
        this._dd.apply(this.headerDOM, diff);
        this._virtualHeaderDOM = newVirtualHeaderDOM;
        // Compensate for scrollbars
        const paddingRight = this.headerDOM.firstElementChild.clientWidth - this.dom.clientWidth;
        if (paddingRight) {
            const paddedVirtualHeaderDOM = structuredClone(this._virtualHeaderDOM);
            paddedVirtualHeaderDOM.attributes.style = `padding-right: ${paddingRight}px;`;
            const diff = this._dd.diff(this._virtualHeaderDOM, paddedVirtualHeaderDOM);
            this._dd.apply(this.headerDOM, diff);
            this._virtualHeaderDOM = paddedVirtualHeaderDOM;
        }
        if (container.scrollHeight > container.clientHeight) {
            // scrollbars on one page means scrollbars on all pages.
            container.style.overflowY = "scroll";
        }
    }
    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    _bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapperDOM.querySelector(`select.${this.options.classes.selector}`);
            if (selector && selector instanceof HTMLSelectElement) {
                // Change per page
                selector.addEventListener("change", () => {
                    this.options.perPage = parseInt(selector.value, 10);
                    this.update();
                    this._fixHeight();
                    this.emit("datatable.perpage", this.options.perPage);
                }, false);
            }
        }
        // Search input
        if (this.options.searchable) {
            this.wrapperDOM.addEventListener("input", (event) => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement) || !target.matches(`.${this.options.classes.input}`)) {
                    return;
                }
                event.preventDefault();
                const searches = Array.from(this.wrapperDOM.querySelectorAll(`.${this.options.classes.input}`)).filter(el => el.value.length).map(el => el.dataset.columns ?
                    { term: el.value,
                        columns: JSON.parse(el.dataset.columns) } :
                    { term: el.value,
                        columns: undefined });
                if (searches.length === 1) {
                    const search = searches[0];
                    this.search(search.term, search.columns);
                }
                else {
                    this.multiSearch(searches);
                }
            });
        }
        // Pager(s) / sorting
        this.wrapperDOM.addEventListener("click", (event) => {
            const target = event.target;
            const hyperlink = target.closest("a");
            if (!hyperlink) {
                return;
            }
            if (hyperlink.hasAttribute("data-page")) {
                this.page(parseInt(hyperlink.getAttribute("data-page"), 10));
                event.preventDefault();
            }
            else if (hyperlink.classList.contains(this.options.classes.sorter)) {
                const visibleIndex = Array.from(hyperlink.parentElement.parentElement.children).indexOf(hyperlink.parentElement);
                const columnIndex = visibleToColumnIndex(visibleIndex, this.columns.settings);
                this.columns.sort(columnIndex);
                event.preventDefault();
            }
            else if (hyperlink.classList.contains(this.options.classes.filter)) {
                const visibleIndex = Array.from(hyperlink.parentElement.parentElement.children).indexOf(hyperlink.parentElement);
                const columnIndex = visibleToColumnIndex(visibleIndex, this.columns.settings);
                this.columns.filter(columnIndex);
                event.preventDefault();
            }
        }, false);
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", (event) => {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    event.stopPropagation();
                    let lastRow;
                    this.pages[this._currentPage - 1].find((row) => {
                        if (row.index === this.rows.cursor) {
                            return true;
                        }
                        lastRow = row;
                        return false;
                    });
                    if (lastRow) {
                        this.rows.setCursor(lastRow.index);
                    }
                    else if (!this.onFirstPage) {
                        this.page(this._currentPage - 1, true);
                    }
                }
                else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    event.stopPropagation();
                    let foundRow;
                    const nextRow = this.pages[this._currentPage - 1].find((row) => {
                        if (foundRow) {
                            return true;
                        }
                        if (row.index === this.rows.cursor) {
                            foundRow = true;
                        }
                        return false;
                    });
                    if (nextRow) {
                        this.rows.setCursor(nextRow.index);
                    }
                    else if (!this.onLastPage) {
                        this.page(this._currentPage + 1);
                    }
                }
                else if (["Enter", " "].includes(event.key)) {
                    this.emit("datatable.selectrow", this.rows.cursor, event);
                }
            });
            this.dom.addEventListener("mousedown", (event) => {
                const target = event.target;
                if (!(target instanceof Element)) {
                    return;
                }
                if (this.dom.matches(":focus")) {
                    const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(target));
                    if (row && row instanceof HTMLElement) {
                        this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event);
                    }
                }
            });
        }
        else {
            this.dom.addEventListener("mousedown", (event) => {
                const target = event.target;
                if (!(target instanceof Element)) {
                    return;
                }
                const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(target));
                if (row && row instanceof HTMLElement) {
                    this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event);
                }
            });
        }
        window.addEventListener("resize", this._listeners.onResize);
    }
    /**
     * execute on resize
     */
    _onResize() {
        this._rect = this.containerDOM.getBoundingClientRect();
        if (!this._rect.width) {
            // No longer shown, likely no longer part of DOM. Give up.
            return;
        }
        this.update(true);
    }
    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        if (!this.options.destroyable) {
            return;
        }
        this.dom.innerHTML = this._initialInnerHTML;
        // Remove the className
        this.dom.classList.remove(this.options.classes.table);
        // Remove the containers
        if (this.wrapperDOM.parentElement) {
            this.wrapperDOM.parentElement.replaceChild(this.dom, this.wrapperDOM);
        }
        this.initialized = false;
        window.removeEventListener("resize", this._listeners.onResize);
    }
    /**
     * Update the instance
     * @return {Void}
     */
    update(measureWidths = false) {
        if (measureWidths) {
            this.columns._measureWidths();
            this.hasRows = Boolean(this.data.data.length);
            this.hasHeadings = Boolean(this.data.headings.length);
        }
        this.wrapperDOM.classList.remove(this.options.classes.empty);
        this._paginate();
        this._renderPage();
        this._renderPagers();
        if (this.options.scrollY.length) {
            this._renderSeparateHeader();
        }
        this.emit("datatable.update");
    }
    _paginate() {
        let rows = this.data.data.map((row, index) => ({
            row,
            index
        }));
        if (this._searchQueries.length) {
            rows = [];
            this._searchData.forEach((index) => rows.push({ index,
                row: this.data.data[index] }));
        }
        if (this.columns._state.filters.length) {
            this.columns._state.filters.forEach((filterState, column) => {
                if (!filterState) {
                    return;
                }
                rows = rows.filter((row) => typeof filterState === "function" ? filterState(row.row[column].data) : (row.row[column].text ?? row.row[column].data) === filterState);
            });
        }
        if (this.options.paging && this.options.perPage > 0) {
            // Check for hidden columns
            this.pages = rows
                .map((row, i) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter((page) => page);
        }
        else {
            this.pages = [rows];
        }
        this.totalPages = this.lastPage = this.pages.length;
        if (!this._currentPage) {
            this._currentPage = 1;
        }
        return this.totalPages;
    }
    /**
     * Fix the container height
     */
    _fixHeight() {
        if (this.options.fixedHeight) {
            this.containerDOM.style.height = null;
            this._rect = this.containerDOM.getBoundingClientRect();
            this.containerDOM.style.height = `${this._rect.height}px`;
        }
    }
    /**
     * Perform a simple search of the data set
     */
    search(term, columns = undefined) {
        if (!term.length) {
            this._currentPage = 1;
            this._searchQueries = [];
            this._searchData = [];
            this.update();
            this.emit("datatable.search", "", []);
            this.wrapperDOM.classList.remove("search-results");
            return false;
        }
        this.multiSearch([
            { term,
                columns: columns ? columns : undefined }
        ]);
        this.emit("datatable.search", term, this._searchData);
    }
    /**
     * Perform a search of the data set seraching for up to multiple strings in various columns
     */
    multiSearch(queries) {
        if (!this.hasRows)
            return false;
        this._currentPage = 1;
        this._searchQueries = queries;
        this._searchData = [];
        queries = queries.filter(query => query.term.length);
        if (!queries.length) {
            this.update();
            this.emit("datatable.multisearch", queries, this._searchData);
            this.wrapperDOM.classList.remove("search-results");
            return false;
        }
        const queryWords = queries.map(query => this.columns.settings.map((column, index) => {
            if (column.hidden || !column.searchable || (query.columns && !query.columns.includes(index))) {
                return false;
            }
            let columnQuery = query.term;
            const sensitivity = column.sensitivity || this.options.sensitivity;
            if (["base", "accent"].includes(sensitivity)) {
                columnQuery = columnQuery.toLowerCase();
            }
            if (["base", "case"].includes(sensitivity)) {
                columnQuery = columnQuery.normalize("NFD").replace(/\p{Diacritic}/gu, "");
            }
            const ignorePunctuation = column.ignorePunctuation || this.options.ignorePunctuation;
            if (ignorePunctuation) {
                columnQuery = columnQuery.replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "");
            }
            return columnQuery;
        }));
        this.data.data.forEach((row, idx) => {
            const searchRow = row.map((cell, i) => {
                let content = (cell.text || String(cell.data)).trim();
                if (content.length) {
                    const column = this.columns.settings[i];
                    const sensitivity = column.sensitivity || this.options.sensitivity;
                    if (["base", "accent"].includes(sensitivity)) {
                        content = content.toLowerCase();
                    }
                    if (["base", "case"].includes(sensitivity)) {
                        content = content.normalize("NFD").replace(/\p{Diacritic}/gu, "");
                    }
                    const ignorePunctuation = column.ignorePunctuation || this.options.ignorePunctuation;
                    if (ignorePunctuation) {
                        content = content.replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "");
                    }
                }
                return content;
            });
            if (queryWords.every(queries => queries.find((query, index) => query ?
                (this.columns.settings[index].isSplitQueryWord ? query.split(this.columns.settings[index].searchQuerySeparator) : [query]).find(queryWord => searchRow[index].includes(queryWord.trim())) :
                false))) {
                this._searchData.push(idx);
            }
        });
        this.wrapperDOM.classList.add("search-results");
        if (this._searchData.length) {
            this.update();
        }
        else {
            this.wrapperDOM.classList.remove("search-results");
            this.setMessage(this.options.labels.noResults);
        }
        this.emit("datatable.multisearch", queries, this._searchData);
    }
    /**
     * Change page
     */
    page(page, lastRowCursor = false) {
        // We don't want to load the current page again.
        if (page === this._currentPage) {
            return false;
        }
        if (!isNaN(page)) {
            this._currentPage = page;
        }
        if (page > this.pages.length || page < 0) {
            return false;
        }
        this._renderPage(lastRowCursor);
        this._renderPagers();
        this.emit("datatable.page", page);
    }
    /**
     * Add new row data
     */
    insert(data) {
        let rows = [];
        if (Array.isArray(data)) {
            const headings = this.data.headings.map((heading) => heading.text ?? String(heading.data));
            data.forEach((row, rIndex) => {
                const r = [];
                Object.entries(row).forEach(([heading, cell]) => {
                    const index = headings.indexOf(heading);
                    if (index > -1) {
                        r[index] = readDataCell(cell, this.columns.settings[index]);
                    }
                    else if (!this.hasHeadings && !this.hasRows && rIndex === 0) {
                        r[headings.length] = readDataCell(cell, this.columns.settings[headings.length]);
                        headings.push(heading);
                        this.data.headings.push(readHeaderCell(heading));
                    }
                });
                rows.push(r);
            });
        }
        else if (isObject(data)) {
            if (data.headings && !this.hasHeadings && !this.hasRows) {
                this.data = readTableData(data, undefined, this.columns.settings, this.options.type, this.options.format);
            }
            else if (data.data && Array.isArray(data.data)) {
                rows = data.data.map(row => row.map((cell, index) => readDataCell(cell, this.columns.settings[index])));
            }
        }
        if (rows.length) {
            rows.forEach((row) => this.data.data.push(row));
        }
        this.hasHeadings = Boolean(this.data.headings.length);
        if (this.columns._state.sort) {
            this.columns.sort(this.columns._state.sort.column, this.columns._state.sort.dir, true);
        }
        this.update(true);
    }
    /**
     * Refresh the instance
     */
    refresh() {
        if (this.options.searchable) {
            Array.from(this.wrapperDOM.querySelectorAll(`.${this.options.classes.input}`)).forEach(el => {
                el.value = "";
            });
            this._searchQueries = [];
        }
        this._currentPage = 1;
        this.onFirstPage = true;
        this.update(true);
        this.emit("datatable.refresh");
    }
    /**
     * Print the table
     */
    print() {
        const tableDOM = createElement("table");
        const tableVirtualDOM = { nodeName: "TABLE" };
        let newTableVirtualDOM = dataToVirtualDOM(this._tableAttributes, this.data.headings, this.data.data.map((row, index) => ({
            row,
            index
        })), this.columns.settings, this.columns._state, false, // No row cursor
        this.options, {
            noColumnWidths: true,
            unhideHeader: true
        });
        if (this.options.tableRender) {
            const renderedTableVirtualDOM = this.options.tableRender(this.data, newTableVirtualDOM, "print");
            if (renderedTableVirtualDOM) {
                newTableVirtualDOM = renderedTableVirtualDOM;
            }
        }
        const diff = this._dd.diff(tableVirtualDOM, newTableVirtualDOM);
        this._dd.apply(tableDOM, diff);
        // Open new window
        const w = window.open();
        // Append the table to the body
        w.document.body.appendChild(tableDOM);
        // Print
        w.print();
    }
    /**
     * Show a message in the table
     */
    setMessage(message) {
        const activeHeadings = this.data.headings.filter((heading, index) => !this.columns.settings[index]?.hidden);
        const colspan = activeHeadings.length || 1;
        this.wrapperDOM.classList.add(this.options.classes.empty);
        if (this._label) {
            this._label.innerHTML = "";
        }
        this.totalPages = 0;
        this._renderPagers();
        let newVirtualDOM = {
            nodeName: "TABLE",
            attributes: this._tableAttributes,
            childNodes: [
                {
                    nodeName: "THEAD",
                    childNodes: [
                        headingsToVirtualHeaderRowDOM(this.data.headings, this.columns.settings, this.columns._state, this.options, {})
                    ]
                },
                {
                    nodeName: "TBODY",
                    childNodes: [
                        {
                            nodeName: "TR",
                            childNodes: [
                                {
                                    nodeName: "TD",
                                    attributes: {
                                        class: this.options.classes.empty,
                                        colspan: String(colspan)
                                    },
                                    childNodes: [
                                        {
                                            nodeName: "#text",
                                            data: message
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        newVirtualDOM.attributes.class = newVirtualDOM.attributes.class ? `${newVirtualDOM.attributes.class} ${this.options.classes.table}` : this.options.classes.table;
        if (this.options.tableRender) {
            const renderedTableVirtualDOM = this.options.tableRender(this.data, newVirtualDOM, "message");
            if (renderedTableVirtualDOM) {
                newVirtualDOM = renderedTableVirtualDOM;
            }
        }
        const diff = this._dd.diff(this._virtualDOM, newVirtualDOM);
        this._dd.apply(this.dom, diff);
        this._virtualDOM = newVirtualDOM;
    }
    /**
     * Add custom event listener
     */
    on(event, callback) {
        this._events[event] = this._events[event] || [];
        this._events[event].push(callback);
    }
    /**
     * Remove custom event listener
     */
    off(event, callback) {
        if (event in this._events === false)
            return;
        this._events[event].splice(this._events[event].indexOf(callback), 1);
    }
    /**
     * Fire custom event
     */
    emit(event, ...args) {
        if (event in this._events === false)
            return;
        for (let i = 0; i < this._events[event].length; i++) {
            this._events[event][i](...args);
        }
    }
}

/**
 * Convert CSV data to fit the format used in the table.
 */
const convertCSV = function (userOptions) {
    let obj;
    const defaults = {
        lineDelimiter: "\n",
        columnDelimiter: ",",
        removeDoubleQuotes: false
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = {
        ...defaults,
        ...userOptions
    };
    if (options.data.length) {
        // Import CSV
        obj = {
            data: []
        };
        // Split the string into rows
        const rows = options.data.split(options.lineDelimiter);
        if (rows.length) {
            if (options.headings) {
                obj.headings = rows[0].split(options.columnDelimiter);
                if (options.removeDoubleQuotes) {
                    obj.headings = obj.headings.map((e) => e.trim().replace(/(^"|"$)/g, ""));
                }
                rows.shift();
            }
            rows.forEach((row, i) => {
                obj.data[i] = [];
                // Split the rows into values
                const values = row.split(options.columnDelimiter);
                if (values.length) {
                    values.forEach((value) => {
                        if (options.removeDoubleQuotes) {
                            value = value.trim().replace(/(^"|"$)/g, "");
                        }
                        obj.data[i].push(value);
                    });
                }
            });
        }
        if (obj) {
            return obj;
        }
    }
    return false;
};

/**
 * Convert JSON data to fit the format used in the table.
 */
const convertJSON = function (userOptions) {
    let obj;
    const defaults = {
        data: ""
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = {
        ...defaults,
        ...userOptions
    };
    if (options.data.length || isObject(options.data)) {
        // Import JSON
        const json = isJson(options.data) ? JSON.parse(options.data) : false;
        // Valid JSON string
        if (json) {
            obj = {
                headings: [],
                data: []
            };
            json.forEach((data, i) => {
                obj.data[i] = [];
                Object.entries(data).forEach(([column, value]) => {
                    if (!obj.headings.includes(column)) {
                        obj.headings.push(column);
                    }
                    obj.data[i].push(value);
                });
            });
        }
        else {
            console.warn("That's not valid JSON!");
        }
        if (obj) {
            return obj;
        }
    }
    return false;
};

const exportCSV = function (dt, userOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = {
        ...defaults,
        ...userOptions
    };
    const columnShown = (index) => !options.skipColumn.includes(index) && !dt.columns.settings[index]?.hidden;
    let rows = [];
    const headers = dt.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.text ?? header.data);
    // Include headings
    rows[0] = headers;
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dt.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text ?? cell.data)));
            }
        }
        else {
            rows = rows.concat(dt.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text ?? cell.data)));
        }
    }
    else {
        rows = rows.concat(dt.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text ?? cell.data)));
    }
    // Only proceed if we have data
    if (rows.length) {
        let str = "";
        rows.forEach(row => {
            row.forEach((cell) => {
                if (typeof cell === "string") {
                    cell = cell.trim();
                    cell = cell.replace(/\s{2,}/g, " ");
                    cell = cell.replace(/\n/g, "  ");
                    cell = cell.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23");
                    if (cell.includes(",")) {
                        cell = `"${cell}"`;
                    }
                }
                str += cell + options.columnDelimiter;
            });
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);
            // Apply line delimiter
            str += options.lineDelimiter;
        });
        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a");
            link.href = encodeURI(`data:text/csv;charset=utf-8,${str}`);
            link.download = `${options.filename || "datatable_export"}.csv`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str;
    }
    return false;
};

const exportJSON = function (dt, userOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        replacer: null,
        space: 4
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = {
        ...defaults,
        ...userOptions
    };
    const columnShown = (index) => !options.skipColumn.includes(index) && !dt.columns.settings[index]?.hidden;
    let rows = [];
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dt.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
            }
        }
        else {
            rows = rows.concat(dt.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
        }
    }
    else {
        rows = rows.concat(dt.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
    }
    const headers = dt.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.text ?? String(header.data));
    // Only proceed if we have data
    if (rows.length) {
        const arr = [];
        rows.forEach((row, x) => {
            arr[x] = arr[x] || {};
            row.forEach((cell, i) => {
                arr[x][headers[i]] = cell;
            });
        });
        // Convert the array of objects to JSON string
        const str = JSON.stringify(arr, options.replacer, options.space);
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const blob = new Blob([str], {
                type: "data:application/json;charset=utf-8"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${options.filename || "datatable_export"}.json`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        return str;
    }
    return false;
};

const exportSQL = function (dt, userOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        tableName: "myTable"
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = {
        ...defaults,
        ...userOptions
    };
    const columnShown = (index) => !options.skipColumn.includes(index) && !dt.columns.settings[index]?.hidden;
    let rows = [];
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dt.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text ?? cell.data)));
            }
        }
        else {
            rows = rows.concat(dt.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text ?? cell.data)));
        }
    }
    else {
        rows = rows.concat(dt.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text ?? cell.data)));
    }
    const headers = dt.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.text ?? String(header.data));
    // Only proceed if we have data
    if (rows.length) {
        // Begin INSERT statement
        let str = `INSERT INTO \`${options.tableName}\` (`;
        // Convert table headings to column names
        headers.forEach((header) => {
            str += `\`${header}\`,`;
        });
        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);
        // Begin VALUES
        str += ") VALUES ";
        // Iterate rows and convert cell data to column values
        rows.forEach((row) => {
            str += "(";
            row.forEach((cell) => {
                if (typeof cell === "string") {
                    str += `"${cell}",`;
                }
                else {
                    str += `${cell},`;
                }
            });
            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1);
            // end VALUES
            str += "),";
        });
        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);
        // Add trailing colon
        str += ";";
        if (options.download) {
            str = `data:application/sql;charset=utf-8,${str}`;
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a");
            link.href = encodeURI(str);
            link.download = `${options.filename || "datatable_export"}.sql`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str;
    }
    return false;
};

const exportTXT = function (dt, userOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = {
        ...defaults,
        ...userOptions
    };
    const columnShown = (index) => !options.skipColumn.includes(index) && !dt.columns.settings[index]?.hidden;
    let rows = [];
    const headers = dt.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.text ?? header.data);
    // Include headings
    rows[0] = headers;
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dt.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
            }
        }
        else {
            rows = rows.concat(dt.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
        }
    }
    else {
        rows = rows.concat(dt.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
    }
    // Only proceed if we have data
    if (rows.length) {
        let str = "";
        rows.forEach(row => {
            row.forEach((cell) => {
                if (typeof cell === "string") {
                    cell = cell.trim();
                    cell = cell.replace(/\s{2,}/g, " ");
                    cell = cell.replace(/\n/g, "  ");
                    cell = cell.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23");
                    if (cell.includes(",")) {
                        cell = `"${cell}"`;
                    }
                }
                str += cell + options.columnDelimiter;
            });
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);
            // Apply line delimiter
            str += options.lineDelimiter;
        });
        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);
        if (options.download) {
            str = `data:text/csv;charset=utf-8,${str}`;
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a");
            link.href = encodeURI(str);
            link.download = `${options.filename || "datatable_export"}.txt`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str;
    }
    return false;
};

const defaultConfig = {
    classes: {
        row: "datatable-editor-row",
        form: "datatable-editor-form",
        item: "datatable-editor-item",
        menu: "datatable-editor-menu",
        save: "datatable-editor-save",
        block: "datatable-editor-block",
        cancel: "datatable-editor-cancel",
        close: "datatable-editor-close",
        inner: "datatable-editor-inner",
        input: "datatable-editor-input",
        label: "datatable-editor-label",
        modal: "datatable-editor-modal",
        action: "datatable-editor-action",
        header: "datatable-editor-header",
        wrapper: "datatable-editor-wrapper",
        editable: "datatable-editor-editable",
        container: "datatable-editor-container",
        separator: "datatable-editor-separator"
    },
    labels: {
        closeX: "x",
        editCell: "Edit Cell",
        editRow: "Edit Row",
        removeRow: "Remove Row",
        reallyRemove: "Are you sure?",
        reallyCancel: "Do you really want to cancel?",
        save: "Save",
        cancel: "Cancel"
    },
    cancelModal: editor => confirm(editor.options.labels.reallyCancel),
    // edit inline instead of using a modal lay-over for editing content
    inline: true,
    // include hidden columns in the editor
    hiddenColumns: false,
    // enable the context menu
    contextMenu: true,
    // event to start editing
    clickEvent: "dblclick",
    // indexes of columns not to be edited
    excludeColumns: [],
    // set the context menu items
    menuItems: [
        {
            text: (editor) => editor.options.labels.editCell,
            action: (editor, _event) => {
                if (!(editor.event.target instanceof Element)) {
                    return;
                }
                const cell = editor.event.target.closest("td");
                return editor.editCell(cell);
            }
        },
        {
            text: (editor) => editor.options.labels.editRow,
            action: (editor, _event) => {
                if (!(editor.event.target instanceof Element)) {
                    return;
                }
                const row = editor.event.target.closest("tr");
                return editor.editRow(row);
            }
        },
        {
            separator: true
        },
        {
            text: (editor) => editor.options.labels.removeRow,
            action: (editor, _event) => {
                if (!(editor.event.target instanceof Element)) {
                    return;
                }
                if (confirm(editor.options.labels.reallyRemove)) {
                    const row = editor.event.target.closest("tr");
                    editor.removeRow(row);
                }
            }
        }
    ]
};

// Source: https://www.freecodecamp.org/news/javascript-debounce-example/
const debounce = function (func, timeout = 300) {
    let timer;
    return (..._args) => {
        clearTimeout(timer);
        timer = window.setTimeout(() => func(), timeout);
    };
};

/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
class Editor {
    constructor(dataTable, options = {}) {
        this.dt = dataTable;
        this.options = {
            ...defaultConfig,
            ...options
        };
    }
    /**
     * Init instance
     * @return {Void}
     */
    init() {
        if (this.initialized) {
            return;
        }
        this.dt.wrapperDOM.classList.add(this.options.classes.editable);
        if (this.options.inline) {
            this.originalRowRender = this.dt.options.rowRender;
            this.dt.options.rowRender = (row, tr, index) => {
                let newTr = this.rowRender(row, tr, index);
                if (this.originalRowRender) {
                    newTr = this.originalRowRender(row, newTr, index);
                }
                return newTr;
            };
        }
        if (this.options.contextMenu) {
            this.containerDOM = createElement("div", {
                id: this.options.classes.container
            });
            this.wrapperDOM = createElement("div", {
                class: this.options.classes.wrapper
            });
            this.menuDOM = createElement("ul", {
                class: this.options.classes.menu
            });
            if (this.options.menuItems && this.options.menuItems.length) {
                this.options.menuItems.forEach((item) => {
                    const li = createElement("li", {
                        class: item.separator ? this.options.classes.separator : this.options.classes.item
                    });
                    if (!item.separator) {
                        const a = createElement("a", {
                            class: this.options.classes.action,
                            href: item.url || "#",
                            html: typeof item.text === "function" ? item.text(this) : item.text
                        });
                        li.appendChild(a);
                        if (item.action && typeof item.action === "function") {
                            a.addEventListener("click", (event) => {
                                event.preventDefault();
                                item.action(this, event);
                            });
                        }
                    }
                    this.menuDOM.appendChild(li);
                });
            }
            this.wrapperDOM.appendChild(this.menuDOM);
            this.containerDOM.appendChild(this.wrapperDOM);
            this.updateMenu();
        }
        this.data = {};
        this.menuOpen = false;
        this.editing = false;
        this.editingRow = false;
        this.editingCell = false;
        this.bindEvents();
        setTimeout(() => {
            this.initialized = true;
            this.dt.emit("editable.init");
        }, 10);
    }
    /**
     * Bind events to DOM
     * @return {Void}
     */
    bindEvents() {
        this.events = {
            keydown: this.keydown.bind(this),
            click: this.click.bind(this)
        };
        // listen for click / double-click
        this.dt.dom.addEventListener(this.options.clickEvent, this.events.click);
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown);
        if (this.options.contextMenu) {
            this.events.context = this.context.bind(this);
            this.events.updateMenu = this.updateMenu.bind(this);
            this.events.dismissMenu = this.dismissMenu.bind(this);
            this.events.reset = debounce(() => this.events.updateMenu(), 50);
            // listen for right-click
            this.dt.dom.addEventListener("contextmenu", this.events.context);
            // listen for click everywhere except the menu
            document.addEventListener("click", this.events.dismissMenu);
            // Reset contextmenu on browser window changes
            window.addEventListener("resize", this.events.reset);
            window.addEventListener("scroll", this.events.reset);
        }
    }
    /**
     * contextmenu listener
     * @param  {Object} event Event
     * @return {Void}
     */
    context(event) {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        this.event = event;
        const cell = target.closest("tbody td");
        if (!this.disabled && cell) {
            event.preventDefault();
            // get the mouse position
            let x = event.pageX;
            let y = event.pageY;
            // check if we're near the right edge of window
            if (x > this.limits.x) {
                x -= this.rect.width;
            }
            // check if we're near the bottom edge of window
            if (y > this.limits.y) {
                y -= this.rect.height;
            }
            this.wrapperDOM.style.top = `${y}px`;
            this.wrapperDOM.style.left = `${x}px`;
            this.openMenu();
            this.updateMenu();
        }
    }
    /**
     * dblclick listener
     * @param  {Object} event Event
     * @return {Void}
     */
    click(event) {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        if (this.editing && this.data && this.editingCell) {
            const input = this.modalDOM ?
                this.modalDOM.querySelector(`input.${this.options.classes.input}[type=text]`) :
                this.dt.wrapperDOM.querySelector(`input.${this.options.classes.input}[type=text]`);
            this.saveCell(input.value);
        }
        else if (!this.editing) {
            const cell = target.closest("tbody td");
            if (cell) {
                this.editCell(cell);
                event.preventDefault();
            }
        }
    }
    /**
     * keydown listener
     * @param  {Object} event Event
     * @return {Void}
     */
    keydown(event) {
        if (this.modalDOM) {
            if (event.key === "Escape") { // close button
                if (this.options.cancelModal(this)) {
                    this.closeModal();
                }
            }
            else if (event.key === "Enter") { // save button
                // Save
                if (this.editingCell) {
                    const input = this.modalDOM.querySelector(`input.${this.options.classes.input}[type=text]`);
                    this.saveCell(input.value);
                }
                else {
                    const inputs = Array.from(this.modalDOM.querySelectorAll(`input.${this.options.classes.input}[type=text]`));
                    this.saveRow(inputs.map(input => input.value.trim()), this.data.row);
                }
            }
        }
        else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    const input = this.dt.wrapperDOM.querySelector(`input.${this.options.classes.input}[type=text]`);
                    this.saveCell(input.value);
                }
                else if (this.editingRow) {
                    const inputs = Array.from(this.dt.wrapperDOM.querySelectorAll(`input.${this.options.classes.input}[type=text]`));
                    this.saveRow(inputs.map(input => input.value.trim()), this.data.row);
                }
            }
            else if (event.key === "Escape") {
                // Escape key reverts
                if (this.editingCell) {
                    this.saveCell(this.data.content);
                }
                else if (this.editingRow) {
                    this.saveRow(null, this.data.row);
                }
            }
        }
    }
    /**
     * Edit cell
     * @param  {Object} td    The HTMLTableCellElement
     * @return {Void}
     */
    editCell(td) {
        const columnIndex = visibleToColumnIndex(td.cellIndex, this.dt.columns.settings);
        if (this.options.excludeColumns.includes(columnIndex)) {
            this.closeMenu();
            return;
        }
        const rowIndex = parseInt(td.parentElement.dataset.index, 10);
        const row = this.dt.data.data[rowIndex];
        const cell = row[columnIndex];
        this.data = {
            cell,
            rowIndex,
            columnIndex,
            content: cell.text || String(cell.data)
        };
        this.editing = true;
        this.editingCell = true;
        if (this.options.inline) {
            this.dt.update();
        }
        else {
            this.editCellModal();
        }
        this.closeMenu();
    }
    editCellModal() {
        const cell = this.data.cell;
        const columnIndex = this.data.columnIndex;
        const label = this.dt.data.headings[columnIndex].text || String(this.dt.data.headings[columnIndex].data);
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            `<h4>${this.options.labels.editCell}</h4>`,
            `<button class='${this.options.classes.close}' type='button' data-editor-cancel>${this.options.labels.closeX}</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<label class='${this.options.classes.label}'>${escapeText(label)}</label>`,
            `<input class='${this.options.classes.input}' value='${escapeText(cell.text || String(cell.data) || "")}' type='text'>`,
            "</div>",
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.cancel}' type='button' data-editor-cancel>${this.options.labels.cancel}</button>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>${this.options.labels.save}</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        const modalDOM = createElement("div", {
            class: this.options.classes.modal,
            html: template
        });
        this.modalDOM = modalDOM;
        this.openModal();
        const input = modalDOM.querySelector(`input.${this.options.classes.input}[type=text]`);
        input.focus();
        input.selectionStart = input.selectionEnd = input.value.length;
        // Close / save
        modalDOM.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            if (target.hasAttribute("data-editor-cancel")) { // cancel button
                event.preventDefault();
                if (this.options.cancelModal(this)) {
                    this.closeModal();
                }
            }
            else if (target.hasAttribute("data-editor-save")) { // save button
                event.preventDefault();
                // Save
                this.saveCell(input.value);
            }
        });
    }
    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    saveCell(value) {
        const oldData = this.data.content;
        // Get the type of that column
        const type = this.dt.columns.settings[this.data.columnIndex].type || this.dt.options.type;
        const stringValue = value.trim();
        let cell;
        if (type === "number") {
            cell = { data: parseFloat(stringValue) };
        }
        else if (type === "boolean") {
            if (["", "false", "0"].includes(stringValue)) {
                cell = { data: false,
                    text: "false",
                    order: 0 };
            }
            else {
                cell = { data: true,
                    text: "true",
                    order: 1 };
            }
        }
        else if (type === "html") {
            cell = { data: [
                    { nodeName: "#text",
                        data: value }
                ],
                text: value,
                order: value };
        }
        else if (type === "string") {
            cell = { data: value };
        }
        else if (type === "date") {
            const format = this.dt.columns.settings[this.data.columnIndex].format || this.dt.options.format;
            cell = { data: value,
                order: parseDate(String(value), format) };
        }
        else {
            cell = { data: value };
        }
        // Set the cell content
        this.dt.data.data[this.data.rowIndex][this.data.columnIndex] = cell;
        this.closeModal();
        const rowIndex = this.data.rowIndex;
        const columnIndex = this.data.columnIndex;
        this.data = {};
        this.dt.update(true);
        this.editing = false;
        this.editingCell = false;
        this.dt.emit("editable.save.cell", value, oldData, rowIndex, columnIndex);
    }
    /**
     * Edit row
     * @param  {Object} row    The HTMLTableRowElement
     * @return {Void}
     */
    editRow(tr) {
        if (!tr || tr.nodeName !== "TR" || this.editing)
            return;
        const rowIndex = parseInt(tr.dataset.index, 10);
        const row = this.dt.data.data[rowIndex];
        this.data = {
            row,
            rowIndex
        };
        this.editing = true;
        this.editingRow = true;
        if (this.options.inline) {
            this.dt.update();
        }
        else {
            this.editRowModal();
        }
        this.closeMenu();
    }
    editRowModal() {
        const row = this.data.row;
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            `<h4>${this.options.labels.editRow}</h4>`,
            `<button class='${this.options.classes.close}' type='button' data-editor-cancel>${this.options.labels.closeX}</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.cancel}' type='button' data-editor-cancel>${this.options.labels.cancel}</button>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>${this.options.labels.save}</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        const modalDOM = createElement("div", {
            class: this.options.classes.modal,
            html: template
        });
        const inner = modalDOM.firstElementChild;
        if (!inner) {
            return;
        }
        const form = inner.lastElementChild?.firstElementChild;
        if (!form) {
            return;
        }
        // Add the inputs for each cell
        row.forEach((cell, i) => {
            const columnSettings = this.dt.columns.settings[i];
            if ((!columnSettings.hidden || (columnSettings.hidden && this.options.hiddenColumns)) && !this.options.excludeColumns.includes(i)) {
                const label = this.dt.data.headings[i].text || String(this.dt.data.headings[i].data);
                form.insertBefore(createElement("div", {
                    class: this.options.classes.row,
                    html: [
                        `<div class='${this.options.classes.row}'>`,
                        `<label class='${this.options.classes.label}'>${escapeText(label)}</label>`,
                        `<input class='${this.options.classes.input}' value='${escapeText(cell.text || String(cell.data) || "")}' type='text'>`,
                        "</div>"
                    ].join("")
                }), form.lastElementChild);
            }
        });
        this.modalDOM = modalDOM;
        this.openModal();
        // Grab the inputs
        const inputs = Array.from(form.querySelectorAll(`input.${this.options.classes.input}[type=text]`));
        // Remove save button
        inputs.pop();
        // Close / save
        modalDOM.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            if (target.hasAttribute("data-editor-cancel")) { // cancel button
                if (this.options.cancelModal(this)) {
                    this.closeModal();
                }
            }
            else if (target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveRow(inputs.map((input) => input.value.trim()), this.data.row);
            }
        });
    }
    /**
     * Save edited row
     * @param  {Object} row    The HTMLTableRowElement
     * @param  {Array} data   Cell data
     * @return {Void}
     */
    saveRow(data, row) {
        // Store the old data for the emitter
        const oldData = row.map((cell) => cell.text ?? String(cell.data));
        if (data) {
            this.dt.data.data[this.data.rowIndex] = this.dt.data.data[this.data.rowIndex].map((oldCell, colIndex) => {
                const columnSetting = this.dt.columns.settings[colIndex];
                if (columnSetting.hidden || this.options.excludeColumns.includes(colIndex)) {
                    return oldCell;
                }
                const type = this.dt.columns.settings[colIndex].type || this.dt.options.type;
                const value = data[columnToVisibleIndex(colIndex, this.dt.columns.settings)];
                const stringValue = value.trim();
                let cell;
                if (type === "number") {
                    cell = { data: parseFloat(stringValue) };
                }
                else if (type === "boolean") {
                    if (["", "false", "0"].includes(stringValue)) {
                        cell = { data: false,
                            text: "false",
                            order: 0 };
                    }
                    else {
                        cell = { data: true,
                            text: "true",
                            order: 1 };
                    }
                }
                else if (type === "html") {
                    cell = { data: [
                            { nodeName: "#text",
                                data: value }
                        ],
                        text: value,
                        order: value };
                }
                else if (type === "string") {
                    cell = { data: value };
                }
                else if (type === "date") {
                    const format = this.dt.columns.settings[colIndex].format || this.dt.options.format;
                    cell = { data: value,
                        order: parseDate(String(value), format) };
                }
                else {
                    cell = { data: value };
                }
                return cell;
            });
        }
        const updatedRow = this.dt.data.data[this.data.rowIndex];
        const newData = updatedRow.map(cell => cell.text ?? String(cell.data));
        this.data = {};
        this.dt.update(true);
        this.closeModal();
        this.editing = false;
        this.dt.emit("editable.save.row", newData, oldData, row);
    }
    /**
     * Open the row editor modal
     * @return {Void}
     */
    openModal() {
        if (this.modalDOM) {
            document.body.appendChild(this.modalDOM);
        }
    }
    /**
     * Close the row editor modal
     * @return {Void}
     */
    closeModal() {
        if (this.editing && this.modalDOM) {
            document.body.removeChild(this.modalDOM);
            this.modalDOM = this.editing = this.editingRow = this.editingCell = false;
        }
    }
    /**
     * Remove a row
     * @param  {Object} tr The HTMLTableRowElement
     * @return {Void}
     */
    removeRow(tr) {
        if (!tr || tr.nodeName !== "TR" || this.editing)
            return;
        const index = parseInt(tr.dataset.index, 10);
        this.dt.rows.remove(index);
        this.closeMenu();
    }
    /**
     * Update context menu position
     * @return {Void}
     */
    updateMenu() {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        this.rect = this.wrapperDOM.getBoundingClientRect();
        this.limits = {
            x: window.innerWidth + scrollX - this.rect.width,
            y: window.innerHeight + scrollY - this.rect.height
        };
    }
    /**
     * Dismiss the context menu
     * @param  {Object} event Event
     * @return {Void}
     */
    dismissMenu(event) {
        const target = event.target;
        if (!(target instanceof Element) || this.wrapperDOM.contains(target)) {
            return;
        }
        let valid = true;
        if (this.editing) {
            valid = !(target.matches(`input.${this.options.classes.input}[type=text]`));
        }
        if (valid) {
            this.closeMenu();
        }
    }
    /**
     * Open the context menu
     * @return {Void}
     */
    openMenu() {
        if (this.editing && this.data && this.editingCell) {
            const input = this.modalDOM ?
                this.modalDOM.querySelector(`input.${this.options.classes.input}[type=text]`) :
                this.dt.wrapperDOM.querySelector(`input.${this.options.classes.input}[type=text]`);
            this.saveCell(input.value);
        }
        document.body.appendChild(this.containerDOM);
        this.menuOpen = true;
        this.dt.emit("editable.context.open");
    }
    /**
     * Close the context menu
     * @return {Void}
     */
    closeMenu() {
        if (this.menuOpen) {
            this.menuOpen = false;
            document.body.removeChild(this.containerDOM);
            this.dt.emit("editable.context.close");
        }
    }
    /**
     * Destroy the instance
     * @return {Void}
     */
    destroy() {
        this.dt.dom.removeEventListener(this.options.clickEvent, this.events.click);
        this.dt.dom.removeEventListener("contextmenu", this.events.context);
        document.removeEventListener("click", this.events.dismissMenu);
        document.removeEventListener("keydown", this.events.keydown);
        window.removeEventListener("resize", this.events.reset);
        window.removeEventListener("scroll", this.events.reset);
        if (document.body.contains(this.containerDOM)) {
            document.body.removeChild(this.containerDOM);
        }
        if (this.options.inline) {
            this.dt.options.rowRender = this.originalRowRender;
        }
        this.initialized = false;
    }
    rowRender(row, tr, index) {
        if (!this.data || this.data.rowIndex !== index) {
            return tr;
        }
        if (this.editingCell) {
            // cell editing
            const cell = tr.childNodes[columnToVisibleIndex(this.data.columnIndex, this.dt.columns.settings)];
            cell.childNodes = [
                {
                    nodeName: "INPUT",
                    attributes: {
                        type: "text",
                        value: this.data.content,
                        class: this.options.classes.input
                    }
                }
            ];
        }
        else {
            // row editing
            // Add the inputs for each cell
            tr.childNodes.forEach((cell, i) => {
                const index = visibleToColumnIndex(i, this.dt.columns.settings);
                const dataCell = row[index];
                if (!this.options.excludeColumns.includes(index)) {
                    const cell = tr.childNodes[i];
                    cell.childNodes = [
                        {
                            nodeName: "INPUT",
                            attributes: {
                                type: "text",
                                value: escapeText(dataCell.text || String(dataCell.data) || ""),
                                class: this.options.classes.input
                            }
                        }
                    ];
                }
            });
        }
        return tr;
    }
}
const makeEditable = function (dataTable, options = {}) {
    const editor = new Editor(dataTable, options);
    if (dataTable.initialized) {
        editor.init();
    }
    else {
        dataTable.on("datatable.init", () => editor.init());
    }
    return editor;
};

export { DataTable, convertCSV, convertJSON, createElement, exportCSV, exportJSON, exportSQL, exportTXT, isJson, isObject, makeEditable };
//# sourceMappingURL=module.js.map
