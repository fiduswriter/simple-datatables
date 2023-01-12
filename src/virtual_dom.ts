import {stringToObj} from "diff-dom"

import {cellType, DataTableOptions, headerCellType, nodeType, renderOptions} from "./interfaces"


export const headingsToVirtualHeaderRowDOM = (
    headings,
    columnSettings,
    columnWidths,
    {
        classes,
        hiddenHeader,
        sortable,
        scrollY
    }: DataTableOptions,
    {
        noColumnWidths,
        unhideHeader
    }: renderOptions
) => ({
    nodeName: "TR",

    childNodes: headings.map(
        (heading: headerCellType, index: number) : nodeType | void => {
            const column = columnSettings.columns[index] || {}
            if (column.hidden) {
                return
            }
            const attributes : { [key: string]: string} = {}
            if (!column.notSortable && sortable) {
                attributes["data-sortable"] = "true"
            }
            if (columnSettings.sort?.column === index) {
                attributes.class = columnSettings.sort.dir
                attributes["aria-sort"] = columnSettings.sort.dir === "asc" ? "ascending" : "descending"
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
            const headerNodes : nodeType[] = heading.type === "node" ?
                heading.data as nodeType[] :
                [
                    {
                        nodeName: "#text",
                        data: heading.text ?? String(heading.data)
                    }
                ] as nodeType[]
            return {
                nodeName: "TH",
                attributes,
                childNodes:
                    ((hiddenHeader || scrollY.length) && !unhideHeader) ?
                        [
                            {nodeName: "#text",
                                data: ""}
                        ] :
                        column.notSortable || !sortable ?
                            headerNodes :
                            [
                                {
                                    nodeName: "a",
                                    attributes: {
                                        href: "#",
                                        class: classes.sorter
                                    },
                                    childNodes: headerNodes
                                }
                            ]
            }
        }
    ).filter((column: (nodeType | void)) => column)
})

export const dataToVirtualDOM = (id: string, headings: headerCellType[], rows: {row: cellType[], index: number}[], columnSettings: any, columnWidths: number[], rowCursor: (number | false), {
    classes,
    hiddenHeader,
    header,
    footer,
    sortable,
    scrollY,
    rowRender,
    tabIndex
}: DataTableOptions, {
    noColumnWidths,
    unhideHeader,
    renderHeader
}: renderOptions) => {
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
                    }: {row: cellType[], index: number}) => {
                        const tr: nodeType = {
                            nodeName: "TR",
                            attributes: {
                                "data-index": String(index)
                            },
                            childNodes: row.map(
                                (cell: cellType, cIndex: number) => {
                                    const column = columnSettings.columns[cIndex] || {}
                                    if (column.hidden) {
                                        return
                                    }
                                    const td : nodeType = cell.type === "node" ?
                                        {
                                            nodeName: "TD",
                                            childNodes: cell.data
                                        } as nodeType:
                                        {
                                            nodeName: "TD",
                                            childNodes: [
                                                {
                                                    nodeName: "#text",
                                                    data: cell.text ?? String(cell.data)
                                                }
                                            ]
                                        } as nodeType
                                    if (!header && !footer && columnWidths[cIndex] && !noColumnWidths) {
                                        td.attributes = {
                                            style: `width: ${columnWidths[cIndex]}%;`
                                        }
                                    }
                                    if (column.render) {
                                        const renderedCell : (nodeType | void) = column.render(cell.data, td, index, cIndex)
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
                            ).filter((column: (nodeType | void)) => column)
                        }
                        if (index===rowCursor) {
                            tr.attributes.class = classes.cursor
                        }
                        if (rowRender) {
                            const renderedRow : (nodeType | void) = rowRender(row, tr, index)
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
            } as nodeType
        ]
    }

    if (id.length) {
        table.attributes.id = id
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
