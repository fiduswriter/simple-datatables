import {
    isObject
} from "../helpers"

/**
 * Export table to SQL
 */
export const exportSQL = function(dataTable: any, userOptions = {}) {
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
    const columnShown = (index: any) => !options.skipColumn.includes(index) && !dataTable.columnSettings.columns[index]?.hidden
    let rows: any = []
    // Selection or whole table
    // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
    if (options.selection) {
        // Page number
        // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        if (!isNaN(options.selection)) {
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            rows = rows.concat(dataTable.pages[options.selection - 1].map((row: any) => row.row.filter((_cell: any, index: any) => columnShown(index)).map((cell: any) => cell.data)))
        // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        } else if (Array.isArray(options.selection)) {
            // Array of page numbers
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            for (let i = 0; i < options.selection.length; i++) {
                // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map((row: any) => row.row.filter((_cell: any, index: any) => columnShown(index)).map((cell: any) => cell.data)))
            }
        }
    } else {
        rows = rows.concat(dataTable.data.data.map((row: any) => row.filter((_cell: any, index: any) => columnShown(index)).map((cell: any) => cell.data)))
    }

    const headers = dataTable.data.headings.filter((_heading: any, index: any) => columnShown(index)).map((header: any) => header.data)
    // Only proceed if we have data
    if (rows.length) {
        // Begin INSERT statement
        let str = `INSERT INTO \`${options.tableName}\` (`

        // Convert table headings to column names
        headers.forEach((header: any) => {
            str += `\`${header}\`,`
        })

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1)

        // Begin VALUES
        str += ") VALUES "

        // Iterate rows and convert cell data to column values

        rows.forEach((row: any) => {
            str += "("
            row.forEach((cell: any) => {
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
            // @ts-expect-error TS(2339): Property 'filename' does not exist on type '{ down... Remove this comment to see the full error message
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
