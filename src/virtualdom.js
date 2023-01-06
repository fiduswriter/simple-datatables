export const dataToVirtualDOM = (data, columnSettings, {hiddenHeader, header, footer, sortable}) => {

    const table = {
        nodeName: "TABLE",
        attributes: {
            class: "dataTable-table"
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: data.data.map(
                    row => ({
                        nodeName: "TR",
                        childNodes: row.map(
                            (cell, index) => {
                                const column = columnSettings.columns[index] || {}
                                if (column.hidden) {
                                    return false
                                }
                                return {
                                    nodeName: "TD",
                                    childNodes: [
                                        {
                                            nodeName: "#text",
                                            data: column.render ? column.render(cell.data) : cell.text
                                        }
                                    ]
                                }
                            }
                        ).filter(column => column)
                    })
                )
            }
        ]
    }

    if (header || footer) {
        const headerRow = {
            nodeName: "TR",
            childNodes: data.headings.map(
                (heading, index) => {
                    const column = columnSettings.columns[index] || {}
                    if (column.hidden) {
                        return false
                    }
                    return {
                        nodeName: "TH",
                        attributes: column.notSortable || !sortable ?
                            {} :
                            {
                                "data-sortable": true
                            },
                        childNodes: [
                            hiddenHeader ?
                                {nodeName: "#text",
                                    data: ""} :
                                column.notSortable || !sortable ?
                                    {
                                        nodeName: "#text",
                                        data: heading.data
                                    } :
                                    {
                                        nodeName: "a",
                                        attributes: {
                                            href: "#",
                                            class: "dataTable-sorter"
                                        },
                                        childNodes: [
                                            {
                                                nodeName: "#text",
                                                data: heading.data
                                            }
                                        ]
                                    }
                        ]
                    }
                }
            ).filter(column => column)
        }

        if (header) {
            table.childNodes.unshift({
                nodeName: "THEAD",
                childNodes: [headerRow]
            })
        }
        if (footer) {
            const footerRow = header ? structuredClone(headerRow) : headerRow
            table.childNodes.push({
                nodeName: "TFOOT",
                childNodes: [footerRow]
            })
        }

    }

    return table
}
