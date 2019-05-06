import {isArray, each, classList, sortItems} from "./helpers"

/**
 * Columns API
 * @param {Object} instance DataTable instance
 * @param {Mixed} columns  Column index or array of column indexes
 */
export class Columns {
    constructor(dt) {
        this.dt = dt
        return this
    }

    /**
     * Swap two columns
     * @return {Void}
     */
    swap(columns) {
        if (columns.length && columns.length === 2) {
            const cols = []

            // Get the current column indexes
            each(this.dt.headings, (h, i) => {
                cols.push(i)
            })

            const x = columns[0]
            const y = columns[1]
            const b = cols[y]
            cols[y] = cols[x]
            cols[x] = b

            this.order(cols)
        }
    }

    /**
     * Reorder the columns
     * @return {Array} columns  Array of ordered column indexes
     */
    order(columns) {
        let a
        let b
        let c
        let d
        let h
        let s
        let cell

        const temp = [
            [],
            [],
            [],
            []
        ]

        const dt = this.dt

        // Order the headings
        each(columns, (column, x) => {
            h = dt.headings[column]
            s = h.getAttribute("data-sortable") !== "false"
            a = h.cloneNode(true)
            a.originalCellIndex = x
            a.sortable = s

            temp[0].push(a)

            if (!dt.hiddenColumns.includes(column)) {
                b = h.cloneNode(true)
                b.originalCellIndex = x
                b.sortable = s

                temp[1].push(b)
            }
        })

        // Order the row cells
        each(dt.data, (row, i) => {
            c = row.cloneNode(false)
            d = row.cloneNode(false)

            c.dataIndex = d.dataIndex = i

            if (row.searchIndex !== null && row.searchIndex !== undefined) {
                c.searchIndex = d.searchIndex = row.searchIndex
            }

            // Append the cell to the fragment in the correct order
            each(columns, column => {
                cell = row.cells[column].cloneNode(true)
                cell.data = row.cells[column].data
                c.appendChild(cell)

                if (!dt.hiddenColumns.includes(column)) {
                    cell = row.cells[column].cloneNode(true)
                    cell.data = row.cells[column].data
                    d.appendChild(cell)
                }
            })

            temp[2].push(c)
            temp[3].push(d)
        })

        dt.headings = temp[0]
        dt.activeHeadings = temp[1]

        dt.data = temp[2]
        dt.activeRows = temp[3]

        // Update
        dt.update()
    }

    /**
     * Hide columns
     * @return {Void}
     */
    hide(columns) {
        if (columns.length) {
            const dt = this.dt

            each(columns, column => {
                if (!dt.hiddenColumns.includes(column)) {
                    dt.hiddenColumns.push(column)
                }
            })

            this.rebuild()
        }
    }

    /**
     * Show columns
     * @return {Void}
     */
    show(columns) {
        if (columns.length) {
            let index
            const dt = this.dt

            each(columns, column => {
                index = dt.hiddenColumns.indexOf(column)
                if (index > -1) {
                    dt.hiddenColumns.splice(index, 1)
                }
            })

            this.rebuild()
        }
    }

    /**
     * Check column(s) visibility
     * @return {Boolean}
     */
    visible(columns) {
        let cols
        const dt = this.dt

        columns = columns || dt.headings.map(th => th.originalCellIndex)

        if (!isNaN(columns)) {
            cols = !dt.hiddenColumns.includes(columns)
        } else if (isArray(columns)) {
            cols = []
            each(columns, column => {
                cols.push(!dt.hiddenColumns.includes(column))
            })
        }

        return cols
    }

    /**
     * Add a new column
     * @param {Object} data
     */
    add(data) {
        let td
        const th = document.createElement("th")

        if (!this.dt.headings.length) {
            this.dt.insert({
                headings: [data.heading],
                data: data.data.map(i => [i])
            })
            this.rebuild()
            return
        }

        if (!this.dt.hiddenHeader) {
            if (data.heading.nodeName) {
                th.appendChild(data.heading)
            } else {
                th.innerHTML = data.heading
            }
        } else {
            th.innerHTML = ""
        }

        this.dt.headings.push(th)

        each(this.dt.data, (row, i) => {
            if (data.data[i]) {
                td = document.createElement("td")

                if (data.data[i].nodeName) {
                    td.appendChild(data.data[i])
                } else {
                    td.innerHTML = data.data[i]
                }

                td.data = td.innerHTML

                if (data.render) {
                    td.innerHTML = data.render.call(this, td.data, td, row)
                }

                row.appendChild(td)
            }
        })

        if (data.type) {
            th.setAttribute("data-type", data.type)
        }
        if (data.format) {
            th.setAttribute("data-format", data.format)
        }

        if (data.hasOwnProperty("sortable")) {
            th.sortable = data.sortable
            th.setAttribute("data-sortable", data.sortable === true ? "true" : "false")
        }

        this.rebuild()

        this.dt.renderHeader()
    }

