import {
    columnsStateType,
    filterStateType,
    columnSettingsType
} from "./types"

export const readColumnSettings = (columnOptions = [], defaultType, defaultFormat) : [columnSettingsType[], columnsStateType] => {

    let columns: (columnSettingsType | undefined)[] = []
    let sort: (false | {column: number, dir: "asc" | "desc"}) = false
    const filters: (filterStateType | undefined )[] = []

    // Check for the columns option

    columnOptions.forEach(data => {

        // convert single column selection to array
        const columnSelectors = Array.isArray(data.select) ? data.select : [data.select]

        columnSelectors.forEach((selector: number) => {
            if (columns[selector]) {
                if (data.type) {
                    columns[selector].type = data.type
                }
            } else {
                columns[selector] = {
                    type: data.type || defaultType,
                    sortable: true,
                    searchable: true
                }
            }
            const column = columns[selector]


            if (data.render) {
                column.render = data.render
            }

            if (data.format) {
                column.format = data.format
            } else if (data.type === "date") {
                column.format = defaultFormat
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
                if (typeof data.ignorePunctuation !== "undefined") {
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

            if (data.sort) {
                if (data.filter) {
                    filters[selector] = data.sort
                } else {
                    // We only allow one. The last one will overwrite all other options
                    sort = {column: selector,
                        dir: data.sort}
                }
            }

            if (typeof data.searchItemSeparator !== "undefined") {
                column.searchItemSeparator = data.searchItemSeparator
            }

        })


    })

    columns = columns.map(column => column ?
        column :
        {type: defaultType,
            format: defaultType === "date" ? defaultFormat : undefined,
            sortable: true,
            searchable: true})

    const widths = [] // Width are determined later on by measuring on screen.

    return [
        columns, {filters,
            sort,
            widths}
    ]

}
