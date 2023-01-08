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

const headingsToVirtualHeaderRowDOM = (headings, columnSettings, columnWidths, {hiddenHeader, sortable, scrollY}, {noColumnWidths, unhideHeader}) => ({
    nodeName: "TR",
    childNodes: headings.map(
        (heading, index) => {
            const column = columnSettings.columns[index] || {};
            if (column.hidden) {
                return false
            }
            const attributes = {};
            if (!column.notSortable && sortable) {
                attributes["data-sortable"] = true;
            }
            if (heading.sorted) {
                attributes.class = heading.sorted;
                attributes['aria-sort'] = heading.sorted === "asc" ? "ascending" : "descending";
            }
            let style = "";
            if (columnWidths[index] && !noColumnWidths) {
                style += `width: ${columnWidths[index]}%;`;
            }
            if (hiddenHeader && !unhideHeader) {
                style += "height: 0;";
            }
            if (scrollY.length && !unhideHeader) {
                style += "padding-bottom: 0;padding-top: 0;border: 0;";
            }

            if (style.length) {
                attributes.style = style;
            }
            return {
                nodeName: "TH",
                attributes,
                childNodes: [
                    (hiddenHeader && !unhideHeader) ?
                        {nodeName: "#text",
                            data: ""} :
                        column.notSortable || !sortable ?
                            {
                                nodeName: "#text",
                                data: heading.data
                            } :
                            {
                                nodeName: "a",
                                attributes: {
                                    href: "#",
                                    class: "dataTable-sorter"
                                },
                                childNodes: [
                                    {
                                        nodeName: "#text",
                                        data: heading.data
                                    }
                                ]
                            }
                ]
            }
        }
    ).filter(column => column)
});

const dataToVirtualDOM = (headings, rows, columnSettings, columnWidths, rowCursor, {hiddenHeader, header, footer, sortable, scrollY}, {noColumnWidths, unhideHeader, showHeader}) => {
    console.log({columnWidths});
    const table = {
        nodeName: "TABLE",
        attributes: {
            class: "dataTable-table"
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    (row, rIndex) => {
                        const tr = {
                            nodeName: "TR",
                            childNodes: row.map(
                                (cell, index) => {
                                    const column = columnSettings.columns[index] || {};
                                    if (column.hidden) {
                                        return false
                                    }
                                    const node = {
                                        nodeName: "TD",
                                        childNodes: [
                                            {
                                                nodeName: "#text",
                                                data: column.render ? column.render(cell.data) : cell.text
                                            }
                                        ]
                                    };
                                    if (!header && !footer && columnWidths[index] && !noColumnWidths) {
                                        node.attributes = {
                                            style: `width: ${columnWidths[index]}%;`
                                        };
                                    }
                                    return node
                                }
                            ).filter(column => column)
                        };
                        if (rIndex===rowCursor) {
                            tr.attributes.class = "dataTable-cursor";
                        }
                        return tr
                    }
                )
            }
        ]
    };

    if (header || footer || showHeader) {
        const headerRow = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnWidths, {hiddenHeader,
            sortable,
            scrollY}, {noColumnWidths,
            unhideHeader});

        if (header || showHeader) {
            table.childNodes.unshift({
                nodeName: "THEAD",
                childNodes: [headerRow]
            });
        }
        if (footer) {
            const footerRow = header ? structuredClone(headerRow) : headerRow;
            table.childNodes.push({
                nodeName: "TFOOT",
                childNodes: [footerRow]
            });
        }

    }

    return table
};

const readColumnSettings = (columnOptions = []) => {

    const columns = [];
    let sort = false;

    // Check for the columns option

    columnOptions.forEach(data => {

        // convert single column selection to array
        const columnSelectors = Array.isArray(data.select) ? data.select : [data.select];

        columnSelectors.forEach(selector => {
            if (!columns[selector]) {
                columns[selector] = {};
            }
            const column = columns[selector];


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

            if (data.sort) {
                // We only allow one. The last one will overwrite all other options
                sort = {column,
                    direction: data.sort};
            }

        });

    });

    return {columns,
        sort}

};

const readTableData = (dataOption, dom=false) => {
    const data = {
        data: [],
        headings: []
    };
    if (dataOption?.data) {
        data.data = dataOption.data.map(row => row.map(cell => ({data: cell,
            text: cell})));
    } else if (dom?.tBodies.length) {
        console.log(Array.from(dom.tBodies[0].rows));
        data.data = Array.from(dom.tBodies[0].rows).map(row => Array.from(row.cells).map(cell => ({data: cell.dataset.content || cell.innerHTML,
            text: cell.innerHTML})));
    }
    if (dataOption?.headings) {
        data.headings = dataOption.headings.map(heading => ({data: heading,
            sorted: false}));
    } else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(th => {
            const heading = {data: th.innerHTML,
                sorted: false};
            heading.sortable = th.dataset.sortable !== "false";
            return heading
        });
    } else if (dataOption?.data?.data?.length) {
        data.headings = dataOption.data.data[0].map(_cell => "");
    } else if (dom?.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(_cell => "");
    }

    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error(
            "Data heading length mismatch."
        )
    }
    console.log({dom,
        dataOption,
        data});
    return data
};

/**
 * Rows API
 */
class Rows {
    constructor(dt) {
        this.dt = dt;

        this.cursor = false;
    }

    setCursor(row=false) {
        const oldCursor = this.cursor;
        this.cursor = row;
        this.dt.update();
        if (row) {
            if (this.dt.options.scrollY) {
                const cursorDOM = this.dt.dom.querySelector("dataTable-cursor");
                if (cursorDOM) {
                    cursorDOM.scrollIntoView({block: "nearest"});
                }
            }
        }
        this.dt.emit("datatable.cursormove", this.cursor, oldCursor);

    }

    /**
     * Add new row
     */
    add(data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {};
            return ({text: columnSettings.render ? data.render(cell) : cell,
                data: cell})
        });
        this.dt.data.data.push(row);

        // We may have added data to an empty table
        if ( this.dt.data.data.length ) {
            this.dt.hasRows = true;
        }

        this.dt.fixColumns();

    }

    /**
     * Remove row(s)
     */
    remove(select) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.data.data.filter((_row, index) => !select.includes(index));
            // We may have emptied the table
            if ( !this.dt.data.data.length ) {
                this.dt.hasRows = false;
            }
            this.dt.fixColumns();
        } else {
            return this.remove([select])
        }
    }


    /**
     * Find index of row by searching for a value in a column
     */
    findRowIndex(columnIndex, value) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex(
            row => String(row[columnIndex].text).toLowerCase().includes(String(value).toLowerCase())
        )
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
            }
        }
        // get the row from data
        const row = this.dt.data.data[index];
        // return innerHTML of each td
        const cols = row.map(cell => cell.text);
        // return everything
        return {
            index,
            row,
            cols
        }
    }

    /**
     * Update a row with new data
     */
    updateRow(select, data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {};
            return ({text: columnSettings.render ? data.render(cell) : cell,
                data: cell})
        });
        this.dt.data.data.splice(select, 1, row);

        this.dt.fixColumns();
    }
}

