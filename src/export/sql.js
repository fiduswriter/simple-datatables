import {
    isObject
} from "../helpers"

/**
 * Export table to SQL
 */
export const exportSQL = function(dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows) return false

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
        // Begin INSERT statement
        let str = `INSERT INTO \`${options.tableName}\` (`

        // Convert table headings to column names
        headers.forEach(header => {
            str += `\`${header}\`,`
        })

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1)

        // Begin VALUES
        str += ") VALUES "

        // Iterate rows and convert cell data to column values

        rows.forEach(row => {
            str += "("
            row.forEach(cell => {
                if (typeof cell === "string") {
                    str += `"${cell}",`
                } else {
                    str += `${cell},`
                }
            })
            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1)

            // end VALUES
            str += "),"

        })

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
            const link = document.createElement("a")
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
