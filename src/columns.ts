import {readDataCell} from "./read_data"
import {DataTable} from "./datatable"
import {cellType, headerCellType} from "./interfaces"

export class Columns {
    dt: DataTable

    constructor(dt: DataTable) {
        this.dt = dt
    }

    /**
     * Swap two columns
     */
    swap(columns: [number, number]) {
        if (columns.length === 2) {
            // Get the current column indexes
            const cols = this.dt.data.headings.map((_node: headerCellType, index: number) => index)

            const x = columns[0]
            const y = columns[1]
            const b = cols[y]
            cols[y] = cols[x]
            cols[x] = b

            return this.order(cols)
        }
    }

    /**
     * Reorder the columns
     */
    order(columns: number[]) {

        this.dt.data.headings = columns.map((index: number) => this.dt.data.headings[index])
        this.dt.data.data = this.dt.data.data.map(
            (row: cellType[]) => columns.map((index: any) => row[index])
        )
        this.dt.columnSettings.columns = columns.map(
            (index: number) => this.dt.columnSettings.columns[index]
        )

        // Update
        this.dt.update()
    }

    /**
     * Hide columns
     */
    hide(columns: number[]) {
        if (!columns.length) {
            return
        }
        columns.forEach((index: number) => {
            if (!this.dt.columnSettings.columns[index]) {
                this.dt.columnSettings.columns[index] = {}
            }
            const column = this.dt.columnSettings.columns[index]
            column.hidden = true
        })

        this.dt.update()
    }

    /**
     * Show columns
     */
    show(columns: number[]) {
        if (!columns.length) {
            return
        }
        columns.forEach((index: number) => {
            if (!this.dt.columnSettings.columns[index]) {
                this.dt.columnSettings.columns[index] = {}
            }
            const column = this.dt.columnSettings.columns[index]
            delete column.hidden
        })

        this.dt.update()
    }

    /**
     * Check column(s) visibility
     */
    visible(columns: number | number[]) {

        if (Array.isArray(columns)) {
            return columns.map(index => !this.dt.columnSettings.columns[index]?.hidden)
        }
        return !this.dt.columnSettings.columns[columns]?.hidden

    }

    /**
     * Add a new column
     */
    add(data: any) {
        const newColumnSelector = this.dt.data.headings.length
        this.dt.data.headings = this.dt.data.headings.concat([{data: data.heading}])
        this.dt.data.data = this.dt.data.data.map(
            (row: any, index: any) => row.concat([readDataCell(data.data[index], data)])
        )
        if (data.type || data.format || data.sortable || data.render) {
            if (!this.dt.columnSettings.columns[newColumnSelector]) {
                this.dt.columnSettings.columns[newColumnSelector] = {}
            }
            const column = this.dt.columnSettings.columns[newColumnSelector]
            if (data.type) {
                column.type = data.type
            }
            if (data.format) {
                column.format = data.format
            }
            if (data.notSortable) {
                column.notSortable = data.notSortable
            }
            if (data.filter) {
                column.filter = data.filter
            }
            if (data.type) {
                column.type = data.type
            }
            if (data.render) {
                column.render = data.render
            }
        }
        this.dt.update(false)
        this.dt.fixColumns()
    }

    /**
     * Remove column(s)
     */
    remove(columns: number[]) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter((_heading: any, index: any) => !columns.includes(index))
            this.dt.data.data = this.dt.data.data.map(
                (row: any) => row.filter((_cell: any, index: any) => !columns.includes(index))
            )
            this.dt.update(false)
            this.dt.fixColumns()
        } else {
            return this.remove([columns])
        }
    }

    /**
     * Filter by column
     */
    filter(column: number, init = false) {

        if (!this.dt.columnSettings.columns[column]?.filter?.length) {
            // There is no filter to apply.
            return
        }

        const currentFilter = this.dt.filterStates.find((filterState: any) => filterState.column === column)
        let newFilterState
        if (currentFilter) {
            let returnNext = false
            newFilterState = this.dt.columnSettings.columns[column].filter.find((filter: any) => {
                if (returnNext) {
                    return true
                }
                if (filter === currentFilter.state) {
                    returnNext = true
                }
                return false
            })
        } else {
            newFilterState = this.dt.columnSettings.columns[column].filter[0]
        }

        if (currentFilter && newFilterState) {
            currentFilter.state = newFilterState
        } else if (currentFilter) {
            this.dt.filterStates = this.dt.filterStates.filter((filterState: any) => filterState.column !== column)
        } else {
            this.dt.filterStates.push({column,
                state: newFilterState})
        }

        this.dt.update()

        if (!init) {
            this.dt.emit("datatable.filter", column, newFilterState)
        }
    }

    /**
     * Sort by column
     */
    sort(column: number, dir: ("asc" | "desc" | undefined) = undefined, init = false) {
        const columnSettings = this.dt.columnSettings.columns[column]
        // If there is a filter for this column, apply it instead of sorting
        if (columnSettings?.filter?.length) {
            return this.filter(column, init)
        }

        if (!init) {
            this.dt.emit("datatable.sorting", column, dir)
        }

        if (!dir) {
            const currentDir = this.dt.columnSettings.sort ? this.dt.columnSettings.sort?.dir : false
            const sortSequence = columnSettings?.sortSequence || ["asc", "desc"]
            if (!currentDir) {
                dir = sortSequence.length ? sortSequence[0] : "asc"
            } else {
                const currentDirIndex = sortSequence.indexOf(currentDir)
                if (currentDirIndex === -1) {
                    dir = "asc"
                } else if (currentDirIndex === sortSequence.length -1) {
                    dir = sortSequence[0]
                } else {
                    dir = sortSequence[currentDirIndex + 1]
                }
            }

        }

        this.dt.data.data.sort((row1: cellType[], row2: cellType[]) => {
            let order1 = row1[column].order || row1[column].data,
                order2 = row2[column].order || row2[column].data
            if (dir === "desc") {
                const temp = order1
                order1 = order2
                order2 = temp
            }
            if (order1 < order2) {
                return -1
            } else if (order1 > order2) {
                return 1
            }
            return 0
        })

        this.dt.columnSettings.sort = {column,
            dir}

        this.dt.update(!init)

        if (!init) {
            this.dt.emit("datatable.sort", column, dir)
        }
    }
}