class Columns {
    constructor(dt) {
        this.dt = dt;
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

            return this.order(cols)
        }
    }

    /**
     * Reorder the columns
     */
    order(columns) {

        this.dt.headings = columns.map(index => this.dt.headings[index]);
        this.dt.data.data = this.dt.data.data.map(
            row => columns.map(index => row[index])
        );

        // Update
        this.dt.update();
    }

    /**
     * Hide columns
     */
    hide(columns) {
        if (!columns.length) {
            return
        }
        columns.forEach(index => {
            const column = this.dt.columnSettings.columns[index] || {};
            column.hidden = true;
        });

        this.dt.update();
    }

    /**
     * Show columns
     */
    show(columns) {
        if (!columns.length) {
            return
        }
        columns.forEach(index => {
            const column = this.dt.columnSettings.columns[index] || {};
            delete column.hidden;
        });

        this.dt.update();
    }

    /**
     * Check column(s) visibility
     */
    visible(columns) {

        if (Array.isArray(columns)) {
            return columns.map(index => !this.dt.columnSettings.columns[index]?.hidden)
        }
        return !this.dt.columnSettings.columns[columns]?.hidden

    }

    /**
     * Add a new column
     */
    add(data) {
        const newColumnSelector = this.td.data.heading.length;
        this.td.data.heading = this.td.data.heading.concat([{data: data.heading}]);
        this.td.data.data = this.td.data.data.map(
            (row, index) => row.concat([
                data.data[index].map(cell => ({text: data.render ? data.render(cell) : cell,
                    data: cell}))
            ])
        );
        if (data.type || data.format || data.sortable || data.render) {
            const columnSettings = this.td.columnSettings.columns[newColumnSelector] = {};
            if (data.type) {
                columnSettings.type = data.type;
            }
            if (data.format) {
                columnSettings.format = data.format;
            }
            if (data.sortable) {
                columnSettings.sortable = data.sortable;
            }
            if (data.filter) {
                columnSettings.filter = data.filter;
            }
            if (data.type) {
                columnSettings.type = data.type;
            }
        }
        this.td.fixColumns();
    }

    /**
     * Remove column(s)
     */
    remove(columns) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter((_heading, index) => !columns.includes(index));
            this.td.data.data = this.td.data.data.map(
                row => row.filter((_cell, index) => !columns.includes(index))
            );
            this.td.fixColumns();
        } else {
            return this.remove([columns])
        }
    }

    /**
     * Filter by column
     */
    filter(column, init) {

        if (!this.dt.columnSettings.columns[column]?.filter?.length) {
            // There is no filter to apply.
            return
        }

        const currentFilter = this.dt.filterStates.find(filterState => filterState.column === column);
        let newFilterState;
        if (currentFilter) {
            let returnNext = false;
            newFilterState = this.dt.columnSettings.columns[column].filter.find(filter => {
                if (returnNext) {
                    return true
                }
                if (filter === currentFilter.state) {
                    returnNext = true;
                }
                return false
            });
        } else {
            newFilterState = this.dt.columnSettings.columns[column].filter[0];
        }

        if (currentFilter && newFilterState) {
            currentFilter.state = newFilterState;
        } else if (currentFilter) {
            this.dt.filterStates = this.dt.filterStates.filter(filterState => filterState.column !== column);
        } else {
            this.dt.filterStates.push({column,
                state: newFilterState});
        }

        this.dt.update();

        if (!init) {
            this.dt.emit("datatable.filter", column, newFilterState);
        }
    }

    /**
     * Sort by column
     */
    sort(column, dir, init) {
        // TODO: add date sorting

        // If there is a filter for this column, apply it instead of sorting
        if (this.dt.columnSettings.columns[column]?.filter?.length) {
            return this.filter(column, init)
        }

        if (!init) {
            this.dt.emit("datatable.sorting", column, dir);
        }

        if (!dir) {
            const currentDir = this.dt.data.headings[column].sorted;
            dir = currentDir === "asc" ? "desc" : "asc";
        }

        // Remove all other sorting
        this.dt.data.headings.forEach(heading => heading.sorted = false);

        this.dt.data.data.sort((row1, row2) => {
            let order1 = row1[column].order || row1[column].data,
                order2 = row2[column].order || row2[column].data;
            if (dir === "desc") {
                const temp = order1;
                order1 = order2;
                order2 = temp;
            }
            if (order1 < order2) {
                return -1
            } else if (order1 > order2) {
                return 1
            }
            return 0
        });

        this.dt.data.headings[column].sorted = dir;

        this.dt.update();

        if (!init) {
            this.dt.emit("datatable.sort", column, dir);
        }
    }
}

/**
 * Default configuration
 */
const defaultConfig$1 = {
    sortable: true,
    searchable: true,
    destroyable: true,

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

    // Customise the display text
    labels: {
        placeholder: "Search...", // The search input placeholder
        perPage: "{select} entries per page", // per-page dropdown label
        noRows: "No entries found", // Message shown when there are no records to show
        noResults: "No results match your search query", // Message shown when there are no search results
        info: "Showing {start} to {end} of {rows} entries" //
    },

    // Customise the layout
    layout: {
        top: "{select}{search}",
        bottom: "{info}{pager}"
    }
};

/**
 * Check is item is object
 */
const isObject = val => Object.prototype.toString.call(val) === "[object Object]";

/**
 * Check for valid JSON string
 */
const isJson = str => {
    let t = !1;
    try {
        t = JSON.parse(str);
    } catch (e) {
        return !1
    }
    return !(null === t || (!Array.isArray(t) && !isObject(t))) && t
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
            } else {
                dom.setAttribute(attr, attrs[attr]);
            }
        }
    }
    return dom
};

const flush = el => {
    if (el instanceof NodeList) {
        el.forEach(e => flush(e));
    } else {
        el.innerHTML = "";
    }
};

/**
 * Create button helper
 */
const button = (className, page, text) => createElement(
    "li",
    {
        class: className,
        html: `<a href="#" data-page="${page}">${text}</a>`
    }
);

/**
 * Pager truncation algorithm
 */
