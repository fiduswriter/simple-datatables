import {
    isObject
} from "../helpers"
import {DataTable} from "../datatable"
import {
    cellType,
    headerCellType
} from "../types"
/**
 * Export table to SQL
 */

 interface sqlUserOptions {
   download?: boolean,
   skipColumn?: number[],
   tableName?: string,
   selection?: number | number[],
   filename?: string,
 }

export const exportSQL = function(dt: DataTable, userOptions : sqlUserOptions = {}) {
    if (!dt.hasHeadings && !dt.hasRows) return false

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
    const columnShown = (index: number) => !options.skipColumn.includes(index) && !dt.columns.settings[index]?.hidden
    let rows : (string | number | boolean | object | undefined | null)[][] = []
    // Selection or whole table
    if (options.selection) {
        // Page number
        if (Array.isArray(options.selection)) {
            // Array of page numbers
            for (let i = 0; i < options.selection.length; i++) {
                rows = rows.concat(dt.pages[options.selection[i] - 1].map((row: {row: cellType[], index: number}) => row.row.filter((_cell: cellType, index: number) => columnShown(index)).map((cell: cellType) => cell.text ?? cell.data)))
            }
        } else {
            rows = rows.concat(dt.pages[options.selection - 1].map((row: {row: cellType[], index: number}) => row.row.filter((_cell: cellType, index: number) => columnShown(index)).map((cell: cellType) => cell.text ?? cell.data)))
        }
    } else {
        rows = rows.concat(dt.data.data.map((row: cellType[]) => row.filter((_cell: cellType, index: number) => columnShown(index)).map((cell: cellType) => cell.data)))
    }

    const headers = dt.data.headings.filter((_heading: headerCellType, index: number) => columnShown(index)).map((header: headerCellType) => header.text ?? String(header.data))
    // Only proceed if we have data
    if (rows.length) {
        // Begin INSERT statement
        let str = `INSERT INTO \`${options.tableName}\` (`

        // Convert table headings to column names
        headers.forEach((header: string) => {
            str += `\`${header}\`,`
        })

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1)

        // Begin VALUES
        str += ") VALUES "

        // Iterate rows and convert cell data to column values

        rows.forEach((row: (string | number | boolean | object | undefined | null)[]) => {
            str += "("
            row.forEach((cell: (string | number | boolean | object | undefined | null)) => {
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