    /**
     * Remove column(s)
     * @param  {Array|Number} select
     * @return {Void}
     */
    remove(select) {
        if (isArray(select)) {
            // Remove in reverse otherwise the indexes will be incorrect
            select.sort((a, b) => b - a)

            each(select, function (column) {
                this.remove(column)
            }, this)
        } else {
            this.dt.headings.splice(select, 1)

            each(this.dt.data, row => {
                row.removeChild(row.cells[select])
            })
        }

        this.rebuild()
    }

    /**
     * Sort by column
     * @param  {int} column - The column no.
     * @param  {string} dir - asc or desc
     * @return {void}
     */
    sort(column, dir, init) {
        const dt = this.dt

        // Check column is present
        if (dt.hasHeadings && (column < 0 || column > dt.headings.length)) {
            return false
        }

        dt.sorting = true

        let rows = dt.data
        const alpha = []
        const numeric = []
        let a = 0
        let n = 0
        const th = dt.headings[column]
        let parseFunction = content => content
        const waitFor = []

        // Check for date format
        if (th.getAttribute("data-type") === "date") {
            let format = false
            const formatted = th.hasAttribute("data-format")

            if (formatted) {
                format = th.getAttribute("data-format")
            }
            waitFor.push(import("./date").then(({parseDate}) => {
                parseFunction = content => parseDate(content, format)
            }))
        }

        Promise.all(waitFor).then(() => {
            Array.from(rows).forEach(tr => {
                const cell = tr.cells[column]
                const content = cell.hasAttribute('data-content') ? cell.getAttribute('data-content') : cell.innerText
                const num = parseFunction(typeof content==="string" ? content.replace(/(\$|,|\s|%)/g, "") : content)

                if (parseFloat(num) == num) {
                    numeric[n++] = {
                        value: Number(num),
                        row: tr
                    }
                } else {
                    alpha[a++] = {
                        value: content,
                        row: tr
                    }
                }
            })

            /* Sort according to direction (ascending or descending) */
            if (!dir) {
                if (classList.contains(th, "asc")) {
                    dir = "desc"
                } else {
                    dir = "asc"
                }
            }
            let top
            let btm
            if (dir == "desc") {
                top = sortItems(alpha, -1)
                btm = sortItems(numeric, -1)
                classList.remove(th, "asc")
                classList.add(th, "desc")
            } else {
                top = sortItems(numeric, 1)
                btm = sortItems(alpha, 1)
                classList.remove(th, "desc")
                classList.add(th, "asc")
            }

            /* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
            if (dt.lastTh && th != dt.lastTh) {
                classList.remove(dt.lastTh, "desc")
                classList.remove(dt.lastTh, "asc")
            }

            dt.lastTh = th

            /* Reorder the table */
            rows = top.concat(btm)

            dt.data = []
            const indexes = []

            each(rows, (v, i) => {
                dt.data.push(v.row)

                if (v.row.searchIndex !== null && v.row.searchIndex !== undefined) {
                    indexes.push(i)
                }
            }, dt)

            dt.searchData = indexes

            this.rebuild()

            dt.update()

            if (!init) {
                dt.emit("datatable.sort", column, dir)
            }
        })
    }

    /**
     * Rebuild the columns
     * @return {Void}
     */
    rebuild() {
        let a
        let b
        let c
        let d
        const dt = this.dt
        const temp = []

        dt.activeRows = []
        dt.activeHeadings = []

        each(dt.headings, (th, i) => {
            th.originalCellIndex = i
            th.sortable = th.getAttribute("data-sortable") !== "false"
            if (!dt.hiddenColumns.includes(i)) {
                dt.activeHeadings.push(th)
            }
        }, this)

        // Loop over the rows and reorder the cells
        each(dt.data, (row, i) => {
            a = row.cloneNode(false)
            b = row.cloneNode(false)

            a.dataIndex = b.dataIndex = i

            if (row.searchIndex !== null && row.searchIndex !== undefined) {
                a.searchIndex = b.searchIndex = row.searchIndex
            }

            // Append the cell to the fragment in the correct order
            each(row.cells, cell => {
                c = cell.cloneNode(true)
                c.data = cell.data
                a.appendChild(c)

                if (!dt.hiddenColumns.includes(c.cellIndex)) {
                    d = c.cloneNode(true)
                    d.data = c.data
                    b.appendChild(d)
                }
            })

            // Append the fragment with the ordered cells
            temp.push(a)
            dt.activeRows.push(b)
        })

        dt.data = temp

        dt.update()
    }
}