const truncate = (a, b, c, d, ellipsis) => {
    d = d || 2;
    let j;
    const e = 2 * d;
    let f = b - d;
    let g = b + d;
    const h = [];
    const i = [];
    if (b < 4 - d + e) {
        g = 3 + e;
    } else if (b > c - (3 - d + e)) {
        f = c - (2 + e);
    }
    for (let k = 1; k <= c; k++) {
        if (1 == k || k == c || (k >= f && k <= g)) {
            const l = a[k - 1];
            l.classList.remove("active");
            h.push(l);
        }
    }
    h.forEach(c => {
        const d = c.children[0].getAttribute("data-page");
        if (j) {
            const e = j.children[0].getAttribute("data-page");
            if (d - e == 2) i.push(a[e]);
            else if (d - e != 1) {
                const f = createElement("li", {
                    class: "ellipsis",
                    html: `<a href="#">${ellipsis}</a>`
                });
                i.push(f);
            }
        }
        i.push(c);
        j = c;
    });

    return i
};

class DataTable {
    constructor(table, options = {}) {

        this.dom = typeof table === "string" ? document.querySelector(table) : table;

        // user options
        this.options = {
            ...defaultConfig$1,
            ...options,
            layout: {
                ...defaultConfig$1.layout,
                ...options.layout
            },
            labels: {
                ...defaultConfig$1.labels,
                ...options.labels
            }
        };

        this.initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : ""; // preserve in case of later destruction

        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex;
        } else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0;
        }

        this.listeners = {
            onResize: event => this.onResize(event)
        };

        this.dd = new DiffDOM();

        // Initialize other variables
        this.initialized = false;
        this.data = false;
        this.virtualDOM = false;
        this.virtualHeaderDOM = false;
        this.headerDOM = false;
        this.currentPage = 0;
        this.onFirstPage = true;
        this.hasHeadings = false;
        this.hasRows = false;

        this.columnWidths = [];
        this.columnSettings = false;
        this.filterStates = [];

        this.init();
    }

    /**
     * Initialize the instance
     */
    init() {
        if (this.initialized || this.dom.classList.contains("dataTable-table")) {
            return false
        }

        this.rows = new Rows(this);
        this.columns = new Columns(this);

        // // Disable manual sorting if no header is present (#4)
        // if (this.dom.tHead === null && !this.options.data?.headings) {
        //     this.options.sortable = false
        // }
        //
        // if (this.dom.tBodies.length && !this.dom.tBodies[0].rows.length && this.options.data && !this.options.data.data) {
        //     throw new Error(
        //         "You seem to be using the data option, but you've not defined any rows."
        //     )
        // }


        this.data = readTableData(this.options.data, this.dom);
        this.hasRows = Boolean(this.data.data.length);
        this.hasHeadings = Boolean(this.data.headings.length);

        this.columnSettings = readColumnSettings(this.options.columns);

        this.virtualDOM = nodeToObj(this.dom);

        this.render();

        setTimeout(() => {
            this.emit("datatable.init");
            this.initialized = true;
        }, 10);
    }


    /**
     * Render the instance
     */
    render() {

        this.renderTable();

        // Store references
        this.bodyDOM = this.dom.tBodies[0];
        this.head = this.dom.tHead;

        if (this.hasHeadings) {
            this.header = this.head.rows[0];
        }

        // Build
        this.wrapper = createElement("div", {
            class: "dataTable-wrapper dataTable-loading"
        });

        // Template for custom layouts
        let template = "";
        template += "<div class='dataTable-top'>";
        template += this.options.layout.top;
        template += "</div>";
        if (this.options.scrollY.length) {
            template += `<div class='dataTable-container' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`;
        } else {
            template += "<div class='dataTable-container'></div>";
        }
        template += "<div class='dataTable-bottom'>";
        template += this.options.layout.bottom;
        template += "</div>";

        // Info placement
        template = template.replace("{info}", this.options.paging ? "<div class='dataTable-info'></div>" : "");

        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {
            let wrap = "<div class='dataTable-dropdown'><label>";
            wrap += this.options.labels.perPage;
            wrap += "</label></div>";

            // Create the select
            const select = createElement("select", {
                class: "dataTable-selector"
            });

            // Create the options
            this.options.perPageSelect.forEach(val => {
                const selected = val === this.options.perPage;
                const option = new Option(val, val, selected, selected);
                select.add(option);
            });

            // Custom label
            wrap = wrap.replace("{select}", select.outerHTML);

            // Selector placement
            template = template.replace("{select}", wrap);
        } else {
            template = template.replace("{select}", "");
        }

        // Searchable
        if (this.options.searchable) {
            const form =
                `<div class='dataTable-search'><input class='dataTable-input' placeholder='${this.options.labels.placeholder}' type='text'></div>`;

            // Search input placement
            template = template.replace("{search}", form);
        } else {
            template = template.replace("{search}", "");
        }

        // Paginator
        const paginatorWrapper = createElement("nav", {
            class: "dataTable-pagination"
        });
        const paginator = createElement("ul", {
            class: "dataTable-pagination-list"
        });
        paginatorWrapper.appendChild(paginator);

        // Pager(s) placement
        template = template.replace(/\{pager\}/g, paginatorWrapper.outerHTML);
        this.wrapper.innerHTML = template;

        this.container = this.wrapper.querySelector(".dataTable-container");

        this.pagers = this.wrapper.querySelectorAll(".dataTable-pagination-list");

        this.label = this.wrapper.querySelector(".dataTable-info");

        // Insert in to DOM tree
        this.dom.parentNode.replaceChild(this.wrapper, this.dom);
        this.container.appendChild(this.dom);

        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect();

        // // Update
        this.update();
        //
        // // Fix height
        this.fixHeight();
        //
        // // Fix columns
        this.fixColumns();

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
    }

    renderTable(renderOptions={}) {
        const newVirtualDOM = dataToVirtualDOM(
            this.data.headings,
            this.options.paging && this.currentPage && !renderOptions.noPaging ? this.pages[this.currentPage - 1] : this.data.data,
            this.columnSettings,
            this.columnWidths,
            this.rows.cursor,
            this.options,
            renderOptions
        );

        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM);
        console.log({diff,
            newVirtualDOM,
            virtualDOM: this.virtualDOM});
        this.dd.apply(this.dom, diff);
        this.virtualDOM = newVirtualDOM;
    }

    /**
     * Render the page
     * @return {Void}
     */
    renderPage(lastRowCursor=false) {

        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1;
            }

            // Use a fragment to limit touching the DOM


            this.renderTable();


            this.onFirstPage = this.currentPage === 1;
            this.onLastPage = this.currentPage === this.lastPage;
        } else {
            this.setMessage(this.options.labels.noRows);
        }

        // Update the info
        let current = 0;

        let f = 0;
        let t = 0;
        let items;

        if (this.totalPages) {
            current = this.currentPage - 1;
            f = current * this.options.perPage;
            console.log({current,
                pages: this.pages});
            t = f + this.pages[current].length;
            f = f + 1;
            items = this.searching ? this.searchData.length : this.data.data.length;
        }

        if (this.label && this.options.labels.info.length) {
            // CUSTOM LABELS
            const string = this.options.labels.info
                .replace("{start}", f)
                .replace("{end}", t)
                .replace("{page}", this.currentPage)
                .replace("{pages}", this.totalPages)
                .replace("{rows}", items);

            this.label.innerHTML = items ? string : "";
        }

        if (this.currentPage == 1) {
            this.fixHeight();
        }

        if (this.options.rowNavigation) {
            if (!this.rows.cursor || !this.pages[this.currentPage-1].includes(this.rows.cursor)) {
                const rows = this.pages[this.currentPage-1];
                if (lastRowCursor) {
                    this.rows.setCursor(rows[rows.length-1]);
                } else {
                    this.rows.setCursor(rows[0]);
                }

            }
        }
    }

    /**
     * Render the pager(s)
     * @return {Void}
     */
    renderPager() {
        flush(this.pagers);

        if (this.totalPages > 1) {
            const c = "pager";
            const frag = document.createDocumentFragment();
            const prev = this.onFirstPage ? 1 : this.currentPage - 1;
            const next = this.onLastPage ? this.totalPages : this.currentPage + 1;

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, 1, this.options.firstText));
            }

            // prev button
            if (this.options.nextPrev && !this.onFirstPage) {
                frag.appendChild(button(c, prev, this.options.prevText));
            }

            let pager = this.links;

            // truncate the links
            if (this.options.truncatePager) {
                pager = truncate(
                    this.links,
                    this.currentPage,
                    this.pages.length,
                    this.options.pagerDelta,
                    this.options.ellipsisText
                );
            }

            // active page link
            this.links[this.currentPage - 1].classList.add("active");

            // append the links
            pager.forEach(p => {
                p.classList.remove("active");
                frag.appendChild(p);
            });

            this.links[this.currentPage - 1].classList.add("active");

            // next button
            if (this.options.nextPrev && !this.onLastPage) {
                frag.appendChild(button(c, next, this.options.nextText));
            }

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, this.totalPages, this.options.lastText));
            }

            // We may have more than one pager
            this.pagers.forEach(pager => {
                pager.appendChild(frag.cloneNode(true));
            });
        }
    }

    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapper.querySelector(".dataTable-selector");
            if (selector) {
                // Change per page
                selector.addEventListener("change", () => {
                    this.options.perPage = parseInt(selector.value, 10);
                    this.update();

                    this.fixHeight();

                    this.emit("datatable.perpage", this.options.perPage);
                }, false);
            }
        }

        // Search input
        if (this.options.searchable) {
            this.input = this.wrapper.querySelector(".dataTable-input");
            if (this.input) {
                this.input.addEventListener("keyup", () => this.search(this.input.value), false);
            }
        }

        // Pager(s) / sorting
        this.wrapper.addEventListener("click", e => {
            const t = e.target.closest("a");
            if (t && (t.nodeName.toLowerCase() === "a")) {
                if (t.hasAttribute("data-page")) {
                    this.page(t.getAttribute("data-page"));
                    e.preventDefault();
                } else if (
                    this.options.sortable &&
                    t.classList.contains("dataTable-sorter") &&
                    t.parentNode.getAttribute("data-sortable") != "false"
                ) {
                    this.columns.sort(Array.from(t.parentNode.parentNode.children).indexOf(t.parentNode));
                    e.preventDefault();
                }
            }
        }, false);
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", event => {
                if (event.key === "ArrowUp") {
                    if (this.rows.cursor.previousElementSibling) {
                        this.rows.setCursor(this.rows.cursor.previousElementSibling);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (!this.onFirstPage) {
                        this.page(this.currentPage-1, true);
                    }
                } else if (event.key === "ArrowDown") {
                    if (this.rows.cursor.nextElementSibling) {
                        this.rows.setCursor(this.rows.cursor.nextElementSibling);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (!this.onLastPage) {
                        this.page(this.currentPage+1);
                    }
                } else if (["Enter", " "].includes(event.key)) {
                    this.emit("datatable.selectrow", this.rows.cursor, event);
                }
            });
            this.bodyDOM.addEventListener("mousedown", event => {
                if (this.bodyDOM.matches(":focus")) {
                    const row = Array.from(this.bodyDOM.rows).find(row => row.contains(event.target));
                    this.emit("datatable.selectrow", row, event);
                }

            });
        } else {
            this.bodyDOM.addEventListener("mousedown", event => {
                const row = Array.from(this.bodyDOM.rows).find(row => row.contains(event.target));
                this.emit("datatable.selectrow", row, event);
            });
        }

        window.addEventListener("resize", this.listeners.onResize);
    }

    /**
     * execute on resize
     */
    onResize() {
        this.rect = this.container.getBoundingClientRect();
        if (!this.rect.width) {
            // No longer shown, likely no longer part of DOM. Give up.
            return
        }
        this.fixColumns();
    }

    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        if (!this.options.destroyable) {
            return
        }
        this.dom.innerHTML = this.initialInnerHTML;

        // Remove the className
        this.dom.classList.remove("dataTable-table");

        // Remove the containers
        this.wrapper.parentNode.replaceChild(this.dom, this.wrapper);

        this.initialized = false;

        window.removeEventListener("resize", this.listeners.onResize);
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update() {
        this.wrapper.classList.remove("dataTable-empty");

        this.paginate();
        this.renderPage();

        this.links = [];

        let i = this.pages.length;
        while (i--) {
            const num = i + 1;
            this.links[i] = button(i === 0 ? "active" : "", num, num);
        }

        this.sorting = false;

        this.renderPager();

        //this.rows.update()

        this.emit("datatable.update");
    }

    paginate() {
        let rows = this.data.data;

        if (this.searching) {
            rows = [];

            this.searchData.forEach(index => rows.push(this.data.data[index]));
        }

        if (this.filterStates.length) {
            this.filterStates.forEach(
                filterState => {
                    rows = rows.filter(
                        row => typeof filterState.state === "function" ? filterState.state(row[filterState.column]) : row[filterState.column] === filterState.state
                    );
                }
            );
        }

        if (this.options.paging) {
            // Check for hidden columns
            this.pages = rows
                .map((row, i) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter(page => page);
        } else {
            this.pages = [rows];
        }

        this.totalPages = this.lastPage = this.pages.length;

        this.currentPage = 1;

        return this.totalPages
    }

    /**
     * Fix column widths
     */
    fixColumns() {
        console.log('fixColumns');
        const activeHeadings = this.data.headings.filter((heading, index) => !this.columnSettings.columns[index]?.hidden);
        console.log([this.options.scrollY, this.options.fixedColumns, activeHeadings]);
        if ((this.options.scrollY.length || this.options.fixedColumns) && activeHeadings?.length) {

            this.columnWidths = [];
            const renderOptions = {
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

                const activeDOMHeadings = Array.from(this.dom.querySelector("thead, tfoot")?.firstElementChild?.children || []);
                console.log({activeDOMHeadings});
                const absoluteColumnWidths = activeDOMHeadings.map(cell => cell.offsetWidth);
                const totalOffsetWidth = absoluteColumnWidths.reduce(
                    (total, cellWidth) => total + cellWidth,
                    0
                );
                this.columnWidths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100);


                if (this.options.scrollY.length) {
                    const container = this.dom.parentElement;
                    if (!this.headerDOM) {
                        this.headerDOM = document.createElement("div");
                        this.virtualHeaderDOM = {
                            nodeType: "DIV"
                        };

                    }
                    container.parentElement.insertBefore(this.headerDOM, container);
                    const newVirtualHeaderDOM = {
                        nodeType: "DIV",
                        attributes: {
                            class: "dataTable-headercontainer"
                        },
                        childNodes: [
                            {
                                nodeType: "TABLE",
                                attributes: {
                                    class: "dataTable-table"
                                },
                                childNodes: [
                                    {
                                        nodeType: "THEAD",
                                        childNodes: [
                                            {
                                                nodeType: "TR",
                                                childNodes: [headingsToVirtualHeaderRowDOM()]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    };
                    const diff = this.dd.diff(this.virtualHeaderDOM, newVirtualHeaderDOM);
                    this.dd.apply(this.headerDOM, diff);
                    this.virtualHeaderDOM = newVirtualHeaderDOM;

                    // Compensate for scrollbars
                    const paddingRight = this.headerDOM.firstElementChild.clientWidth - this.dom.clientWidth;
                    if (paddingRight) {
                        const paddedVirtualHeaderDOM = structuredClone(this.virtualHeaderDOM);
                        paddedVirtualHeaderDOM.attributes.style = `padding-right: ${paddingRight}px;`;
                        const diff = this.dd.diff(this.virtualHeaderDOM, paddedVirtualHeaderDOM);
                        this.dd.apply(this.headerDOM, diff);
                        this.virtualHeaderDOM = paddedVirtualHeaderDOM;
                    }

                    if (container.scrollHeight > container.clientHeight) {
                        // scrollbars on one page means scrollbars on all pages.
                        container.style.overflowY = "scroll";
                    }
                }

            } else {
                renderOptions.showHeader = true;
                this.renderTable(renderOptions);

                const activeDOMHeadings = Array.from(this.dom.querySelector("thead, tfoot")?.firstElementChild?.children || []);
                console.log({activeDOMHeadings});
                const absoluteColumnWidths = activeDOMHeadings.map(cell => cell.offsetWidth);
                const totalOffsetWidth = absoluteColumnWidths.reduce(
                    (total, cellWidth) => total + cellWidth,
                    0
                );
                this.columnWidths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100);
            }
            // render table without options for measurements
            this.renderTable();
        }
    }

    /**
     * Fix the container height
     */
    fixHeight() {
        if (this.options.fixedHeight) {
            this.container.style.height = null;
            this.rect = this.container.getBoundingClientRect();
            this.container.style.height = `${this.rect.height}px`;
        }
    }

    /**
     * Perform a search of the data set
     */
    search(query) {
        if (!this.hasRows) return false

        query = query.toLowerCase();

        this.currentPage = 1;
        this.searching = true;
        this.searchData = [];

        if (!query.length) {
            this.searching = false;
            this.update();
            this.emit("datatable.search", query, this.searchData);
            this.wrapper.classList.remove("search-results");
            return false
        }

        this.data.data.forEach((row, idx) => {
            const inArray = this.searchData.includes(row);

            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            const doesQueryMatch = query.split(" ").reduce((bool, word) => {
                let includes = false;
                let cell = null;
                let content = null;

                for (let x = 0; x < row.length; x++) {
                    cell = row[x];
                    content = cell.data;

                    if (
                        content.toLowerCase().includes(word) &&
                        this.columns.visible(cell.cellIndex)
                    ) {
                        includes = true;
                        break
                    }
                }

                return bool && includes
            }, true);

            if (doesQueryMatch && !inArray) {
                this.searchData.push(idx);
            }
        });

        this.wrapper.classList.add("search-results");

        if (!this.searchData.length) {
            this.wrapper.classList.remove("search-results");

            this.setMessage(this.options.labels.noResults);
        } else {
            this.update();
        }

        this.emit("datatable.search", query, this.searchData);
    }

    /**
     * Change page
     */
    page(page, lastRowCursor=false) {
        // We don't want to load the current page again.
        if (page == this.currentPage) {
            return false
        }

        if (!isNaN(page)) {
            this.currentPage = parseInt(page, 10);
        }

        if (page > this.pages.length || page < 0) {
            return false
        }

        this.renderPage(lastRowCursor);
        this.renderPager();

        this.emit("datatable.page", page);
    }

    /**
     * Add new row data
     */
    insert(data) {
        let rows = [];
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    this.data = readTableData(data);
                    this.hasRows = Boolean(this.data.data.length);
                    this.hasHeadings = Boolean(this.data.headings.length);
                }
            }

            if (data.data && Array.isArray(data.data)) {
                rows = data.data;
            }
        } else if (Array.isArray(data)) {
            data.forEach(row => {
                const r = [];
                Object.entries(row).forEach(([heading, cell]) => {

                    const index = this.data.headings.indexOf(heading);

                    if (index > -1) {
                        r[index] = cell;
                    }
                });
                rows.push(r);
            });
        }

        if (rows.length) {
            rows.forEach(row => this.data.data.push(row.map(cell => ({data: cell,
                text: cell}))));
            this.hasRows = true;
        }

        this.update();
        this.fixColumns();
    }

    /**
     * Refresh the instance
     */
    refresh() {
        if (this.options.searchable) {
            this.input.value = "";
            this.searching = false;
        }
        this.currentPage = 1;
        this.onFirstPage = true;
        this.update();

        this.emit("datatable.refresh");
    }

    /**
     * Print the table
     * @return {void}
     */
    print() {
        const headings = this.virtualDOM.childNodes.find(node => ["THEAD", "TFOOT"].includes(node.nodeType))?.childNodes;
        const rows = this.data.data;
        const table = createElement("table");
        const thead = createElement("thead");
        const tbody = createElement("tbody");

        const tr = createElement("tr");
        headings.forEach(th => {
            tr.appendChild(
                createElement("th", {
                    html: th.textContent
                })
            );
        });

        thead.appendChild(tr);

        rows.forEach(row => {
            const tr = createElement("tr");
            Array.from(row.cells).forEach(cell => {
                tr.appendChild(
                    createElement("td", {
                        html: cell.textContent
                    })
                );
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        // Open new window
        const w = window.open();

        // Append the table to the body
        w.document.body.appendChild(table);

        // Print
        w.print();
    }

    /**
     * Show a message in the table
     */
    setMessage(message) {
        const activeHeadings = this.data.headings.filter((heading, index) => !this.columnSettings.columns[index]?.hidden);
        const colspan = activeHeadings.length || 1;

        this.wrapper.classList.add("dataTable-empty");

        if (this.label) {
            this.label.innerHTML = "";
        }
        this.totalPages = 0;
        this.renderPager();

        const newVirtualDOM = structuredClone(this.virtualDOM);

        const tbody = newVirtualDOM.childNodes.find(node => node.nodeName === "TBODY");

        tbody.childNodes = [
            {
                nodeName: "TR",
                childNodes: [
                    {
                        nodeName: "TD",
                        attributes: {
                            class: "dataTables-empty",
                            colspan
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


        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM);
        console.log({diff,
            newVirtualDOM,
            virtualDOM: this.virtualDOM});
        this.dd.apply(this.dom, diff);
        this.virtualDOM = newVirtualDOM;

    }

    /**
     * Add custom event listener
     */
    on(event, callback) {
        this.events = this.events || {};
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }

    /**
     * Remove custom event listener
     */
    off(event, callback) {
        this.events = this.events || {};
        if (event in this.events === false) return
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    }

    /**
     * Fire custom event
     */
    emit(event) {
        this.events = this.events || {};
        if (event in this.events === false) return
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    }
}

/**
 * Convert CSV data to fit the format used in the table.
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
const convertCSV = function(userOptions = {}) {
    let obj = false;
    const defaults = {
        lineDelimiter: "\n",
        columnDelimiter: ",",
        removeDoubleQuotes: false
    };

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    };

    if (options.data.length || isObject(options.data)) {
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
                    obj.headings = obj.headings.map(e => e.trim().replace(/(^"|"$)/g, ""));
                }
                rows.shift();
            }

            rows.forEach((row, i) => {
                obj.data[i] = [];

                // Split the rows into values
                const values = row.split(options.columnDelimiter);

                if (values.length) {
                    values.forEach(value => {
                        if (options.removeDoubleQuotes) {
                            value = value.trim().replace(/(^"|"$)/g, "");
                        }
                        obj.data[i].push(value);
                    });
                }
            });
        }

        if (obj) {
            return obj
        }
    }

    return false
};

/**
 * Convert JSON data to fit the format used in the table.
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
const convertJSON = function(userOptions = {}) {
    let obj = false;
    const defaults = {};

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    };

    if (options.data.length || isObject(options.data)) {
        // Import CSV
        const json = isJson(options.data);

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
        } else {
            console.warn("That's not valid JSON!");
        }

        if (obj) {
            return obj
        }
    }

    return false
};

/**
 * Export table to CSV
 */
const exportCSV = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings;
    let rows = [];
    let i;
    let x;
    let str;
    let link;

    const defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    };

    // Include headings
    rows[0] = dataTable.header;

    // Selection or whole table
    if (options.selection) {
        // Page number
        if (!isNaN(options.selection)) {
            rows = rows.concat(dataTable.pages[options.selection - 1]);
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1]);
            }
        }
    } else {
        rows = rows.concat(dataTable.activeRows);
    }

    // Only proceed if we have data
    if (rows.length) {
        str = "";

        for (i = 0; i < rows.length; i++) {
            for (x = 0; x < rows[i].cells.length; x++) {
                // Check for column skip and visibility
                if (
                    !options.skipColumn.includes(headers[x].originalCellIndex) &&
                    dataTable.columns.visible(headers[x].originalCellIndex)
                ) {
                    let text = rows[i].cells[x].textContent;
                    text = text.trim();
                    text = text.replace(/\s{2,}/g, " ");
                    text = text.replace(/\n/g, "  ");
                    text = text.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    text = text.replace(/#/g, "%23");
                    if (text.includes(","))
                        text = `"${text}"`;


                    str += text + options.columnDelimiter;
                }
            }
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);

            // Apply line delimiter
            str += options.lineDelimiter;
        }

        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);

        // Download
        if (options.download) {
            // Create a link to trigger the download
            link = document.createElement("a");
            link.href = encodeURI(`data:text/csv;charset=utf-8,${str}`);
            link.download = `${options.filename || "datatable_export"}.csv`;

            // Append the link
            document.body.appendChild(link);

            // Trigger the download
            link.click();

            // Remove the link
            document.body.removeChild(link);
        }

        return str
    }

    return false
};

/**
 * Export table to JSON
 */
const exportJSON = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings;
    let rows = [];
    const arr = [];
    let i;
    let x;
    let str;
    let link;

    const defaults = {
        download: true,
        skipColumn: [],
        replacer: null,
        space: 4
    };

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    };


    // Selection or whole table
    if (options.selection) {
        // Page number
        if (!isNaN(options.selection)) {
            rows = rows.concat(dataTable.pages[options.selection - 1]);
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1]);
            }
        }
    } else {
        rows = rows.concat(dataTable.activeRows);
    }

    // Only proceed if we have data
    if (rows.length) {
        // Iterate rows
        for (x = 0; x < rows.length; x++) {
            arr[x] = arr[x] || {};
            // Iterate columns
            for (i = 0; i < headers.length; i++) {
                // Check for column skip and column visibility
                if (
                    !options.skipColumn.includes(headers[i].originalCellIndex) &&
                    dataTable.columns.visible(headers[i].originalCellIndex)
                ) {
                    arr[x][headers[i].textContent] = rows[x].cells[i].textContent;
                }
            }
        }

        // Convert the array of objects to JSON string
        str = JSON.stringify(arr, options.replacer, options.space);

        // Download
        if (options.download) {
            // Create a link to trigger the download
            link = document.createElement("a");
            link.href = encodeURI(`data:application/json;charset=utf-8,${str}`);
            link.download = `${options.filename || "datatable_export"}.json`;

            // Append the link
            document.body.appendChild(link);

            // Trigger the download
            link.click();

            // Remove the link
            document.body.removeChild(link);
        }

        return str
    }

    return false
};

