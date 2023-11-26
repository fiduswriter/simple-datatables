import {stringToObj} from "diff-dom"

import {cellType, columnsStateType, columnSettingsType, DataTableOptions, headerCellType, elementNodeType, textNodeType, renderOptions, rowType} from "./types"
import {cellToText, joinWithSpaces} from "./helpers"


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
            const attributes : { [key: string]: string } = heading.attributes ? {...heading.attributes} : {}
            if (column.sortable && sortable && (!scrollY.length || unhideHeader)) {
                if (column.filter) {
                    attributes["data-filterable"] = "true"
                } else {
                    attributes["data-sortable"] = "true"
                }
            }

            if (column.headerClass) {
                attributes.class = joinWithSpaces(attributes.class, column.headerClass)
            }
            if (columnsState.sort && columnsState.sort.column === index) {
                const directionClass = columnsState.sort.dir === "asc" ? classes.ascending : classes.descending
                attributes.class = joinWithSpaces(attributes.class, directionClass)
                attributes["aria-sort"] = columnsState.sort.dir === "asc" ? "ascending" : "descending"
            } else if (columnsState.filters[index]) {
                attributes.class = joinWithSpaces(attributes.class, classes.filterActive)
            }

            if (columnsState.widths[index] && !noColumnWidths) {
                const style = `width: ${columnsState.widths[index]}%;`
                attributes.style = joinWithSpaces(attributes.style, style)
            }
            if (scrollY.length && !unhideHeader) {
                const style = "padding-bottom: 0;padding-top: 0;border: 0;"
                attributes.style = joinWithSpaces(attributes.style, style)
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
                            {
                                nodeName: "#text",
                                data: ""
                            }
                        ] :
                        !column.sortable || !sortable ?
                            headerNodes :
                            [
                                {
                                    nodeName: "BUTTON",
                                    attributes: {
                                        class: column.filter ? classes.filter : classes.sorter
                                    },
                                    childNodes: headerNodes
                                }
                            ]
            }
        }
    ).filter((column: (elementNodeType | void)) => column)
})

export const dataToVirtualDOM = (tableAttributes: { [key: string]: string}, headings: headerCellType[], rows: rowType[], columnSettings: columnSettingsType[], columnsState: columnsStateType, rowCursor: (number | false), {
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
}: renderOptions, footers: elementNodeType[], captions: elementNodeType[]) => {
    const table: elementNodeType = {
        nodeName: "TABLE",
        attributes: {...tableAttributes},
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(
                    ({row, index}) => {
                        const tr: elementNodeType = {
                            nodeName: "TR",
                            attributes: {
                                ...row.attributes,
                                ...{
                                    "data-index": String(index)
                                }
                            },
                            childNodes: row.cells.map(
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
                                    const td: elementNodeType = {
                                        nodeName: "TD",
                                        attributes: cell.attributes ? {...cell.attributes} : {},
                                        childNodes: column.type === "html" ?
                                            cell.data :
                                            [
                                                {
                                                    nodeName: "#text",
                                                    data: cellToText(cell)
                                                }
                                            ]
                                    } as elementNodeType
                                    if (!header && !footer && columnsState.widths[cIndex] && !noColumnWidths) {
                                        td.attributes.style = joinWithSpaces(td.attributes.style, `width: ${columnsState.widths[cIndex]}%;`)
                                    }
                                    if (column.cellClass) {
                                        td.attributes.class = joinWithSpaces(td.attributes.class, column.cellClass)
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
                        if (index === rowCursor) {
                            tr.attributes.class = joinWithSpaces(tr.attributes.class, classes.cursor)
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

    table.attributes.class = joinWithSpaces(table.attributes.class, classes.table)

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
                thead.attributes = {
                    style: "height: 0px;"
                }
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

    footers.forEach(foot => table.childNodes.push(foot))
    captions.forEach(caption => table.childNodes.push(caption))

    if (tabIndex !== false) {
        table.attributes.tabindex = String(tabIndex)
    }

    return table
}
