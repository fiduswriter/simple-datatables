import {
    isJson,
    isObject
} from "../helpers"

interface jsonConvertUserOptions {
  lineDelimiter?: string,
  columnDelimiter?: string
  removeDoubleQuotes?: boolean
  data: string,
  headings?: string[],
}

/**
 * Convert JSON data to fit the format used in the table.
 */
export const convertJSON = function(userOptions : jsonConvertUserOptions) {
    let obj
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
        // Import JSON
        const json = isJson(options.data) ? JSON.parse(options.data) : false

        // Valid JSON string
        if (json) {
            obj = {
                headings: [],
                data: []
            }

            json.forEach((data: { [key: string]: string | number | boolean | null | undefined}, i: number) => {
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
