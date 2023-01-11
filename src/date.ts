import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customParseFormat)

/**
 * Use dayjs to parse cell contents for sorting
 */
export const parseDate = (content: string, format: string) => {
    let date: number | string

    // Converting to YYYYMMDD ensures we can accurately sort the column numerically

    if (format) {
        switch (format) {
        case "ISO_8601":
            // ISO8601 is already lexiographically sorted, so we can just sort it as a string.
            date = content
            break
        case "RFC_2822":
            date = dayjs(content.slice(5), "DD MMM YYYY HH:mm:ss ZZ").unix()
            break
        case "MYSQL":
            date = dayjs(content, "YYYY-MM-DD hh:mm:ss").unix()
            break
        case "UNIX":
            date = dayjs(content).unix()
            break
        // User defined format using the data-format attribute or columns[n].format option
        default:
            date = dayjs(content, format, true).valueOf()
            break
        }
    }
    return date
}
