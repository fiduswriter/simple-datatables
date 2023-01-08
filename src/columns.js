import {readDataCell} from "./read_data"

export class Columns {
    constructor(dt) {
        this.dt = dt
    }

    /**
     * Swap two columns
     */
    swap(columns) {
        if (columns.length === 2) {
            // Get the current column indexes
            const cols = this.dt.data.headings.map((_node, index) => index)

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
    order(columns) {

        this.dt.headings = columns.map(index => this.dt.headings[index])
        this.dt.data.data = this.dt.data.data.map(
            row => columns.map(index => row[index])
        )

        // Update
        this.dt.update()
    }

    /**
     * Hide columns
     */
    hide(columns) {
        if (!columns.length) {
            return
        }
        columns.forEach(index => {
            const column = this.dt.columnSettings.columns[index] || {}
            column.hidden = true
        })

        this.dt.update()
    }

    /**
     * Show columns
     */
    show(columns) {
        if (!columns.length) {
            return
        }
        columns.forEach(index => {
            const column = this.dt.columnSettings.columns[index] || {}
            delete column.hidden
        })

        this.dt.update()
    }

    /**
     * Check column(s) visibility
     */
    visible(columns) {

        if (Array.isArray(columns)) {
            return columns.map(index => !this.dt.columnSettings.columns[index]?.hidden)
        }
        return !this.dt.columnSettings.columns[columns]?.hidden

    }

    /**
     * Add a new column
     */
    add(data) {
        const newColumnSelector = this.td.data.headings.length
        this.td.data.heading = this.td.data.heading.concat([{data: data.heading}])
        this.td.data.data = this.td.data.data.map(
            (row, index) => row.concat([data.data[index].map(cell => readDataCell(cell, data))])
        )
        if (data.type || data.format || data.sortable || data.render) {
            const columnSettings = this.td.columnSettings.columns[newColumnSelector] = {}
            if (data.type) {
                columnSettings.type = data.type
            }
            if (data.format) {
                columnSettings.format = data.format
            }
            if (data.sortable) {
                columnSettings.sortable = data.sortable
            }
            if (data.filter) {
                columnSettings.filter = data.filter
            }
            if (data.type) {
                columnSettings.type = data.type
            }
        }
        this.td.fixColumns()
    }

    /**
     * Remove column(s)
     */
    remove(columns) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter((_heading, index) => !columns.includes(index))
            this.td.data.data = this.td.data.data.map(
                row => row.filter((_cell, index) => !columns.includes(index))
            )
            this.td.fixColumns()
        } else {
            return this.remove([columns])
        }
    }

    /**
     * Filter by column
     */
    filter(column, init) {

        if (!this.dt.columnSettings.columns[column]?.filter?.length) {
            // There is no filter to apply.
            return
        }

        const currentFilter = this.dt.filterStates.find(filterState => filterState.column === column)
        let newFilterState
        if (currentFilter) {
            let returnNext = false
            newFilterState = this.dt.columnSettings.columns[column].filter.find(filter => {
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
            this.dt.filterStates = this.dt.filterStates.filter(filterState => filterState.column !== column)
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
    sort(column, dir, init) {

        // If there is a filter for this column, apply it instead of sorting
        if (this.dt.columnSettings.columns[column]?.filter?.length) {
            return this.filter(column, init)
        }

        if (!init) {
            this.dt.emit("datatable.sorting", column, dir)
        }

        if (!dir) {
            const currentDir = this.dt.data.headings[column].sorted
            dir = currentDir === "asc" ? "desc" : "asc"
        }

        // Remove all other sorting
        this.dt.data.headings.forEach(heading => {
            heading.sorted = false
        })

        this.dt.data.data.sort((row1, row2) => {
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

        this.dt.data.headings[column].sorted = dir

        this.dt.update(!init)

        if (!init) {
            this.dt.columnSettings.sort = {column,
                dir}
            this.dt.emit("datatable.sort", column, dir)
        }
    }
}
