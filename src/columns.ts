import {readDataCell, readHeaderCell} from "./read_data"
import {DataTable} from "./datatable"
import {
    cellType,
    columnSettingsType,
    columnsStateType,
    dataRowType,
    elementNodeType,
    headerCellType,
    inputCellType,
    inputHeaderCellType
} from "./types"
import {readColumnSettings} from "./column_settings"
import {cellToText} from "./helpers"


export class Columns {
    dt: DataTable

    settings: columnSettingsType[]

    _state: columnsStateType

    constructor(dt: DataTable) {
        this.dt = dt
        this.init()
    }

    init() {
        [this.settings, this._state] = readColumnSettings(this.dt.options.columns, this.dt.options.type, this.dt.options.format)
    }

    get(column: number) {
        if (column < 0 || column >= this.size()) {
            return null
        }
        return {...this.settings[column]}
    }

    size() {
        return this.settings.length
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
        this.dt.data.data.forEach(
            (row: dataRowType) => (row.cells = columns.map((index: number) => row.cells[index]))
        )
        this.settings = columns.map(
            (index: number) => this.settings[index]
        )

        // Update
        this.dt.update()
    }

    /**
     * Hide columns
     */
    hide(columns: number | number[]) {
        if (!Array.isArray(columns)) {
            columns = [columns]
        }
        if (!columns.length) {
            return
        }
        columns.forEach((index: number) => {
            if (!this.settings[index]) {
                this.settings[index] = {
                    type: "string"
                }
            }
            const column = this.settings[index]
            column.hidden = true
        })

        this.dt.update()
    }

    /**
     * Show columns
     */
    show(columns: number | number[]) {
        if (!Array.isArray(columns)) {
            columns = [columns]
        }
        if (!columns.length) {
            return
        }
        columns.forEach((index: number) => {
            if (!this.settings[index]) {
                this.settings[index] = {
                    type: "string",
                    sortable: true
                }
            }
            const column = this.settings[index]
            delete column.hidden
        })

        this.dt.update()
    }

    /**
     * Check column(s) visibility
     */
    visible(columns: number | number[] | undefined) {

        if (columns === undefined) {
            columns = [...Array(this.dt.data.headings.length).keys()]
        }
        if (Array.isArray(columns)) {
            return columns.map(index => !this.settings[index]?.hidden)
        }
        return !this.settings[columns]?.hidden

    }

    /**
     * Add a new column
     */
    add(data: {data: inputCellType[], heading: inputHeaderCellType} & columnSettingsType) {
        const newColumnSelector = this.dt.data.headings.length
        this.dt.data.headings = this.dt.data.headings.concat([readHeaderCell(data.heading)])
        this.dt.data.data.forEach((row: dataRowType, index: number) => {
            row.cells = row.cells.concat([readDataCell(data.data[index], data)])
        })
        this.settings[newColumnSelector] = {
            type: data.type || "string",
            sortable: true,
            searchable: true
        }
        if (data.type || data.format || data.sortable || data.render || data.filter) {
            const column = this.settings[newColumnSelector]

            if (data.render) {
                column.render = data.render
            }

            if (data.format) {
                column.format = data.format
            }

            if (data.cellClass) {
                column.cellClass = data.cellClass
            }

            if (data.headerClass) {
                column.headerClass = data.headerClass
            }

            if (data.locale) {
                column.locale = data.locale
            }

            if (data.sortable === false) {
                column.sortable = false
            } else {
                if (data.numeric) {
                    column.numeric = data.numeric
                }
                if (data.caseFirst) {
                    column.caseFirst = data.caseFirst
                }
            }

            if (data.searchable === false) {
                column.searchable = false
            } else {
                if (data.sensitivity) {
                    column.sensitivity = data.sensitivity
                }
            }

            if (column.searchable || column.sortable) {
                if (data.ignorePunctuation) {
                    column.ignorePunctuation = data.ignorePunctuation
                }
            }

            if (data.hidden) {
                column.hidden = true
            }

            if (data.filter) {
                column.filter = data.filter
            }

            if (data.sortSequence) {
                column.sortSequence = data.sortSequence
            }
        }
        this.dt.update(true)
    }

    /**
     * Remove column(s)
     */
    remove(columns: number | number[]) {
        if (!Array.isArray(columns)) {
            columns = [columns]
        }

        this.dt.data.headings = this.dt.data.headings.filter((_heading: headerCellType, index: number) => !columns.includes(index))
        this.dt.data.data.forEach(
            (row: dataRowType) => (row.cells = row.cells.filter((_cell: cellType, index: number) => !columns.includes(index)))
        )
        this.dt.update(true)
    }

    /**
     * Filter by column
     */
    filter(column: number, init = false) {

        if (!this.settings[column]?.filter?.length) {
            // There is no filter to apply.
            return
        }

        const currentFilter = this._state.filters[column]
        let newFilterState
        if (currentFilter) {
            let returnNext = false
            newFilterState = this.settings[column].filter.find((filter: (string | number | boolean | elementNodeType[] | object | ((arg: (string | number | boolean | elementNodeType[] | object)) => boolean))) => {
                if (returnNext) {
                    return true
                }
                if (filter === currentFilter) {
                    returnNext = true
                }
                return false
            })
        } else {
            const filter = this.settings[column].filter
            newFilterState = filter ? filter[0] : undefined
        }

        if (newFilterState) {
            this._state.filters[column] = newFilterState
        } else if (currentFilter) {
            this._state.filters[column] = undefined
        }
        this.dt._currentPage = 1
        this.dt.update()

        if (!init) {
            this.dt.emit("datatable.filter", column, newFilterState)
        }
    }

