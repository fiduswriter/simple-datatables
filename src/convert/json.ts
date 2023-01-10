import {
    isJson,
    isObject
} from "../helpers"

/**
 * Convert JSON data to fit the format used in the table.
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
export const convertJSON = function(userOptions = {}) {
    let obj = false
    const defaults = {
        data: ""
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
        const json = isJson(options.data)

        // Valid JSON string
        if (json) {
            // @ts-expect-error TS(2322): Type '{ headings: never[]; data: never[]; }' is no... Remove this comment to see the full error message
            obj = {
                headings: [],
                data: []
            }

            // @ts-expect-error TS(2339): Property 'forEach' does not exist on type 'true'.
            json.forEach((data: any, i: any) => {
                // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                obj.data[i] = []
                Object.entries(data).forEach(([column, value]) => {
                    // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                    if (!obj.headings.includes(column)) {
                        // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                        obj.headings.push(column)
                    }
                    if (value?.constructor == Object) {
                        // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                        obj.data[i].push(value)
                    } else {
                        // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                        obj.data[i].push({data: value})
                    }

                })
            })
        } else {
            console.warn("That's not valid JSON!")
        }

        if (obj) {
            return obj
        }
    }

    return false
}
