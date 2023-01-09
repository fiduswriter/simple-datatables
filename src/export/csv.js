import {
    isObject
} from "../helpers"

/**
 * Export table to CSV
 */
export const exportCSV = function(dataTable, userOptions = {}) {
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
    const columnShown = index => !options.skipColumn.includes(index) && !dataTable.columnSettings.columns[index]?.hidden
    let rows = []
    const headers = dataTable.data.headings.filter((_heading, index) => columnShown(index)).map(header => header.data)
    // Include headings
    rows[0] = headers

    // Selection or whole table
    if (options.selection) {
        // Page number
        if (!isNaN(options.selection)) {
            rows = rows.concat(dataTable.pages[options.selection - 1].map(row => row.row.filter((_cell, index) => columnShown(index)).map(cell => cell.data)))
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map(row => row.row.filter((_cell, index) => columnShown(index)).map(cell => cell.data)))
            }
        }
    } else {
        rows = rows.concat(dataTable.data.data.map(row => row.filter((_cell, index) => columnShown(index)).map(cell => cell.data)))
    }

    // Only proceed if we have data
    if (rows.length) {
        let str = ""
        rows.forEach(row => {
            row.forEach(cell => {
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
