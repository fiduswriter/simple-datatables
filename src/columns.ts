import {readDataCell, readHeaderCell} from "./read_data"
import {DataTable} from "./datatable"
import {allColumnSettingsType, cellType, headerCellType, filterStateType, inputCellType, inputHeaderCellType, elementNodeType, singleColumnSettingsType} from "./types"
import {readColumnSettings} from "./column_settings"


export class Columns {
    dt: DataTable

    widths: number[]

    settings: allColumnSettingsType

    constructor(dt: DataTable) {
        this.dt = dt
        this.widths = []
        this.init()
    }

    init() {
        this.settings = readColumnSettings(this.dt.options.columns)
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
            (row: cellType[]) => columns.map((index: number) => row[index])
        )
        this.settings.columns = columns.map(
            (index: number) => this.settings.columns[index]
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
            if (!this.settings.columns[index]) {
                this.settings.columns[index] = {
                    type: "string"
                }
            }
            const column = this.settings.columns[index]
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
            if (!this.settings.columns[index]) {
                this.settings.columns[index] = {
                    type: "string",
                    sortable: true
                }
            }
            const column = this.settings.columns[index]
            delete column.hidden
        })

        this.dt.update()
    }

    /**
     * Check column(s) visibility
     */
    visible(columns: number | number[]) {

        if (Array.isArray(columns)) {
            return columns.map(index => !this.settings.columns[index]?.hidden)
        }
        return !this.settings.columns[columns]?.hidden

    }

    /**
     * Add a new column
     */
    add(data: {data: inputCellType[], heading: inputHeaderCellType} & singleColumnSettingsType) {
        const newColumnSelector = this.dt.data.headings.length
        this.dt.data.headings = this.dt.options.dataConvert ?
            this.dt.data.headings.concat([readHeaderCell(data.heading)]) :
            this.dt.data.headings.concat([data.heading as headerCellType])
        this.dt.data.data = this.dt.options.dataConvert ?
            this.dt.data.data.map(
                (row: cellType[], index: number) => row.concat([readDataCell(data.data[index], data)])
            ) :
            this.dt.data.data.map(
                (row: cellType[], index: number) => row.concat([data.data[index] as cellType])
            )
        this.settings.columns[newColumnSelector] = {
            type: data.type || "string",
            sortable: true,
            searchable: true
        }
        if (data.type || data.format || data.sortable || data.render || data.filter) {
            const column = this.settings.columns[newColumnSelector]

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
    remove(columns: number[]) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter((_heading: headerCellType, index: number) => !columns.includes(index))
            this.dt.data.data = this.dt.data.data.map(
                (row: cellType[]) => row.filter((_cell: cellType, index: number) => !columns.includes(index))
            )
            this.dt.update(true)
        } else {
            return this.remove([columns])
        }
    }

    /**
     * Filter by column
     */
    filter(column: number, init = false) {

        if (!this.settings.columns[column]?.filter?.length) {
            // There is no filter to apply.
            return
        }

        const currentFilter = this.dt.filterStates.find((filterState: filterStateType) => filterState.column === column)
        let newFilterState
        if (currentFilter) {
            let returnNext = false
            newFilterState = this.settings.columns[column].filter.find((filter: (string | number | boolean | elementNodeType[] | object | ((arg: (string | number | boolean | elementNodeType[] | object)) => boolean))) => {
                if (returnNext) {
                    return true
                }
                if (filter === currentFilter.state) {
                    returnNext = true
                }
                return false
            })
        } else {
            newFilterState = this.settings.columns[column].filter[0]
        }

        if (currentFilter && newFilterState) {
            currentFilter.state = newFilterState
        } else if (currentFilter) {
            this.dt.filterStates = this.dt.filterStates.filter((filterState: filterStateType) => filterState.column !== column)
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
    sort(index: number, dir: ("asc" | "desc" | undefined) = undefined, init = false) {
        const column = this.settings.columns[index]
        // If there is a filter for this column, apply it instead of sorting
        if (column?.filter?.length) {
            return this.filter(index, init)
        }

        if (!init) {
            this.dt.emit("datatable.sorting", index, dir)
        }

        if (!dir) {
            const currentDir = this.settings.sort ? this.settings.sort?.dir : false
            const sortSequence = column?.sortSequence || ["asc", "desc"]
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

        const collator = ["string", "html"].includes(column.type) ?
            new Intl.Collator(column.locale || this.dt.options.locale, {
                usage: "sort",
                numeric: column.numeric || this.dt.options.numeric,
                caseFirst: column.caseFirst || this.dt.options.caseFirst,
                ignorePunctuation: column.ignorePunctuation|| this.dt.options.ignorePunctuation
            }) :
            false

        this.dt.data.data.sort((row1: cellType[], row2: cellType[]) => {
            let order1 = row1[index].order || row1[index].data,
                order2 = row2[index].order || row2[index].data
            if (dir === "desc") {
                const temp = order1
                order1 = order2
                order2 = temp
            }
            if (collator) {
                return collator.compare(String(order1), String(order2))
            }
            if (order1 < order2) {
                return -1
            } else if (order1 > order2) {
                return 1
            }
            return 0
        })

        this.settings.sort = {column: index,
            dir}
        if (!init) {
            this.dt.update()
            this.dt.emit("datatable.sort", index, dir)
        }
    }

    /**
     * Measure the actual width of cell content by rendering the entire table with all contents.
     * Note: Destroys current DOM and therefore requires subsequent dt.update()
     */
    _measureWidths() {
        const activeHeadings = this.dt.data.headings.filter((heading: headerCellType, index: number) => !this.settings.columns[index]?.hidden)
        if ((this.dt.options.scrollY.length || this.dt.options.fixedColumns) && activeHeadings?.length) {

            this.widths = []
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
                    if (this.settings.columns[index]?.hidden) {
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
                this.widths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100)

            } else {
                renderOptions.renderHeader = true
                this.dt._renderTable(renderOptions)

                const activeDOMHeadings: HTMLTableCellElement[] = Array.from(this.dt.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || [])
                let domCounter = 0
                const absoluteColumnWidths = this.dt.data.headings.map((_heading: headerCellType, index: number) => {
                    if (this.settings.columns[index]?.hidden) {
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
                this.widths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100)
            }
            // render table without options for measurements
            this.dt._renderTable()
        }
    }
}
