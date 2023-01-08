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
            if (heading.sorted) {
                attributes.class = heading.sorted
                attributes["aria-sort"] = heading.sorted === "asc" ? "ascending" : "descending"
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

export const dataToVirtualDOM = (headings, rows, columnSettings, columnWidths, rowCursor, {hiddenHeader, header, footer, sortable, scrollY, rowRender}, {noColumnWidths, unhideHeader, showHeader}) => {
    const table = {
        nodeName: "TABLE",
        attributes: {
            class: "dataTable-table"
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    ({row, index}) => {
                        const tr = {
                            nodeName: "TR",
                            attributes: {
                                "data-index": index
                            },
                            childNodes: row.map(
                                (cell, cIndex) => {
                                    const column = columnSettings.columns[cIndex] || {}
                                    if (column.hidden) {
                                        return false
                                    }
                                    const td = {
                                        nodeName: "TD",
                                        childNodes: [
                                            {
                                                nodeName: "#text",
                                                data: String(cell.data)
                                            }
                                        ]
                                    }
                                    if (!header && !footer && columnWidths[cIndex] && !noColumnWidths) {
                                        td.attributes = {
                                            style: `width: ${columnWidths[cIndex]}%;`
                                        }
                                    }
                                    if (column.render) {
                                        const renderedCell = column.render(cell, td, index, cIndex)
                                        if (renderedCell && renderedCell instanceof String && td.childNodes.length) {
                                            // Convenience function to make it work similarly to what it did up to version 5.
                                            td.childNodes[0].data = renderedCell
                                        }
                                    }
                                    return td
                                }
                            ).filter(column => column)
                        }
                        if (index===rowCursor) {
                            tr.attributes.class = "dataTable-cursor"
                        }
                        if (rowRender) {
                            rowRender(row, tr, index)
                        }
                        return tr
                    }
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
