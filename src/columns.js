import {sortItems} from "./helpers"


export class Columns {
    constructor(dt) {
        this.dt = dt
    }

    /**
     * Swap two columns
     * @return {Void}
     */
    swap(columns) {
        if (columns.length && columns.length === 2) {
            const cols = []

            // Get the current column indexes
            this.dt.headings.forEach((h, i) => {
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
        columns.forEach((column, x) => {
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
        dt.data.forEach((row, i) => {
            c = row.cloneNode(false)
            d = row.cloneNode(false)

            c.dataIndex = d.dataIndex = i

            if (row.searchIndex !== null && row.searchIndex !== undefined) {
                c.searchIndex = d.searchIndex = row.searchIndex
            }

            // Append the cell to the fragment in the correct order
            columns.forEach(column => {
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

            columns.forEach(column => {
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

            columns.forEach(column => {
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
        } else if (Array.isArray(columns)) {
            cols = []
            columns.forEach(column => {
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

        this.dt.data.forEach((row, i) => {
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
        if (Array.isArray(select)) {
            // Remove in reverse otherwise the indexes will be incorrect
            select.sort((a, b) => b - a)
            select.forEach(column => this.remove(column))
        } else {
            this.dt.headings.splice(select, 1)

            this.dt.data.forEach(row => {
                row.removeChild(row.cells[select])
            })
        }

        this.rebuild()
    }

    /**
     * Filter by column
     * @param  {int} column - The column no.
     * @param  {string} dir - asc or desc
     * @filter {array} filter - optional parameter with a list of strings
     * @return {void}
     */
    filter(column, dir, init, terms) {
        const dt = this.dt

        // Creates a internal state that manages filters if there are none
        if ( !dt.filterState ) {
            dt.filterState = {
                originalData: dt.data
            }
        }

        // If that column is was not filtered yet, we need to create its state
        if ( !dt.filterState[column] ) {

            // append a filter that selects all rows, 'resetting' the filter
            const filters = [...terms, () => true]

            dt.filterState[column] = (
                function() {
                    let i = 0;
                    return () => filters[i++ % (filters.length)]
                }()
            )
        }

        // Apply the filter and rebuild table
        const rowFilter = dt.filterState[column]() // fetches next filter
        const filteredRows = Array.from(dt.filterState.originalData).filter(tr => {
            const cell = tr.cells[column]
            const content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.innerText

            // If the filter is a function, call it, if it is a string, compare it
            return (typeof rowFilter) === "function" ? rowFilter(content) : content === rowFilter;
        })

        dt.data = filteredRows

        if (!dt.data.length) {
            dt.clear()
            dt.hasRows = false
            dt.setMessage(dt.options.labels.noRows)
        } else {
            this.rebuild()
            dt.update()
        }

        if (!init) {
            dt.emit("datatable.sort", column, dir)
        }
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

        //If there is a filter for this column, apply it instead of sorting
        const filterTerms = dt.options.filters &&
              dt.options.filters[dt.headings[column].textContent]
        if ( filterTerms && filterTerms.length !== 0 ) {
            this.filter(column, dir, init, filterTerms)
            return;
        }

        dt.sorting = true

        if (!init) {
            dt.emit("datatable.sorting", column, dir)
        }

        let rows = dt.data
        const alpha = []
        const numeric = []
        let a = 0
        let n = 0
        const th = dt.headings[column]

        const waitFor = []

        // Check for date format
        if (th.getAttribute("data-type") === "date") {
            let format = false
            const formatted = th.hasAttribute("data-format")

            if (formatted) {
                format = th.getAttribute("data-format")
            }
            waitFor.push(import("./date").then(({parseDate}) => date => parseDate(date, format)))
        }

        Promise.all(waitFor).then(importedFunctions => {
            const parseFunction = importedFunctions[0] // only defined if date
            Array.from(rows).forEach(tr => {
                const cell = tr.cells[column]
                const content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.innerText
                let num
                if (parseFunction) {
                    num = parseFunction(content)
                } else if (typeof content==="string") {
                    num = content.replace(/(\$|,|\s|%)/g, "")
                } else {
                    num = content
                }

                if (parseFloat(num) == num) {
                    numeric[n++] = {
                        value: Number(num),
                        row: tr
                    }
                } else {
                    alpha[a++] = {
                        value: typeof content==="string" ? content.toLowerCase() : content,
                        row: tr
                    }
                }
            })

            /* Sort according to direction (ascending or descending) */
            if (!dir) {
                if (th.classList.contains("asc")) {
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
                th.classList.remove("asc")
                th.classList.add("desc")
                th.setAttribute("aria-sort", "descending")
            } else {
                top = sortItems(numeric, 1)
                btm = sortItems(alpha, 1)
                th.classList.remove("desc")
                th.classList.add("asc")
                th.setAttribute("aria-sort", "ascending")
            }

            /* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
            if (dt.lastTh && th != dt.lastTh) {
                dt.lastTh.classList.remove("desc")
                dt.lastTh.classList.remove("asc")
                dt.lastTh.removeAttribute("aria-sort")
            }

            dt.lastTh = th

            /* Reorder the table */
            rows = top.concat(btm)

            dt.data = []
            const indexes = []

            rows.forEach((v, i) => {
                dt.data.push(v.row)

                if (v.row.searchIndex !== null && v.row.searchIndex !== undefined) {
                    indexes.push(i)
                }
            })

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

        dt.headings.forEach((th, i) => {
            th.originalCellIndex = i
            th.sortable = th.getAttribute("data-sortable") !== "false"
            if (!dt.hiddenColumns.includes(i)) {
                dt.activeHeadings.push(th)
            }
        })

        // Loop over the rows and reorder the cells
        dt.data.forEach((row, i) => {
            a = row.cloneNode(false)
            b = row.cloneNode(false)

            a.dataIndex = b.dataIndex = i

            if (row.searchIndex !== null && row.searchIndex !== undefined) {
                a.searchIndex = b.searchIndex = row.searchIndex
            }

            // Append the cell to the fragment in the correct order
            Array.from(row.cells).forEach(cell => {
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
