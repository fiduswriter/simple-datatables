/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function objToNode(objNode, insideSvg, options) {
    let node;
    if (objNode.nodeName === "#text") {
        node = options.document.createTextNode(objNode.data);
    } else if (objNode.nodeName === "#comment") {
        node = options.document.createComment(objNode.data);
    } else {
        if (insideSvg) {
            node = options.document.createElementNS(
                "http://www.w3.org/2000/svg",
                objNode.nodeName
            );
        } else if (objNode.nodeName.toLowerCase() === "svg") {
            node = options.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );
            insideSvg = true;
        } else {
            node = options.document.createElement(objNode.nodeName);
        }
        if (objNode.attributes) {
            Object.entries(objNode.attributes).forEach(([key, value]) =>
                node.setAttribute(key, value)
            );
        }
        if (objNode.childNodes) {
            objNode.childNodes.forEach((childNode) =>
                node.appendChild(objToNode(childNode, insideSvg, options))
            );
        }
        if (options.valueDiffing) {
            if (objNode.value) {
                node.value = objNode.value;
            }
            if (objNode.checked) {
                node.checked = objNode.checked;
            }
            if (objNode.selected) {
                node.selected = objNode.selected;
            }
        }
    }
    return node
}

// ===== Apply a diff =====

function getFromRoute(node, route) {
    route = route.slice();
    while (route.length > 0) {
        if (!node.childNodes) {
            return false
        }
        const c = route.splice(0, 1)[0];
        node = node.childNodes[c];
    }
    return node
}

function applyDiff(
    tree,
    diff,
    options // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    let node = getFromRoute(tree, diff[options._const.route]);
    let newNode;
    let reference;
    let route;
    let nodeArray;
    let c;

    // pre-diff hook
    const info = {
        diff,
        node,
    };

    if (options.preDiffApply(info)) {
        return true
    }

    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            if (!node || !node.setAttribute) {
                return false
            }
            node.setAttribute(
                diff[options._const.name],
                diff[options._const.value]
            );
            break
        case options._const.modifyAttribute:
            if (!node || !node.setAttribute) {
                return false
            }
            node.setAttribute(
                diff[options._const.name],
                diff[options._const.newValue]
            );
            if (
                node.nodeName === "INPUT" &&
                diff[options._const.name] === "value"
            ) {
                node.value = diff[options._const.newValue];
            }
            break
        case options._const.removeAttribute:
            if (!node || !node.removeAttribute) {
                return false
            }
            node.removeAttribute(diff[options._const.name]);
            break
        case options._const.modifyTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            options.textDiff(
                node,
                node.data,
                diff[options._const.oldValue],
                diff[options._const.newValue]
            );
            break
        case options._const.modifyValue:
            if (!node || typeof node.value === "undefined") {
                return false
            }
            node.value = diff[options._const.newValue];
            break
        case options._const.modifyComment:
            if (!node || typeof node.data === "undefined") {
                return false
            }
            options.textDiff(
                node,
                node.data,
                diff[options._const.oldValue],
                diff[options._const.newValue]
            );
            break
        case options._const.modifyChecked:
            if (!node || typeof node.checked === "undefined") {
                return false
            }
            node.checked = diff[options._const.newValue];
            break
        case options._const.modifySelected:
            if (!node || typeof node.selected === "undefined") {
                return false
            }
            node.selected = diff[options._const.newValue];
            break
        case options._const.replaceElement:
            node.parentNode.replaceChild(
                objToNode(
                    diff[options._const.newValue],
                    diff[options._const.newValue].nodeName.toLowerCase() ===
                        "svg",
                    options
                ),
                node
            );
            break
        case options._const.relocateGroup:
            nodeArray = Array(...new Array(diff.groupLength)).map(() =>
                node.removeChild(node.childNodes[diff[options._const.from]])
            );
            nodeArray.forEach((childNode, index) => {
                if (index === 0) {
                    reference = node.childNodes[diff[options._const.to]];
                }
                node.insertBefore(childNode, reference || null);
            });
            break
        case options._const.removeElement:
            node.parentNode.removeChild(node);
            break
        case options._const.addElement:
            route = diff[options._const.route].slice();
            c = route.splice(route.length - 1, 1)[0];
            node = getFromRoute(tree, route);
            node.insertBefore(
                objToNode(
                    diff[options._const.element],
                    node.namespaceURI === "http://www.w3.org/2000/svg",
                    options
                ),
                node.childNodes[c] || null
            );
            break
        case options._const.removeTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            node.parentNode.removeChild(node);
            break
        case options._const.addTextElement:
            route = diff[options._const.route].slice();
            c = route.splice(route.length - 1, 1)[0];
            newNode = options.document.createTextNode(
                diff[options._const.value]
            );
            node = getFromRoute(tree, route);
            if (!node || !node.childNodes) {
                return false
            }
            node.insertBefore(newNode, node.childNodes[c] || null);
            break
        default:
            console.log("unknown action");
    }

    // if a new node was created, we might be interested in its
    // post diff hook
    info.newNode = newNode;
    options.postDiffApply(info);

    return true
}

function applyDOM(tree, diffs, options) {
    return diffs.every((diff) => applyDiff(tree, diff, options))
}

// ===== Undo a diff =====

function swap(obj, p1, p2) {
    const tmp = obj[p1];
    obj[p1] = obj[p2];
    obj[p2] = tmp;
}

function undoDiff(
    tree,
    diff,
    options // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            diff[options._const.action] = options._const.removeAttribute;
            applyDiff(tree, diff, options);
            break
        case options._const.modifyAttribute:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.removeAttribute:
            diff[options._const.action] = options._const.addAttribute;
            applyDiff(tree, diff, options);
            break
        case options._const.modifyTextElement:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.modifyValue:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.modifyComment:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.modifyChecked:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.modifySelected:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.replaceElement:
            swap(diff, options._const.oldValue, options._const.newValue);
            applyDiff(tree, diff, options);
            break
        case options._const.relocateGroup:
            swap(diff, options._const.from, options._const.to);
            applyDiff(tree, diff, options);
            break
        case options._const.removeElement:
            diff[options._const.action] = options._const.addElement;
            applyDiff(tree, diff, options);
            break
        case options._const.addElement:
            diff[options._const.action] = options._const.removeElement;
            applyDiff(tree, diff, options);
            break
        case options._const.removeTextElement:
            diff[options._const.action] = options._const.addTextElement;
            applyDiff(tree, diff, options);
            break
        case options._const.addTextElement:
            diff[options._const.action] = options._const.removeTextElement;
            applyDiff(tree, diff, options);
            break
        default:
            console.log("unknown action");
    }
}

function undoDOM(tree, diffs, options) {
    if (!diffs.length) {
        diffs = [diffs];
    }
    diffs = diffs.slice();
    diffs.reverse();
    diffs.forEach((diff) => {
        undoDiff(tree, diff, options);
    });
}

class Diff {
    constructor(options = {}) {
        Object.entries(options).forEach(([key, value]) => (this[key] = value));
    }

    toString() {
        return JSON.stringify(this)
    }

    setValue(aKey, aValue) {
        this[aKey] = aValue;
        return this
    }
}

function elementDescriptors(el) {
    const output = [];
    output.push(el.nodeName);
    if (el.nodeName !== "#text" && el.nodeName !== "#comment") {
        if (el.attributes) {
            if (el.attributes["class"]) {
                output.push(
                    `${el.nodeName}.${el.attributes["class"].replace(
                        / /g,
                        "."
                    )}`
                );
            }
            if (el.attributes.id) {
                output.push(`${el.nodeName}#${el.attributes.id}`);
            }
        }
    }
    return output
}

function findUniqueDescriptors(li) {
    const uniqueDescriptors = {};
    const duplicateDescriptors = {};

    li.forEach((node) => {
        elementDescriptors(node).forEach((descriptor) => {
            const inUnique = descriptor in uniqueDescriptors;
            const inDupes = descriptor in duplicateDescriptors;
            if (!inUnique && !inDupes) {
                uniqueDescriptors[descriptor] = true;
            } else if (inUnique) {
                delete uniqueDescriptors[descriptor];
                duplicateDescriptors[descriptor] = true;
            }
        });
    });

    return uniqueDescriptors
}

function uniqueInBoth(l1, l2) {
    const l1Unique = findUniqueDescriptors(l1);
    const l2Unique = findUniqueDescriptors(l2);
    const inBoth = {};

    Object.keys(l1Unique).forEach((key) => {
        if (l2Unique[key]) {
            inBoth[key] = true;
        }
    });

    return inBoth
}

function removeDone(tree) {
    delete tree.outerDone;
    delete tree.innerDone;
    delete tree.valueDone;
    if (tree.childNodes) {
        return tree.childNodes.every(removeDone)
    } else {
        return true
    }
}

function isEqual(e1, e2) {
    if (
        !["nodeName", "value", "checked", "selected", "data"].every(
            (element) => {
                if (e1[element] !== e2[element]) {
                    return false
                }
                return true
            }
        )
    ) {
        return false
    }

    if (Boolean(e1.attributes) !== Boolean(e2.attributes)) {
        return false
    }

    if (Boolean(e1.childNodes) !== Boolean(e2.childNodes)) {
        return false
    }
    if (e1.attributes) {
        const e1Attributes = Object.keys(e1.attributes);
        const e2Attributes = Object.keys(e2.attributes);

        if (e1Attributes.length !== e2Attributes.length) {
            return false
        }
        if (
            !e1Attributes.every((attribute) => {
                if (e1.attributes[attribute] !== e2.attributes[attribute]) {
                    return false
                }
                return true
            })
        ) {
            return false
        }
    }
    if (e1.childNodes) {
        if (e1.childNodes.length !== e2.childNodes.length) {
            return false
        }
        if (
            !e1.childNodes.every((childNode, index) =>
                isEqual(childNode, e2.childNodes[index])
            )
        ) {
            return false
        }
    }

    return true
}

function roughlyEqual(
    e1,
    e2,
    uniqueDescriptors,
    sameSiblings,
    preventRecursion
) {
    if (!e1 || !e2) {
        return false
    }

    if (e1.nodeName !== e2.nodeName) {
        return false
    }

    if (e1.nodeName === "#text") {
        // Note that we initially don't care what the text content of a node is,
        // the mere fact that it's the same tag and "has text" means it's roughly
        // equal, and then we can find out the true text difference later.
        return preventRecursion ? true : e1.data === e2.data
    }

    if (e1.nodeName in uniqueDescriptors) {
        return true
    }

    if (e1.attributes && e2.attributes) {
        if (e1.attributes.id) {
            if (e1.attributes.id !== e2.attributes.id) {
                return false
            } else {
                const idDescriptor = `${e1.nodeName}#${e1.attributes.id}`;
                if (idDescriptor in uniqueDescriptors) {
                    return true
                }
            }
        }
        if (
            e1.attributes["class"] &&
            e1.attributes["class"] === e2.attributes["class"]
        ) {
            const classDescriptor = `${e1.nodeName}.${e1.attributes[
                "class"
            ].replace(/ /g, ".")}`;
            if (classDescriptor in uniqueDescriptors) {
                return true
            }
        }
    }

    if (sameSiblings) {
        return true
    }

    const nodeList1 = e1.childNodes ? e1.childNodes.slice().reverse() : [];
    const nodeList2 = e2.childNodes ? e2.childNodes.slice().reverse() : [];

    if (nodeList1.length !== nodeList2.length) {
        return false
    }

    if (preventRecursion) {
        return nodeList1.every(
            (element, index) => element.nodeName === nodeList2[index].nodeName
        )
    } else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        // was not set, we must explicitly force it to true for child iterations.
        const childUniqueDescriptors = uniqueInBoth(nodeList1, nodeList2);
        return nodeList1.every((element, index) =>
            roughlyEqual(
                element,
                nodeList2[index],
                childUniqueDescriptors,
                true,
                true
            )
        )
    }
}

function cloneObj(obj) {
    //  TODO: Do we really need to clone here? Is it not enough to just return the original object?
    return JSON.parse(JSON.stringify(obj))
}
/**
 * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
 */
function findCommonSubsets(c1, c2, marked1, marked2) {
    let lcsSize = 0;
    let index = [];
    const c1Length = c1.length;
    const c2Length = c2.length;

    const // set up the matching table
        matches = Array(...new Array(c1Length + 1)).map(() => []);

    const uniqueDescriptors = uniqueInBoth(c1, c2);

    let // If all of the elements are the same tag, id and class, then we can
        // consider them roughly the same even if they have a different number of
        // children. This will reduce removing and re-adding similar elements.
        subsetsSame = c1Length === c2Length;

    if (subsetsSame) {
        c1.some((element, i) => {
            const c1Desc = elementDescriptors(element);
            const c2Desc = elementDescriptors(c2[i]);
            if (c1Desc.length !== c2Desc.length) {
                subsetsSame = false;
                return true
            }
            c1Desc.some((description, i) => {
                if (description !== c2Desc[i]) {
                    subsetsSame = false;
                    return true
                }
            });
            if (!subsetsSame) {
                return true
            }
        });
    }

    // fill the matches with distance values
    for (let c1Index = 0; c1Index < c1Length; c1Index++) {
        const c1Element = c1[c1Index];
        for (let c2Index = 0; c2Index < c2Length; c2Index++) {
            const c2Element = c2[c2Index];
            if (
                !marked1[c1Index] &&
                !marked2[c2Index] &&
                roughlyEqual(
                    c1Element,
                    c2Element,
                    uniqueDescriptors,
                    subsetsSame
                )
            ) {
                matches[c1Index + 1][c2Index + 1] = matches[c1Index][c2Index]
                    ? matches[c1Index][c2Index] + 1
                    : 1;
                if (matches[c1Index + 1][c2Index + 1] >= lcsSize) {
                    lcsSize = matches[c1Index + 1][c2Index + 1];
                    index = [c1Index + 1, c2Index + 1];
                }
            } else {
                matches[c1Index + 1][c2Index + 1] = 0;
            }
        }
    }

    if (lcsSize === 0) {
        return false
    }

    return {
        oldValue: index[0] - lcsSize,
        newValue: index[1] - lcsSize,
        length: lcsSize,
    }
}

/**
 * This should really be a predefined function in Array...
 */
function makeArray(n, v) {
    return Array(...new Array(n)).map(() => v)
}

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
function getGapInformation(t1, t2, stable) {
    const gaps1 = t1.childNodes ? makeArray(t1.childNodes.length, true) : [];
    const gaps2 = t2.childNodes ? makeArray(t2.childNodes.length, true) : [];
    let group = 0;

    // give elements from the same subset the same group number
    stable.forEach((subset) => {
        const endOld = subset.oldValue + subset.length;
        const endNew = subset.newValue + subset.length;

        for (let j = subset.oldValue; j < endOld; j += 1) {
            gaps1[j] = group;
        }
        for (let j = subset.newValue; j < endNew; j += 1) {
            gaps2[j] = group;
        }
        group += 1;
    });

    return {
        gaps1,
        gaps2,
    }
}

/**
 * Find all matching subsets, based on immediate child differences only.
 */
