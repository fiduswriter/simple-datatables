import {
    isObject
} from "../helpers"

/**
 * Export table to TXT
 * @param {DataTable} dataTable DataTable instance.
 * @param {Object} userOptions User options
 * @return {Boolean}
 */
export const exportTXT = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings
    let rows = []
    let i
    let x
    let str
    let link

    const defaults = {
        download: true,
        skipColumn: []
    }

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    }

    // Include headings
    rows[0] = dataTable.header

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
        str = ""

        for (i = 0; i < rows.length; i++) {
            for (x = 0; x < rows[i].cells.length; x++) {
                // Check for column skip and visibility
                if (
                    !options.skipColumn.includes(headers[x].originalCellIndex) &&
                    dataTable.columns.visible(headers[x].originalCellIndex)
                ) {
                    let text = rows[i].cells[x].textContent
                    text = text.trim()
                    text = text.replace(/\s{2,}/g, " ")
                    text = text.replace(/\n/g, "  ")
                    text = text.replace(/"/g, "\"\"")
                    //have to manually encode "#" as encodeURI leaves it as is.
                    text = text.replace(/#/g, "%23")
                    if (text.includes(","))
                        text = `"${text}"`


                    str += text + options.columnDelimiter
                }
            }
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1)

            // Apply line delimiter
            str += options.lineDelimiter
        }

        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1)

        if (options.download) {
            str = `data:text/csv;charset=utf-8,${str}`
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            link = document.createElement("a")
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
