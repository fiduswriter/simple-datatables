import {
    isObject
} from "../helpers"
import {DataTable} from "../datatable"
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


export const exportTXT = function(dataTable: DataTable, userOptions : txtUserOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

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

    const columnShown = (index: any) => !options.skipColumn.includes(index) && !dataTable.columnSettings.columns[index]?.hidden

    let rows : (string | number | boolean)[][] = []
    const headers = dataTable.data.headings.filter((_heading: any, index: any) => columnShown(index)).map((header: any) => header.text ?? header.data)
    // Include headings
    rows[0] = headers

    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map((row: any) => row.row.filter((_cell: any, index: any) => columnShown(index)).map((cell: any) => cell.text ?? cell.data)))
            }
        } else {
            rows = rows.concat(dataTable.pages[options.selection - 1].map((row: any) => row.row.filter((_cell: any, index: any) => columnShown(index)).map((cell: any) => cell.text ?? cell.data)))
        }
    } else {
        rows = rows.concat(dataTable.data.data.map((row: any) => row.filter((_cell: any, index: any) => columnShown(index)).map((cell: any) => cell.text ?? cell.data)))
    }

    // Only proceed if we have data
    if (rows.length) {
        let str = ""

        rows.forEach(row => {
            row.forEach((cell: any) => {
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
