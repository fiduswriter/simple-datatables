import {stringToObj} from "diff-dom"
import {parseDate} from "./date"
import {objToText} from "./helpers"
import {cellType, DataOption, inputCellType} from "./interfaces"

export const readDataCell = (cell: inputCellType, columnSettings : {type?: "date", format?: string, } = {}) : cellType => {
    if (cell.constructor == Object && cell instanceof Object && cell.hasOwnProperty("data") && (typeof cell.text === "string" || typeof cell.data === "string")) {
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

    } else if (["null", "undefined"].includes(typeof cell)) {
        cellData.text = ""
        cellData.order = ""
    } else {
        cellData.text = JSON.stringify(cell)
    }

    if (columnSettings.type === "date" && columnSettings.format) {
        cellData.order = parseDate(String(cell), columnSettings.format)
    }

    return cellData
}


export const readTableData = (dataOption: DataOption, dom: (HTMLTableElement | undefined)=undefined, columnSettings) => {
    const data = {
        data: [],
        headings: []
    }
    if (dataOption.data) {
        data.data = dataOption.data.map((row: any) => row.map((cell: any, index: any) => readDataCell(cell, columnSettings.columns[index])))
    } else if (dom?.tBodies?.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(
            row => Array.from(row.cells).map(
                (cell, index) => readDataCell(cell.dataset.content || cell.innerHTML, columnSettings.columns[index])
            )
        )
    }
    if (dataOption.headings) {
        data.headings = dataOption.headings.map((heading: any) => ({
            data: heading,
            sorted: false
        }))
    } else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map((th, index) => {
            const heading = {data: th.innerHTML,
                sorted: false}
            if (th.dataset.sortable === "false" || th.dataset.sort === "false") {
                if (!columnSettings.columns[index]) {
                    columnSettings.columns[index] = {}
                }
                columnSettings.columns[index].notSortable = true
            }
            if (th.dataset.hidden === "true" || th.getAttribute("hidden") === "true") {
                if (!columnSettings.columns[index]) {
                    columnSettings.columns[index] = {}
                }
                columnSettings.columns[index].hidden = true
            }
            return heading
        })
    } else if (dataOption.data?.length) {
        data.headings = dataOption.data[0].map((_cell: any) => "")
    } else if (dom?.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(_cell => "")
    }

    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error(
            "Data heading length mismatch."
        )
    }
    return data
}