function markSubTrees(oldTree, newTree) {
    // note: the child lists are views, and so update as we update old/newTree
    const oldChildren = oldTree.childNodes ? oldTree.childNodes : [];

    const newChildren = newTree.childNodes ? newTree.childNodes : [];
    const marked1 = makeArray(oldChildren.length, false);
    const marked2 = makeArray(newChildren.length, false);
    const subsets = [];
    let subset = true;

    const returnIndex = function () {
        return arguments[1]
    };

    const markBoth = (i) => {
        marked1[subset.oldValue + i] = true;
        marked2[subset.newValue + i] = true;
    };

    while (subset) {
        subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
        if (subset) {
            subsets.push(subset);
            const subsetArray = Array(...new Array(subset.length)).map(
                returnIndex
            );
            subsetArray.forEach((item) => markBoth(item));
        }
    }

    oldTree.subsets = subsets;
    oldTree.subsetsAge = 100;
    return subsets
}

class DiffTracker {
    constructor() {
        this.list = [];
    }

    add(diffs) {
        this.list.push(...diffs);
    }
    forEach(fn) {
        this.list.forEach((li) => fn(li));
    }
}

// ===== Apply a virtual diff =====

function getFromVirtualRoute(tree, route) {
    let node = tree;
    let parentNode;
    let nodeIndex;

    route = route.slice();
    while (route.length > 0) {
        if (!node.childNodes) {
            return false
        }
        nodeIndex = route.splice(0, 1)[0];
        parentNode = node;
        node = node.childNodes[nodeIndex];
    }
    return {
        node,
        parentNode,
        nodeIndex,
    }
}

function applyVirtualDiff(
    tree,
    diff,
    options // {preVirtualDiffApply, postVirtualDiffApply, _const}
) {
    const routeInfo = getFromVirtualRoute(tree, diff[options._const.route]);
    let node = routeInfo.node;
    const parentNode = routeInfo.parentNode;
    const nodeIndex = routeInfo.nodeIndex;
    const newSubsets = [];

    // pre-diff hook
    const info = {
        diff,
        node,
    };

    if (options.preVirtualDiffApply(info)) {
        return true
    }

    let newNode;
    let nodeArray;
    let route;
    let c;
    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            if (!node.attributes) {
                node.attributes = {};
            }

            node.attributes[diff[options._const.name]] =
                diff[options._const.value];

            if (diff[options._const.name] === "checked") {
                node.checked = true;
            } else if (diff[options._const.name] === "selected") {
                node.selected = true;
            } else if (
                node.nodeName === "INPUT" &&
                diff[options._const.name] === "value"
            ) {
                node.value = diff[options._const.value];
            }

            break
        case options._const.modifyAttribute:
            node.attributes[diff[options._const.name]] =
                diff[options._const.newValue];
            break
        case options._const.removeAttribute:
            delete node.attributes[diff[options._const.name]];

            if (Object.keys(node.attributes).length === 0) {
                delete node.attributes;
            }

            if (diff[options._const.name] === "checked") {
                node.checked = false;
            } else if (diff[options._const.name] === "selected") {
                delete node.selected;
            } else if (
                node.nodeName === "INPUT" &&
                diff[options._const.name] === "value"
            ) {
                delete node.value;
            }

            break
        case options._const.modifyTextElement:
            node.data = diff[options._const.newValue];
            break
        case options._const.modifyValue:
            node.value = diff[options._const.newValue];
            break
        case options._const.modifyComment:
            node.data = diff[options._const.newValue];
            break
        case options._const.modifyChecked:
            node.checked = diff[options._const.newValue];
            break
        case options._const.modifySelected:
            node.selected = diff[options._const.newValue];
            break
        case options._const.replaceElement:
            newNode = cloneObj(diff[options._const.newValue]);
            newNode.outerDone = true;
            newNode.innerDone = true;
            newNode.valueDone = true;
            parentNode.childNodes[nodeIndex] = newNode;
            break
        case options._const.relocateGroup:
            nodeArray = node.childNodes
                .splice(diff[options._const.from], diff.groupLength)
                .reverse();
            nodeArray.forEach((movedNode) =>
                node.childNodes.splice(diff[options._const.to], 0, movedNode)
            );
            if (node.subsets) {
                node.subsets.forEach((map) => {
                    if (
                        diff[options._const.from] < diff[options._const.to] &&
                        map.oldValue <= diff[options._const.to] &&
                        map.oldValue > diff[options._const.from]
                    ) {
                        map.oldValue -= diff.groupLength;
                        const splitLength =
                            map.oldValue + map.length - diff[options._const.to];
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue:
                                    diff[options._const.to] + diff.groupLength,
                                newValue:
                                    map.newValue + map.length - splitLength,
                                length: splitLength,
                            });
                            map.length -= splitLength;
                        }
                    } else if (
                        diff[options._const.from] > diff[options._const.to] &&
                        map.oldValue > diff[options._const.to] &&
                        map.oldValue < diff[options._const.from]
                    ) {
                        map.oldValue += diff.groupLength;
                        const splitLength =
                            map.oldValue + map.length - diff[options._const.to];
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue:
                                    diff[options._const.to] + diff.groupLength,
                                newValue:
                                    map.newValue + map.length - splitLength,
                                length: splitLength,
                            });
                            map.length -= splitLength;
                        }
                    } else if (map.oldValue === diff[options._const.from]) {
                        map.oldValue = diff[options._const.to];
                    }
                });
            }

            break
        case options._const.removeElement:
            parentNode.childNodes.splice(nodeIndex, 1);
            if (parentNode.subsets) {
                parentNode.subsets.forEach((map) => {
                    if (map.oldValue > nodeIndex) {
                        map.oldValue -= 1;
                    } else if (map.oldValue === nodeIndex) {
                        map.delete = true;
                    } else if (
                        map.oldValue < nodeIndex &&
                        map.oldValue + map.length > nodeIndex
                    ) {
                        if (map.oldValue + map.length - 1 === nodeIndex) {
                            map.length--;
                        } else {
                            newSubsets.push({
                                newValue:
                                    map.newValue + nodeIndex - map.oldValue,
                                oldValue: nodeIndex,
                                length:
                                    map.length - nodeIndex + map.oldValue - 1,
                            });
                            map.length = nodeIndex - map.oldValue;
                        }
                    }
                });
            }
            node = parentNode;
            break
        case options._const.addElement:
            route = diff[options._const.route].slice();
            c = route.splice(route.length - 1, 1)[0];
            node = getFromVirtualRoute(tree, route).node;
            newNode = cloneObj(diff[options._const.element]);
            newNode.outerDone = true;
            newNode.innerDone = true;
            newNode.valueDone = true;

            if (!node.childNodes) {
                node.childNodes = [];
            }

            if (c >= node.childNodes.length) {
                node.childNodes.push(newNode);
            } else {
                node.childNodes.splice(c, 0, newNode);
            }
            if (node.subsets) {
                node.subsets.forEach((map) => {
                    if (map.oldValue >= c) {
                        map.oldValue += 1;
                    } else if (
                        map.oldValue < c &&
                        map.oldValue + map.length > c
                    ) {
                        const splitLength = map.oldValue + map.length - c;
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c + 1,
                            length: splitLength,
                        });
                        map.length -= splitLength;
                    }
                });
            }
            break
        case options._const.removeTextElement:
            parentNode.childNodes.splice(nodeIndex, 1);
            if (parentNode.nodeName === "TEXTAREA") {
                delete parentNode.value;
            }
            if (parentNode.subsets) {
                parentNode.subsets.forEach((map) => {
                    if (map.oldValue > nodeIndex) {
                        map.oldValue -= 1;
                    } else if (map.oldValue === nodeIndex) {
                        map.delete = true;
                    } else if (
                        map.oldValue < nodeIndex &&
                        map.oldValue + map.length > nodeIndex
                    ) {
                        if (map.oldValue + map.length - 1 === nodeIndex) {
                            map.length--;
                        } else {
                            newSubsets.push({
                                newValue:
                                    map.newValue + nodeIndex - map.oldValue,
                                oldValue: nodeIndex,
                                length:
                                    map.length - nodeIndex + map.oldValue - 1,
                            });
                            map.length = nodeIndex - map.oldValue;
                        }
                    }
                });
            }
            node = parentNode;
            break
        case options._const.addTextElement:
            route = diff[options._const.route].slice();
            c = route.splice(route.length - 1, 1)[0];
            newNode = {};
            newNode.nodeName = "#text";
            newNode.data = diff[options._const.value];
            node = getFromVirtualRoute(tree, route).node;
            if (!node.childNodes) {
                node.childNodes = [];
            }

            if (c >= node.childNodes.length) {
                node.childNodes.push(newNode);
            } else {
                node.childNodes.splice(c, 0, newNode);
            }
            if (node.nodeName === "TEXTAREA") {
                node.value = diff[options._const.newValue];
            }
            if (node.subsets) {
                node.subsets.forEach((map) => {
                    if (map.oldValue >= c) {
                        map.oldValue += 1;
                    }
                    if (map.oldValue < c && map.oldValue + map.length > c) {
                        const splitLength = map.oldValue + map.length - c;
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c + 1,
                            length: splitLength,
                        });
                        map.length -= splitLength;
                    }
                });
            }
            break
        default:
            console.log("unknown action");
    }

    if (node.subsets) {
        node.subsets = node.subsets.filter(
            (map) => !map.delete && map.oldValue !== map.newValue
        );
        if (newSubsets.length) {
            node.subsets = node.subsets.concat(newSubsets);
        }
    }

    // capture newNode for the callback
    info.newNode = newNode;
    options.postVirtualDiffApply(info);

    return
}

function applyVirtual(tree, diffs, options) {
    diffs.forEach((diff) => {
        applyVirtualDiff(tree, diff, options);
    });
    return true
}

function nodeToObj(aNode, options = {}) {
    const objNode = {};
    objNode.nodeName = aNode.nodeName;
    if (objNode.nodeName === "#text" || objNode.nodeName === "#comment") {
        objNode.data = aNode.data;
    } else {
        if (aNode.attributes && aNode.attributes.length > 0) {
            objNode.attributes = {};
            const nodeArray = Array.prototype.slice.call(aNode.attributes);
            nodeArray.forEach(
                (attribute) =>
                    (objNode.attributes[attribute.name] = attribute.value)
            );
        }
        if (objNode.nodeName === "TEXTAREA") {
            objNode.value = aNode.value;
        } else if (aNode.childNodes && aNode.childNodes.length > 0) {
            objNode.childNodes = [];
            const nodeArray = Array.prototype.slice.call(aNode.childNodes);
            nodeArray.forEach((childNode) =>
                objNode.childNodes.push(nodeToObj(childNode, options))
            );
        }
        if (options.valueDiffing) {
            if (
                aNode.checked !== undefined &&
                aNode.type &&
                ["radio", "checkbox"].includes(aNode.type.toLowerCase())
            ) {
                objNode.checked = aNode.checked;
            } else if (aNode.value !== undefined) {
                objNode.value = aNode.value;
            }
            if (aNode.selected !== undefined) {
                objNode.selected = aNode.selected;
            }
        }
    }
    return objNode
}

// from html-parse-stringify (MIT)

const tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g;

// re-used obj for quick lookups of components
const empty = Object.create ? Object.create(null) : {};
const attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;

function unescape(string) {
    return string
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
}

// create optimized lookup object for
// void elements as listed here:
// http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
const lookup = {
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
    wbr: true,
};

function parseTag(tag) {
    const res = {
        nodeName: "",
        attributes: {},
    };

    let tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);
    if (tagMatch) {
        res.nodeName = tagMatch[1].toUpperCase();
        if (lookup[tagMatch[1]] || tag.charAt(tag.length - 2) === "/") {
            res.voidElement = true;
        }

        // handle comment tag
        if (res.nodeName.startsWith("!--")) {
            const endIndex = tag.indexOf("-->");
            return {
                type: "comment",
                data: endIndex !== -1 ? tag.slice(4, endIndex) : "",
            }
        }
    }

    let reg = new RegExp(attrRE);
    let result = null;
    let done = false;
    while (!done) {
        result = reg.exec(tag);

        if (result === null) {
            done = true;
        } else if (result[0].trim()) {
            if (result[1]) {
                let attr = result[1].trim();
                let arr = [attr, ""];

                if (attr.indexOf("=") > -1) arr = attr.split("=");

                res.attributes[arr[0]] = arr[1];
                reg.lastIndex--;
            } else if (result[2])
                res.attributes[result[2]] = result[3]
                    .trim()
                    .substring(1, result[3].length - 1);
        }
    }

    return res
}

function parse(html, options = { components: empty }) {
    const result = [];
    let current;
    let level = -1;
    const arr = [];
    let inComponent = false;

    // handle text at top level
    if (html.indexOf("<") !== 0) {
        const end = html.indexOf("<");
        result.push({
            nodeName: "#text",
            data: end === -1 ? html : html.substring(0, end),
        });
    }

    html.replace(tagRE, (tag, index) => {
        if (inComponent) {
            if (tag !== `</${current.nodeName}>`) {
                return
            } else {
                inComponent = false;
            }
        }
        const isOpen = tag.charAt(1) !== "/";
        const isComment = tag.startsWith("<!--");
        const start = index + tag.length;
        const nextChar = html.charAt(start);
        let parent;

        if (isComment) {
            const comment = parseTag(tag);

            // if we're at root, push new base node
            if (level < 0) {
                result.push(comment);
                return result
            }
            parent = arr[level];
            if (parent) {
                if (!parent.childNodes) {
                    parent.childNodes = [];
                }
                parent.childNodes.push(comment);
            }

            return result
        }

        if (isOpen) {
            current = parseTag(tag);
            level++;
            if (
                current.type === "tag" &&
                options.components[current.nodeName]
            ) {
                current.type = "component";
                inComponent = true;
            }

            if (
                !current.voidElement &&
                !inComponent &&
                nextChar &&
                nextChar !== "<"
            ) {
                if (!current.childNodes) {
                    current.childNodes = [];
                }
                current.childNodes.push({
                    nodeName: "#text",
                    data: unescape(html.slice(start, html.indexOf("<", start))),
                });
            }

            // if we're at root, push new base node
            if (level === 0) {
                result.push(current);
            }

            parent = arr[level - 1];

            if (parent) {
                if (!parent.childNodes) {
                    parent.childNodes = [];
                }
                parent.childNodes.push(current);
            }

            arr[level] = current;
        }

        if (!isOpen || current.voidElement) {
            if (
                level > -1 &&
                (current.voidElement ||
                    current.nodeName === tag.slice(2, -1).toUpperCase())
            ) {
                level--;
                // move current up a level to match the end tag
                current = level === -1 ? result : arr[level];
            }
            if (!inComponent && nextChar !== "<" && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                parent = level === -1 ? result : arr[level].childNodes || [];

                // calculate correct end of the data slice in case there's
                // no tag after the text node.
                const end = html.indexOf("<", start);
                let data = unescape(
                    html.slice(start, end === -1 ? undefined : end)
                );
                parent.push({
                    nodeName: "#text",
                    data,
                });
            }
        }
    });

    return result[0]
}

function cleanObj(obj) {
    delete obj.voidElement;
    if (obj.childNodes) {
        obj.childNodes.forEach((child) => cleanObj(child));
    }
    return obj
}

function stringToObj(string) {
    return cleanObj(parse(string))
}

// ===== Create a diff =====

