import {nodeToObj, stringToObj} from "diff-dom"
import {parseDate} from "./date"
import {namedNodeMapToObject, objToText} from "./helpers"
import {
    cellDataType,
    cellType,
    columnSettingsType,
    DataOption,
    dataRowType,
    headerCellType,
    inputCellType,
    inputHeaderCellType,
    inputRowType,
    nodeType
} from "./types"

export const readDataCell = (cell: inputCellType, columnSettings : columnSettingsType) : cellType => {
    let cellData : cellType
    let inputData: cellDataType
    let attributes: { [key: string]: string } | undefined

    // Check if cell is already a cellType object with data property
    if (cell?.constructor === Object && Object.prototype.hasOwnProperty.call(cell, "data") && !Object.keys(cell).find(key => !(["text", "order", "data", "attributes"].includes(key)))) {
        const cellObj = cell as cellType
        inputData = cellObj.data
        attributes = cellObj.attributes
        // If text and order are already set, return as-is
        if (cellObj.text !== undefined && cellObj.order !== undefined) {
            return cellObj
        }
        cellData = {
            data: cellObj.data,
            text: cellObj.text,
            order: cellObj.order,
            attributes: cellObj.attributes
        }
    } else {
        inputData = cell
        cellData = {
            data: cell
        }
    }
    // Only process if text/order are not already set
    if (cellData.text === undefined || cellData.order === undefined) {
        switch (columnSettings.type) {
        case "string":
            if (!(typeof inputData === "string")) {
                cellData.text = cellData.text ?? String(cellData.data)
                cellData.order = cellData.order ?? cellData.text
            }
            break
        case "date":
            if (columnSettings.format) {
                cellData.order = cellData.order ?? parseDate(String(cellData.data), columnSettings.format)
            }
            break
        case "number":
            cellData.text = cellData.text ?? String(cellData.data as number)
            cellData.data = parseFloat(cellData.data as string)
            cellData.order = cellData.order ?? cellData.data
            break
        case "html": {
            const node = Array.isArray(cellData.data) ?
                {nodeName: "TD",
                    childNodes: (cellData.data as nodeType[])} : // If it is an array, we assume it is an array of nodeType
                stringToObj(`<td>${String(cellData.data)}</td>`)
            cellData.data = node.childNodes || []
            const text = objToText(node)
            cellData.text = cellData.text ?? text
            cellData.order = cellData.order ?? text
            break
        }
        case "boolean":
            if (typeof cellData.data === "string") {
                cellData.data = cellData.data.toLowerCase().trim()
            }
            cellData.data = !["false", false, null, undefined, 0].includes(cellData.data as (string | number | boolean | null | undefined))
            cellData.order = cellData.order ?? (cellData.data ? 1 : 0)
            cellData.text = cellData.text ?? String(cellData.data)
            break
        case "other":
            cellData.text = cellData.text ?? ""
            cellData.order = cellData.order ?? 0
            break
        default:
            cellData.text = cellData.text ?? JSON.stringify(cellData.data)
            break
        }
    }

    // Preserve attributes if they were provided
    if (attributes) {
        cellData.attributes = attributes
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
    case "number": {
        const data = parseFloat(cell.innerText)
        cellData = {
            data,
            order: data,
            text: cell.innerText
        }
        break
    }
    case "boolean": {
        const data = !["false", "0", "null", "undefined"].includes(cell.innerText.toLowerCase().trim())
        cellData = {
            data,
            text: data ? "1" : "0",
            order: data ? 1 : 0
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

    // Save cell attributes to reference when rendering
    cellData.attributes = namedNodeMapToObject(cell.attributes)

    return cellData
}


export const readHeaderCell = (cell: inputHeaderCellType) : headerCellType => {
    if (
        cell instanceof Object &&
        cell.constructor === Object &&
        cell.hasOwnProperty("data")
    ) {
        // If it's already a headerCellType object, ensure text and type are set if data is a string
        const headerCell = cell as headerCellType
        if (typeof headerCell.data === "string") {
            if (!headerCell.text) {
                headerCell.text = headerCell.data
            }
            if (!headerCell.type) {
                headerCell.type = "string"
            }
        }
        return headerCell
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
    let cellData: headerCellType
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

    // Save header cell attributes to reference when rendering
    cellData.attributes = node.attributes

    return cellData

}

export const readTableData = (dataOption: DataOption, dom: (HTMLTableElement | undefined)=undefined, columnSettings, defaultType, defaultFormat) => {

    const data = {
        data: [] as dataRowType[],
        headings: [] as headerCellType[]
    }
    if (dataOption.headings) {
        // Process headings and handle colspan
        const processedHeadings: headerCellType[] = []
        dataOption.headings.forEach((heading: inputHeaderCellType) => {
            const headerCell = readHeaderCell(heading)
            const colspan = parseInt(headerCell.attributes?.colspan || "1", 10)

            processedHeadings.push(headerCell)

            // Add placeholder headings for colspan > 1
            for (let i = 1; i < colspan; i++) {
                processedHeadings.push({
                    data: "",
                    text: "",
                    attributes: {
                        "data-colspan-placeholder": "true"
                    }
                })
            }
        })
        data.headings = processedHeadings
    } else if (dom?.tHead) {
        // Collect all headings accounting for colspan
        const headings: headerCellType[] = []
        Array.from(dom.tHead.querySelectorAll("th")).forEach(th => {
            const colspan = parseInt(th.getAttribute("colspan") || "1", 10)

            // Add the actual heading with colspan data
            const heading = readDOMHeaderCell(th)
            headings.push(heading)

            // Add placeholder headings for colspan > 1
            for (let i = 1; i < colspan; i++) {
                headings.push({
                    data: "",
                    text: "",
                    attributes: {
                        "data-colspan-placeholder": "true"
                    }
                })
            }
        })

        data.headings = headings

        // Process column settings for all columns including colspan placeholders
        let columnIndex = 0
        Array.from(dom.tHead.querySelectorAll("th")).forEach(th => {
            const colspan = parseInt(th.getAttribute("colspan") || "1", 10)

            for (let i = 0; i < colspan; i++) {
                if (!columnSettings[columnIndex]) {
                    columnSettings[columnIndex] = {
                        type: defaultType,
                        format: defaultFormat,
                        searchable: true,
                        sortable: true
                    }
                }
                const settings = columnSettings[columnIndex]

                // Only apply settings from the actual th element to the first column of the colspan
                if (i === 0) {
                    if (th.dataset.sortable?.trim().toLowerCase() === "false" || th.dataset.sort?.trim().toLowerCase() === "false") {
                        settings.sortable = false
                    }
                    if (th.dataset.searchable?.trim().toLowerCase() === "false") {
                        settings.searchable = false
                    }
                    if (th.dataset.hidden?.trim().toLowerCase() === "true" || th.getAttribute("hidden")?.trim().toLowerCase() === "true") {
                        settings.hidden = true
                    }
                    if (th.dataset.type && ["number", "string", "html", "date", "boolean", "other"].includes(th.dataset.type)) {
                        settings.type = th.dataset.type
                        if (settings.type === "date" && th.dataset.format) {
                            settings.format = th.dataset.format
                        }
                    }
                }
                columnIndex++
            }
        })
    } else if (dataOption.data?.length) {
        const firstRow = dataOption.data[0]
        const firstRowCells = Array.isArray(firstRow) ? firstRow : firstRow.cells
        data.headings = firstRowCells.map((_cell: inputCellType) => readHeaderCell(""))
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
        const headings = data.headings.map((heading: headerCellType) => heading.data ? String(heading.data) : heading.text)

        // Track rowspan carryover: columnIndex -> {remainingRows, cellData}
        const rowspanCarryover: Map<number, {remainingRows: number, cellData: cellType}> = new Map()

        data.data = dataOption.data.map((row: inputRowType | inputCellType[], _rowIndex: number) => {
            let attributes: { [key: string]: string }
            let cells: inputCellType[]
            if (Array.isArray(row)) {
                attributes = {}
                cells = row
            } else if (row.hasOwnProperty("cells") && Object.keys(row).every(key => ["cells", "attributes"].includes(key))) {
                attributes = row.attributes
                cells = row.cells
            } else {
                attributes = {}
                cells = []
                Object.entries(row).forEach(([heading, cell]) => {
                    const index = headings.indexOf(heading)
                    if (index > -1) {
                        cells[index] = cell
                    }
                })
            }

            // Process cells and handle colspan and rowspan
            const processedCells: cellType[] = []
            let cellIndex = 0
            let inputCellIndex = 0

            while (cellIndex < data.headings.length) {
                // Check if this column is occupied by a rowspan from a previous row
                if (rowspanCarryover.has(cellIndex)) {
                    const carryover = rowspanCarryover.get(cellIndex)
                    // Add placeholder for rowspan
                    processedCells.push({
                        data: "",
                        text: "",
                        order: "",
                        attributes: {
                            "data-rowspan-placeholder": "true"
                        }
                    })

                    // Decrement remaining rows
                    carryover.remainingRows--
                    if (carryover.remainingRows <= 0) {
                        rowspanCarryover.delete(cellIndex)
                    }

                    cellIndex++
                } else if (inputCellIndex < cells.length) {
                    // Process the next input cell
                    const cell = cells[inputCellIndex]
                    const cellData = readDataCell(cell, columnSettings[cellIndex])
                    const colspan = parseInt(cellData.attributes?.colspan || "1", 10)
                    const rowspan = parseInt(cellData.attributes?.rowspan || "1", 10)

                    processedCells.push(cellData)

                    // Track rowspan for future rows
                    if (rowspan > 1) {
                        rowspanCarryover.set(cellIndex, {
                            remainingRows: rowspan - 1,
                            cellData
                        })
                    }

                    cellIndex++
                    inputCellIndex++

                    // Add placeholder cells for colspan > 1
                    for (let i = 1; i < colspan; i++) {
                        processedCells.push({
                            data: "",
                            text: "",
                            order: "",
                            attributes: {
                                "data-colspan-placeholder": "true"
                            }
                        })
                        cellIndex++
                    }
                } else {
                    // This shouldn't happen if data is well-formed, but handle it gracefully
                    break
                }
            }

            return {
                attributes,
                cells: processedCells
            } as dataRowType
        })
    } else if (dom?.tBodies?.length) {
        // Track rowspan carryover: columnIndex -> {remainingRows, cellData}
        const rowspanCarryover: Map<number, {remainingRows: number, cellData: cellType}> = new Map()

        data.data = Array.from(dom.tBodies[0].rows).map(
            row => {
                const cells: cellType[] = []
                let cellIndex = 0
                let domCellIndex = 0
                const domCells = Array.from(row.cells)

                while (cellIndex < data.headings.length) {
                    // Check if this column is occupied by a rowspan from a previous row
                    if (rowspanCarryover.has(cellIndex)) {
                        const carryover = rowspanCarryover.get(cellIndex)
                        // Add placeholder for rowspan
                        cells.push({
                            data: "",
                            text: "",
                            order: "",
                            attributes: {
                                "data-rowspan-placeholder": "true"
                            }
                        })

                        // Decrement remaining rows
                        carryover.remainingRows--
                        if (carryover.remainingRows <= 0) {
                            rowspanCarryover.delete(cellIndex)
                        }

                        cellIndex++
                    } else if (domCellIndex < domCells.length) {
                        // Process the next DOM cell
                        const cell = domCells[domCellIndex]
                        const colspan = parseInt(cell.getAttribute("colspan") || "1", 10)
                        const rowspan = parseInt(cell.getAttribute("rowspan") || "1", 10)

                        // Add the actual cell with colspan and rowspan data
                        const cellData = cell.dataset.content ?
                            readDataCell(cell.dataset.content, columnSettings[cellIndex]) :
                            readDOMDataCell(cell, columnSettings[cellIndex])
                        if (cell.dataset.order) {
                            cellData.order = isNaN(parseFloat(cell.dataset.order)) ? cell.dataset.order : parseFloat(cell.dataset.order)
                        }
                        cells.push(cellData)

                        // Track rowspan for future rows
                        if (rowspan > 1) {
                            rowspanCarryover.set(cellIndex, {
                                remainingRows: rowspan - 1,
                                cellData
                            })
                        }

                        cellIndex++
                        domCellIndex++

                        // Add placeholder cells for colspan > 1
                        for (let i = 1; i < colspan; i++) {
                            cells.push({
                                data: "",
                                text: "",
                                order: "",
                                attributes: {
                                    "data-colspan-placeholder": "true"
                                }
                            })
                            cellIndex++
                        }
                    } else {
                        // This shouldn't happen if DOM is well-formed, but handle it gracefully
                        break
                    }
                }

                return {
                    attributes: namedNodeMapToObject(row.attributes),
                    cells
                } as dataRowType
            }
        )
    }

    if (data.data.length && data.data[0].cells.length !== data.headings.length) {
        throw new Error(
            "Data heading length mismatch."
        )
    }
    return data
}
