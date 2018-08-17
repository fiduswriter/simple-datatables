import {isArray, each, createElement} from "./helpers"
/**
 * Rows API
 * @param {Object} instance DataTable instance
 * @param {Array} rows
 */
export class Rows {
    constructor(dt, rows) {
        this.dt = dt
        this.rows = rows

        return this
    }

    /**
     * Build a new row
     * @param  {Array} row
     * @return {HTMLElement}
     */
    build(row) {
        const tr = createElement("tr")

        let headings = this.dt.headings

        if (!headings.length) {
            headings = row.map(() => "")
        }

        each(headings, (h, i) => {
            const td = createElement("td")

            // Fixes #29
            if (!row[i] || !row[i].length) {
                row[i] = ""
            }

            td.innerHTML = row[i]

            td.data = row[i]

            tr.appendChild(td)
        })

        return tr
    }

    render(row) {
        return row
    }

    /**
     * Add new row
     * @param {Array} select
     */
    add(data) {
        if (isArray(data)) {
            const dt = this.dt
            // Check for multiple rows
            if (isArray(data[0])) {
                each(data, function (row) {
                    dt.data.push(this.build(row))
                }, this)
            } else {
                dt.data.push(this.build(data))
            }

            // We may have added data to an empty table
            if ( dt.data.length ) {
                dt.hasRows = true
            }


            this.update()

            dt.columns().rebuild()
        }

    }

    /**
     * Remove row(s)
     * @param  {Array|Number} select
     * @return {Void}
     */
    remove(select) {
        const dt = this.dt

        if (isArray(select)) {
            // Remove in reverse otherwise the indexes will be incorrect
            select.sort((a, b) => b - a)

            each(select, row => {
                dt.data.splice(row, 1)
            })
        } else {
            dt.data.splice(select, 1)
        }

        // We may have emptied the table
        if ( !dt.data.length ) {
            dt.hasRows = false
        }

        this.update()
        dt.columns().rebuild()
    }

    /**
     * Update row indexes
     * @return {Void}
     */
    update() {
        each(this.dt.data, (row, i) => {
            row.dataIndex = i
        })
    }
}
