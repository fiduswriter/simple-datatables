import {stringToObj} from "diff-dom"
import {parseDate} from "./date"
import {objToText} from "./helpers"
import {cellType, DataOption, headerCellType, inputCellType, inputHeaderCellType, columnSettingsType} from "./interfaces"

export const readDataCell = (cell: inputCellType, columnSettings : {type?: "date", format?: string, } = {}) : cellType => {
    if (cell instanceof Object && cell.constructor === Object && cell.hasOwnProperty("data") && (typeof cell.text === "string" || typeof cell.data === "string")) {
        return cell
    }
    const cellData : cellType = {
        data: cell
    }
    if (typeof cell === "string") {
        if (cell.length) {
            const node = stringToObj(`<td>${cell}</td>`)
            if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                cellData.data = node.childNodes
                cellData.type = "node"
                const text = objToText(node)
                cellData.text = text
                cellData.order = text
            }
        }

    } else if ([null, undefined].includes(cell)) {
        cellData.text = ""
        cellData.order = 0
    } else {
        cellData.text = JSON.stringify(cell)
    }

    if (columnSettings.type === "date" && columnSettings.format) {
        cellData.order = parseDate(String(cell), columnSettings.format)
    }
    return cellData
}


export const readHeaderCell = (cell: inputHeaderCellType) : headerCellType => {
    if (cell instanceof Object && cell.constructor === Object && cell.hasOwnProperty("data") && (typeof cell.text === "string" || typeof cell.data === "string")) {
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
                cellData.type = "node"
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

export const readTableData = (dataOption: DataOption, dom: (HTMLTableElement | undefined)=undefined, columnSettings) => {
    const data = {
        data: [],
        headings: []
    }
    if (dataOption.headings) {
        data.headings = dataOption.headings.map((heading: inputHeaderCellType) => readHeaderCell(heading))
    } else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map((th, index) => {
            const heading = readHeaderCell(th.innerHTML)
            const settings : columnSettingsType = {}
            if (th.dataset.sortable === "false" || th.dataset.sort === "false") {
                settings.notSortable = true
            }
            if (th.dataset.hidden === "true" || th.getAttribute("hidden") === "true") {
                settings.hidden = true
            }
            if (th.dataset.type === "date") {
                settings.type = "date"
                if (th.dataset.format) {
                    settings.format = th.dataset.format
                }
            }
            if (Object.keys(settings).length) {
                if (!columnSettings.columns[index]) {
                    columnSettings.columns[index] = {}
                }
                columnSettings.columns[index] = {
                    ...columnSettings.columns[index],
                    ...settings
                }
            }
            return heading
        })
    } else if (dataOption.data?.length) {
        data.headings = dataOption.data[0].map((_cell: inputCellType) => readHeaderCell(""))
    } else if (dom?.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map((_cell: HTMLElement) => readHeaderCell(""))
    }
    if (dataOption.data) {
        data.data = dataOption.data.map((row: any) => row.map((cell: inputCellType, index: number) => readDataCell(cell, columnSettings.columns[index])))
    } else if (dom?.tBodies?.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(
            row => Array.from(row.cells).map(
                (cell, index) => readDataCell(cell.dataset.content || cell.innerHTML, columnSettings.columns[index])
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
