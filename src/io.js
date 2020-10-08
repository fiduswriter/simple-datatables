/*
 * This module defines methods for the DataTable class
 * that handle importing data into or exporting data from a DataTable object.
 *
 * Note that import and export are reserved names in JavaScript so
 *  we cannot use those variable names here, so we name them importData and exportData here.
 *  They are still referenced as DataTable.import and DataTable.export by the end user.
 */

import {
    isIterable,
    isObject,
    isJson,
    createElement
} from "./helpers"


/**
 * Populates this DataTable's internal model (this.headings, this.data)
 * with contents of an options.data object
 *
 *
 * @param {object} data
 */
export const insert = function(data) {

    let newRows

    if (isObject(data)) {
        /*
         * data is an object of the form
         *   {
         *      headings: [h1, h2, ..., hn],
         *      data: [[d11, d12, ..., d1n],
         *             [d21, d22, ..., d2n,
         *             ...,
         *             [dm1, dm2, ..., dmn]]
         *    }
         *
         * data.data doesn't need to be an array of length-n arrays.
         *  it can be any finite iterable of length-n arrays, eg. a generator.
         */
        if (data.headings) {
            if (this.hasHeadings || this.hasRows) {
                throw new Error(
                    `attempted to insert from data obejct into non-empty dataTable.
                     use Rows.add or Colummns.add instead`
                )
            } else {
                const tr = createElement("tr")
                data.headings.forEach(heading => {
                    const th = createElement("th", {
                        html: heading
                    })

                    tr.appendChild(th)
                })
                this.head.appendChild(tr)

                this.header = tr
                this.headings = [].slice.call(tr.cells)
                this.hasHeadings = true

                // Re-enable sorting if it was disabled due
                // to missing header
                this.options.sortable = this.initialSortable

                // Allow sorting on new header
                // this.render("header")

                // Activate newly added headings
                this.activeHeadings = this.headings.slice()
            }

            // Set up renderers and other column properties
            if (this.options.columns) {
                this.setColumns()
            }
        }

        if (data.data) {
            newRows = data.data
        }
    } else if (isIterable(data)) {
        /*
         * data is an iterable of the form
         * [
         *   {h1: d11, h2: d12, ..., hn: d1n},
         *   {h1: d21, h2: d22, ..., hn: d2n},
         *   ...,
         *   {h1: dm1, h2: dm2, ..., hn: dmn},
         * ]
         *
         * Note: this is only for adding to a table that already has headers
         */

        // in this case rows is a generator that yields arrays
        newRows = function *() {
            for (const dRow of data) {
                const r = []
                Object.entries(dRow).forEach(([heading, cell]) => {

                    const index = this.labels.indexOf(heading)

                    if (index > -1) {
                        r[index] = cell
                    }
                })
                yield r
            }
        }
    }

    if (newRows) {
        this.rows().add(newRows)
    }
    this.update()
    this.fixColumns()
}


/**
 * Import data to the table
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
export const importData = function(userOptions) {
    let obj = false
    const defaults = {
        // csv
        lineDelimiter: "\n",
        columnDelimiter: ","
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
        if (options.type === "csv") {
            obj = {
                data: []
            }

            // Split the string into rows
            const rows = options.data.split(options.lineDelimiter)

            if (rows.length) {

                if (options.headings) {
                    obj.headings = rows[0].split(options.columnDelimiter)

                    rows.shift()
                }

                rows.forEach((row, i) => {
                    obj.data[i] = []

                    // Split the rows into values
                    const values = row.split(options.columnDelimiter)

                    if (values.length) {
                        values.forEach(value => {
                            obj.data[i].push(value)
                        })
                    }
                })
            }
        } else if (options.type === "json") {
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
                // console.warn("That's not valid JSON!")
            }
        }

        if (isObject(options.data)) {
            obj = options.data
        }

        if (obj) {
            // Add the rows
            this.insert(obj)
        }
    }

    return false
}


/**
 * Implements the ajax option for importing data into a new dataTable
 * @param  {Object} ajax [description]
 */
export const ajaxImport = function(ajax) {
    const xhr = new XMLHttpRequest()

    const xhrProgress = e => {
        this.emit("datatable.ajax.progress", e, xhr)
    }

    const xhrLoad = e => {
        if (xhr.readyState === 4) {
            this.emit("datatable.ajax.loaded", e, xhr)

            if (xhr.status === 200) {
                const obj = {}
                obj.data = ajax.load ? ajax.load.call(this, xhr) : xhr.responseText

                obj.type = "json"

                if (ajax.content && ajax.content.type) {
                    obj.type = ajax.content.type

                    Object.assign(obj, ajax.content)
                }

                this.import(obj)

                this.emit("datatable.ajax.success", e, xhr)
            } else {
                this.emit("datatable.ajax.error", e, xhr)
            }
        }
    }

    const xhrFailed = e => {
        this.emit("datatable.ajax.error", e, xhr)
    }

    const xhrCancelled = e => {
        this.emit("datatable.ajax.abort", e, xhr)
    }

    xhr.addEventListener("progress", xhrProgress, false)
    xhr.addEventListener("load", xhrLoad, false)
    xhr.addEventListener("error", xhrFailed, false)
    xhr.addEventListener("abort", xhrCancelled, false)

    this.emit("datatable.ajax.loading", xhr)

    xhr.open("GET", typeof ajax === "string" ? ajax : ajax.url)
    xhr.send()
}

