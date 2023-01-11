import {
    columnSettingsType
} from "./interfaces"

export const readColumnSettings = (columnOptions = []) : {columns: (columnSettingsType | undefined)[], sort: (false | {column: number, dir: "asc" | "desc"})} => {

    const columns: (columnSettingsType | undefined)[] = []
    let sort: (false | {column: number, dir: "asc" | "desc"}) = false

    // Check for the columns option

    columnOptions.forEach(data => {

        // convert single column selection to array
        const columnSelectors = Array.isArray(data.select) ? data.select : [data.select]

        columnSelectors.forEach((selector: any) => {
            if (!columns[selector]) {
                columns[selector] = {}
            }
            const column = columns[selector]


            if (data.render) {
                column.render = data.render
            }

            if (data.type) {
                column.type = data.type
            }

            if (data.format) {
                column.format = data.format
            }

            if (data.sortable === false) {
                column.notSortable = true
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
                // We only allow one. The last one will overwrite all other options
                sort = {column: selector,
                    dir: data.sort}
            }

        })

    })

    return {columns,
        sort}

}