    /**
     * Sort by column
     */
    sort(index: number, dir: ("asc" | "desc" | undefined) = undefined, init = false) {
        const column = this.settings[index]

        if (!init) {
            this.dt.emit("datatable.sorting", index, dir)
        }

        if (!dir) {
            const currentDir = this._state.sort && this._state.sort.column === index ? this._state.sort?.dir : false
            const sortSequence = column?.sortSequence || ["asc", "desc"]
            if (!currentDir) {
                dir = sortSequence.length ? sortSequence[0] : "asc"
            } else {
                const currentDirIndex = sortSequence.indexOf(currentDir)
                if (currentDirIndex === -1) {
                    dir = sortSequence[0] || "asc"
                } else if (currentDirIndex === sortSequence.length -1) {
                    dir = sortSequence[0]
                } else {
                    dir = sortSequence[currentDirIndex + 1]
                }
            }

        }

        const collator = ["string", "html"].includes(column.type) ?
            new Intl.Collator(column.locale || this.dt.options.locale, {
                usage: "sort",
                numeric: column.numeric || this.dt.options.numeric,
                caseFirst: column.caseFirst || this.dt.options.caseFirst,
                ignorePunctuation: column.ignorePunctuation|| this.dt.options.ignorePunctuation
            }) :
            false

        this.dt.data.data.sort((row1: dataRowType, row2: dataRowType) => {
            const cell1 = row1.cells[index]
            const cell2 = row2.cells[index]
            let order1 = cell1.order ?? cellToText(cell1)
            let order2 = cell2.order ?? cellToText(cell2)
            if (dir === "desc") {
                const temp = order1
                order1 = order2
                order2 = temp
            }
            if (collator && (typeof order1 !== "number") && (typeof order2 !== "number")) {
                return collator.compare(String(order1), String(order2))
            }
            if (order1 < order2) {
                return -1
            } else if (order1 > order2) {
                return 1
            }
            return 0
        })

        this._state.sort = {column: index,
            dir}
        if (this.dt._searchQueries.length) {
            this.dt.multiSearch(this.dt._searchQueries)
            this.dt.emit("datatable.sort", index, dir)
        } else if (!init) {
            this.dt._currentPage = 1
            this.dt.update()
            this.dt.emit("datatable.sort", index, dir)
        }
    }

    /**
     * Measure the actual width of cell content by rendering the entire table with all contents.
     * Note: Destroys current DOM and therefore requires subsequent dt.update()
     */
    _measureWidths() {
        const activeHeadings = this.dt.data.headings.filter((heading: headerCellType, index: number) => !this.settings[index]?.hidden)
        if ((this.dt.options.scrollY.length || this.dt.options.fixedColumns) && activeHeadings?.length) {

            this._state.widths = []
            const renderOptions: {noPaging?: true, noColumnWidths?: true, unhideHeader?: true, renderHeader?: true} = {
                noPaging: true
            }
            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.dt.options.header || this.dt.options.footer) {

                if (this.dt.options.scrollY.length) {
                    renderOptions.unhideHeader = true
                }
                if (this.dt.headerDOM) {
                    // Remove headerDOM for accurate measurements
                    this.dt.headerDOM.parentElement.removeChild(this.dt.headerDOM)
                }

                // Reset widths
                renderOptions.noColumnWidths = true
                this.dt._renderTable(renderOptions)

                const activeDOMHeadings : HTMLTableCellElement[] = Array.from(this.dt.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || [])
                let domCounter = 0
                const absoluteColumnWidths = this.dt.data.headings.map((_heading: headerCellType, index: number) => {
                    if (this.settings[index]?.hidden) {
                        return 0
                    }
                    const width = activeDOMHeadings[domCounter].offsetWidth
                    domCounter += 1
                    return width

                })
                const totalOffsetWidth = absoluteColumnWidths.reduce(
                    (total, cellWidth) => total + cellWidth,
                    0
                )
                this._state.widths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100)

            } else {
                renderOptions.renderHeader = true
                this.dt._renderTable(renderOptions)

                const activeDOMHeadings: HTMLTableCellElement[] = Array.from(this.dt.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || [])
                let domCounter = 0
                const absoluteColumnWidths = this.dt.data.headings.map((_heading: headerCellType, index: number) => {
                    if (this.settings[index]?.hidden) {
                        return 0
                    }
                    const width = activeDOMHeadings[domCounter].offsetWidth
                    domCounter += 1
                    return width

                })
                const totalOffsetWidth = absoluteColumnWidths.reduce(
                    (total, cellWidth) => total + cellWidth,
                    0
                )
                this._state.widths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100)
            }
            // render table without options for measurements
            this.dt._renderTable()
        }
    }
}