class DiffFinder {
    constructor(t1Node, t2Node, options) {
        this.options = options;
        this.t1 =
            typeof HTMLElement !== "undefined" && t1Node instanceof HTMLElement
                ? nodeToObj(t1Node, this.options)
                : typeof t1Node === "string"
                ? stringToObj(t1Node, this.options)
                : JSON.parse(JSON.stringify(t1Node));
        this.t2 =
            typeof HTMLElement !== "undefined" && t2Node instanceof HTMLElement
                ? nodeToObj(t2Node, this.options)
                : typeof t2Node === "string"
                ? stringToObj(t2Node, this.options)
                : JSON.parse(JSON.stringify(t2Node));
        this.diffcount = 0;
        this.foundAll = false;
        if (this.debug) {
            this.t1Orig = nodeToObj(t1Node, this.options);
            this.t2Orig = nodeToObj(t2Node, this.options);
        }

        this.tracker = new DiffTracker();
    }

    init() {
        return this.findDiffs(this.t1, this.t2)
    }

    findDiffs(t1, t2) {
        let diffs;
        do {
            if (this.options.debug) {
                this.diffcount += 1;
                if (this.diffcount > this.options.diffcap) {
                    throw new Error(
                        `surpassed diffcap:${JSON.stringify(
                            this.t1Orig
                        )} -> ${JSON.stringify(this.t2Orig)}`
                    )
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
                    } else {
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
        } while (diffs.length > 0)

        return this.tracker.list
    }

    findNextDiff(t1, t2, route) {
        let diffs;
        let fdiffs;

        if (this.options.maxDepth && route.length > this.options.maxDepth) {
            return []
        }
        // outer differences?
        if (!t1.outerDone) {
            diffs = this.findOuterDiff(t1, t2, route);
            if (this.options.filterOuterDiff) {
                fdiffs = this.options.filterOuterDiff(t1, t2, diffs);
                if (fdiffs) diffs = fdiffs;
            }
            if (diffs.length > 0) {
                t1.outerDone = true;
                return diffs
            } else {
                t1.outerDone = true;
            }
        }
        // inner differences?
        if (!t1.innerDone) {
            diffs = this.findInnerDiff(t1, t2, route);
            if (diffs.length > 0) {
                return diffs
            } else {
                t1.innerDone = true;
            }
        }

        if (this.options.valueDiffing && !t1.valueDone) {
            // value differences?
            diffs = this.findValueDiff(t1, t2, route);

            if (diffs.length > 0) {
                t1.valueDone = true;
                return diffs
            } else {
                t1.valueDone = true;
            }
        }

        // no differences
        return []
    }

    findOuterDiff(t1, t2, route) {
        const diffs = [];
        let attr;
        let attr1;
        let attr2;
        let attrLength;
        let pos;
        let i;
        if (t1.nodeName !== t2.nodeName) {
            if (!route.length) {
                throw new Error("Top level nodes have to be of the same kind.")
            }
            return [
                new Diff()
                    .setValue(
                        this.options._const.action,
                        this.options._const.replaceElement
                    )
                    .setValue(this.options._const.oldValue, cloneObj(t1))
                    .setValue(this.options._const.newValue, cloneObj(t2))
                    .setValue(this.options._const.route, route),
            ]
        }
        if (
            route.length &&
            this.options.maxNodeDiffCount <
                Math.abs(
                    (t1.childNodes || []).length - (t2.childNodes || []).length
                )
        ) {
            return [
                new Diff()
                    .setValue(
                        this.options._const.action,
                        this.options._const.replaceElement
                    )
                    .setValue(this.options._const.oldValue, cloneObj(t1))
                    .setValue(this.options._const.newValue, cloneObj(t2))
                    .setValue(this.options._const.route, route),
            ]
        }

        if (t1.data !== t2.data) {
            // Comment or text node.
            if (t1.nodeName === "#text") {
                return [
                    new Diff()
                        .setValue(
                            this.options._const.action,
                            this.options._const.modifyTextElement
                        )
                        .setValue(this.options._const.route, route)
                        .setValue(this.options._const.oldValue, t1.data)
                        .setValue(this.options._const.newValue, t2.data),
                ]
            } else {
                return [
                    new Diff()
                        .setValue(
                            this.options._const.action,
                            this.options._const.modifyComment
                        )
                        .setValue(this.options._const.route, route)
                        .setValue(this.options._const.oldValue, t1.data)
                        .setValue(this.options._const.newValue, t2.data),
                ]
            }
        }

        attr1 = t1.attributes ? Object.keys(t1.attributes).sort() : [];
        attr2 = t2.attributes ? Object.keys(t2.attributes).sort() : [];

        attrLength = attr1.length;
        for (i = 0; i < attrLength; i++) {
            attr = attr1[i];
            pos = attr2.indexOf(attr);
            if (pos === -1) {
                diffs.push(
                    new Diff()
                        .setValue(
                            this.options._const.action,
                            this.options._const.removeAttribute
                        )
                        .setValue(this.options._const.route, route)
                        .setValue(this.options._const.name, attr)
                        .setValue(
                            this.options._const.value,
                            t1.attributes[attr]
                        )
                );
            } else {
                attr2.splice(pos, 1);
                if (t1.attributes[attr] !== t2.attributes[attr]) {
                    diffs.push(
                        new Diff()
                            .setValue(
                                this.options._const.action,
                                this.options._const.modifyAttribute
                            )
                            .setValue(this.options._const.route, route)
                            .setValue(this.options._const.name, attr)
                            .setValue(
                                this.options._const.oldValue,
                                t1.attributes[attr]
                            )
                            .setValue(
                                this.options._const.newValue,
                                t2.attributes[attr]
                            )
                    );
                }
            }
        }

        attrLength = attr2.length;
        for (i = 0; i < attrLength; i++) {
            attr = attr2[i];
            diffs.push(
                new Diff()
                    .setValue(
                        this.options._const.action,
                        this.options._const.addAttribute
                    )
                    .setValue(this.options._const.route, route)
                    .setValue(this.options._const.name, attr)
                    .setValue(this.options._const.value, t2.attributes[attr])
            );
        }

        return diffs
    }

    findInnerDiff(t1, t2, route) {
        const t1ChildNodes = t1.childNodes ? t1.childNodes.slice() : [];
        const t2ChildNodes = t2.childNodes ? t2.childNodes.slice() : [];
        const last = Math.max(t1ChildNodes.length, t2ChildNodes.length);
        let childNodesLengthDifference = Math.abs(
            t1ChildNodes.length - t2ChildNodes.length
        );
        let diffs = [];
        let index = 0;
        if (!this.options.maxChildCount || last < this.options.maxChildCount) {
            const cachedSubtrees = t1.subsets && t1.subsetsAge--;
            const subtrees = cachedSubtrees
                ? t1.subsets
                : t1.childNodes && t2.childNodes
                ? markSubTrees(t1, t2)
                : [];
            if (subtrees.length > 0) {
                /* One or more groups have been identified among the childnodes of t1
                 * and t2.
                 */
                diffs = this.attemptGroupRelocation(
                    t1,
                    t2,
                    subtrees,
                    route,
                    cachedSubtrees
                );
                if (diffs.length > 0) {
                    return diffs
                }
            }
        }

        /* 0 or 1 groups of similar child nodes have been found
         * for t1 and t2. 1 If there is 1, it could be a sign that the
         * contents are the same. When the number of groups is below 2,
         * t1 and t2 are made to have the same length and each of the
         * pairs of child nodes are diffed.
         */

        for (let i = 0; i < last; i += 1) {
            const e1 = t1ChildNodes[i];
            const e2 = t2ChildNodes[i];

            if (childNodesLengthDifference) {
                /* t1 and t2 have different amounts of childNodes. Add
                 * and remove as necessary to obtain the same length */
                if (e1 && !e2) {
                    if (e1.nodeName === "#text") {
                        diffs.push(
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.removeTextElement
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index)
                                )
                                .setValue(this.options._const.value, e1.data)
                        );
                        index -= 1;
                    } else {
                        diffs.push(
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.removeElement
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index)
                                )
                                .setValue(
                                    this.options._const.element,
                                    cloneObj(e1)
                                )
                        );
                        index -= 1;
                    }
                } else if (e2 && !e1) {
                    if (e2.nodeName === "#text") {
                        diffs.push(
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.addTextElement
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index)
                                )
                                .setValue(this.options._const.value, e2.data)
                        );
                    } else {
                        diffs.push(
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.addElement
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index)
                                )
                                .setValue(
                                    this.options._const.element,
                                    cloneObj(e2)
                                )
                        );
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
                if (
                    !this.options.maxChildCount ||
                    last < this.options.maxChildCount
                ) {
                    diffs = diffs.concat(
                        this.findNextDiff(e1, e2, route.concat(index))
                    );
                } else if (!isEqual(e1, e2)) {
                    if (t1ChildNodes.length > t2ChildNodes.length) {
                        if (e1.nodeName === "#text") {
                            diffs.push(
                                new Diff()
                                    .setValue(
                                        this.options._const.action,
                                        this.options._const.removeTextElement
                                    )
                                    .setValue(
                                        this.options._const.route,
                                        route.concat(index)
                                    )
                                    .setValue(
                                        this.options._const.value,
                                        e1.data
                                    )
                            );
                        } else {
                            diffs.push(
                                new Diff()
                                    .setValue(
                                        this.options._const.action,
                                        this.options._const.removeElement
                                    )
                                    .setValue(
                                        this.options._const.element,
                                        cloneObj(e1)
                                    )
                                    .setValue(
                                        this.options._const.route,
                                        route.concat(index)
                                    )
                            );
                        }
                        t1ChildNodes.splice(i, 1);
                        i -= 1;
                        index -= 1;

                        childNodesLengthDifference -= 1;
                    } else if (t1ChildNodes.length < t2ChildNodes.length) {
                        diffs = diffs.concat([
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.addElement
                                )
                                .setValue(
                                    this.options._const.element,
                                    cloneObj(e2)
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index)
                                ),
                        ]);
                        t1ChildNodes.splice(i, 0, {});
                        childNodesLengthDifference -= 1;
                    } else {
                        diffs = diffs.concat([
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.replaceElement
                                )
                                .setValue(
                                    this.options._const.oldValue,
                                    cloneObj(e1)
                                )
                                .setValue(
                                    this.options._const.newValue,
                                    cloneObj(e2)
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index)
                                ),
                        ]);
                    }
                }
            }
            index += 1;
        }
        t1.innerDone = true;
        return diffs
    }

    attemptGroupRelocation(t1, t2, subtrees, route, cachedSubtrees) {
        /* Either t1.childNodes and t2.childNodes have the same length, or
         * there are at least two groups of similar elements can be found.
         * attempts are made at equalizing t1 with t2. First all initial
         * elements with no group affiliation (gaps=true) are removed (if
         * only in t1) or added (if only in t2). Then the creation of a group
         * relocation diff is attempted.
         */
        const gapInformation = getGapInformation(t1, t2, subtrees);
        const gaps1 = gapInformation.gaps1;
        const gaps2 = gapInformation.gaps2;
        let shortest = Math.min(gaps1.length, gaps2.length);
        let destinationDifferent;
        let toGroup;
        let group;
        let node;
        let similarNode;
        let testI;
        const diffs = [];

        for (
            let index2 = 0, index1 = 0;
            index2 < shortest;
            index1 += 1, index2 += 1
        ) {
            if (
                cachedSubtrees &&
                (gaps1[index2] === true || gaps2[index2] === true)
            ) ; else if (gaps1[index2] === true) {
                node = t1.childNodes[index1];
                if (node.nodeName === "#text") {
                    if (t2.childNodes[index2].nodeName === "#text") {
                        if (node.data !== t2.childNodes[index2].data) {
                            testI = index1;
                            while (
                                t1.childNodes.length > testI + 1 &&
                                t1.childNodes[testI + 1].nodeName === "#text"
                            ) {
                                testI += 1;
                                if (
                                    t2.childNodes[index2].data ===
                                    t1.childNodes[testI].data
                                ) {
                                    similarNode = true;
                                    break
                                }
                            }
                            if (!similarNode) {
                                diffs.push(
                                    new Diff()
                                        .setValue(
                                            this.options._const.action,
                                            this.options._const
                                                .modifyTextElement
                                        )
                                        .setValue(
                                            this.options._const.route,
                                            route.concat(index2)
                                        )
                                        .setValue(
                                            this.options._const.oldValue,
                                            node.data
                                        )
                                        .setValue(
                                            this.options._const.newValue,
                                            t2.childNodes[index2].data
                                        )
                                );
                                return diffs
                            }
                        }
                    } else {
                        diffs.push(
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.removeTextElement
                                )
                                .setValue(
                                    this.options._const.route,
                                    route.concat(index2)
                                )
                                .setValue(this.options._const.value, node.data)
                        );
                        gaps1.splice(index2, 1);
                        shortest = Math.min(gaps1.length, gaps2.length);
                        index2 -= 1;
                    }
                } else {
                    diffs.push(
                        new Diff()
                            .setValue(
                                this.options._const.action,
                                this.options._const.removeElement
                            )
                            .setValue(
                                this.options._const.route,
                                route.concat(index2)
                            )
                            .setValue(
                                this.options._const.element,
                                cloneObj(node)
                            )
                    );
                    gaps1.splice(index2, 1);
                    shortest = Math.min(gaps1.length, gaps2.length);
                    index2 -= 1;
                }
            } else if (gaps2[index2] === true) {
                node = t2.childNodes[index2];
                if (node.nodeName === "#text") {
                    diffs.push(
                        new Diff()
                            .setValue(
                                this.options._const.action,
                                this.options._const.addTextElement
                            )
                            .setValue(
                                this.options._const.route,
                                route.concat(index2)
                            )
                            .setValue(this.options._const.value, node.data)
                    );
                    gaps1.splice(index2, 0, true);
                    shortest = Math.min(gaps1.length, gaps2.length);
                    index1 -= 1;
                } else {
                    diffs.push(
                        new Diff()
                            .setValue(
                                this.options._const.action,
                                this.options._const.addElement
                            )
                            .setValue(
                                this.options._const.route,
                                route.concat(index2)
                            )
                            .setValue(
                                this.options._const.element,
                                cloneObj(node)
                            )
                    );
                    gaps1.splice(index2, 0, true);
                    shortest = Math.min(gaps1.length, gaps2.length);
                    index1 -= 1;
                }
            } else if (gaps1[index2] !== gaps2[index2]) {
                if (diffs.length > 0) {
                    return diffs
                }
                // group relocation
                group = subtrees[gaps1[index2]];
                toGroup = Math.min(
                    group.newValue,
                    t1.childNodes.length - group.length
                );
                if (toGroup !== group.oldValue) {
                    // Check whether destination nodes are different than originating ones.
                    destinationDifferent = false;
                    for (let j = 0; j < group.length; j += 1) {
                        if (
                            !roughlyEqual(
                                t1.childNodes[toGroup + j],
                                t1.childNodes[group.oldValue + j],
                                [],
                                false,
                                true
                            )
                        ) {
                            destinationDifferent = true;
                        }
                    }
                    if (destinationDifferent) {
                        return [
                            new Diff()
                                .setValue(
                                    this.options._const.action,
                                    this.options._const.relocateGroup
                                )
                                .setValue("groupLength", group.length)
                                .setValue(
                                    this.options._const.from,
                                    group.oldValue
                                )
                                .setValue(this.options._const.to, toGroup)
                                .setValue(this.options._const.route, route),
                        ]
                    }
                }
            }
        }
        return diffs
    }

    findValueDiff(t1, t2, route) {
        // Differences of value. Only useful if the value/selection/checked value
        // differs from what is represented in the DOM. For example in the case
        // of filled out forms, etc.
        const diffs = [];

        if (t1.selected !== t2.selected) {
            diffs.push(
                new Diff()
                    .setValue(
                        this.options._const.action,
                        this.options._const.modifySelected
                    )
                    .setValue(this.options._const.oldValue, t1.selected)
                    .setValue(this.options._const.newValue, t2.selected)
                    .setValue(this.options._const.route, route)
            );
        }

        if (
            (t1.value || t2.value) &&
            t1.value !== t2.value &&
            t1.nodeName !== "OPTION"
        ) {
            diffs.push(
                new Diff()
                    .setValue(
                        this.options._const.action,
                        this.options._const.modifyValue
                    )
                    .setValue(this.options._const.oldValue, t1.value || "")
                    .setValue(this.options._const.newValue, t2.value || "")
                    .setValue(this.options._const.route, route)
            );
        }
        if (t1.checked !== t2.checked) {
            diffs.push(
                new Diff()
                    .setValue(
                        this.options._const.action,
                        this.options._const.modifyChecked
                    )
                    .setValue(this.options._const.oldValue, t1.checked)
                    .setValue(this.options._const.newValue, t2.checked)
                    .setValue(this.options._const.route, route)
            );
        }

        return diffs
    }
}

