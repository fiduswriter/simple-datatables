export const headingsToVirtualHeaderRowDOM = (headings, columnSettings, columnWidths, {hiddenHeader, sortable, scrollY}, {noColumnWidths, unhideHeader}) => ({
    nodeName: "TR",
    childNodes: headings.map(
        (heading, index) => {
            const column = columnSettings.columns[index] || {}
            if (column.hidden) {
                return false
            }
            const attributes = {}
            if (!column.notSortable && sortable) {
                attributes["data-sortable"] = true
            }
            let style = ""
            if (columnWidths[index] && !noColumnWidths) {
                style += `width: ${columnWidths[index]}%;`
            }
            if (hiddenHeader && !unhideHeader) {
                style += "height: 0;"
            }
            if (scrollY.length && !unhideHeader) {
                style += "padding-bottom: 0;padding-top: 0;border: 0;"
            }

            if (style.length) {
                attributes.style = style
            }
            return {
                nodeName: "TH",
                attributes,
                childNodes: [
                    (hiddenHeader && !unhideHeader) ?
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
})

export const dataToVirtualDOM = (headings, rows, columnSettings, columnWidths, {hiddenHeader, header, footer, sortable, scrollY}, {noColumnWidths, unhideHeader, showHeader}) => {

    const table = {
        nodeName: "TABLE",
        attributes: {
            class: "dataTable-table"
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    row => ({
                        nodeName: "TR",
                        childNodes: row.map(
                            (cell, index) => {
                                const column = columnSettings.columns[index] || {}
                                if (column.hidden) {
                                    return false
                                }
                                const node = {
                                    nodeName: "TD",
                                    childNodes: [
                                        {
                                            nodeName: "#text",
                                            data: column.render ? column.render(cell.data) : cell.text
                                        }
                                    ]
                                }
                                if (!header && !footer && columnWidths[index] && !noColumnWidths) {
                                    node.attributes = {
                                        style: `width: ${columnWidths[index]}%;`
                                    }
                                }
                                return node
                            }
                        ).filter(column => column)
                    })
                )
            }
        ]
    }

    if (header || footer || showHeader) {
        const headerRow = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnWidths, {hiddenHeader,
            sortable,
            scrollY}, {noColumnWidths,
            unhideHeader})

        if (header || showHeader) {
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
