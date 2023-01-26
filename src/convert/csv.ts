import {
    isObject
} from "../helpers"

interface csvConvertUserOptions {
  lineDelimiter?: string,
  columnDelimiter?: string
  removeDoubleQuotes?: boolean
  data: string,
  headings?: string[],
}


/**
 * Convert CSV data to fit the format used in the table.
 */
export const convertCSV = function(userOptions : csvConvertUserOptions) {
    let obj
    const defaults = {
        lineDelimiter: "\n",
        columnDelimiter: ",",
        removeDoubleQuotes: false
    }

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    }

    if (options.data.length) {
        // Import CSV
        obj = {
            data: []
        }

        // Split the string into rows
        const rows : string[] = options.data.split(options.lineDelimiter)

        if (rows.length) {

            if (options.headings) {
                obj.headings = rows[0].split(options.columnDelimiter)
                if (options.removeDoubleQuotes) {
                    obj.headings = obj.headings.map((e: string) => e.trim().replace(/(^"|"$)/g, ""))
                }
                rows.shift()
            }

            rows.forEach((row: string, i: number) => {
                obj.data[i] = []

                // Split the rows into values
                const values = row.split(options.columnDelimiter)

                if (values.length) {
                    values.forEach((value: string) => {
                        if (options.removeDoubleQuotes) {
                            value = value.trim().replace(/(^"|"$)/g, "")
                        }
                        obj.data[i].push(value)
                    })
                }
            })
        }

        if (obj) {
            return obj
        }
    }

    return false
}
