import {stringToObj} from "diff-dom"

export const headingsToVirtualHeaderRowDOM = (
    headings,
    columnSettings,
    columnWidths,
    {
        hiddenHeader,
        sortable,
        scrollY
    }: any,
    {
        noColumnWidths,
        unhideHeader
    }: any
) => ({
    nodeName: "TR",

    childNodes: headings.map(
        (heading: any, index: any) => {
            const column = columnSettings.columns[index] || {}
            if (column.hidden) {
                return false
            }
            const attributes = {}
            if (!column.notSortable && sortable) {
                attributes["data-sortable"] = "true"
            }
            if (heading.sorted) {
                // @ts-expect-error TS(2339): Property 'class' does not exist on type '{}'.
                attributes.class = heading.sorted
                attributes["aria-sort"] = heading.sorted === "asc" ? "ascending" : "descending"
            }
            let style = ""
            if (columnWidths[index] && !noColumnWidths) {
                style += `width: ${columnWidths[index]}%;`
            }
            if (scrollY.length && !unhideHeader) {
                style += "padding-bottom: 0;padding-top: 0;border: 0;"
            }

            if (style.length) {
                // @ts-expect-error TS(2339): Property 'style' does not exist on type '{}'.
                attributes.style = style
            }
            return {
                nodeName: "TH",
                attributes,
                childNodes: [
                    ((hiddenHeader || scrollY.length) && !unhideHeader) ?
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
                                    class: "datatable-sorter"
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
    ).filter((column: any) => column)
})

export const dataToVirtualDOM = (headings: any, rows: any, columnSettings: any, columnWidths: any, rowCursor: any, {
    hiddenHeader,
    header,
    footer,
    sortable,
    scrollY,
    rowRender,
    tabIndex
}: any, {
    noColumnWidths,
    unhideHeader,
    renderHeader
}: any) => {
    const table = {
        nodeName: "TABLE",
        attributes: {
            class: "datatable-table"
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    ({
                        row,
                        index
                    }: any) => {
                        const tr = {
                            nodeName: "TR",
                            attributes: {
                                "data-index": index
                            },
                            childNodes: row.map(
                                (cell: any, cIndex: any) => {
                                    const column = columnSettings.columns[cIndex] || {}
                                    if (column.hidden) {
                                        return false
                                    }
                                    const td = cell.type === "node" ?
                                        {
                                            nodeName: "TD",
                                            childNodes: cell.data
                                        } :
                                        {
                                            nodeName: "TD",
                                            childNodes: [
                                                {
                                                    nodeName: "#text",
                                                    data: String(cell.data)
                                                }
                                            ]
                                        }
                                    if (!header && !footer && columnWidths[cIndex] && !noColumnWidths) {
                                        // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ no... Remove this comment to see the full error message
                                        td.attributes = {
                                            style: `width: ${columnWidths[cIndex]}%;`
                                        }
                                    }
                                    if (column.render) {
                                        const renderedCell = column.render(cell.data, td, index, cIndex)
                                        if (renderedCell) {
                                            if (typeof renderedCell === "string") {
                                                // Convenience method to make it work similarly to what it did up to version 5.
                                                const node = stringToObj(`<td>${renderedCell}</td>`)
                                                // @ts-expect-error TS(2367): This condition will always return 'true' since the... Remove this comment to see the full error message
                                                if (!node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text") {
                                                    td.childNodes = node.childNodes
                                                } else {
                                                    td.childNodes[0].data = renderedCell
                                                }

                                            } else {
                                                return renderedCell
                                            }
                                        }

                                    }
                                    return td
                                }
                            ).filter((column: any) => column)
                        }
                        if (index===rowCursor) {
                            // @ts-expect-error TS(2339): Property 'class' does not exist on type '{ "data-i... Remove this comment to see the full error message
                            tr.attributes.class = "datatable-cursor"
                        }
                        if (rowRender) {
                            const renderedRow = rowRender(row, tr, index)
                            if (renderedRow) {
                                if (typeof renderedRow === "string") {
                                    // Convenience method to make it work similarly to what it did up to version 5.
                                    const node = stringToObj(`<tr>${renderedRow}</tr>`)
                                    if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                                        tr.childNodes = node.childNodes
                                    } else {
                                        tr.childNodes[0].data = renderedRow
                                    }

                                } else {
                                    return renderedRow
                                }
                            }
                        }
                        return tr
                    }
                )
            }
        ]
    }

    if (header || footer || renderHeader) {
        const headerRow = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnWidths, {hiddenHeader,
            sortable,
            scrollY}, {noColumnWidths,
            unhideHeader})

        if (header || renderHeader) {
            const thead = {
                nodeName: "THEAD",
                childNodes: [headerRow]
            }
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ no... Remove this comment to see the full error message
                thead.attributes = {style: "height: 0px;"}
            }
            table.childNodes.unshift(thead)
        }
        if (footer) {
            const footerRow = header ? structuredClone(headerRow) : headerRow
            const tfoot = {
                nodeName: "TFOOT",
                childNodes: [footerRow]
            }
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ no... Remove this comment to see the full error message
                tfoot.attributes = {style: "height: 0px;"}
            }
            table.childNodes.push(tfoot)
        }

    }

    if (tabIndex !== false) {
        // @ts-expect-error TS(2339): Property 'tabindex' does not exist on type '{ clas... Remove this comment to see the full error message
        table.attributes.tabindex = String(tabIndex)
    }

    return table
}
