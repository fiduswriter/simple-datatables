import {
    cellToText,
    isObject
} from "../helpers"
import {DataTable} from "../datatable"
import {
    cellDataType,

    dataRowType,
    headerCellType
} from "../types"

/**
 * Export table to CSV
 */

interface csvUserOptions {
  download?: boolean,
  skipColumn?: number[],
  lineDelimiter?: string,
  columnDelimiter?: string,
  selection?: number | number[],
  filename?: string,
}


export const exportCSV = function(dt: DataTable, userOptions: csvUserOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows) return false

    const defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    }

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    }
    const columnShown = (index: number) => !options.skipColumn.includes(index) && !dt.columns.settings[index]?.hidden
    // Handle colspan in headers by adding empty columns
    const headers = dt.data.headings
        .filter((_heading: headerCellType, index: number) => columnShown(index))
        .map((header: headerCellType) => {
            const colspan = Number(header.attributes?.colspan || 1)
            const headerText = header.text ?? header.data
            return [headerText, ...Array(colspan - 1).fill("")]
        })
        .flat()

    // Track rowspan for cells: column index -> {remainingRows, cellText}
    const rowspanCarryover: Map<number, {remainingRows: number, cellText: string}> = new Map()

    // Selection or whole table
    let selectedRows: dataRowType[]
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            selectedRows = []
            for (let i = 0; i < options.selection.length; i++) {
                selectedRows = selectedRows.concat(dt.pages[options.selection[i] - 1].map(row => row.row))
            }

        } else {
            selectedRows = dt.pages[options.selection - 1].map(row => row.row)
        }
    } else {
        selectedRows = dt.data.data
    }

    let rows : cellDataType[][] = []
    // Include headings
    rows[0] = headers
    rows = rows.concat(selectedRows.map((row: dataRowType) => {
        const csvRow: cellDataType[] = []
        let csvColumnIndex = 0
        let dataColumnIndex = 0

        while (dataColumnIndex < row.cells.length) {
            const cell = row.cells[dataColumnIndex]


            if (columnShown(dataColumnIndex)) {


                // Check if this column is occupied by a rowspan from a previous row
                if (rowspanCarryover.has(csvColumnIndex)) {
                    const carryover = rowspanCarryover.get(csvColumnIndex)
                    // Use the carried over text
                    csvRow.push(carryover.cellText)

                    // Decrement remaining rows
                    carryover.remainingRows--
                    if (carryover.remainingRows <= 0) {
                        rowspanCarryover.delete(csvColumnIndex)
                    }

                    csvColumnIndex++
                    dataColumnIndex++
                } else if (cell.attributes?.["data-rowspan-placeholder"] === "true") {
                // This is a placeholder, should have been handled by carryover
                    dataColumnIndex++
                } else if (cell.attributes?.["data-colspan-placeholder"] === "true") {
                // Colspan placeholder - add empty cell
                    csvRow.push("")
                    csvColumnIndex++
                    dataColumnIndex++
                } else {
                // Regular cell or cell with colspan/rowspan
                    const colspan = Number(cell.attributes?.colspan || 1)
                    const rowspan = Number(cell.attributes?.rowspan || 1)
                    const cellText = cellToText(cell)

                    // Add the cell and colspan placeholders
                    csvRow.push(cellText)
                    for (let i = 1; i < colspan; i++) {
                        csvRow.push("")
                    }

                    // Track rowspan for future rows
                    if (rowspan > 1) {
                        rowspanCarryover.set(csvColumnIndex, {
                            remainingRows: rowspan - 1,
                            cellText
                        })
                    }

                    csvColumnIndex++
                    dataColumnIndex++
                }

            } else {
                // Skip hidden columns and placeholder cells
                dataColumnIndex++
            }
        }

        return csvRow
    }))

    // Only proceed if we have data
    if (rows.length) {
        let str = ""
        rows.forEach(row => {
            row.forEach((cell: cellDataType) => {
                if (typeof cell === "string") {
                    cell = cell.trim()
                    cell = cell.replace(/\s{2,}/g, " ")
                    cell = cell.replace(/\n/g, "  ")
                    cell = cell.replace(/"/g, "\"\"")
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23")
                    if (cell.includes(",")) {
                        cell = `"${cell}"`
                    }
                }
                str += cell + options.columnDelimiter
            })
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1)

            // Apply line delimiter
            str += options.lineDelimiter
        })

        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1)

        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a")
            link.href = encodeURI(`data:text/csv;charset=utf-8,${str}`)
            link.download = `${options.filename || "datatable_export"}.csv`

            // Append the link
            document.body.appendChild(link)

            // Trigger the download
            link.click()

            // Remove the link
            document.body.removeChild(link)
        }

        return str
    }

    return false
}
