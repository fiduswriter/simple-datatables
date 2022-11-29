import {
    isObject
} from "../helpers"

/**
 * Export table to SQL
 * @param {DataTable} dataTable DataTable instance.
 * @param {Object} userOptions User options
 * @return {Boolean}
 */
export const exportSQL = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

    const headers = dataTable.activeHeadings
    let rows = []
    let i
    let x
    let str
    let link

    const defaults = {
        download: true,
        skipColumn: [],
        tableName: "myTable"
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
        // Begin INSERT statement
        str = `INSERT INTO \`${options.tableName}\` (`

        // Convert table headings to column names
        for (i = 0; i < headers.length; i++) {
            // Check for column skip and column visibility
            if (
                !options.skipColumn.includes(headers[i].originalCellIndex) &&
                dataTable.columns.visible(headers[i].originalCellIndex)
            ) {
                str += `\`${headers[i].textContent}\`,`
            }
        }

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1)

        // Begin VALUES
        str += ") VALUES "

        // Iterate rows and convert cell data to column values
        for (i = 0; i < rows.length; i++) {
            str += "("

            for (x = 0; x < rows[i].cells.length; x++) {
                // Check for column skip and column visibility
                if (
                    !options.skipColumn.includes(headers[x].originalCellIndex) &&
                    dataTable.columns.visible(headers[x].originalCellIndex)
                ) {
                    str += `"${rows[i].cells[x].textContent}",`
                }
            }

            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1)

            // end VALUES
            str += "),"
        }

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1)

        // Add trailing colon
        str += ";"

        if (options.download) {
            str = `data:application/sql;charset=utf-8,${str}`
        }

        // Download
        if (options.download) {
            // Create a link to trigger the download
            link = document.createElement("a")
            link.href = encodeURI(str)
            link.download = `${options.filename || "datatable_export"}.sql`

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
