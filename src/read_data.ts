import {stringToObj} from "diff-dom"
import {parseDate} from "./date"
import {objToText} from "./helpers"
import {cellType, DataOption, inputCellType} from "./interfaces"

export const readDataCell = (cell: inputCellType, columnSettings = {}) : cellType => {
    if (cell.constructor == Object && cell instanceof Object) {
        return cell
    }
    const cellData : cellType = {
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
    // @ts-expect-error TS(2339): Property 'type' does not exist on type '{}'.
    if (columnSettings.type === "date" && columnSettings.format) {
        // @ts-expect-error TS(2339): Property 'order' does not exist on type '{ data: a... Remove this comment to see the full error message
        cellData.order = parseDate(cell, columnSettings.format)
    }

    return cellData
}


export const readTableData = (dataOption: DataOption, dom: HTMLTableElement | false=false, columnSettings: any) => {
    const data = {
        data: [],
        headings: []
    }
    if (dataOption.data) {
        data.data = dataOption.data.map((row: any) => row.map((cell: any, index: any) => readDataCell(cell, columnSettings.columns[index])))
    // @ts-expect-error TS(2339): Property 'tBodies' does not exist on type 'boolean... Remove this comment to see the full error message
    } else if (dom?.tBodies?.length) {
        // @ts-expect-error TS(2322): Type 'any[][]' is not assignable to type 'never[]'... Remove this comment to see the full error message
        data.data = Array.from(dom.tBodies[0].rows).map(
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            row => Array.from(row.cells).map(
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                (cell, index) => readDataCell(cell.dataset.content || cell.innerHTML, columnSettings.columns[index])
            )
        )
    }
    if (dataOption.headings) {
        data.headings = dataOption.headings.map((heading: any) => ({
            data: heading,
            sorted: false
        }))
    // @ts-expect-error TS(2339): Property 'tHead' does not exist on type 'boolean'.
    } else if (dom?.tHead) {
        // @ts-expect-error TS(2322): Type '{ data: any; sorted: boolean; }[]' is not as... Remove this comment to see the full error message
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(th => {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            const heading = {data: th.innerHTML,
                sorted: false}
            // @ts-expect-error TS(2339): Property 'sortable' does not exist on type '{ data... Remove this comment to see the full error message
            heading.sortable = th.dataset.sortable !== "false"
            return heading
        })
    } else if (dataOption.data?.length) {
        data.headings = dataOption.data[0].map((_cell: any) => "")
    // @ts-expect-error TS(2339): Property 'tBodies' does not exist on type 'boolean... Remove this comment to see the full error message
    } else if (dom?.tBodies.length) {
        // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'never[]... Remove this comment to see the full error message
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(_cell => "")
    }

    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error(
            "Data heading length mismatch."
        )
    }
    return data
}
