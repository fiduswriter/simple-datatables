import {stringToObj} from "diff-dom"

import {nodeType, renderType, rowRenderType} from "./interfaces"


export const headingsToVirtualHeaderRowDOM = (
    headings,
    columnSettings,
    columnWidths,
    {
        classes,
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
        (heading: any, index: number) : false | nodeType => {
            const column = columnSettings.columns[index] || {}
            if (column.hidden) {
                return false
            }
            const attributes : { [key: string]: string} = {}
            if (!column.notSortable && sortable) {
                attributes["data-sortable"] = "true"
            }
            if (heading.sorted) {
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
                                    class: classes.sorter
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
    classes,
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
    const table: nodeType = {
        nodeName: "TABLE",
        attributes: {
            class: classes.table
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    ({
                        row,
                        index
                    }: any) => {
                        const tr: nodeType = {
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
                                    const td : nodeType = cell.type === "node" ?
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
                                        td.attributes = {
                                            style: `width: ${columnWidths[cIndex]}%;`
                                        }
                                    }
                                    if (column.render) {
                                        const renderedCell : renderType = column.render(cell.data, td, index, cIndex)
                                        if (renderedCell) {
                                            if (typeof renderedCell === "string") {
                                                // Convenience method to make it work similarly to what it did up to version 5.
                                                const node = stringToObj(`<td>${renderedCell}</td>`)

                                                if (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text") {
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
                            tr.attributes.class = classes.cursor
                        }
                        if (rowRender) {
                            const renderedRow : rowRenderType = rowRender(row, tr, index)
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
        const headerRow: nodeType = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnWidths, {classes,
            hiddenHeader,
            sortable,
            scrollY}, {noColumnWidths,
            unhideHeader})

        if (header || renderHeader) {
            const thead: nodeType = {
                nodeName: "THEAD",
                childNodes: [headerRow]
            }
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                thead.attributes = {style: "height: 0px;"}
            }
            table.childNodes.unshift(thead)
        }
        if (footer) {
            const footerRow = header ? structuredClone(headerRow) : headerRow
            const tfoot: nodeType = {
                nodeName: "TFOOT",
                childNodes: [footerRow]
            }
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                tfoot.attributes = {style: "height: 0px;"}
            }
            table.childNodes.push(tfoot)
        }

    }

    if (tabIndex !== false) {
        table.attributes.tabindex = String(tabIndex)
    }

    return table
}
