import {
    isObject
} from "../helpers"

/**
 * Export table to JSON
 */
export const exportJSON = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false


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

    const columnShown = index => !options.skipColumn.includes(index) && !dataTable.columnSettings.columns[index]?.hidden

    let rows = []
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

    const headers = dataTable.data.headings.filter((_heading, index) => columnShown(index)).map(header => header.data)

    // Only proceed if we have data
    if (rows.length) {
        const arr = []
        rows.forEach((row, x) => {
            arr[x] = arr[x] || {}
            row.forEach((cell, i) => {
                arr[x][headers[i]] = cell
            })
        })

        // Convert the array of objects to JSON string
        const str = JSON.stringify(arr, options.replacer, options.space)

        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a")
            link.href = encodeURI(`data:application/json;charset=utf-8,${str}`)
            link.download = `${options.filename || "datatable_export"}.json`

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
