export const dataToVirtualDOM = (data, columnSettings, hiddenHeader) => ({
    nodeName: "TABLE",
    attributes: {
        class: "dataTable-table"
    },
    childNodes: [
        {
            nodeName: "THEAD",
            childNodes: [
                {
                    nodeName: "TR",
                    childNodes: data.headings.map(
                        (heading, index) => {
                            const column = columnSettings.columns[index] || {}
                            if (column.hidden) {
                                return false
                            }
                            return {
                                nodeName: "TH",
                                attributes: column.notSortable ?
                                    {} :
                                    {
                                        "data-sortable": true
                                    },
                                childNodes: [
                                    hiddenHeader ?
                                        {nodeName: "#text",
                                            data: ""} :
                                        column.notSortable ?
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
            ]
        },
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
})
