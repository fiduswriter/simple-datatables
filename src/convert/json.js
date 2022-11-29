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
    const defaults = {}

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
            obj = {
                headings: [],
                data: []
            }

            json.forEach((data, i) => {
                obj.data[i] = []
                Object.entries(data).forEach(([column, value]) => {
                    if (!obj.headings.includes(column)) {
                        obj.headings.push(column)
                    }

                    obj.data[i].push(value)
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
