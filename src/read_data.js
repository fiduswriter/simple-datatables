import {stringToObj} from "diff-dom"
import {parseDate} from "./date"
import {objToText} from "./helpers"

export const readDataCell = (cell, columnSettings = {}) => {
    if (cell.constructor == Object) {
        return cell
    }
    const cellData = {
        data: cell
    }
    if (typeof cell === "string" && cell.length) {
        const node = stringToObj(`<td>${cell}</td>`)
        if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
            cellData.data = node.childNodes
            cellData.type = "node"
            const text = objToText(node)
            cellData.text = text
            cellData.order = text
        }
    }
    if (columnSettings.type === "date" && columnSettings.format) {
        cellData.order = parseDate(cell, columnSettings.format)
    }

    return cellData
}


export const readTableData = (dataOption, dom=false, columnSettings) => {
    const data = {
        data: [],
        headings: []
    }
    if (dataOption?.data) {
        data.data = dataOption.data.map(row => row.map((cell, index) => readDataCell(cell, columnSettings.columns[index])))
    } else if (dom?.tBodies.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(
            row => Array.from(row.cells).map(
                (cell, index) => readDataCell(cell.dataset.content || cell.innerHTML, columnSettings.columns[index])
            )
        )
    }
    if (dataOption?.headings) {
        data.headings = dataOption.headings.map(heading => ({data: heading,
            sorted: false}))
    } else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(th => {
            const heading = {data: th.innerHTML,
                sorted: false}
            heading.sortable = th.dataset.sortable !== "false"
            return heading
        })
    } else if (dataOption?.data?.data?.length) {
        data.headings = dataOption.data.data[0].map(_cell => "")
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