/**
 * Export table to various formats (csv, txt or sql)
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
export const exportData = function(userOptions) {
    if (!this.hasHeadings && !this.hasRows) return false

    const headers = this.activeHeadings
    let rows = []
    const arr = []
    let i
    let x
    let str
    let link

    const defaults = {
        download: true,
        skipColumn: [],

        // csv
        lineDelimiter: "\n",
        columnDelimiter: ",",

        // sql
        tableName: "myTable",

        // json
        replacer: null,
        space: 4
    }

    // Check for the options object
    if (!isObject(userOptions)) {
        return false
    }

    const options = {
        ...defaults,
        ...userOptions
    }

    if (options.type) {
        if (options.type === "txt" || options.type === "csv") {
            // Include headings
            rows[0] = this.header
        }

        // Selection or whole table
        if (options.selection) {
            // Page number
            if (!isNaN(options.selection)) {
                rows = rows.concat(this.pages[options.selection - 1])
            } else if (Array.isArray(options.selection)) {
                // Array of page numbers
                for (i = 0; i < options.selection.length; i++) {
                    rows = rows.concat(this.pages[options.selection[i] - 1])
                }
            }
        } else {
            rows = rows.concat(this.activeRows)
        }

        // Only proceed if we have data
        if (rows.length) {
            if (options.type === "txt" || options.type === "csv") {
                str = ""

                for (i = 0; i < rows.length; i++) {
                    for (x = 0; x < rows[i].cells.length; x++) {
                        // Check for column skip and visibility
                        if (
                            !options.skipColumn.includes(headers[x].originalCellIndex) &&
                            this.columns(headers[x].originalCellIndex).visible()
                        ) {
                            let text = rows[i].cells[x].textContent
                            text = text.trim()
                            text = text.replace(/\s{2,}/g, ' ')
                            text = text.replace(/\n/g, '  ')
                            text = text.replace(/"/g, '""')
                            //have to manually encode "#" as encodeURI leaves it as is.
                            text = text.replace(/#/g, "%23")
                            if (text.includes(","))
                                text = `"${text}"`


                            str += text + options.columnDelimiter
                        }
                    }
                    // Remove trailing column delimiter
                    str = str.trim().substring(0, str.length - 1)

                    // Apply line delimiter
                    str += options.lineDelimiter
                }

                // Remove trailing line delimiter
                str = str.trim().substring(0, str.length - 1)

                if (options.download) {
                    str = `data:text/csv;charset=utf-8,${str}`
                }
            } else if (options.type === "sql") {
                // Begin INSERT statement
                str = `INSERT INTO \`${options.tableName}\` (`

                // Convert table headings to column names
                for (i = 0; i < headers.length; i++) {
                    // Check for column skip and column visibility
                    if (
                        !options.skipColumn.includes(headers[i].originalCellIndex) &&
                        this.columns(headers[i].originalCellIndex).visible()
                    ) {
                        str += `\`${headers[i].textContent}\`,`
                    }
                }

                // Remove trailing comma
                str = str.trim().substring(0, str.length - 1)

                // Begin VALUES
                str += ") VALUES "

                // Iterate rows and convert cell data to column values
                for (i = 0; i < rows.length; i++) {
                    str += "("

                    for (x = 0; x < rows[i].cells.length; x++) {
                        // Check for column skip and column visibility
                        if (
                            !options.skipColumn.includes(headers[x].originalCellIndex) &&
                            this.columns(headers[x].originalCellIndex).visible()
                        ) {
                            str += `"${rows[i].cells[x].textContent}",`
                        }
                    }

                    // Remove trailing comma
                    str = str.trim().substring(0, str.length - 1)

                    // end VALUES
                    str += "),"
                }

                // Remove trailing comma
                str = str.trim().substring(0, str.length - 1)

                // Add trailing colon
                str += ";"

                if (options.download) {
                    str = `data:application/sql;charset=utf-8,${str}`
                }
            } else if (options.type === "json") {
                // Iterate rows
                for (x = 0; x < rows.length; x++) {
                    arr[x] = arr[x] || {}
                    // Iterate columns
                    for (i = 0; i < headers.length; i++) {
                        // Check for column skip and column visibility
                        if (
                            !options.skipColumn.includes(headers[i].originalCellIndex) &&
                            this.columns(headers[i].originalCellIndex).visible()
                        ) {
                            arr[x][headers[i].textContent] = rows[x].cells[i].textContent
                        }
                    }
                }

                // Convert the array of objects to JSON string
                str = JSON.stringify(arr, options.replacer, options.space)

                if (options.download) {
                    str = `data:application/json;charset=utf-8,${str}`
                }
            }

            // Download
            if (options.download) {
                // Filename
                options.filename = options.filename || "datatable_export"
                options.filename += `.${options.type}`

                str = encodeURI(str)

                // Create a link to trigger the download
                link = document.createElement("a")
                link.href = str
                link.download = options.filename

                // Append the link
                document.body.appendChild(link)

                // Trigger the download
                link.click()

                // Remove the link
                document.body.removeChild(link)
            }

            return str
        }
    }

    return false
}

/**
 * Print the table
 * @return {void}
 */
export const print = function() {
    const headings = this.activeHeadings
    const rows = this.activeRows
    const table = createElement("table")
    const thead = createElement("thead")
    const tbody = createElement("tbody")

    const tr = createElement("tr")
    headings.forEach(th => {
        tr.appendChild(
            createElement("th", {
                html: th.textContent
            })
        )
    })

    thead.appendChild(tr)

    rows.forEach(row => {
        const tr = createElement("tr")
        Array.from(row.cells).forEach(cell => {
            tr.appendChild(
                createElement("td", {
                    html: cell.textContent
                })
            )
        })
        tbody.appendChild(tr)
    })

    table.appendChild(thead)
    table.appendChild(tbody)

    // Open new window
    const w = window.open()

    // Append the table to the body
    w.document.body.appendChild(table)

    // Print
    w.print()
}