/**
 * Export table to SQL
 */
const exportSQL = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings;
    let rows = [];
    let i;
    let x;
    let str;
    let link;

    const defaults = {
        download: true,
        skipColumn: [],
        tableName: "myTable"
    };

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    };

    // Selection or whole table
    if (options.selection) {
        // Page number
        if (!isNaN(options.selection)) {
            rows = rows.concat(dataTable.pages[options.selection - 1]);
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1]);
            }
        }
    } else {
        rows = rows.concat(dataTable.activeRows);
    }

    // Only proceed if we have data
    if (rows.length) {
        // Begin INSERT statement
        str = `INSERT INTO \`${options.tableName}\` (`;

        // Convert table headings to column names
        for (i = 0; i < headers.length; i++) {
            // Check for column skip and column visibility
            if (
                !options.skipColumn.includes(headers[i].originalCellIndex) &&
                dataTable.columns.visible(headers[i].originalCellIndex)
            ) {
                str += `\`${headers[i].textContent}\`,`;
            }
        }

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);

        // Begin VALUES
        str += ") VALUES ";

        // Iterate rows and convert cell data to column values
        for (i = 0; i < rows.length; i++) {
            str += "(";

            for (x = 0; x < rows[i].cells.length; x++) {
                // Check for column skip and column visibility
                if (
                    !options.skipColumn.includes(headers[x].originalCellIndex) &&
                    dataTable.columns.visible(headers[x].originalCellIndex)
                ) {
                    str += `"${rows[i].cells[x].textContent}",`;
                }
            }

            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1);

            // end VALUES
            str += "),";
        }

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
            link = document.createElement("a");
            link.href = encodeURI(str);
            link.download = `${options.filename || "datatable_export"}.sql`;

            // Append the link
            document.body.appendChild(link);

            // Trigger the download
            link.click();

            // Remove the link
            document.body.removeChild(link);
        }

        return str
    }

    return false
};

