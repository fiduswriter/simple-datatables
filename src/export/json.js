import {
    isObject
} from "../helpers"

/**
 * Export table to JSON
 * @param {DataTable} dataTable DataTable instance.
 * @param {Object} userOptions User options
 * @return {Boolean}
 */
export const exportJSON = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings
    let rows = []
    const arr = []
    let i
    let x
    let str
    let link

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


    // Selection or whole table
    if (options.selection) {
        // Page number
        if (!isNaN(options.selection)) {
            rows = rows.concat(dataTable.pages[options.selection - 1])
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dataTable.pages[options.selection[i] - 1])
            }
        }
    } else {
        rows = rows.concat(dataTable.activeRows)
    }

    // Only proceed if we have data
    if (rows.length) {
        // Iterate rows
        for (x = 0; x < rows.length; x++) {
            arr[x] = arr[x] || {}
            // Iterate columns
            for (i = 0; i < headers.length; i++) {
                // Check for column skip and column visibility
                if (
                    !options.skipColumn.includes(headers[i].originalCellIndex) &&
                    dataTable.columns.visible(headers[i].originalCellIndex)
                ) {
                    arr[x][headers[i].textContent] = rows[x].cells[i].textContent
                }
            }
        }

        // Convert the array of objects to JSON string
        str = JSON.stringify(arr, options.replacer, options.space)

        // Download
        if (options.download) {
            // Create a link to trigger the download
            link = document.createElement("a")
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