const DEFAULT_OPTIONS = {
    debug: false,
    diffcap: 10, // Limit for how many diffs are accepting when debugging. Inactive when debug is false.
    maxDepth: false, // False or a numeral. If set to a numeral, limits the level of depth that the the diff mechanism looks for differences. If false, goes through the entire tree.
    maxChildCount: 50, // False or a numeral. If set to a numeral, only does a simplified form of diffing of contents so that the number of diffs cannot be higher than the number of child nodes.
    valueDiffing: true, // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
    // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
    textDiff(node, currentValue, expectedValue, newValue) {
        node.data = newValue;
        return
    },
    // empty functions were benchmarked as running faster than both
    // `f && f()` and `if (f) { f(); }`
    preVirtualDiffApply() {},
    postVirtualDiffApply() {},
    preDiffApply() {},
    postDiffApply() {},
    filterOuterDiff: null,
    compress: false, // Whether to work with compressed diffs
    _const: false, // object with strings for every change types to be used in diffs.
    document:
        typeof window !== "undefined" && window.document
            ? window.document
            : false,
};

class DiffDOM {
    constructor(options = {}) {
        this.options = options;
        // IE11 doesn't have Object.assign and buble doesn't translate object spreaders
        // by default, so this is the safest way of doing it currently.
        Object.entries(DEFAULT_OPTIONS).forEach(([key, value]) => {
            if (!Object.prototype.hasOwnProperty.call(this.options, key)) {
                this.options[key] = value;
            }
        });

        if (!this.options._const) {
            const varNames = [
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
                "from",
                "to",
                "name",
                "value",
                "data",
                "attributes",
                "nodeName",
                "childNodes",
                "checked",
                "selected",
            ];
            this.options._const = {};
            if (this.options.compress) {
                varNames.forEach(
                    (varName, index) => (this.options._const[varName] = index)
                );
            } else {
                varNames.forEach(
                    (varName) => (this.options._const[varName] = varName)
                );
            }
        }

        this.DiffFinder = DiffFinder;
    }

    apply(tree, diffs) {
        return applyDOM(tree, diffs, this.options)
    }

    undo(tree, diffs) {
        return undoDOM(tree, diffs, this.options)
    }

    diff(t1Node, t2Node) {
        const finder = new this.DiffFinder(t1Node, t2Node, this.options);
        return finder.init()
    }
}

