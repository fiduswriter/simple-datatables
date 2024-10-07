import {
    cellDataType,
    cellType,
    columnSettingsType,
    inputCellType,
    nodeType,
    textNodeType
} from "./types"

/**
 * Check is item is object
 */
export const isObject = (val: (string | number | boolean | object | null | undefined )) => Object.prototype.toString.call(val) === "[object Object]"

/**
 * Check for valid JSON string
 */
export const isJson = (str: string) => {
    let t = !1
    try {
        t = JSON.parse(str)
    } catch (e) {
        return !1
    }
    return !(null === t || (!Array.isArray(t) && !isObject(t))) && t
}

/**
 * Create DOM element node
 */
export const createElement = (nodeName: string, attrs?: { [key: string]: string}) => {
    const dom = document.createElement(nodeName)
    if (attrs && "object" == typeof attrs) {
        for (const attr in attrs) {
            if ("html" === attr) {
                dom.innerHTML = attrs[attr]
            } else {
                dom.setAttribute(attr, attrs[attr])
            }
        }
    }
    return dom
}

export const objToText = (obj: nodeType) => {
    if (["#text", "#comment"].includes(obj.nodeName)) {
        return (obj as textNodeType).data
    }
    if (obj.childNodes) {
        return obj.childNodes.map((childNode: nodeType) => objToText(childNode)).join("")
    }
    return ""
}

export const cellToText = (obj: inputCellType | cellDataType | null | undefined): string => {
    if (obj === null || obj === undefined) {
        return ""
    } else if (obj.hasOwnProperty("text") || obj.hasOwnProperty("data")) {
        const cell = obj as cellType
        return cell.text ?? cellToText(cell.data)
    } else if (obj.hasOwnProperty("nodeName")) {
        return objToText(obj as nodeType)
    }
    return String(obj)
}


export const escapeText = function(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}


export const visibleToColumnIndex = function(visibleIndex: number, columns: columnSettingsType[]) {
    let counter = 0
    let columnIndex = 0
    while (counter < (visibleIndex+1)) {
        const columnSettings = columns[columnIndex]
        if (!columnSettings.hidden) {
            counter += 1
        }
        columnIndex += 1
    }
    return columnIndex-1
}

export const columnToVisibleIndex = function(columnIndex: number, columns: columnSettingsType[]) {
    let visibleIndex = columnIndex
    let counter = 0
    while (counter < columnIndex) {
        const columnSettings = columns[counter]
        if (columnSettings.hidden) {
            visibleIndex -= 1
        }
        counter++
    }
    return visibleIndex
}

/**
 * Converts a [NamedNodeMap](https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap) into a normal object.
 *
 * @param map The `NamedNodeMap` to convert
 */
export const namedNodeMapToObject = function(map: NamedNodeMap) {
    const obj = {}
    if (map) {
        for (const attr of map) {
            obj[attr.name] = attr.value
        }
    }
    return obj
}

/**
 * Convert class names to a CSS selector. Multiple classes should be separated by spaces.
 * Examples:
 *  - "my-class" -> ".my-class"
 *  - "my-class second-class" -> ".my-class.second-class"
 *
 * @param classNames The class names to convert. Can contain multiple classes separated by spaces.
 */
export const classNamesToSelector = (classNames: string) => {
    if (!classNames) {
        return null
    }
    return classNames.trim().split(" ").map(className => `.${className}`).join("")
}

/**
 * Check if the element contains all the classes. Multiple classes should be separated by spaces.
 *
 * @param element The element that will be checked
 * @param classes The classes that must be present in the element. Can contain multiple classes separated by spaces.
 */
export const containsClass = (element: Element, classes: string) => {
    const hasMissingClass = classes?.split(" ").some(className => !element.classList.contains(className))
    return !hasMissingClass
}

/**
 * Join two strings with spaces. Null values are ignored.
 * Examples:
 *  - joinWithSpaces("a", "b") -> "a b"
 *  - joinWithSpaces("a", null) -> "a"
 *  - joinWithSpaces(null, "b") -> "b"
 *  - joinWithSpaces("a", "b c") -> "a b c"
 *
 * @param first The first string to join
 * @param second The second string to join
 */
export const joinWithSpaces = (first: string | null | undefined, second: string | null | undefined) => {
    if (first) {
        if (second) {
            return `${first} ${second}`
        }
        return first
    } else if (second) {
        return second
    }
    return ""
}

// Source: https://www.freecodecamp.org/news/javascript-debounce-example/

export const debounce = function(func: () => void, timeout = 300) {
    let timer: number
    return (..._args: any[]) => {
        clearTimeout(timer)
        timer = window.setTimeout(() => func(), timeout)
    }
}