/**
 * Export table to TXT
 */
const exportTXT = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings;
    let rows = [];
    let i;
    let x;
    let str;
    let link;

    const defaults = {
        download: true,
        skipColumn: []
    };

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    };

    // Include headings
    rows[0] = dataTable.header;

    // Selection or whole table
    if (options.selection) {
        // Page number
        if (!isNaN(options.selection)) {
            rows = rows.concat(dataTable.pages[options.selection - 1]);
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1]);
            }
        }
    } else {
        rows = rows.concat(dataTable.activeRows);
    }

    // Only proceed if we have data
    if (rows.length) {
        str = "";

        for (i = 0; i < rows.length; i++) {
            for (x = 0; x < rows[i].cells.length; x++) {
                // Check for column skip and visibility
                if (
                    !options.skipColumn.includes(headers[x].originalCellIndex) &&
                    dataTable.columns.visible(headers[x].originalCellIndex)
                ) {
                    let text = rows[i].cells[x].textContent;
                    text = text.trim();
                    text = text.replace(/\s{2,}/g, " ");
                    text = text.replace(/\n/g, "  ");
                    text = text.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    text = text.replace(/#/g, "%23");
                    if (text.includes(","))
                        text = `"${text}"`;


                    str += text + options.columnDelimiter;
                }
            }
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);

            // Apply line delimiter
            str += options.lineDelimiter;
        }

        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);

        if (options.download) {
            str = `data:text/csv;charset=utf-8,${str}`;
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            link = document.createElement("a");
            link.href = encodeURI(str);
            link.download = `${options.filename || "datatable_export"}.txt`;

            // Append the link
            document.body.appendChild(link);

            // Trigger the download
            link.click();

            // Remove the link
            document.body.removeChild(link);
        }

        return str
    }

    return false
};

