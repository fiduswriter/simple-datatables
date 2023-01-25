import {stringToObj} from "diff-dom"

import {cellType, columnsStateType, columnSettingsType, DataTableOptions, headerCellType, elementNodeType, textNodeType, renderOptions} from "./types"


export const headingsToVirtualHeaderRowDOM = (
    headings,
    columnSettings,
    columnsState: columnsStateType,
    {
        classes,
        format,
        hiddenHeader,
        sortable,
        scrollY,
        type
    }: DataTableOptions,
    {
        noColumnWidths,
        unhideHeader
    }: renderOptions
) => ({
    nodeName: "TR",

    childNodes: headings.map(
        (heading: headerCellType, index: number) : elementNodeType | void => {
            const column = columnSettings[index] || ({
                type,
                format,
                sortable: true,
                searchable: true
            } as columnSettingsType)
            if (column.hidden) {
                return
            }
            const attributes : { [key: string]: string} = {}
            if (column.sortable && sortable && (!scrollY.length || unhideHeader)) {
                if (column.filter) {
                    attributes["data-filterable"] = "true"
                } else {
                    attributes["data-sortable"] = "true"
                }
            }
            if (column.headerClass) {
                attributes.class = column.headerClass
            }
            if (columnsState.sort && columnsState.sort.column === index) {
                const directionClass = columnsState.sort.dir === "asc" ? classes.ascending : classes.descending
                attributes.class = attributes.class ? `${attributes.class} ${directionClass}` : directionClass
                attributes["aria-sort"] = columnsState.sort.dir === "asc" ? "ascending" : "descending"
            } else if (columnsState.filters[index]) {
                attributes.class = attributes.class ? `${attributes.class} ${classes.filterActive}` : classes.filterActive
            }
            let style = ""
            if (columnsState.widths[index] && !noColumnWidths) {
                style += `width: ${columnsState.widths[index]}%;`
            }
            if (scrollY.length && !unhideHeader) {
                style += "padding-bottom: 0;padding-top: 0;border: 0;"
            }

            if (style.length) {
                attributes.style = style
            }
            if (column.headerClass) {
                attributes.class = column.headerClass
            }
            const headerNodes : elementNodeType[] = heading.type === "html" ?
                heading.data as elementNodeType[] :
                [
                    {
                        nodeName: "#text",
                        data: heading.text ?? String(heading.data)
                    }
                ] as textNodeType[]
            return {
                nodeName: "TH",
                attributes,
                childNodes:
                    ((hiddenHeader || scrollY.length) && !unhideHeader) ?
                        [
                            {nodeName: "#text",
                                data: ""}
                        ] :
                        !column.sortable || !sortable ?
                            headerNodes :
                            [
                                {
                                    nodeName: "a",
                                    attributes: {
                                        href: "#",
                                        class: column.filter ? classes.filter : classes.sorter
                                    },
                                    childNodes: headerNodes
                                }
                            ]
            }
        }
    ).filter((column: (elementNodeType | void)) => column)
})

export const dataToVirtualDOM = (tableAttributes: { [key: string]: string}, headings: headerCellType[], rows: {row: cellType[], index: number}[], columnSettings: columnSettingsType[], columnsState: columnsStateType, rowCursor: (number | false), {
    classes,
    hiddenHeader,
    header,
    footer,
    format,
    sortable,
    scrollY,
    type,
    rowRender,
    tabIndex
}: DataTableOptions, {
    noColumnWidths,
    unhideHeader,
    renderHeader
}: renderOptions) => {
    const table: elementNodeType = {
        nodeName: "TABLE",
        attributes: {...tableAttributes},
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    ({
                        row,
                        index
                    }: {row: cellType[], index: number}) => {
                        const tr: elementNodeType = {
                            nodeName: "TR",
                            attributes: {
                                "data-index": String(index)
                            },
                            childNodes: row.map(
                                (cell: cellType, cIndex: number) => {
                                    const column = columnSettings[cIndex] || ({
                                        type,
                                        format,
                                        sortable: true,
                                        searchable: true
                                    } as columnSettingsType)
                                    if (column.hidden) {
                                        return
                                    }
                                    const td : elementNodeType = column.type === "html" ?
                                        {
                                            nodeName: "TD",
                                            childNodes: cell.data
                                        } as elementNodeType:
                                        {
                                            nodeName: "TD",
                                            childNodes: [
                                                {
                                                    nodeName: "#text",
                                                    data: cell.text ?? String(cell.data)
                                                }
                                            ]
                                        } as elementNodeType
                                    if (!header && !footer && columnsState.widths[cIndex] && !noColumnWidths) {
                                        td.attributes = {
                                            style: `width: ${columnsState.widths[cIndex]}%;`
                                        }
                                    }
                                    if (column.cellClass) {
                                        if (!td.attributes) {
                                            td.attributes = {}
                                        }
                                        td.attributes.class = column.cellClass
                                    }
                                    if (column.render) {
                                        const renderedCell : (string | elementNodeType | void) = column.render(cell.data, td, index, cIndex)
                                        if (renderedCell) {
                                            if (typeof renderedCell === "string") {
                                                // Convenience method to make it work similarly to what it did up to version 5.
                                                const node = stringToObj(`<td>${renderedCell}</td>`)

                                                if (node.childNodes.length !== 1 || !["#text", "#comment"].includes(node.childNodes[0].nodeName)) {
                                                    td.childNodes = node.childNodes
                                                } else {
                                                    (td.childNodes[0] as textNodeType).data = renderedCell
                                                }

                                            } else {
                                                return renderedCell
                                            }
                                        }

                                    }
                                    return td
                                }
                            ).filter((column: (elementNodeType | void)) => column)
                        }
                        if (index===rowCursor) {
                            tr.attributes.class = classes.cursor
                        }
                        if (rowRender) {
                            const renderedRow : (elementNodeType | void) = rowRender(row, tr, index)
                            if (renderedRow) {
                                if (typeof renderedRow === "string") {
                                    // Convenience method to make it work similarly to what it did up to version 5.
                                    const node = stringToObj(`<tr>${renderedRow}</tr>`)
                                    if (node.childNodes && (node.childNodes.length !== 1 || !["#text", "#comment"].includes(node.childNodes[0].nodeName))) {
                                        tr.childNodes = node.childNodes
                                    } else {
                                        (tr.childNodes[0] as textNodeType).data = renderedRow
                                    }

                                } else {
                                    return renderedRow
                                }
                            }
                        }
                        return tr
                    }
                )
            } as elementNodeType
        ]
    }

    table.attributes.class = table.attributes.class ? `${table.attributes.class} ${classes.table}` : classes.table

    if (header || footer || renderHeader) {
        const headerRow: elementNodeType = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnsState, {classes,
            hiddenHeader,
            sortable,
            scrollY}, {noColumnWidths,
            unhideHeader})

        if (header || renderHeader) {
            const thead: elementNodeType = {
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
            const tfoot: elementNodeType = {
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