var headingsToVirtualHeaderRowDOM = function (headings, columnSettings, columnWidths, _a, _b) {
    var classes = _a.classes, hiddenHeader = _a.hiddenHeader, sortable = _a.sortable, scrollY = _a.scrollY;
    var noColumnWidths = _b.noColumnWidths, unhideHeader = _b.unhideHeader;
    return ({
        nodeName: "TR",
        childNodes: headings.map(function (heading, index) {
            var _a, _b;
            var column = columnSettings.columns[index] || {};
            if (column.hidden) {
                return;
            }
            var attributes = {};
            if (!column.notSortable && sortable) {
                attributes["data-sortable"] = "true";
            }
            if (((_a = columnSettings.sort) === null || _a === void 0 ? void 0 : _a.column) === index) {
                attributes["class"] = columnSettings.sort.dir;
                attributes["aria-sort"] = columnSettings.sort.dir === "asc" ? "ascending" : "descending";
            }
            var style = "";
            if (columnWidths[index] && !noColumnWidths) {
                style += "width: ".concat(columnWidths[index], "%;");
            }
            if (scrollY.length && !unhideHeader) {
                style += "padding-bottom: 0;padding-top: 0;border: 0;";
            }
            if (style.length) {
                attributes.style = style;
            }
            var headerNodes = heading.type === "node" ?
                heading.data :
                [
                    {
                        nodeName: "#text",
                        data: (_b = heading.text) !== null && _b !== void 0 ? _b : String(heading.data)
                    }
                ];
            return {
                nodeName: "TH",
                attributes: attributes,
                childNodes: ((hiddenHeader || scrollY.length) && !unhideHeader) ?
                    [
                        { nodeName: "#text",
                            data: "" }
                    ] :
                    column.notSortable || !sortable ?
                        headerNodes :
                        [
                            {
                                nodeName: "a",
                                attributes: {
                                    href: "#",
                                    "class": classes.sorter
                                },
                                childNodes: headerNodes
                            }
                        ]
            };
        }).filter(function (column) { return column; })
    });
};
var dataToVirtualDOM = function (id, headings, rows, columnSettings, columnWidths, rowCursor, _a, _b) {
    var classes = _a.classes, hiddenHeader = _a.hiddenHeader, header = _a.header, footer = _a.footer, sortable = _a.sortable, scrollY = _a.scrollY, rowRender = _a.rowRender, tabIndex = _a.tabIndex;
    var noColumnWidths = _b.noColumnWidths, unhideHeader = _b.unhideHeader, renderHeader = _b.renderHeader;
    var table = {
        nodeName: "TABLE",
        attributes: {
            "class": classes.table
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(function (_a) {
                    var row = _a.row, index = _a.index;
                    var tr = {
                        nodeName: "TR",
                        attributes: {
                            "data-index": String(index)
                        },
                        childNodes: row.map(function (cell, cIndex) {
                            var _a;
                            var column = columnSettings.columns[cIndex] || {};
                            if (column.hidden) {
                                return;
                            }
                            var td = cell.type === "node" ?
                                {
                                    nodeName: "TD",
                                    childNodes: cell.data
                                } :
                                {
                                    nodeName: "TD",
                                    childNodes: [
                                        {
                                            nodeName: "#text",
                                            data: (_a = cell.text) !== null && _a !== void 0 ? _a : String(cell.data)
                                        }
                                    ]
                                };
                            if (!header && !footer && columnWidths[cIndex] && !noColumnWidths) {
                                td.attributes = {
                                    style: "width: ".concat(columnWidths[cIndex], "%;")
                                };
                            }
                            if (column.render) {
                                var renderedCell = column.render(cell.data, td, index, cIndex);
                                if (renderedCell) {
                                    if (typeof renderedCell === "string") {
                                        // Convenience method to make it work similarly to what it did up to version 5.
                                        var node = stringToObj("<td>".concat(renderedCell, "</td>"));
                                        if (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text") {
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
                        }).filter(function (column) { return column; })
                    };
                    if (index === rowCursor) {
                        tr.attributes["class"] = classes.cursor;
                    }
                    if (rowRender) {
                        var renderedRow = rowRender(row, tr, index);
                        if (renderedRow) {
                            if (typeof renderedRow === "string") {
                                // Convenience method to make it work similarly to what it did up to version 5.
                                var node = stringToObj("<tr>".concat(renderedRow, "</tr>"));
                                if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
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
    if (id.length) {
        table.attributes.id = id;
    }
    if (header || footer || renderHeader) {
        var headerRow = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnWidths, { classes: classes, hiddenHeader: hiddenHeader, sortable: sortable, scrollY: scrollY }, { noColumnWidths: noColumnWidths, unhideHeader: unhideHeader });
        if (header || renderHeader) {
            var thead = {
                nodeName: "THEAD",
                childNodes: [headerRow]
            };
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                thead.attributes = { style: "height: 0px;" };
            }
            table.childNodes.unshift(thead);
        }
        if (footer) {
            var footerRow = header ? structuredClone(headerRow) : headerRow;
            var tfoot = {
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

var readColumnSettings = function (columnOptions) {
    if (columnOptions === void 0) { columnOptions = []; }
    var columns = [];
    var sort = false;
    // Check for the columns option
    columnOptions.forEach(function (data) {
        // convert single column selection to array
        var columnSelectors = Array.isArray(data.select) ? data.select : [data.select];
        columnSelectors.forEach(function (selector) {
            if (!columns[selector]) {
                columns[selector] = {};
            }
            var column = columns[selector];
            if (data.render) {
                column.render = data.render;
            }
            if (data.type) {
                column.type = data.type;
            }
            if (data.format) {
                column.format = data.format;
            }
            if (data.sortable === false) {
                column.notSortable = true;
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
                // We only allow one. The last one will overwrite all other options
                sort = { column: selector,
                    dir: data.sort };
            }
        });
    });
    return { columns: columns, sort: sort };
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
var parseDate = function (content, format) {
    var date;
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

/**
 * Check is item is object
 */
var isObject = function (val) { return Object.prototype.toString.call(val) === "[object Object]"; };
/**
 * Check for valid JSON string
 */
var isJson = function (str) {
    var t = !1;
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
var createElement = function (nodeName, attrs) {
    var dom = document.createElement(nodeName);
    if (attrs && "object" == typeof attrs) {
        for (var attr in attrs) {
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
var flush = function (el) {
    if (Array.isArray(el)) {
        el.forEach(function (e) { return flush(e); });
    }
    else {
        el.innerHTML = "";
    }
};
/**
 * Create button helper
 */
var button = function (className, page, text) { return createElement("li", {
    "class": className,
    html: "<a href=\"#\" data-page=\"".concat(page, "\">").concat(text, "</a>")
}); };
/**
 * Pager truncation algorithm
 */
var truncate = function (a, b, c, d, ellipsis) {
    d = d || 2;
    var j;
    var e = 2 * d;
    var f = b - d;
    var g = b + d;
    var h = [];
    var i = [];
    if (b < 4 - d + e) {
        g = 3 + e;
    }
    else if (b > c - (3 - d + e)) {
        f = c - (2 + e);
    }
    for (var k = 1; k <= c; k++) {
        if (1 == k || k == c || (k >= f && k <= g)) {
            var l = a[k - 1];
            l.classList.remove("active");
            h.push(l);
        }
    }
    h.forEach(function (c) {
        var d = c.children[0].getAttribute("data-page");
        if (j) {
            var e_1 = j.children[0].getAttribute("data-page");
            if (d - e_1 == 2)
                i.push(a[e_1]);
            else if (d - e_1 != 1) {
                var f_1 = createElement("li", {
                    "class": "ellipsis",
                    html: "<a href=\"#\">".concat(ellipsis, "</a>")
                });
                i.push(f_1);
            }
        }
        i.push(c);
        j = c;
    });
    return i;
};
var objToText = function (obj) {
    if (obj.nodeName === "#text") {
        return obj.data;
    }
    if (obj.childNodes) {
        return obj.childNodes.map(function (childNode) { return objToText(childNode); }).join("");
    }
    return "";
};
var escapeText = function (text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
};
var visibleToColumnIndex = function (visibleIndex, columns) {
    var counter = 0;
    var columnIndex = 0;
    while (counter < (visibleIndex + 1)) {
        var columnSettings = columns[columnIndex] || {};
        if (!columnSettings.hidden) {
            counter += 1;
        }
        columnIndex += 1;
    }
    return columnIndex - 1;
};

var readDataCell = function (cell, columnSettings) {
    if (columnSettings === void 0) { columnSettings = {}; }
    if (cell instanceof Object && cell.constructor === Object && cell.hasOwnProperty("data") && (typeof cell.text === "string" || typeof cell.data === "string")) {
        return cell;
    }
    var cellData = {
        data: cell
    };
    if (typeof cell === "string") {
        if (cell.length) {
            var node = stringToObj("<td>".concat(cell, "</td>"));
            if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                cellData.data = node.childNodes;
                cellData.type = "node";
                var text = objToText(node);
                cellData.text = text;
                cellData.order = text;
            }
        }
    }
    else if ([null, undefined].includes(cell)) {
        cellData.text = "";
        cellData.order = 0;
    }
    else {
        cellData.text = JSON.stringify(cell);
    }
    if (columnSettings.type === "date" && columnSettings.format) {
        cellData.order = parseDate(String(cell), columnSettings.format);
    }
    return cellData;
};
var readHeaderCell = function (cell) {
    if (cell instanceof Object && cell.constructor === Object && cell.hasOwnProperty("data") && (typeof cell.text === "string" || typeof cell.data === "string")) {
        return cell;
    }
    var cellData = {
        data: cell
    };
    if (typeof cell === "string") {
        if (cell.length) {
            var node = stringToObj("<th>".concat(cell, "</th>"));
            if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                cellData.data = node.childNodes;
                cellData.type = "node";
                var text = objToText(node);
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
var readTableData = function (dataOption, dom, columnSettings) {
    var _a, _b;
    if (dom === void 0) { dom = undefined; }
    var data = {
        data: [],
        headings: []
    };
    if (dataOption.headings) {
        data.headings = dataOption.headings.map(function (heading) { return readHeaderCell(heading); });
    }
    else if (dom === null || dom === void 0 ? void 0 : dom.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(function (th, index) {
            var heading = readHeaderCell(th.innerHTML);
            var settings = {};
            if (th.dataset.sortable === "false" || th.dataset.sort === "false") {
                settings.notSortable = true;
            }
            if (th.dataset.hidden === "true" || th.getAttribute("hidden") === "true") {
                settings.hidden = true;
            }
            if (th.dataset.type === "date") {
                settings.type = "date";
                if (th.dataset.format) {
                    settings.format = th.dataset.format;
                }
            }
            if (Object.keys(settings).length) {
                if (!columnSettings.columns[index]) {
                    columnSettings.columns[index] = {};
                }
                columnSettings.columns[index] = __assign(__assign({}, columnSettings.columns[index]), settings);
            }
            return heading;
        });
    }
    else if ((_a = dataOption.data) === null || _a === void 0 ? void 0 : _a.length) {
        data.headings = dataOption.data[0].map(function (_cell) { return readHeaderCell(""); });
    }
    else if (dom === null || dom === void 0 ? void 0 : dom.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(function (_cell) { return readHeaderCell(""); });
    }
    if (dataOption.data) {
        data.data = dataOption.data.map(function (row) { return row.map(function (cell, index) { return readDataCell(cell, columnSettings.columns[index]); }); });
    }
    else if ((_b = dom === null || dom === void 0 ? void 0 : dom.tBodies) === null || _b === void 0 ? void 0 : _b.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(function (row) { return Array.from(row.cells).map(function (cell, index) { return readDataCell(cell.dataset.content || cell.innerHTML, columnSettings.columns[index]); }); });
    }
    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error("Data heading length mismatch.");
    }
    return data;
};

/**
 * Rows API
 */
var Rows = /** @class */ (function () {
    function Rows(dt) {
        this.dt = dt;
        this.cursor = false;
    }
    Rows.prototype.setCursor = function (index) {
        if (index === void 0) { index = false; }
        if (index === this.cursor) {
            return;
        }
        var oldCursor = this.cursor;
        this.cursor = index;
        this.dt.renderTable();
        if (index !== false && this.dt.options.scrollY) {
            var cursorDOM = this.dt.dom.querySelector("tr.".concat(this.dt.options.classes.cursor));
            if (cursorDOM) {
                cursorDOM.scrollIntoView({ block: "nearest" });
            }
        }
        this.dt.emit("datatable.cursormove", this.cursor, oldCursor);
    };
    /**
     * Add new row
     */
    Rows.prototype.add = function (data) {
        var _this = this;
        var row = data.map(function (cell, index) {
            var columnSettings = _this.dt.columnSettings.columns[index] || {};
            return readDataCell(cell, columnSettings);
        });
        this.dt.data.data.push(row);
        // We may have added data to an empty table
        if (this.dt.data.data.length) {
            this.dt.hasRows = true;
        }
        this.dt.update(false);
        this.dt.fixColumns();
    };
    /**
     * Remove row(s)
     */
    Rows.prototype.remove = function (select) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.dt.data.data.filter(function (_row, index) { return !select.includes(index); });
            // We may have emptied the table
            if (!this.dt.data.data.length) {
                this.dt.hasRows = false;
            }
            this.dt.update(false);
            this.dt.fixColumns();
        }
        else {
            return this.remove([select]);
        }
    };
    /**
     * Find index of row by searching for a value in a column
     */
    Rows.prototype.findRowIndex = function (columnIndex, value) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex(function (row) { return String(row[columnIndex].data).toLowerCase().includes(String(value).toLowerCase()); });
    };
    /**
     * Find index, row, and column data by searching for a value in a column
     */
    Rows.prototype.findRow = function (columnIndex, value) {
        // get the row index
        var index = this.findRowIndex(columnIndex, value);
        // exit if not found
        if (index < 0) {
            return {
                index: -1,
                row: null,
                cols: []
            };
        }
        // get the row from data
        var row = this.dt.data.data[index];
        // return innerHTML of each td
        var cols = row.map(function (cell) { return cell.data; });
        // return everything
        return {
            index: index,
            row: row,
            cols: cols
        };
    };
    /**
     * Update a row with new data
     */
    Rows.prototype.updateRow = function (select, data) {
        var _this = this;
        var row = data.map(function (cell, index) {
            var columnSettings = _this.dt.columnSettings.columns[index] || {};
            return readDataCell(cell, columnSettings);
        });
        this.dt.data.data.splice(select, 1, row);
        this.dt.update(false);
        this.dt.fixColumns();
    };
    return Rows;
}());

var Columns = /** @class */ (function () {
    function Columns(dt) {
        this.dt = dt;
    }
    /**
     * Swap two columns
     */
    Columns.prototype.swap = function (columns) {
        if (columns.length === 2) {
            // Get the current column indexes
            var cols = this.dt.data.headings.map(function (_node, index) { return index; });
            var x = columns[0];
            var y = columns[1];
            var b = cols[y];
            cols[y] = cols[x];
            cols[x] = b;
            return this.order(cols);
        }
    };
    /**
     * Reorder the columns
     */
    Columns.prototype.order = function (columns) {
        var _this = this;
        this.dt.data.headings = columns.map(function (index) { return _this.dt.data.headings[index]; });
        this.dt.data.data = this.dt.data.data.map(function (row) { return columns.map(function (index) { return row[index]; }); });
        this.dt.columnSettings.columns = columns.map(function (index) { return _this.dt.columnSettings.columns[index]; });
        // Update
        this.dt.update();
    };
    /**
     * Hide columns
     */
    Columns.prototype.hide = function (columns) {
        var _this = this;
        if (!columns.length) {
            return;
        }
        columns.forEach(function (index) {
            if (!_this.dt.columnSettings.columns[index]) {
                _this.dt.columnSettings.columns[index] = {};
            }
            var column = _this.dt.columnSettings.columns[index];
            column.hidden = true;
        });
        this.dt.update();
    };
    /**
     * Show columns
     */
    Columns.prototype.show = function (columns) {
        var _this = this;
        if (!columns.length) {
            return;
        }
        columns.forEach(function (index) {
            if (!_this.dt.columnSettings.columns[index]) {
                _this.dt.columnSettings.columns[index] = {};
            }
            var column = _this.dt.columnSettings.columns[index];
            delete column.hidden;
        });
        this.dt.update();
    };
    /**
     * Check column(s) visibility
     */
    Columns.prototype.visible = function (columns) {
        var _this = this;
        var _a;
        if (Array.isArray(columns)) {
            return columns.map(function (index) { var _a; return !((_a = _this.dt.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); });
        }
        return !((_a = this.dt.columnSettings.columns[columns]) === null || _a === void 0 ? void 0 : _a.hidden);
    };
    /**
     * Add a new column
     */
    Columns.prototype.add = function (data) {
        var newColumnSelector = this.dt.data.headings.length;
        this.dt.data.headings = this.dt.data.headings.concat([{ data: data.heading }]);
        this.dt.data.data = this.dt.data.data.map(function (row, index) { return row.concat([readDataCell(data.data[index], data)]); });
        if (data.type || data.format || data.sortable || data.render) {
            if (!this.dt.columnSettings.columns[newColumnSelector]) {
                this.dt.columnSettings.columns[newColumnSelector] = {};
            }
            var column = this.dt.columnSettings.columns[newColumnSelector];
            if (data.type) {
                column.type = data.type;
            }
            if (data.format) {
                column.format = data.format;
            }
            if (data.notSortable) {
                column.notSortable = data.notSortable;
            }
            if (data.filter) {
                column.filter = data.filter;
            }
            if (data.type) {
                column.type = data.type;
            }
            if (data.render) {
                column.render = data.render;
            }
        }
        this.dt.update(false);
        this.dt.fixColumns();
    };
    /**
     * Remove column(s)
     */
    Columns.prototype.remove = function (columns) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter(function (_heading, index) { return !columns.includes(index); });
            this.dt.data.data = this.dt.data.data.map(function (row) { return row.filter(function (_cell, index) { return !columns.includes(index); }); });
            this.dt.update(false);
            this.dt.fixColumns();
        }
        else {
            return this.remove([columns]);
        }
    };
    /**
     * Filter by column
     */
    Columns.prototype.filter = function (column, init) {
        var _a, _b;
        if (init === void 0) { init = false; }
        if (!((_b = (_a = this.dt.columnSettings.columns[column]) === null || _a === void 0 ? void 0 : _a.filter) === null || _b === void 0 ? void 0 : _b.length)) {
            // There is no filter to apply.
            return;
        }
        var currentFilter = this.dt.filterStates.find(function (filterState) { return filterState.column === column; });
        var newFilterState;
        if (currentFilter) {
            var returnNext_1 = false;
            newFilterState = this.dt.columnSettings.columns[column].filter.find(function (filter) {
                if (returnNext_1) {
                    return true;
                }
                if (filter === currentFilter.state) {
                    returnNext_1 = true;
                }
                return false;
            });
        }
        else {
            newFilterState = this.dt.columnSettings.columns[column].filter[0];
        }
        if (currentFilter && newFilterState) {
            currentFilter.state = newFilterState;
        }
        else if (currentFilter) {
            this.dt.filterStates = this.dt.filterStates.filter(function (filterState) { return filterState.column !== column; });
        }
        else {
            this.dt.filterStates.push({ column: column, state: newFilterState });
        }
        this.dt.update();
        if (!init) {
            this.dt.emit("datatable.filter", column, newFilterState);
        }
    };
    /**
     * Sort by column
     */
    Columns.prototype.sort = function (column, dir, init) {
        var _a, _b;
        if (dir === void 0) { dir = undefined; }
        if (init === void 0) { init = false; }
        var columnSettings = this.dt.columnSettings.columns[column];
        // If there is a filter for this column, apply it instead of sorting
        if ((_a = columnSettings === null || columnSettings === void 0 ? void 0 : columnSettings.filter) === null || _a === void 0 ? void 0 : _a.length) {
            return this.filter(column, init);
        }
        if (!init) {
            this.dt.emit("datatable.sorting", column, dir);
        }
        if (!dir) {
            var currentDir = this.dt.columnSettings.sort ? (_b = this.dt.columnSettings.sort) === null || _b === void 0 ? void 0 : _b.dir : false;
            var sortSequence = (columnSettings === null || columnSettings === void 0 ? void 0 : columnSettings.sortSequence) || ["asc", "desc"];
            if (!currentDir) {
                dir = sortSequence.length ? sortSequence[0] : "asc";
            }
            else {
                var currentDirIndex = sortSequence.indexOf(currentDir);
                if (currentDirIndex === -1) {
                    dir = "asc";
                }
                else if (currentDirIndex === sortSequence.length - 1) {
                    dir = sortSequence[0];
                }
                else {
                    dir = sortSequence[currentDirIndex + 1];
                }
            }
        }
        this.dt.data.data.sort(function (row1, row2) {
            var order1 = row1[column].order || row1[column].data, order2 = row2[column].order || row2[column].data;
            if (dir === "desc") {
                var temp = order1;
                order1 = order2;
                order2 = temp;
            }
            if (order1 < order2) {
                return -1;
            }
            else if (order1 > order2) {
                return 1;
            }
            return 0;
        });
        this.dt.columnSettings.sort = { column: column, dir: dir };
        if (this.dt.options.scrollY.length) {
            this.dt.update(false);
            this.dt.fixColumns();
        }
        else {
            this.dt.update(!init);
        }
        if (!init) {
            this.dt.emit("datatable.sort", column, dir);
        }
    };
    return Columns;
}());

/**
 * Default configuration
 */
var defaultConfig$1 = {
    sortable: true,
    searchable: true,
    destroyable: true,
    data: {},
    // Pagination
    paging: true,
    perPage: 10,
    perPageSelect: [5, 10, 15, 20, 25],
    nextPrev: true,
    firstLast: false,
    prevText: "&lsaquo;",
    nextText: "&rsaquo;",
    firstText: "&laquo;",
    lastText: "&raquo;",
    ellipsisText: "&hellip;",
    ascText: "▴",
    descText: "▾",
    truncatePager: true,
    pagerDelta: 2,
    scrollY: "",
    fixedColumns: true,
    fixedHeight: false,
    header: true,
    hiddenHeader: false,
    footer: false,
    tabIndex: false,
    rowNavigation: false,
    rowRender: false,
    // Customise the display text
    labels: {
        placeholder: "Search...",
        perPage: "{select} entries per page",
        noRows: "No entries found",
        noResults: "No results match your search query",
        info: "Showing {start} to {end} of {rows} entries" //
    },
    // Customise the layout
    layout: {
        top: "{select}{search}",
        bottom: "{info}{pager}"
    },
    classes: {
        bottom: "datatable-bottom",
        container: "datatable-container",
        cursor: "datatable-cursor",
        dropdown: "datatable-dropdown",
        empty: "datatable-empty",
        headercontainer: "datatable-headercontainer",
        info: "datatable-info",
        input: "datatable-input",
        loading: "datatable-loading",
        pagination: "datatable-pagination",
        paginationList: "datatable-pagination-list",
        search: "datatable-search",
        selector: "datatable-selector",
        sorter: "datatable-sorter",
        table: "datatable-table",
        top: "datatable-top",
        wrapper: "datatable-wrapper"
    }
};

var DataTable = /** @class */ (function () {
    function DataTable(table, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        this.dom = typeof table === "string" ? document.querySelector(table) : table;
        this.id = this.dom.id;
        // user options
        this.options = __assign(__assign(__assign({}, defaultConfig$1), options), { layout: __assign(__assign({}, defaultConfig$1.layout), options.layout), labels: __assign(__assign({}, defaultConfig$1.labels), options.labels), classes: __assign(__assign({}, defaultConfig$1.classes), options.classes) });
        this.initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : ""; // preserve in case of later destruction
        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex;
        }
        else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0;
        }
        this.listeners = {
            onResize: function () { return _this.onResize(); }
        };
        this.dd = new DiffDOM();
        this.initialized = false;
        this.events = {};
        this.currentPage = 0;
        this.onFirstPage = true;
        this.hasHeadings = false;
        this.hasRows = false;
        this.columnWidths = [];
        this.filterStates = [];
        this.init();
    }
    /**
     * Initialize the instance
     */
    DataTable.prototype.init = function () {
        var _this = this;
        if (this.initialized || this.dom.classList.contains(this.options.classes.table)) {
            return false;
        }
        this.virtualDOM = nodeToObj(this.dom);
        this.rows = new Rows(this);
        this.columns = new Columns(this);
        this.columnSettings = readColumnSettings(this.options.columns);
        this.data = readTableData(this.options.data, this.dom, this.columnSettings);
        this.hasRows = Boolean(this.data.data.length);
        this.hasHeadings = Boolean(this.data.headings.length);
        this.render();
        setTimeout(function () {
            _this.emit("datatable.init");
            _this.initialized = true;
        }, 10);
    };
    /**
     * Render the instance
     */
    DataTable.prototype.render = function () {
        var _this = this;
        // Build
        this.wrapper = createElement("div", {
            "class": "".concat(this.options.classes.wrapper, " ").concat(this.options.classes.loading)
        });
        // Template for custom layouts
        var template = "";
        template += "<div class='".concat(this.options.classes.top, "'>");
        template += this.options.layout.top;
        template += "</div>";
        if (this.options.scrollY.length) {
            template += "<div class='".concat(this.options.classes.container, "' style='height: ").concat(this.options.scrollY, "; overflow-Y: auto;'></div>");
        }
        else {
            template += "<div class='".concat(this.options.classes.container, "'></div>");
        }
        template += "<div class='".concat(this.options.classes.bottom, "'>");
        template += this.options.layout.bottom;
        template += "</div>";
        // Info placement
        template = template.replace("{info}", this.options.paging ? "<div class='".concat(this.options.classes.info, "'></div>") : "");
        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {
            var wrap = "<div class='".concat(this.options.classes.dropdown, "'><label>");
            wrap += this.options.labels.perPage;
            wrap += "</label></div>";
            // Create the select
            var select_1 = createElement("select", {
                "class": this.options.classes.selector
            });
            // Create the options
            this.options.perPageSelect.forEach(function (choice) {
                var _a = Array.isArray(choice) ? [choice[0], choice[1]] : [String(choice), choice], lab = _a[0], val = _a[1];
                var selected = val === _this.options.perPage;
                var option = new Option(lab, String(val), selected, selected);
                select_1.appendChild(option);
            });
            // Custom label
            wrap = wrap.replace("{select}", select_1.outerHTML);
            // Selector placement
            template = template.replace("{select}", wrap);
        }
        else {
            template = template.replace("{select}", "");
        }
        // Searchable
        if (this.options.searchable) {
            var form = "<div class='".concat(this.options.classes.search, "'><input class='").concat(this.options.classes.input, "' placeholder='").concat(this.options.labels.placeholder, "' type='text'></div>");
            // Search input placement
            template = template.replace("{search}", form);
        }
        else {
            template = template.replace("{search}", "");
        }
        // Paginator
        var paginatorWrapper = createElement("nav", {
            "class": this.options.classes.pagination
        });
        var paginator = createElement("ul", {
            "class": this.options.classes.paginationList
        });
        paginatorWrapper.appendChild(paginator);
        // Pager(s) placement
        template = template.replace(/\{pager\}/g, paginatorWrapper.outerHTML);
        this.wrapper.innerHTML = template;
        this.container = this.wrapper.querySelector(".".concat(this.options.classes.container));
        this.pagers = Array.from(this.wrapper.querySelectorAll("ul.".concat(this.options.classes.paginationList)));
        this.label = this.wrapper.querySelector(".".concat(this.options.classes.info));
        // Insert in to DOM tree
        this.dom.parentNode.replaceChild(this.wrapper, this.dom);
        this.container.appendChild(this.dom);
        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect();
        // // Update
        this.update(false);
        //
        // // Fix height
        this.fixHeight();
        //
        // Class names
        if (!this.options.header) {
            this.wrapper.classList.add("no-header");
        }
        if (!this.options.footer) {
            this.wrapper.classList.add("no-footer");
        }
        if (this.options.sortable) {
            this.wrapper.classList.add("sortable");
        }
        if (this.options.searchable) {
            this.wrapper.classList.add("searchable");
        }
        if (this.options.fixedHeight) {
            this.wrapper.classList.add("fixed-height");
        }
        if (this.options.fixedColumns) {
            this.wrapper.classList.add("fixed-columns");
        }
        this.bindEvents();
        if (this.columnSettings.sort) {
            this.columns.sort(this.columnSettings.sort.column, this.columnSettings.sort.dir, true);
        }
        // // Fix columns
        this.fixColumns();
    };
    DataTable.prototype.renderTable = function (renderOptions) {
        if (renderOptions === void 0) { renderOptions = {}; }
        var newVirtualDOM = dataToVirtualDOM(this.id, this.data.headings, this.options.paging && this.currentPage && !renderOptions.noPaging ?
            this.pages[this.currentPage - 1] :
            this.data.data.map(function (row, index) { return ({
                row: row,
                index: index
            }); }), this.columnSettings, this.columnWidths, this.rows.cursor, this.options, renderOptions);
        var diff = this.dd.diff(this.virtualDOM, newVirtualDOM);
        this.dd.apply(this.dom, diff);
        this.virtualDOM = newVirtualDOM;
    };
    /**
     * Render the page
     * @return {Void}
     */
    DataTable.prototype.renderPage = function (renderTable, lastRowCursor) {
        var _this = this;
        if (renderTable === void 0) { renderTable = true; }
        if (lastRowCursor === void 0) { lastRowCursor = false; }
        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1;
            }
            // Use a fragment to limit touching the DOM
            if (renderTable) {
                this.renderTable();
            }
            this.onFirstPage = this.currentPage === 1;
            this.onLastPage = this.currentPage === this.lastPage;
        }
        else {
            this.setMessage(this.options.labels.noRows);
        }
        // Update the info
        var current = 0;
        var f = 0;
        var t = 0;
        var items;
        if (this.totalPages) {
            current = this.currentPage - 1;
            f = current * this.options.perPage;
            t = f + this.pages[current].length;
            f = f + 1;
            items = this.searching ? this.searchData.length : this.data.data.length;
        }
        if (this.label && this.options.labels.info.length) {
            // CUSTOM LABELS
            var string = this.options.labels.info
                .replace("{start}", String(f))
                .replace("{end}", String(t))
                .replace("{page}", String(this.currentPage))
                .replace("{pages}", String(this.totalPages))
                .replace("{rows}", String(items));
            this.label.innerHTML = items ? string : "";
        }
        if (this.currentPage == 1) {
            this.fixHeight();
        }
        if (this.options.rowNavigation && this.currentPage) {
            if (!this.rows.cursor || !this.pages[this.currentPage - 1].find(function (page) { return page.index === _this.rows.cursor; })) {
                var rows = this.pages[this.currentPage - 1];
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
    };
    /**
     * Render the pager(s)
     * @return {Void}
     */
    DataTable.prototype.renderPager = function () {
        flush(this.pagers);
        if (this.totalPages > 1) {
            var c = "pager";
            var frag_1 = document.createDocumentFragment();
            var prev = this.onFirstPage ? 1 : this.currentPage - 1;
            var next = this.onLastPage ? this.totalPages : this.currentPage + 1;
            // first button
            if (this.options.firstLast) {
                frag_1.appendChild(button(c, 1, this.options.firstText));
            }
            // prev button
            if (this.options.nextPrev && !this.onFirstPage) {
                frag_1.appendChild(button(c, prev, this.options.prevText));
            }
            var pager = this.links;
            // truncate the links
            if (this.options.truncatePager) {
                pager = truncate(this.links, this.currentPage, this.pages.length, this.options.pagerDelta, this.options.ellipsisText);
            }
            // active page link
            this.links[this.currentPage - 1].classList.add("active");
            // append the links
            pager.forEach(function (p) {
                p.classList.remove("active");
                frag_1.appendChild(p);
            });
            this.links[this.currentPage - 1].classList.add("active");
            // next button
            if (this.options.nextPrev && !this.onLastPage) {
                frag_1.appendChild(button(c, next, this.options.nextText));
            }
            // first button
            if (this.options.firstLast) {
                frag_1.appendChild(button(c, this.totalPages, this.options.lastText));
            }
            // We may have more than one pager
            this.pagers.forEach(function (pager) {
                pager.appendChild(frag_1.cloneNode(true));
            });
        }
    };
    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    DataTable.prototype.bindEvents = function () {
        var _this = this;
        // Per page selector
        if (this.options.perPageSelect) {
            var selector_1 = this.wrapper.querySelector("select.".concat(this.options.classes.selector));
            if (selector_1 && selector_1 instanceof HTMLSelectElement) {
                // Change per page
                selector_1.addEventListener("change", function () {
                    _this.options.perPage = parseInt(selector_1.value, 10);
                    _this.update();
                    _this.fixHeight();
                    _this.emit("datatable.perpage", _this.options.perPage);
                }, false);
            }
        }
        // Search input
        if (this.options.searchable) {
            this.input = this.wrapper.querySelector(".".concat(this.options.classes.input));
            if (this.input) {
                this.input.addEventListener("keyup", function () { return _this.search(_this.input.value); }, false);
            }
        }
        // Pager(s) / sorting
        this.wrapper.addEventListener("click", function (e) {
            var t = e.target.closest("a");
            if (t && (t.nodeName.toLowerCase() === "a")) {
                if (t.hasAttribute("data-page")) {
                    _this.page(parseInt(t.getAttribute("data-page"), 10));
                    e.preventDefault();
                }
                else if (_this.options.sortable &&
                    t.classList.contains(_this.options.classes.sorter) &&
                    t.parentNode.getAttribute("data-sortable") != "false") {
                    var visibleIndex = Array.from(t.parentNode.parentNode.children).indexOf(t.parentNode);
                    var columnIndex = visibleToColumnIndex(visibleIndex, _this.columnSettings.columns);
                    _this.columns.sort(columnIndex);
                    e.preventDefault();
                }
            }
        }, false);
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", function (event) {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    event.stopPropagation();
                    var lastRow_1;
                    _this.pages[_this.currentPage - 1].find(function (row) {
                        if (row.index === _this.rows.cursor) {
                            return true;
                        }
                        lastRow_1 = row;
                        return false;
                    });
                    if (lastRow_1) {
                        _this.rows.setCursor(lastRow_1.index);
                    }
                    else if (!_this.onFirstPage) {
                        _this.page(_this.currentPage - 1, true);
                    }
                }
                else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    event.stopPropagation();
                    var foundRow_1;
                    var nextRow = _this.pages[_this.currentPage - 1].find(function (row) {
                        if (foundRow_1) {
                            return true;
                        }
                        if (row.index === _this.rows.cursor) {
                            foundRow_1 = true;
                        }
                        return false;
                    });
                    if (nextRow) {
                        _this.rows.setCursor(nextRow.index);
                    }
                    else if (!_this.onLastPage) {
                        _this.page(_this.currentPage + 1);
                    }
                }
                else if (["Enter", " "].includes(event.key)) {
                    _this.emit("datatable.selectrow", _this.rows.cursor, event);
                }
            });
            this.dom.addEventListener("mousedown", function (event) {
                if (_this.dom.matches(":focus")) {
                    var row = Array.from(_this.dom.querySelectorAll("body tr")).find(function (row) { return row.contains(event.target); });
                    if (row && row instanceof HTMLElement) {
                        _this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event);
                    }
                }
            });
        }
        else {
            this.dom.addEventListener("mousedown", function (event) {
                var row = Array.from(_this.dom.querySelectorAll("body tr")).find(function (row) { return row.contains(event.target); });
                if (row && row instanceof HTMLElement) {
                    _this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event);
                }
            });
        }
        window.addEventListener("resize", this.listeners.onResize);
    };
    /**
     * execute on resize
     */
    DataTable.prototype.onResize = function () {
        this.rect = this.container.getBoundingClientRect();
        if (!this.rect.width) {
            // No longer shown, likely no longer part of DOM. Give up.
            return;
        }
        this.fixColumns();
    };
    /**
     * Destroy the instance
     * @return {void}
     */
    DataTable.prototype.destroy = function () {
        if (!this.options.destroyable) {
            return;
        }
        this.dom.innerHTML = this.initialInnerHTML;
        // Remove the className
        this.dom.classList.remove(this.options.classes.table);
        // Remove the containers
        if (this.wrapper.parentNode) {
            this.wrapper.parentNode.replaceChild(this.dom, this.wrapper);
        }
        this.initialized = false;
        window.removeEventListener("resize", this.listeners.onResize);
    };
    /**
     * Update the instance
     * @return {Void}
     */
    DataTable.prototype.update = function (renderTable) {
        if (renderTable === void 0) { renderTable = true; }
        this.wrapper.classList.remove(this.options.classes.empty);
        this.paginate();
        this.renderPage(renderTable);
        this.links = [];
        var i = this.pages.length;
        while (i--) {
            var num = i + 1;
            this.links[i] = button(i === 0 ? "active" : "", num, num);
        }
        this.renderPager();
        this.emit("datatable.update");
    };
    DataTable.prototype.paginate = function () {
        var _this = this;
        var rows = this.data.data.map(function (row, index) { return ({
            row: row,
            index: index
        }); });
        if (this.searching) {
            rows = [];
            this.searchData.forEach(function (index) { return rows.push({ index: index, row: _this.data.data[index] }); });
        }
        if (this.filterStates.length) {
            this.filterStates.forEach(function (filterState) {
                rows = rows.filter(function (row) { return typeof filterState.state === "function" ? filterState.state(row.row[filterState.column].data) : row.row[filterState.column].data === filterState.state; });
            });
        }
        if (this.options.paging && this.options.perPage > 0) {
            // Check for hidden columns
            this.pages = rows
                .map(function (row, i) { return i % _this.options.perPage === 0 ? rows.slice(i, i + _this.options.perPage) : null; })
                .filter(function (page) { return page; });
        }
        else {
            this.pages = [rows];
        }
        this.totalPages = this.lastPage = this.pages.length;
        this.currentPage = 1;
        return this.totalPages;
    };
    /**
     * Fix column widths
     */
    DataTable.prototype.fixColumns = function () {
        var _this = this;
        var _a, _b, _c, _d;
        var activeHeadings = this.data.headings.filter(function (heading, index) { var _a; return !((_a = _this.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); });
        if ((this.options.scrollY.length || this.options.fixedColumns) && (activeHeadings === null || activeHeadings === void 0 ? void 0 : activeHeadings.length)) {
            this.columnWidths = [];
            var renderOptions = {
                noPaging: true
            };
            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.options.header || this.options.footer) {
                if (this.options.scrollY.length) {
                    renderOptions.unhideHeader = true;
                }
                if (this.headerDOM) {
                    // Remove headerDOM for accurate measurements
                    this.headerDOM.parentElement.removeChild(this.headerDOM);
                }
                // Reset widths
                renderOptions.noColumnWidths = true;
                this.renderTable(renderOptions);
                var activeDOMHeadings = Array.from(((_b = (_a = this.dom.querySelector("thead, tfoot")) === null || _a === void 0 ? void 0 : _a.firstElementChild) === null || _b === void 0 ? void 0 : _b.querySelectorAll("th")) || []);
                var absoluteColumnWidths = activeDOMHeadings.map(function (cell) { return cell.offsetWidth; });
                var totalOffsetWidth_1 = absoluteColumnWidths.reduce(function (total, cellWidth) { return total + cellWidth; }, 0);
                this.columnWidths = absoluteColumnWidths.map(function (cellWidth) { return cellWidth / totalOffsetWidth_1 * 100; });
                if (this.options.scrollY.length) {
                    var container = this.dom.parentElement;
                    if (!this.headerDOM) {
                        this.headerDOM = document.createElement("div");
                        this.virtualHeaderDOM = {
                            nodeName: "DIV"
                        };
                    }
                    container.parentElement.insertBefore(this.headerDOM, container);
                    var newVirtualHeaderDOM = {
                        nodeName: "DIV",
                        attributes: {
                            "class": this.options.classes.headercontainer
                        },
                        childNodes: [
                            {
                                nodeName: "TABLE",
                                attributes: {
                                    "class": this.options.classes.table
                                },
                                childNodes: [
                                    {
                                        nodeName: "THEAD",
                                        childNodes: [
                                            headingsToVirtualHeaderRowDOM(this.data.headings, this.columnSettings, this.columnWidths, this.options, { unhideHeader: true })
                                        ]
                                    }
                                ]
                            }
                        ]
                    };
                    var diff = this.dd.diff(this.virtualHeaderDOM, newVirtualHeaderDOM);
                    this.dd.apply(this.headerDOM, diff);
                    this.virtualHeaderDOM = newVirtualHeaderDOM;
                    // Compensate for scrollbars
                    var paddingRight = this.headerDOM.firstElementChild.clientWidth - this.dom.clientWidth;
                    if (paddingRight) {
                        var paddedVirtualHeaderDOM = structuredClone(this.virtualHeaderDOM);
                        paddedVirtualHeaderDOM.attributes.style = "padding-right: ".concat(paddingRight, "px;");
                        var diff_1 = this.dd.diff(this.virtualHeaderDOM, paddedVirtualHeaderDOM);
                        this.dd.apply(this.headerDOM, diff_1);
                        this.virtualHeaderDOM = paddedVirtualHeaderDOM;
                    }
                    if (container.scrollHeight > container.clientHeight) {
                        // scrollbars on one page means scrollbars on all pages.
                        container.style.overflowY = "scroll";
                    }
                }
            }
            else {
                renderOptions.renderHeader = true;
                this.renderTable(renderOptions);
                var activeDOMHeadings = Array.from(((_d = (_c = this.dom.querySelector("thead, tfoot")) === null || _c === void 0 ? void 0 : _c.firstElementChild) === null || _d === void 0 ? void 0 : _d.querySelectorAll("th")) || []);
                var absoluteColumnWidths = activeDOMHeadings.map(function (cell) { return cell.offsetWidth; });
                var totalOffsetWidth_2 = absoluteColumnWidths.reduce(function (total, cellWidth) { return total + cellWidth; }, 0);
                this.columnWidths = absoluteColumnWidths.map(function (cellWidth) { return cellWidth / totalOffsetWidth_2 * 100; });
            }
            // render table without options for measurements
            this.renderTable();
        }
    };
    /**
     * Fix the container height
     */
    DataTable.prototype.fixHeight = function () {
        if (this.options.fixedHeight) {
            this.container.style.height = null;
            this.rect = this.container.getBoundingClientRect();
            this.container.style.height = "".concat(this.rect.height, "px");
        }
    };
    /**
     * Perform a search of the data set
     */
    DataTable.prototype.search = function (query) {
        var _this = this;
        if (!this.hasRows)
            return false;
        query = query.toLowerCase();
        this.currentPage = 1;
        this.searching = true;
        this.searchData = [];
        if (!query.length) {
            this.searching = false;
            this.update();
            this.emit("datatable.search", query, this.searchData);
            this.wrapper.classList.remove("search-results");
            return false;
        }
        this.data.data.forEach(function (row, idx) {
            var inArray = _this.searchData.includes(idx);
            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            var doesQueryMatch = query.split(" ").reduce(function (bool, word) {
                var includes = false;
                var cell = null;
                var content = null;
                for (var x = 0; x < row.length; x++) {
                    cell = row[x];
                    content = cell.text || String(cell.data);
                    if (_this.columns.visible(x) && content.toLowerCase().includes(word)) {
                        includes = true;
                        break;
                    }
                }
                return bool && includes;
            }, true);
            if (doesQueryMatch && !inArray) {
                _this.searchData.push(idx);
            }
        });
        this.wrapper.classList.add("search-results");
        if (!this.searchData.length) {
            this.wrapper.classList.remove("search-results");
            this.setMessage(this.options.labels.noResults);
        }
        else {
            this.update();
        }
        this.emit("datatable.search", query, this.searchData);
    };
    /**
     * Change page
     */
    DataTable.prototype.page = function (page, lastRowCursor) {
        if (lastRowCursor === void 0) { lastRowCursor = false; }
        // We don't want to load the current page again.
        if (page === this.currentPage) {
            return false;
        }
        if (!isNaN(page)) {
            this.currentPage = page;
        }
        if (page > this.pages.length || page < 0) {
            return false;
        }
        this.renderPage(undefined, lastRowCursor);
        this.renderPager();
        this.emit("datatable.page", page);
    };
    /**
     * Add new row data
     */
    DataTable.prototype.insert = function (data) {
        var _this = this;
        var rows = [];
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    this.data = readTableData(data, undefined, this.columnSettings);
                    this.hasRows = Boolean(this.data.data.length);
                    this.hasHeadings = Boolean(this.data.headings.length);
                }
            }
            if (data.data && Array.isArray(data.data)) {
                rows = data.data;
            }
        }
        else if (Array.isArray(data)) {
            var headings_1 = this.data.headings.map(function (heading) { return heading.data; });
            data.forEach(function (row) {
                var r = [];
                Object.entries(row).forEach(function (_a) {
                    var heading = _a[0], cell = _a[1];
                    var index = headings_1.indexOf(heading);
                    if (index > -1) {
                        r[index] = cell;
                    }
                });
                rows.push(r);
            });
        }
        if (rows.length) {
            rows.forEach(function (row) { return _this.data.data.push(row.map(function (cell, index) {
                var cellOut = readDataCell(cell, _this.columnSettings.columns[index]);
                return cellOut;
            })); });
            this.hasRows = true;
        }
        if (this.columnSettings.sort) {
            this.columns.sort(this.columnSettings.sort.column, this.columnSettings.sort.dir, true);
        }
        else {
            this.update(false);
        }
        this.fixColumns();
    };
    /**
     * Refresh the instance
     */
    DataTable.prototype.refresh = function () {
        if (this.options.searchable) {
            this.input.value = "";
            this.searching = false;
        }
        this.currentPage = 1;
        this.onFirstPage = true;
        this.update();
        this.emit("datatable.refresh");
    };
    /**
     * Print the table
     */
    DataTable.prototype.print = function () {
        var tableDOM = createElement("table");
        var tableVirtualDOM = { nodeName: "TABLE" };
        var newTableVirtualDOM = dataToVirtualDOM(this.id, this.data.headings, this.data.data.map(function (row, index) { return ({
            row: row,
            index: index
        }); }), this.columnSettings, this.columnWidths, false, // No row cursor
        this.options, {
            noColumnWidths: true,
            unhideHeader: true
        });
        var diff = this.dd.diff(tableVirtualDOM, newTableVirtualDOM);
        this.dd.apply(tableDOM, diff);
        // Open new window
        var w = window.open();
        // Append the table to the body
        w.document.body.appendChild(tableDOM);
        // Print
        w.print();
    };
    /**
     * Show a message in the table
     */
    DataTable.prototype.setMessage = function (message) {
        var _this = this;
        var _a;
        var activeHeadings = this.data.headings.filter(function (heading, index) { var _a; return !((_a = _this.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); });
        var colspan = activeHeadings.length || 1;
        this.wrapper.classList.add(this.options.classes.empty);
        if (this.label) {
            this.label.innerHTML = "";
        }
        this.totalPages = 0;
        this.renderPager();
        var newVirtualDOM = structuredClone(this.virtualDOM);
        var tbody = (_a = newVirtualDOM.childNodes) === null || _a === void 0 ? void 0 : _a.find(function (node) { return node.nodeName === "TBODY"; });
        if (!tbody) {
            tbody = { nodeName: "TBODY" };
            newVirtualDOM.childNodes = [tbody];
        }
        tbody.childNodes = [
            {
                nodeName: "TR",
                childNodes: [
                    {
                        nodeName: "TD",
                        attributes: {
                            "class": this.options.classes.empty,
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
        ];
        var diff = this.dd.diff(this.virtualDOM, newVirtualDOM);
        this.dd.apply(this.dom, diff);
        this.virtualDOM = newVirtualDOM;
    };
    /**
     * Add custom event listener
     */
    DataTable.prototype.on = function (event, callback) {
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    };
    /**
     * Remove custom event listener
     */
    DataTable.prototype.off = function (event, callback) {
        if (event in this.events === false)
            return;
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    };
    /**
     * Fire custom event
     */
    DataTable.prototype.emit = function (event) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (event in this.events === false)
            return;
        for (var i = 0; i < this.events[event].length; i++) {
            (_a = this.events[event])[i].apply(_a, args);
        }
    };
    return DataTable;
}());

/**
 * Convert CSV data to fit the format used in the table.
 */
var convertCSV = function (userOptions) {
    var obj;
    var defaults = {
        lineDelimiter: "\n",
        columnDelimiter: ",",
        removeDoubleQuotes: false
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    var options = __assign(__assign({}, defaults), userOptions);
    if (options.data.length) {
        // Import CSV
        obj = {
            data: []
        };
        // Split the string into rows
        var rows = options.data.split(options.lineDelimiter);
        if (rows.length) {
            if (options.headings) {
                obj.headings = rows[0].split(options.columnDelimiter);
                if (options.removeDoubleQuotes) {
                    obj.headings = obj.headings.map(function (e) { return e.trim().replace(/(^"|"$)/g, ""); });
                }
                rows.shift();
            }
            rows.forEach(function (row, i) {
                obj.data[i] = [];
                // Split the rows into values
                var values = row.split(options.columnDelimiter);
                if (values.length) {
                    values.forEach(function (value) {
                        if (options.removeDoubleQuotes) {
                            value = value.trim().replace(/(^"|"$)/g, "");
                        }
                        obj.data[i].push({ data: value });
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
var convertJSON = function (userOptions) {
    var obj;
    var defaults = {
        data: ""
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    var options = __assign(__assign({}, defaults), userOptions);
    if (options.data.length || isObject(options.data)) {
        // Import JSON
        var json = isJson(options.data) ? JSON.parse(options.data) : false;
        // Valid JSON string
        if (json) {
            obj = {
                headings: [],
                data: []
            };
            json.forEach(function (data, i) {
                obj.data[i] = [];
                Object.entries(data).forEach(function (_a) {
                    var column = _a[0], value = _a[1];
                    if (!obj.headings.includes(column)) {
                        obj.headings.push(column);
                    }
                    if ((value === null || value === void 0 ? void 0 : value.constructor) == Object) {
                        obj.data[i].push(value);
                    }
                    else {
                        obj.data[i].push({ data: value });
                    }
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

var exportCSV = function (dataTable, userOptions) {
    if (userOptions === void 0) { userOptions = {}; }
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    var defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    var options = __assign(__assign({}, defaults), userOptions);
    var columnShown = function (index) { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    var rows = [];
    var headers = dataTable.data.headings.filter(function (_heading, index) { return columnShown(index); }).map(function (header) { var _a; return (_a = header.text) !== null && _a !== void 0 ? _a : header.data; });
    // Include headings
    rows[0] = headers;
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (var i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
            }
        }
        else {
            rows = rows.concat(dataTable.pages[options.selection - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map(function (row) { return row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
    }
    // Only proceed if we have data
    if (rows.length) {
        var str_1 = "";
        rows.forEach(function (row) {
            row.forEach(function (cell) {
                if (typeof cell === "string") {
                    cell = cell.trim();
                    cell = cell.replace(/\s{2,}/g, " ");
                    cell = cell.replace(/\n/g, "  ");
                    cell = cell.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23");
                    if (cell.includes(",")) {
                        cell = "\"".concat(cell, "\"");
                    }
                }
                str_1 += cell + options.columnDelimiter;
            });
            // Remove trailing column delimiter
            str_1 = str_1.trim().substring(0, str_1.length - 1);
            // Apply line delimiter
            str_1 += options.lineDelimiter;
        });
        // Remove trailing line delimiter
        str_1 = str_1.trim().substring(0, str_1.length - 1);
        // Download
        if (options.download) {
            // Create a link to trigger the download
            var link = document.createElement("a");
            link.href = encodeURI("data:text/csv;charset=utf-8,".concat(str_1));
            link.download = "".concat(options.filename || "datatable_export", ".csv");
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str_1;
    }
    return false;
};

var exportJSON = function (dataTable, userOptions) {
    if (userOptions === void 0) { userOptions = {}; }
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    var defaults = {
        download: true,
        skipColumn: [],
        replacer: null,
        space: 4
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    var options = __assign(__assign({}, defaults), userOptions);
    var columnShown = function (index) { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    var rows = [];
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (var i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { return cell.type === "node" ? cell : cell.data; }); }));
            }
        }
        else {
            rows = rows.concat(dataTable.pages[options.selection - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { return cell.type === "node" ? cell : cell.data; }); }));
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map(function (row) { return row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { return cell.type === "node" ? cell : cell.data; }); }));
    }
    var headers = dataTable.data.headings.filter(function (_heading, index) { return columnShown(index); }).map(function (header) { return header.data; });
    // Only proceed if we have data
    if (rows.length) {
        var arr_1 = [];
        rows.forEach(function (row, x) {
            arr_1[x] = arr_1[x] || {};
            row.forEach(function (cell, i) {
                arr_1[x][headers[i]] = cell;
            });
        });
        // Convert the array of objects to JSON string
        var str = JSON.stringify(arr_1, options.replacer, options.space);
        // Download
        if (options.download) {
            // Create a link to trigger the download
            var blob = new Blob([str], {
                type: "data:application/json;charset=utf-8"
            });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = "".concat(options.filename || "datatable_export", ".json");
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

var exportSQL = function (dataTable, userOptions) {
    if (userOptions === void 0) { userOptions = {}; }
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    var defaults = {
        download: true,
        skipColumn: [],
        tableName: "myTable"
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    var options = __assign(__assign({}, defaults), userOptions);
    var columnShown = function (index) { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    var rows = [];
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (var i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
            }
        }
        else {
            rows = rows.concat(dataTable.pages[options.selection - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map(function (row) { return row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
    }
    var headers = dataTable.data.headings.filter(function (_heading, index) { return columnShown(index); }).map(function (header) { var _a; return (_a = header.text) !== null && _a !== void 0 ? _a : header.data; });
    // Only proceed if we have data
    if (rows.length) {
        // Begin INSERT statement
        var str_1 = "INSERT INTO `".concat(options.tableName, "` (");
        // Convert table headings to column names
        headers.forEach(function (header) {
            str_1 += "`".concat(header, "`,");
        });
        // Remove trailing comma
        str_1 = str_1.trim().substring(0, str_1.length - 1);
        // Begin VALUES
        str_1 += ") VALUES ";
        // Iterate rows and convert cell data to column values
        rows.forEach(function (row) {
            str_1 += "(";
            row.forEach(function (cell) {
                if (typeof cell === "string") {
                    str_1 += "\"".concat(cell, "\",");
                }
                else {
                    str_1 += "".concat(cell, ",");
                }
            });
            // Remove trailing comma
            str_1 = str_1.trim().substring(0, str_1.length - 1);
            // end VALUES
            str_1 += "),";
        });
        // Remove trailing comma
        str_1 = str_1.trim().substring(0, str_1.length - 1);
        // Add trailing colon
        str_1 += ";";
        if (options.download) {
            str_1 = "data:application/sql;charset=utf-8,".concat(str_1);
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            var link = document.createElement("a");
            link.href = encodeURI(str_1);
            link.download = "".concat(options.filename || "datatable_export", ".sql");
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str_1;
    }
    return false;
};

var exportTXT = function (dataTable, userOptions) {
    if (userOptions === void 0) { userOptions = {}; }
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    var defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    var options = __assign(__assign({}, defaults), userOptions);
    var columnShown = function (index) { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    var rows = [];
    var headers = dataTable.data.headings.filter(function (_heading, index) { return columnShown(index); }).map(function (header) { var _a; return (_a = header.text) !== null && _a !== void 0 ? _a : header.data; });
    // Include headings
    rows[0] = headers;
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (var i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
            }
        }
        else {
            rows = rows.concat(dataTable.pages[options.selection - 1].map(function (row) { return row.row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map(function (row) { return row.filter(function (_cell, index) { return columnShown(index); }).map(function (cell) { var _a; return (_a = cell.text) !== null && _a !== void 0 ? _a : cell.data; }); }));
    }
    // Only proceed if we have data
    if (rows.length) {
        var str_1 = "";
        rows.forEach(function (row) {
            row.forEach(function (cell) {
                if (typeof cell === "string") {
                    cell = cell.trim();
                    cell = cell.replace(/\s{2,}/g, " ");
                    cell = cell.replace(/\n/g, "  ");
                    cell = cell.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23");
                    if (cell.includes(",")) {
                        cell = "\"".concat(cell, "\"");
                    }
                }
                str_1 += cell + options.columnDelimiter;
            });
            // Remove trailing column delimiter
            str_1 = str_1.trim().substring(0, str_1.length - 1);
            // Apply line delimiter
            str_1 += options.lineDelimiter;
        });
        // Remove trailing line delimiter
        str_1 = str_1.trim().substring(0, str_1.length - 1);
        if (options.download) {
            str_1 = "data:text/csv;charset=utf-8,".concat(str_1);
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            var link = document.createElement("a");
            link.href = encodeURI(str_1);
            link.download = "".concat(options.filename || "datatable_export", ".txt");
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str_1;
    }
    return false;
};

/**
* Default config
* @type {Object}
*/
var defaultConfig = {
    classes: {
        row: "datatable-editor-row",
        form: "datatable-editor-form",
        item: "datatable-editor-item",
        menu: "datatable-editor-menu",
        save: "datatable-editor-save",
        block: "datatable-editor-block",
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
        editCell: "Edit Cell",
        editRow: "Edit Row",
        removeRow: "Remove Row",
        reallyRemove: "Are you sure?"
    },
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
            text: function (editor) { return editor.options.labels.editCell; },
            action: function (editor, _event) {
                var cell = editor.event.target.closest("td");
                return editor.editCell(cell);
            }
        },
        {
            text: function (editor) { return editor.options.labels.editRow; },
            action: function (editor, _event) {
                var row = editor.event.target.closest("tr");
                return editor.editRow(row);
            }
        },
        {
            separator: true
        },
        {
            text: function (editor) { return editor.options.labels.removeRow; },
            action: function (editor, _event) {
                if (confirm(editor.options.labels.reallyRemove)) {
                    var row = editor.event.target.closest("tr");
                    editor.removeRow(row);
                }
            }
        }
    ]
};

// Source: https://www.freecodecamp.org/news/javascript-debounce-example/
var debounce = function (func, timeout) {
    var _this = this;
    if (timeout === void 0) { timeout = 300; }
    var timer;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        clearTimeout(timer);
        timer = setTimeout(function () {
            func.apply(_this, args);
        }, timeout);
    };
};

/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
var Editor = /** @class */ (function () {
    function Editor(dataTable, options) {
        if (options === void 0) { options = {}; }
        this.dt = dataTable;
        this.options = __assign(__assign({}, defaultConfig), options);
    }
    /**
     * Init instance
     * @return {Void}
     */
    Editor.prototype.init = function () {
        var _this = this;
        if (this.initialized) {
            return;
        }
        this.dt.wrapper.classList.add(this.options.classes.editable);
        if (this.options.contextMenu) {
            this.container = createElement("div", {
                id: this.options.classes.container
            });
            this.wrapper = createElement("div", {
                "class": this.options.classes.wrapper
            });
            this.menu = createElement("ul", {
                "class": this.options.classes.menu
            });
            if (this.options.menuItems && this.options.menuItems.length) {
                this.options.menuItems.forEach(function (item) {
                    var li = createElement("li", {
                        "class": item.separator ? _this.options.classes.separator : _this.options.classes.item
                    });
                    if (!item.separator) {
                        var a = createElement("a", {
                            "class": _this.options.classes.action,
                            href: item.url || "#",
                            html: typeof item.text === "function" ? item.text(_this) : item.text
                        });
                        li.appendChild(a);
                        if (item.action && typeof item.action === "function") {
                            a.addEventListener("click", function (event) {
                                event.preventDefault();
                                item.action(_this, event);
                            });
                        }
                    }
                    _this.menu.appendChild(li);
                });
            }
            this.wrapper.appendChild(this.menu);
            this.container.appendChild(this.wrapper);
            this.update();
        }
        this.data = {};
        this.closed = true;
        this.editing = false;
        this.editingRow = false;
        this.editingCell = false;
        this.bindEvents();
        setTimeout(function () {
            _this.initialized = true;
            _this.dt.emit("editable.init");
        }, 10);
    };
    /**
     * Bind events to DOM
     * @return {Void}
     */
    Editor.prototype.bindEvents = function () {
        this.events = {
            context: this.context.bind(this),
            update: this.update.bind(this),
            dismiss: this.dismiss.bind(this),
            keydown: this.keydown.bind(this),
            click: this.click.bind(this)
        };
        // listen for click / double-click
        this.dt.dom.addEventListener(this.options.clickEvent, this.events.click);
        // listen for click anywhere but the menu
        document.addEventListener("click", this.events.dismiss);
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown);
        if (this.options.contextMenu) {
            // listen for right-click
            this.dt.dom.addEventListener("contextmenu", this.events.context);
            // reset
            this.events.reset = debounce(this.events.update, 50);
            window.addEventListener("resize", this.events.reset);
            window.addEventListener("scroll", this.events.reset);
        }
    };
    /**
     * contextmenu listener
     * @param  {Object} event Event
     * @return {Void}
     */
    Editor.prototype.context = function (event) {
        this.event = event;
        var cell = event.target.closest("tbody td");
        if (this.options.contextMenu && !this.disabled && cell) {
            event.preventDefault();
            // get the mouse position
            var x = event.pageX;
            var y = event.pageY;
            // check if we're near the right edge of window
            if (x > this.limits.x) {
                x -= this.rect.width;
            }
            // check if we're near the bottom edge of window
            if (y > this.limits.y) {
                y -= this.rect.height;
            }
            this.wrapper.style.top = "".concat(y, "px");
            this.wrapper.style.left = "".concat(x, "px");
            this.openMenu();
            this.update();
        }
    };
    /**
     * dblclick listener
     * @param  {Object} event Event
     * @return {Void}
     */
    Editor.prototype.click = function (event) {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell(this.data.input.value);
        }
        else if (!this.editing) {
            var cell = event.target.closest("tbody td");
            if (cell) {
                this.editCell(cell);
                event.preventDefault();
            }
        }
    };
    /**
     * keydown listener
     * @param  {Object} event Event
     * @return {Void}
     */
    Editor.prototype.keydown = function (event) {
        if (this.modal) {
            if (event.key === "Escape") { // close button
                this.closeModal();
            }
            else if (event.key === "Enter") { // save button
                // Save
                this.saveRow(this.data.inputs.map(function (input) { return input.value.trim(); }), this.data.row);
            }
        }
        else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    this.saveCell(this.data.input.value);
                }
                else if (this.editingRow) {
                    this.saveRow(this.data.inputs.map(function (input) { return input.value.trim(); }), this.data.row);
                }
            }
            else if (event.key === "Escape") {
                // Escape key reverts
                this.saveCell(this.data.content);
            }
        }
    };
    /**
     * Edit cell
     * @param  {Object} td    The HTMLTableCellElement
     * @return {Void}
     */
    Editor.prototype.editCell = function (td) {
        var _this = this;
        var columnIndex = visibleToColumnIndex(td.cellIndex, this.dt.columnSettings.columns);
        if (this.options.excludeColumns.includes(columnIndex)) {
            this.closeMenu();
            return;
        }
        var rowIndex = parseInt(td.parentNode.dataset.index, 10);
        var row = this.dt.data.data[rowIndex];
        var cell = row[columnIndex];
        this.data = {
            cell: cell,
            rowIndex: rowIndex,
            columnIndex: columnIndex,
            content: cell.text || String(cell.data)
        };
        var label = this.dt.data.headings[columnIndex].text || String(this.dt.data.headings[columnIndex].data);
        var template = [
            "<div class='".concat(this.options.classes.inner, "'>"),
            "<div class='".concat(this.options.classes.header, "'>"),
            "<h4>Editing cell</h4>",
            "<button class='".concat(this.options.classes.close, "' type='button' data-editor-close>\u00D7</button>"),
            " </div>",
            "<div class='".concat(this.options.classes.block, "'>"),
            "<form class='".concat(this.options.classes.form, "'>"),
            "<div class='".concat(this.options.classes.row, "'>"),
            "<label class='".concat(this.options.classes.label, "'>").concat(escapeText(label), "</label>"),
            "<input class='".concat(this.options.classes.input, "' value='").concat(escapeText(cell.text || String(cell.data) || ""), "' type='text'>"),
            "</div>",
            "<div class='".concat(this.options.classes.row, "'>"),
            "<button class='".concat(this.options.classes.save, "' type='button' data-editor-save>Save</button>"),
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        var modal = createElement("div", {
            "class": this.options.classes.modal,
            html: template
        });
        this.modal = modal;
        this.openModal();
        this.editing = true;
        this.editingCell = true;
        this.data.input = modal.querySelector("input[type=text]");
        this.data.input.focus();
        this.data.input.selectionStart = this.data.input.selectionEnd = this.data.input.value.length;
        // Close / save
        modal.addEventListener("click", function (event) {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                _this.closeModal();
            }
            else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                _this.saveCell(_this.data.input.value);
            }
        });
        this.closeMenu();
    };
    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    Editor.prototype.saveCell = function (value) {
        var oldData = this.data.content;
        // Set the cell content
        this.dt.data.data[this.data.rowIndex][this.data.columnIndex] = { data: value.trim() };
        this.closeModal();
        this.dt.fixColumns();
        this.dt.emit("editable.save.cell", value, oldData, this.data.rowIndex, this.data.columnIndex);
        this.data = {};
    };
    /**
     * Edit row
     * @param  {Object} row    The HTMLTableRowElement
     * @return {Void}
     */
    Editor.prototype.editRow = function (tr) {
        var _this = this;
        var _a;
        if (!tr || tr.nodeName !== "TR" || this.editing)
            return;
        var dataIndex = parseInt(tr.dataset.index, 10);
        var row = this.dt.data.data[dataIndex];
        var template = [
            "<div class='".concat(this.options.classes.inner, "'>"),
            "<div class='".concat(this.options.classes.header, "'>"),
            "<h4>Editing row</h4>",
            "<button class='".concat(this.options.classes.close, "' type='button' data-editor-close>\u00D7</button>"),
            " </div>",
            "<div class='".concat(this.options.classes.block, "'>"),
            "<form class='".concat(this.options.classes.form, "'>"),
            "<div class='".concat(this.options.classes.row, "'>"),
            "<button class='".concat(this.options.classes.save, "' type='button' data-editor-save>Save</button>"),
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        var modal = createElement("div", {
            "class": this.options.classes.modal,
            html: template
        });
        var inner = modal.firstElementChild;
        if (!inner) {
            return;
        }
        var form = (_a = inner.lastElementChild) === null || _a === void 0 ? void 0 : _a.firstElementChild;
        if (!form) {
            return;
        }
        // Add the inputs for each cell
        row.forEach(function (cell, i) {
            var columnSettings = _this.dt.columnSettings.columns[i] || {};
            if ((!columnSettings.hidden || (columnSettings.hidden && _this.options.hiddenColumns)) && !_this.options.excludeColumns.includes(i)) {
                var label = _this.dt.data.headings[i].text || String(_this.dt.data.headings[i].data);
                form.insertBefore(createElement("div", {
                    "class": _this.options.classes.row,
                    html: [
                        "<div class='".concat(_this.options.classes.row, "'>"),
                        "<label class='".concat(_this.options.classes.label, "'>").concat(escapeText(label), "</label>"),
                        "<input class='".concat(_this.options.classes.input, "' value='").concat(escapeText(cell.text || String(cell.data) || ""), "' type='text'>"),
                        "</div>"
                    ].join("")
                }), form.lastElementChild);
            }
        });
        this.modal = modal;
        this.openModal();
        // Grab the inputs
        var inputs = Array.from(form.querySelectorAll("input[type=text]"));
        // Remove save button
        inputs.pop();
        this.data = {
            row: row,
            inputs: inputs,
            dataIndex: dataIndex
        };
        this.editing = true;
        this.editingRow = true;
        // Close / save
        modal.addEventListener("click", function (event) {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                _this.closeModal();
            }
            else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                _this.saveRow(_this.data.inputs.map(function (input) { return input.value.trim(); }), _this.data.row);
            }
        });
        this.closeMenu();
    };
    /**
     * Save edited row
     * @param  {Object} row    The HTMLTableRowElement
     * @param  {Array} data   Cell data
     * @return {Void}
     */
    Editor.prototype.saveRow = function (data, row) {
        // Store the old data for the emitter
        var oldData = row.map(function (cell) { return cell.text || String(cell.data); });
        this.dt.rows.updateRow(this.data.dataIndex, data);
        this.data = {};
        this.closeModal();
        this.dt.emit("editable.save.row", data, oldData, row);
    };
    /**
     * Open the row editor modal
     * @return {Void}
     */
    Editor.prototype.openModal = function () {
        if (!this.editing && this.modal) {
            document.body.appendChild(this.modal);
        }
    };
    /**
     * Close the row editor modal
     * @return {Void}
     */
    Editor.prototype.closeModal = function () {
        if (this.editing && this.modal) {
            document.body.removeChild(this.modal);
            this.modal = this.editing = this.editingRow = this.editingCell = false;
        }
    };
    /**
     * Remove a row
     * @param  {Object} tr The HTMLTableRowElement
     * @return {Void}
     */
    Editor.prototype.removeRow = function (tr) {
        if (!tr || tr.nodeName !== "TR" || this.editing)
            return;
        var index = parseInt(tr.dataset.index, 10);
        this.dt.rows.remove(index);
        this.closeMenu();
    };
    /**
     * Update context menu position
     * @return {Void}
     */
    Editor.prototype.update = function () {
        var scrollX = window.scrollX || window.pageXOffset;
        var scrollY = window.scrollY || window.pageYOffset;
        this.rect = this.wrapper.getBoundingClientRect();
        this.limits = {
            x: window.innerWidth + scrollX - this.rect.width,
            y: window.innerHeight + scrollY - this.rect.height
        };
    };
    /**
     * Dismiss the context menu
     * @param  {Object} event Event
     * @return {Void}
     */
    Editor.prototype.dismiss = function (event) {
        var valid = true;
        if (this.options.contextMenu) {
            valid = !this.wrapper.contains(event.target);
            if (this.editing) {
                valid = !this.wrapper.contains(event.target) && event.target !== this.data.input;
            }
        }
        if (valid) {
            if (this.editingCell) {
                // Revert
                this.saveCell(this.data.content);
            }
            this.closeMenu();
        }
    };
    /**
     * Open the context menu
     * @return {Void}
     */
    Editor.prototype.openMenu = function () {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell(this.data.input.value);
        }
        if (this.options.contextMenu) {
            document.body.appendChild(this.container);
            this.closed = false;
            this.dt.emit("editable.context.open");
        }
    };
    /**
     * Close the context menu
     * @return {Void}
     */
    Editor.prototype.closeMenu = function () {
        if (this.options.contextMenu && !this.closed) {
            this.closed = true;
            document.body.removeChild(this.container);
            this.dt.emit("editable.context.close");
        }
    };
    /**
     * Destroy the instance
     * @return {Void}
     */
    Editor.prototype.destroy = function () {
        this.dt.dom.removeEventListener(this.options.clickEvent, this.events.click);
        this.dt.dom.removeEventListener("contextmenu", this.events.context);
        document.removeEventListener("click", this.events.dismiss);
        document.removeEventListener("keydown", this.events.keydown);
        window.removeEventListener("resize", this.events.reset);
        window.removeEventListener("scroll", this.events.reset);
        if (document.body.contains(this.container)) {
            document.body.removeChild(this.container);
        }
        this.initialized = false;
    };
    return Editor;
}());
var makeEditable = function (dataTable, options) {
    if (options === void 0) { options = {}; }
    var editor = new Editor(dataTable, options);
    if (dataTable.initialized) {
        editor.init();
    }
    else {
        dataTable.on("datatable.init", function () { return editor.init(); });
    }
    return editor;
};

export { DataTable, convertCSV, convertJSON, createElement, exportCSV, exportJSON, exportSQL, exportTXT, isJson, isObject, makeEditable };
//# sourceMappingURL=module.js.map
