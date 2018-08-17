import moment from "moment"

/**
 * Use moment.js to parse cell contents for sorting
 * @param  {String} content     The datetime string to parse
 * @param  {String} format      The format for moment to use
 * @return {String|Boolean}     Datatime string or false
 */
export const parseDate = (content, format) => {
    let date = false

    // moment() throws a fit if the string isn't a valid datetime string
    // so we need to supply the format to the constructor (https://momentjs.com/docs/#/parsing/string-format/)

    // Converting to YYYYMMDD ensures we can accurately sort the column numerically

    if (format) {
        switch (format) {
        case "ISO_8601":
            date = moment(content, moment.ISO_8601).format("YYYYMMDD")
            break
        case "RFC_2822":
            date = moment(content, "ddd, MM MMM YYYY HH:mm:ss ZZ").format("YYYYMMDD")
            break
        case "MYSQL":
            date = moment(content, "YYYY-MM-DD hh:mm:ss").format("YYYYMMDD")
            break
        case "UNIX":
            date = moment(content).unix()
            break
            // User defined format using the data-format attribute or columns[n].format option
        default:
            date = moment(content, format).format("YYYYMMDD")
            break
        }
    }

    return date
}
