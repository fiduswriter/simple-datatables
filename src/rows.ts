import {readDataCell} from "./read_data"
import {DataTable} from "./datatable"
import {cellType, dataRowType, inputCellType} from "./types"
import {cellToText, classNamesToSelector} from "./helpers"

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

    setCursor(index: (false | number) = false) {
        if (index === this.cursor) {
            return
        }
        const oldCursor = this.cursor
        this.cursor = index
        this.dt._renderTable()
        if (index !== false && this.dt.options.scrollY) {
            const cursorSelector = classNamesToSelector(this.dt.options.classes.cursor)
            const cursorDOM = this.dt.dom.querySelector(`tr${cursorSelector}`)
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
        if (!Array.isArray(data) || data.length < 1) {
            return
        }

        const row: dataRowType = {
            cells: data.map((cell: cellType, index: number) => {
                const columnSettings = this.dt.columns.settings[index]
                return readDataCell(cell, columnSettings)
            })
        }
        this.dt.data.data.push(row)
        this.dt.hasRows = true
        this.dt.update(true)
    }

    /**
     * Remove row(s)
     */
    remove(select: number | number[]) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.dt.data.data.filter((_row: dataRowType, index: number) => !select.includes(index))
            // We may have emptied the table
            if ( !this.dt.data.data.length ) {
                this.dt.hasRows = false
            }
            this.dt.update(true)
        } else {
            return this.remove([select])
        }
    }


    /**
     * Find index of row by searching for a value in a column
     */
    findRowIndex(columnIndex: number, value: string | boolean | number) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex(
            (row: dataRowType) => {
                const cell = row.cells[columnIndex]
                const cellText = cellToText(cell)
                return cellText.toLowerCase().includes(String(value).toLowerCase())
            }
        )
    }

    /**
     * Find index, row, and column data by searching for a value in a column
     */
    findRow(columnIndex: number, value: string | boolean | number) {
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
        const cols = row.cells.map((cell: cellType) => cell.data)
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
    updateRow(select: number, data: inputCellType[]) {
        const row: dataRowType = {
            cells: data.map((cell: inputCellType, index: number) => {
                const columnSettings = this.dt.columns.settings[index]
                return readDataCell(cell, columnSettings)
            })
        }
        this.dt.data.data.splice(select, 1, row)
        this.dt.update(true)
    }
}
