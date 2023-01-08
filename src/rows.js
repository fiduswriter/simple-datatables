import {readDataCell} from "./read_data"
/**
 * Rows API
 */
export class Rows {
    constructor(dt) {
        this.dt = dt

        this.cursor = false
    }

    setCursor(row=false) {
        const oldCursor = this.cursor
        this.cursor = row
        this.dt.update()
        if (row) {
            if (this.dt.options.scrollY) {
                const cursorDOM = this.dt.dom.querySelector("dataTable-cursor")
                if (cursorDOM) {
                    cursorDOM.scrollIntoView({block: "nearest"})
                }
            }
        }
        this.dt.emit("datatable.cursormove", this.cursor, oldCursor)

    }

    /**
     * Add new row
     */
    add(data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {}
            return readDataCell(cell, columnSettings)
        })
        this.dt.data.data.push(row)

        // We may have added data to an empty table
        if ( this.dt.data.data.length ) {
            this.dt.hasRows = true
        }

        this.dt.fixColumns()

    }

    /**
     * Remove row(s)
     */
    remove(select) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.data.data.filter((_row, index) => !select.includes(index))
            // We may have emptied the table
            if ( !this.dt.data.data.length ) {
                this.dt.hasRows = false
            }
            this.dt.fixColumns()
        } else {
            return this.remove([select])
        }
    }


    /**
     * Find index of row by searching for a value in a column
     */
    findRowIndex(columnIndex, value) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex(
            row => String(row[columnIndex].text).toLowerCase().includes(String(value).toLowerCase())
        )
    }

    /**
     * Find index, row, and column data by searching for a value in a column
     */
    findRow(columnIndex, value) {
        // get the row index
        const index = this.findRowIndex(columnIndex, value)
        // exit if not found
        if (index < 0) {
            return {
                index: -1,
                row: null,
                cols: []
            }
        }
        // get the row from data
        const row = this.dt.data.data[index]
        // return innerHTML of each td
        const cols = row.map(cell => cell.text)
        // return everything
        return {
            index,
            row,
            cols
        }
    }

    /**
     * Update a row with new data
     */
    updateRow(select, data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {}
            return readDataCell(cell, columnSettings)
        })
        this.dt.data.data.splice(select, 1, row)

        this.dt.fixColumns()
    }
}
