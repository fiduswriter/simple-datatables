import {readDataCell} from "./read_data"
import {DataTable} from "./datatable"
import {cellType} from "./interfaces"
/**
 * Rows API
 */
export class Rows {
    cursor: (false | number)

    dt: DataTable

    constructor(dt: DataTable) {
        this.dt = dt

        this.cursor = false
    }

    setCursor(index: (false | number) =false) {
        if (index === this.cursor) {
            return
        }
        const oldCursor = this.cursor
        this.cursor = index
        this.dt.renderTable()
        if (index !== false && this.dt.options.scrollY) {
            const cursorDOM = this.dt.dom.querySelector(`tr.${this.dt.options.classes.cursor}`)
            if (cursorDOM) {
                cursorDOM.scrollIntoView({block: "nearest"})
            }
        }
        this.dt.emit("datatable.cursormove", this.cursor, oldCursor)
    }

    /**
     * Add new row
     */
    add(data: cellType[]) {
        const row = data.map((cell: cellType, index: number) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {}
            return readDataCell(cell, columnSettings)
        })
        this.dt.data.data.push(row)

        // We may have added data to an empty table
        if ( this.dt.data.data.length ) {
            this.dt.hasRows = true
        }
        this.dt.update(false)
        this.dt.fixColumns()

    }

    /**
     * Remove row(s)
     */
    remove(select: number | number[]) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.dt.data.data.filter((_row: any, index: any) => !select.includes(index))
            // We may have emptied the table
            if ( !this.dt.data.data.length ) {
                this.dt.hasRows = false
            }
            this.dt.update(false)
            this.dt.fixColumns()
        } else {
            return this.remove([select])
        }
    }


    /**
     * Find index of row by searching for a value in a column
     */
    findRowIndex(columnIndex: number, value: any) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex(
            (row: cellType[]) => String(row[columnIndex].data).toLowerCase().includes(String(value).toLowerCase())
        )
    }

    /**
     * Find index, row, and column data by searching for a value in a column
     */
    findRow(columnIndex: any, value: any) {
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
        const cols = row.map((cell: any) => cell.data)
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
    updateRow(select: any, data: any) {
        const row = data.map((cell: any, index: any) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {}
            return readDataCell(cell, columnSettings)
        })
        this.dt.data.data.splice(select, 1, row)
        this.dt.update(false)
        this.dt.fixColumns()
    }
}
