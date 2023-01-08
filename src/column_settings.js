export const readColumnSettings = (columnOptions = []) => {

    const columns = []
    let sort = false

    // Check for the columns option

    columnOptions.forEach(data => {

        // convert single column selection to array
        const columnSelectors = Array.isArray(data.select) ? data.select : [data.select]

        columnSelectors.forEach(selector => {
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

            if (data.sort) {
                // We only allow one. The last one will overwrite all other options
                sort = {column,
                    direction: data.sort}
            }

        })

    })

    return {columns,
        sort}

}