/**
* Default config
* @type {Object}
*/
const defaultConfig = {
    classes: {
        row: "dataTable-editor-row",
        form: "dataTable-editor-form",
        item: "dataTable-editor-item",
        menu: "dataTable-editor-menu",
        save: "dataTable-editor-save",
        block: "dataTable-editor-block",
        close: "dataTable-editor-close",
        inner: "dataTable-editor-inner",
        input: "dataTable-editor-input",
        label: "dataTable-editor-label",
        modal: "dataTable-editor-modal",
        action: "dataTable-editor-action",
        header: "dataTable-editor-header",
        wrapper: "dataTable-editor-wrapper",
        editable: "dataTable-editor-editable",
        container: "dataTable-editor-container",
        separator: "dataTable-editor-separator"
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
            text: editor => editor.options.labels.editCell,
            action: (editor, _event) => {
                const cell = editor.event.target.closest("td");
                return editor.editCell(cell)
            }
        },
        {
            text: editor => editor.options.labels.editRow,
            action: (editor, _event) => {
                const row = editor.event.target.closest("tr");
                return editor.editRow(row)
            }
        },
        {
            separator: true
        },
        {
            text: editor => editor.options.labels.removeRow,
            action: (editor, _event) => {
                if (confirm(editor.options.labels.reallyRemove)) {
                    const row = editor.event.target.closest("tr");
                    editor.removeRow(row);
                }
            }
        }
    ]
};

