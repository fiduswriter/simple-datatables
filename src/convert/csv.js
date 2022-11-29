import {
    isObject
} from "../helpers"

/**
 * Convert CSV data to fit the format used in the table.
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
export const convertCSV = function(userOptions = {}) {
    let obj = false
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

    if (options.data.length || isObject(options.data)) {
        // Import CSV
        obj = {
            data: []
        }

        // Split the string into rows
        const rows = options.data.split(options.lineDelimiter)

        if (rows.length) {

            if (options.headings) {
                obj.headings = rows[0].split(options.columnDelimiter)
                if (options.removeDoubleQuotes) {
                    obj.headings = obj.headings.map(e => e.trim().replace(/(^"|"$)/g, ""))
                }
                rows.shift()
            }

            rows.forEach((row, i) => {
                obj.data[i] = []

                // Split the rows into values
                const values = row.split(options.columnDelimiter)

                if (values.length) {
                    values.forEach(value => {
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
