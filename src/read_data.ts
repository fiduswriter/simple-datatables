import {stringToObj, nodeToObj} from "diff-dom"
import {parseDate} from "./date"
import {objToText} from "./helpers"
import {cellType, DataOption, headerCellType, inputCellType, inputHeaderCellType, nodeType, columnSettingsType} from "./types"

export const readDataCell = (cell: inputCellType, columnSettings : columnSettingsType) : cellType => {
    if (cell?.constructor === Object && Object.prototype.hasOwnProperty.call(cell, "data") && !Object.keys(cell).find(key => !(["text", "order", "data"].includes(key)))) {
        return (cell as cellType)
    }
    const cellData : cellType = {
        data: cell
    }
    switch (columnSettings.type) {
    case "string":
        if (!(typeof cell === "string")) {
            cellData.text = String(cellData.data)
            cellData.order = cellData.text
        }
        break
    case "date":
        if (columnSettings.format) {
            cellData.order = parseDate(String(cellData.data), columnSettings.format)
        }
        break
    case "number":
        cellData.text = String(cellData.data as number)
        cellData.data = parseInt(cellData.data as string, 10)
        break
    case "html": {
        const node = Array.isArray(cellData.data) ?
            {nodeName: "TD",
                childNodes: (cellData.data as nodeType[])} : // If it is an array, we assume it is an array of nodeType
            stringToObj(`<td>${String(cellData.data)}</td>`)
        cellData.data = node.childNodes || []
        const text = objToText(node)
        cellData.text = text
        cellData.order = text
        break
    }
    case "boolean":
        if (typeof cellData.data === "string") {
            cellData.data = cellData.data.toLowerCase().trim()
        }
        cellData.data = !["false", false, null, undefined, 0].includes(cellData.data as (string | number | boolean | null | undefined))
        cellData.order = cellData.data ? 1 : 0
        cellData.text = String(cellData.data)
        break
    case "other":
        cellData.text = ""
        cellData.order = 0
        break
    default:
        cellData.text = JSON.stringify(cellData.data)
        break
    }

    return cellData
}

const readDOMDataCell = (cell: HTMLElement, columnSettings : columnSettingsType) : cellType => {
    let cellData : cellType
    switch (columnSettings.type) {
    case "string":
        cellData = {
            data: cell.innerText
        }
        break
    case "date": {
        const data = cell.innerText
        cellData = {
            data,
            order: parseDate(data, columnSettings.format)
        }
        break
    }
    case "number":
        cellData = {
            data: parseInt(cell.innerText, 10),
            text: cell.innerText
        }
        break
    case "boolean": {
        const data = !["false", "0", "null", "undefined"].includes(cell.innerText.toLowerCase().trim())
        cellData = {
            data,
            order: data ? 1 : 0,
            text: data ? "1" : "0"
        }
        break
    }
    default: { // "html", "other"
        const node = nodeToObj(cell, {valueDiffing: false})
        cellData = {
            data: node.childNodes || [],
            text: cell.innerText,
            order: cell.innerText
        }
        break
    }
    }

    return cellData
}


export const readHeaderCell = (cell: inputHeaderCellType) : headerCellType => {
    if (
        cell instanceof Object &&
        cell.constructor === Object &&
        cell.hasOwnProperty("data") &&
        (typeof cell.text === "string" || typeof cell.data === "string")
    ) {
        return cell
    }
    const cellData : headerCellType = {
        data: cell
    }
    if (typeof cell === "string") {
        if (cell.length) {
            const node = stringToObj(`<th>${cell}</th>`)
            if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                cellData.data = node.childNodes
                cellData.type = "html"
                const text = objToText(node)
                cellData.text = text
            }
        }

    } else if ([null, undefined].includes(cell)) {
        cellData.text = ""
    } else {
        cellData.text = JSON.stringify(cell)
    }
    return cellData
}

export const readDOMHeaderCell = (cell: HTMLElement) : headerCellType => {
    const node = nodeToObj(cell, {valueDiffing: false})
    let cellData
    if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
        cellData = {
            data: node.childNodes,
            type: "html",
            text: objToText(node)
        }
    } else {
        cellData = {
            data: cell.innerText,
            type: "string"
        }
    }
    return cellData

}

export const readTableData = (dataOption: DataOption, dom: (HTMLTableElement | undefined)=undefined, columnSettings, defaultType, defaultFormat) => {

    const data = {
        data: [],
        headings: []
    }
    if (dataOption.headings) {
        data.headings = dataOption.headings.map((heading: inputHeaderCellType) => readHeaderCell(heading))
    } else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map((th, index) => {
            const heading = readDOMHeaderCell(th)
            if (!columnSettings[index]) {
                columnSettings[index] = {
                    type: defaultType,
                    format: defaultFormat,
                    searchable: true,
                    sortable: true
                }
            }
            const settings = columnSettings[index]
            if (th.dataset.sortable?.trim().toLowerCase() === "false" || th.dataset.sort?.trim().toLowerCase() === "false") {
                settings.sortable = false
            }
            if (th.dataset.searchable?.trim().toLowerCase() === "false") {
                settings.searchable = false
            }
            if (th.dataset.hidden?.trim().toLowerCase() === "true" || th.getAttribute("hidden")?.trim().toLowerCase() === "true") {
                settings.hidden = true
            }
            if (["number", "string", "html", "date", "boolean", "other"].includes(th.dataset.type)) {
                settings.type = th.dataset.type
                if (settings.type === "date" && th.dataset.format) {
                    settings.format = th.dataset.format
                }
            }
            return heading
        })
    } else if (dataOption.data?.length) {
        data.headings = dataOption.data[0].map((_cell: inputCellType) => readHeaderCell(""))
    } else if (dom?.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map((_cell: HTMLElement) => readHeaderCell(""))
    }
    for (let i=0; i<data.headings.length; i++) {
        // Make sure that there are settings for all columns
        if (!columnSettings[i]) {
            columnSettings[i] = {
                type: defaultType,
                format: defaultFormat,
                sortable: true,
                searchable: true
            }
        }
    }
    if (dataOption.data) {
        data.data = dataOption.data.map((row: inputCellType[]) => row.map((cell: inputCellType, index: number) => readDataCell(cell, columnSettings[index])))
    } else if (dom?.tBodies?.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(
            row => Array.from(row.cells).map(
                (cell, index) => {
                    const cellData = cell.dataset.content ?
                        readDataCell(cell.dataset.content, columnSettings[index]) :
                        readDOMDataCell(cell, columnSettings[index])
                    if (cell.dataset.order) {
                        cellData.order = isNaN(parseFloat(cell.dataset.order)) ? cell.dataset.order : parseFloat(cell.dataset.order)
                    }
                    return cellData

                }
            )
        )
    }

    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error(
            "Data heading length mismatch."
        )
    }
    return data
}
