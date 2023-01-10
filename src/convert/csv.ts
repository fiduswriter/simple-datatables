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

    // @ts-expect-error TS(2339): Property 'data' does not exist on type '{ lineDeli... Remove this comment to see the full error message
    if (options.data.length || isObject(options.data)) {
        // Import CSV
        // @ts-expect-error TS(2322): Type '{ data: never[]; }' is not assignable to typ... Remove this comment to see the full error message
        obj = {
            data: []
        }

        // Split the string into rows
        // @ts-expect-error TS(2339): Property 'data' does not exist on type '{ lineDeli... Remove this comment to see the full error message
        const rows = options.data.split(options.lineDelimiter)

        if (rows.length) {

            // @ts-expect-error TS(2339): Property 'headings' does not exist on type '{ line... Remove this comment to see the full error message
            if (options.headings) {
                // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                obj.headings = rows[0].split(options.columnDelimiter)
                if (options.removeDoubleQuotes) {
                    // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                    obj.headings = obj.headings.map((e: any) => e.trim().replace(/(^"|"$)/g, ""))
                }
                rows.shift()
            }

            rows.forEach((row: any, i: any) => {
                // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                obj.data[i] = []

                // Split the rows into values
                const values = row.split(options.columnDelimiter)

                if (values.length) {
                    values.forEach((value: any) => {
                        if (options.removeDoubleQuotes) {
                            value = value.trim().replace(/(^"|"$)/g, "")
                        }
                        // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                        obj.data[i].push({data: value})
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
