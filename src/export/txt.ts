import {
    cellToText,
    isObject
} from "../helpers"
import {DataTable} from "../datatable"
import {
    cellDataType,
    cellType,
    dataRowType,
    headerCellType
} from "../types"
/**
 * Export table to TXT
 */
 interface txtUserOptions {
   download?: boolean,
   skipColumn?: number[],
   lineDelimiter?: string,
   columnDelimiter?: string,
   selection?: number | number[],
   filename?: string,
 }


export const exportTXT = function(dt: DataTable, userOptions : txtUserOptions = {}) {
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

    const headers = dt.data.headings.filter((_heading: headerCellType, index: number) => columnShown(index)).map((header: headerCellType) => header.text ?? header.data)

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
        const shownCells = row.cells.filter((_cell: cellType, index: number) => columnShown(index))
        return shownCells.map((cell: cellType) => cellToText(cell))
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

        if (options.download) {
            str = `data:text/csv;charset=utf-8,${str}`
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a")
            link.href = encodeURI(str)
            link.download = `${options.filename || "datatable_export"}.txt`

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