// Source: https://www.freecodecamp.org/news/javascript-debounce-example/

const debounce = function(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    }
};

/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
class Editor {
    constructor(dataTable, options = {}) {
        this.dataTable = dataTable;
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
            return
        }
        this.dataTable.wrapper.classList.add(this.options.classes.editable);
        if (this.options.contextMenu) {
            this.container = createElement("div", {
                id: this.options.classes.container
            });
            this.wrapper = createElement("div", {
                class: this.options.classes.wrapper
            });
            this.menu = createElement("ul", {
                class: this.options.classes.menu
            });
            if (this.options.menuItems && this.options.menuItems.length) {
                this.options.menuItems.forEach(item => {
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
                            a.addEventListener("click", event => {
                                event.preventDefault();
                                item.action(this, event);
                            });
                        }
                    }
                    this.menu.appendChild(li);
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
        setTimeout(() => {
            this.initialized = true;
            this.dataTable.emit("editable.init");
        }, 10);
    }

    /**
     * Bind events to DOM
     * @return {Void}
     */
    bindEvents() {
        this.events = {
            context: this.context.bind(this),
            update: this.update.bind(this),
            dismiss: this.dismiss.bind(this),
            keydown: this.keydown.bind(this),
            click: this.click.bind(this)
        };
        // listen for click / double-click
        this.dataTable.body.addEventListener(this.options.clickEvent, this.events.click);
        // listen for click anywhere but the menu
        document.addEventListener("click", this.events.dismiss);
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown);
        if (this.options.contextMenu) {
            // listen for right-click

            this.dataTable.body.addEventListener("contextmenu", this.events.context);
            // reset
            this.events.reset = debounce(this.events.update, 50);
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
        this.event = event;
        const valid = this.dataTable.body.contains(event.target);
        if (this.options.contextMenu && !this.disabled && valid) {
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
            this.wrapper.style.top = `${y}px`;
            this.wrapper.style.left = `${x}px`;
            this.openMenu();
            this.update();
        }
    }

    /**
     * dblclick listener
     * @param  {Object} event Event
     * @return {Void}
     */
    click(event) {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell();
        } else if (!this.editing) {
            const cell = event.target.closest("td");
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
        if (this.modal) {
            if (event.key === "Escape") { // close button
                this.closeModal();
            } else if (event.key === "Enter") { // save button
                // Save
                this.saveRow();
            }
        } else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    this.saveCell();
                } else if (this.editingRow) {
                    this.saveRow();
                }
            } else if (event.key === "Escape") {
                // Escape key reverts
                this.saveCell(this.data.content);
            }
        }
    }

    /**
     * Edit cell
     * @param  {Object} cell    The HTMLTableCellElement
     * @return {Void}
     */
    editCell(cell) {
        if (this.options.excludeColumns.includes(cell.cellIndex)) {
            this.closeMenu();
            return
        }
        const row = this.dataTable.body.rows[cell.parentNode.dataIndex];
        cell = row.cells[cell.cellIndex];
        this.data = {
            cell,
            content: cell.dataset.content || cell.innerHTML,
            input: createElement("input", {
                type: "text",
                value: cell.dataset.content || cell.innerHTML,
                class: this.options.classes.input
            })
        };
        cell.innerHTML = "";
        cell.appendChild(this.data.input);
        setTimeout(() => {
            this.data.input.focus();
            this.data.input.selectionStart = this.data.input.selectionEnd = this.data.input.value.length;
            this.editing = true;
            this.editingCell = true;
            this.closeMenu();
        }, 10);
    }

    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    saveCell(value, cell) {
        cell = cell || this.data.cell;
        value = value || this.data.input.value;
        const oldData = this.data.content;
        // Set the cell content
        this.dataTable.data[cell.parentNode.dataIndex].cells[cell.cellIndex].innerHTML = cell.innerHTML = value.trim();
        this.data = {};
        this.editing = this.editingCell = false;
        this.dataTable.emit("editable.save.cell", value, oldData, cell);
    }

    /**
     * Edit row
     * @param  {Object} cell    The HTMLTableRowElement
     * @return {Void}
     */
    editRow(row) {
        row = row || this.event.target.closest("tr");
        if (!row || row.nodeName !== "TR" || this.editing) return
        row = this.dataTable.body.rows[row.dataIndex];
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            "<h4>Editing row</h4>",
            `<button class='${this.options.classes.close}' type='button' data-editor-close>×</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>Save</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        const modal = createElement("div", {
            class: this.options.classes.modal,
            html: template
        });
        const inner = modal.firstElementChild;
        const form = inner.lastElementChild.firstElementChild;
        // Add the inputs for each cell
        Array.from(row.cells).forEach((cell, i) => {
            if ((!cell.hidden || (cell.hidden && this.options.hiddenColumns)) && !this.options.excludeColumns.includes(i)) {
                form.insertBefore(createElement("div", {
                    class: this.options.classes.row,
                    html: [
                        `<div class='${this.options.classes.row}'>`,
                        `<label class='${this.options.classes.label}'>${this.dataTable.header.cells[i].textContent}</label>`,
                        `<input class='${this.options.classes.input}' value='${cell.dataset.content || cell.innerHTML}' type='text'>`,
                        "</div>"
                    ].join("")
                }), form.lastElementChild);
            }
        });
        this.modal = modal;
        this.openModal();
        // Grab the inputs
        const inputs = Array.from(form.elements);
        // Remove save button
        inputs.pop();
        this.data = {
            row,
            inputs
        };
        this.editing = true;
        this.editingRow = true;
        // Close / save
        modal.addEventListener("click", event => {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                this.closeModal();
            } else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveRow();
            }
        });
        this.closeMenu();
    }

    /**
     * Save edited row
     * @param  {Object} row    The HTMLTableRowElement
     * @param  {Array} data   Cell data
     * @return {Void}
     */
    saveRow(data, row) {
        data = data || this.data.inputs.map(input => input.value.trim());
        row = row || this.data.row;
        // Store the old data for the emitter
        const oldData = Array.from(row.cells).map(cell => cell.dataset.content || cell.innerHTML);
        Array.from(row.cells).forEach((cell, i) => {
            cell.innerHTML = data[i];
        });
        this.closeModal();
        this.dataTable.emit("editable.save.row", data, oldData, row);
    }

    /**
     * Open the row editor modal
     * @return {Void}
     */
    openModal() {
        if (!this.editing && this.modal) {
            document.body.appendChild(this.modal);
        }
    }

    /**
     * Close the row editor modal
     * @return {Void}
     */
    closeModal() {
        if (this.editing && this.modal) {
            document.body.removeChild(this.modal);
            this.modal = this.editing = this.editingRow = false;
        }
    }

    /**
     * Remove a row
     * @param  {Number|Object} row The HTMLTableRowElement or dataIndex property
     * @return {Void}
     */
    removeRow(row) {
        if (!row) {
            row = this.event.target.closest("tr");
            if (row && row.dataIndex !== undefined) {
                this.dataTable.rows.remove(row.dataIndex);
                this.closeMenu();
            }
        } else {
            // User passed a HTMLTableRowElement
            if (row instanceof Element && row.nodeName === "TR" && row.dataIndex !== undefined) {
                row = row.dataIndex;
            }
            this.dataTable.rows.remove(row);
            this.closeMenu();
        }
    }

    /**
     * Update context menu position
     * @return {Void}
     */
    update() {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        this.rect = this.wrapper.getBoundingClientRect();
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
    dismiss(event) {
        let valid = true;
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
    }

    /**
     * Open the context menu
     * @return {Void}
     */
    openMenu() {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell();
        }
        if (this.options.contextMenu) {
            document.body.appendChild(this.container);
            this.closed = false;
            this.dataTable.emit("editable.context.open");
        }
    }

    /**
     * Close the context menu
     * @return {Void}
     */
    closeMenu() {
        if (this.options.contextMenu && !this.closed) {
            this.closed = true;
            document.body.removeChild(this.container);
            this.dataTable.emit("editable.context.close");
        }
    }

    /**
     * Destroy the instance
     * @return {Void}
     */
    destroy() {
        this.dataTable.body.removeEventListener(this.options.clickEvent, this.events.click);
        this.dataTable.body.removeEventListener("contextmenu", this.events.context);
        document.removeEventListener("click", this.events.dismiss);
        document.removeEventListener("keydown", this.events.keydown);
        window.removeEventListener("resize", this.events.reset);
        window.removeEventListener("scroll", this.events.reset);
        if (document.body.contains(this.container)) {
            document.body.removeChild(this.container);
        }
        this.initialized = false;
    }
}

const makeEditable = function(dataTable, options = {}) {
    const editor = new Editor(dataTable, options);
    if (dataTable.initialized) {
        editor.init();
    } else {
        dataTable.on("datatable.init", () => editor.init());
    }

    return editor
};

export { DataTable, convertCSV, convertJSON, createElement, exportCSV, exportJSON, exportSQL, exportTXT, isJson, isObject, makeEditable };
//# sourceMappingURL=module.js.map
