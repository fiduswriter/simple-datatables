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
 * Export table to JSON
 */

 interface jsonUserOptions {
   download?: boolean,
   skipColumn?: number[],
   replacer?: null | ((key, value) => string) | (string | number)[],
   space?: number,
   selection?: number | number[],
   filename?: string,
 }


export const exportJSON = function(dt: DataTable, userOptions: jsonUserOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows) return false


    const defaults = {
        download: true,
        skipColumn: [],
        replacer: null,
        space: 4
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

    const rows: cellDataType[][] = selectedRows.map((row: dataRowType) => {
        const shownCells = row.cells.filter((_cell: cellType, index: number) => columnShown(index))
        return shownCells.map((cell: cellType) => cellToText(cell))
    })

    const headers = dt.data.headings.filter((_heading: headerCellType, index: number) => columnShown(index)).map((header: headerCellType) => header.text ?? String(header.data))

    // Only proceed if we have data
    if (rows.length) {
        const arr: (void | { [key: string]: cellDataType})[] = []
        rows.forEach((row: cellDataType[], x: number) => {
            arr[x] = arr[x] || {}
            row.forEach((cell: cellDataType, i: number) => {
                arr[x][headers[i]] = cell
            })
        })

        // Convert the array of objects to JSON string
        const str = JSON.stringify(arr, options.replacer, options.space)

        // Download
        if (options.download) {
            // Create a link to trigger the download

            const blob = new Blob(
                [str],
                {
                    type: "data:application/json;charset=utf-8"
                }
            )
            const url = URL.createObjectURL(blob)


            const link = document.createElement("a")
            link.href = url
            link.download = `${options.filename || "datatable_export"}.json`

            // Append the link
            document.body.appendChild(link)

            // Trigger the download
            link.click()

            // Remove the link
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }

        return str
    }

    return false
}
