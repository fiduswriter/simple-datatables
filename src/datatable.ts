import {
    isObject,
    createElement,
    flush,
    paginationListItem,
    truncate,
    visibleToColumnIndex
} from "./helpers"
import {
    cellType,
    DataTableConfiguration,
    DataTableOptions,
    filterStateType,
    headerCellType,
    inputCellType,
    elementNodeType,
    renderOptions,
    TableDataType
} from "./types"
import {DiffDOM, nodeToObj} from "diff-dom"

import {dataToVirtualDOM, headingsToVirtualHeaderRowDOM} from "./virtual_dom"
import {readTableData, readDataCell, readHeaderCell} from "./read_data"
import {Rows} from "./rows"
import {Columns} from "./columns"
import {defaultConfig} from "./config"


export class DataTable {

    columns: Columns

    container: HTMLDivElement

    currentPage: number

    data: TableDataType

    dd: DiffDOM

    dom: HTMLTableElement

    events: { [key: string]: ((...args) => void)[]}

    filterStates: filterStateType[]

    hasHeadings: boolean

    hasRows: boolean

    headerDOM: HTMLDivElement

    id: string

    initialInnerHTML: string

    initialized: boolean

    input: HTMLInputElement

    label: HTMLElement

    lastPage: number

    paginationListItems: HTMLElement[]

    listeners: { [key: string]: () => void}

    onFirstPage: boolean

    onLastPage: boolean

    options: DataTableConfiguration

    pagers: HTMLUListElement[]

    pages: {row: cellType[], index: number}[][]

    rect: {width: number, height: number}

    rows: Rows

    searchData: number[]

    searching: boolean

    totalPages: number

    virtualDOM: elementNodeType

    virtualHeaderDOM: elementNodeType

    wrapper: HTMLElement

    constructor(table: HTMLTableElement | string, options: DataTableOptions = {}) {

        this.dom = typeof table === "string" ? document.querySelector(table) : table

        this.id = this.dom.id

        const labels = {
            ...defaultConfig.labels,
            ...options.labels
        }

        const classes = {
            ...defaultConfig.classes,
            ...options.classes
        }

        // user options
        this.options = {
            ...defaultConfig,
            ...options,
            labels,
            classes
        }

        this.initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : "" // preserve in case of later destruction

        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex
        } else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0
        }

        this.listeners = {
            onResize: () => this._onResize()
        }

        this.dd = new DiffDOM()

        this.initialized = false
        this.events = {}

        this.currentPage = 0
        this.onFirstPage = true
        this.hasHeadings = false
        this.hasRows = false

        this.filterStates = []

        this.init()
    }

    /**
     * Initialize the instance
     */
    init() {
        if (this.initialized || this.dom.classList.contains(this.options.classes.table)) {
            return false
        }

        this.virtualDOM = nodeToObj(this.dom)

        this.rows = new Rows(this)
        this.columns = new Columns(this)

        this.data = readTableData(this.options.dataConvert, this.options.data, this.dom, this.columns.settings)
        this.hasRows = Boolean(this.data.data.length)
        this.hasHeadings = Boolean(this.data.headings.length)


        this._render()

        setTimeout(() => {
            this.emit("datatable.init")
            this.initialized = true
        }, 10)
    }


    /**
     * Render the instance
     */
    _render() {

        // Build
        this.wrapper = createElement("div", {
            class: `${this.options.classes.wrapper} ${this.options.classes.loading}`
        })

        let template = this.options.template(this.options)

        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {

            // Create the select
            const select = createElement("select", {
                class: this.options.classes.selector
            })

            // Create the options
            this.options.perPageSelect.forEach((choice: number | [string, number]) => {
                const [lab, val] = Array.isArray(choice) ? [choice[0], choice[1]] : [String(choice), choice]
                const selected = val === this.options.perPage
                const option = new Option(lab, String(val), selected, selected)
                select.appendChild(option)
            })

            // Selector placement
            template = template.replace("{select}", select.outerHTML)
        } else {
            template = template.replace("{select}", "")
        }

        // Paginator
        const paginatorWrapper = createElement("nav", {
            class: this.options.classes.pagination
        })
        const paginator = createElement("ul", {
            class: this.options.classes.paginationList
        })
        paginatorWrapper.appendChild(paginator)

        // Pager(s) placement
        template = template.replace(/\{pager\}/g, paginatorWrapper.outerHTML)
        this.wrapper.innerHTML = template

        this.container = this.wrapper.querySelector(`.${this.options.classes.container}`)

        this.pagers = Array.from(this.wrapper.querySelectorAll(`ul.${this.options.classes.paginationList}`))

        this.label = this.wrapper.querySelector(`.${this.options.classes.info}`)

        // Insert in to DOM tree
        this.dom.parentElement.replaceChild(this.wrapper, this.dom)
        this.container.appendChild(this.dom)

        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect()

        // // Fix height
        this._fixHeight()
        //


        // Class names
        if (!this.options.header) {
            this.wrapper.classList.add("no-header")
        }

        if (!this.options.footer) {
            this.wrapper.classList.add("no-footer")
        }

        if (this.options.sortable) {
            this.wrapper.classList.add("sortable")
        }

        if (this.options.searchable) {
            this.wrapper.classList.add("searchable")
        }

        if (this.options.fixedHeight) {
            this.wrapper.classList.add("fixed-height")
        }

        if (this.options.fixedColumns) {
            this.wrapper.classList.add("fixed-columns")
        }

        this._bindEvents()

        if (this.columns.settings.sort) {
            this.columns.sort(this.columns.settings.sort.column, this.columns.settings.sort.dir, true)
        }

        this.update(true)
    }

    _renderTable(renderOptions: renderOptions ={}) {
        let newVirtualDOM = dataToVirtualDOM(
            this.id,
            this.data.headings,
            (this.options.paging || this.searching) && this.currentPage && this.pages.length && !renderOptions.noPaging ?
                this.pages[this.currentPage - 1] :
                this.data.data.map((row, index) => ({
                    row,
                    index
                })),
            this.columns.settings,
            this.columns.widths,
            this.rows.cursor,
            this.options,
            renderOptions
        )

        if (this.options.tableRender) {
            const renderedTableVirtualDOM : (elementNodeType | void) = this.options.tableRender(this.data, newVirtualDOM, "main")
            if (renderedTableVirtualDOM) {
                newVirtualDOM = renderedTableVirtualDOM
            }
        }

        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM)
        this.dd.apply(this.dom, diff)
        this.virtualDOM = newVirtualDOM
    }

    /**
     * Render the page
     * @return {Void}
     */
    _renderPage(lastRowCursor=false) {
        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1
            }

            // Use a fragment to limit touching the DOM
            this._renderTable()

            this.onFirstPage = this.currentPage === 1
            this.onLastPage = this.currentPage === this.lastPage
        } else {
            this.setMessage(this.options.labels.noRows)
        }

        // Update the info
        let current = 0

        let f = 0
        let t = 0
        let items

        if (this.totalPages) {
            current = this.currentPage - 1
            f = current * this.options.perPage
            t = f + this.pages[current].length
            f = f + 1
            items = this.searching ? this.searchData.length : this.data.data.length
        }

        if (this.label && this.options.labels.info.length) {
            // CUSTOM LABELS
            const string = this.options.labels.info
                .replace("{start}", String(f))
                .replace("{end}", String(t))
                .replace("{page}", String(this.currentPage))
                .replace("{pages}", String(this.totalPages))
                .replace("{rows}", String(items))

            this.label.innerHTML = items ? string : ""
        }

        if (this.currentPage == 1) {
            this._fixHeight()
        }

        if (this.options.rowNavigation && this.currentPage) {
            if (!this.rows.cursor || !this.pages[this.currentPage-1].find(
                row => row.index === this.rows.cursor)
            ) {
                const rows = this.pages[this.currentPage-1]
                if (rows.length) {
                    if (lastRowCursor) {
                        this.rows.setCursor(rows[rows.length-1].index)
                    } else {
                        this.rows.setCursor(rows[0].index)
                    }
                }
            }
        }
    }

    /**
     * Render the pager(s)
     * @return {Void}
     */
    _renderPager() {
        flush(this.pagers)

        if (this.totalPages > 1) {
            const frag = document.createDocumentFragment()
            const prev = this.onFirstPage ? 1 : this.currentPage - 1
            const next = this.onLastPage ? this.totalPages : this.currentPage + 1

            // first button
            if (this.options.firstLast) {
                frag.appendChild(paginationListItem(this.options.classes.paginationListItem, this.options.classes.paginationListItemLink, 1, this.options.firstText))
            }

            // prev button
            if (this.options.nextPrev && !this.onFirstPage) {
                frag.appendChild(paginationListItem(this.options.classes.paginationListItem, this.options.classes.paginationListItemLink, prev, this.options.prevText))
            }

            let pager = this.paginationListItems

            // truncate the paginationListItems
            if (this.options.truncatePager) {
                pager = truncate(
                    this.paginationListItems,
                    this.currentPage,
                    this.pages.length,
                    this.options
                )
            }

            // active page link
            this.paginationListItems[this.currentPage - 1].classList.add(this.options.classes.active)

            // append the paginationListItems
            pager.forEach((p: HTMLElement) => {
                p.classList.remove(this.options.classes.active)
                frag.appendChild(p)
            })

            this.paginationListItems[this.currentPage - 1].classList.add(this.options.classes.active)

            // next button
            if (this.options.nextPrev && !this.onLastPage) {
                frag.appendChild(paginationListItem(this.options.classes.paginationListItem, this.options.classes.paginationListItemLink, next, this.options.nextText))
            }

            // first button
            if (this.options.firstLast) {
                frag.appendChild(paginationListItem(this.options.classes.paginationListItem, this.options.classes.paginationListItemLink, this.totalPages, this.options.lastText))
            }

            // We may have more than one pager
            this.pagers.forEach((pager: HTMLElement) => {
                pager.appendChild(frag.cloneNode(true))
            })
        }
    }

    // Render header that is not in the same table element as the remainder
    // of the table. Used for tables with scrollY.
    _renderSeparateHeader() {
        const container = this.dom.parentElement
        if (!this.headerDOM) {
            this.headerDOM = document.createElement("div")
            this.virtualHeaderDOM = {
                nodeName: "DIV"
            }

        }
        container.parentElement.insertBefore(this.headerDOM, container)
        let tableVirtualDOM : elementNodeType = {
            nodeName: "TABLE",
            attributes: {
                class: this.options.classes.table
            },
            childNodes: [
                {
                    nodeName: "THEAD",
                    childNodes: [
                        headingsToVirtualHeaderRowDOM(
                            this.data.headings, this.columns.settings, this.columns.widths, this.options, {unhideHeader: true})
                    ]

                }

            ]
        }
        if (this.options.tableRender) {
            const renderedTableVirtualDOM : (elementNodeType | void) = this.options.tableRender(this.data, tableVirtualDOM, "header")
            if (renderedTableVirtualDOM) {
                tableVirtualDOM = renderedTableVirtualDOM
            }
        }

        const newVirtualHeaderDOM = {
            nodeName: "DIV",
            attributes: {
                class: this.options.classes.headercontainer
            },
            childNodes: [tableVirtualDOM]
        }

        const diff = this.dd.diff(this.virtualHeaderDOM, newVirtualHeaderDOM)
        this.dd.apply(this.headerDOM, diff)
        this.virtualHeaderDOM = newVirtualHeaderDOM

        // Compensate for scrollbars
        const paddingRight = this.headerDOM.firstElementChild.clientWidth - this.dom.clientWidth
        if (paddingRight) {
            const paddedVirtualHeaderDOM = structuredClone(this.virtualHeaderDOM)
            paddedVirtualHeaderDOM.attributes.style = `padding-right: ${paddingRight}px;`
            const diff = this.dd.diff(this.virtualHeaderDOM, paddedVirtualHeaderDOM)
            this.dd.apply(this.headerDOM, diff)
            this.virtualHeaderDOM = paddedVirtualHeaderDOM
        }

        if (container.scrollHeight > container.clientHeight) {
            // scrollbars on one page means scrollbars on all pages.
            container.style.overflowY = "scroll"
        }
    }

    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    _bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapper.querySelector(`select.${this.options.classes.selector}`)
            if (selector && selector instanceof HTMLSelectElement) {
                // Change per page
                selector.addEventListener("change", () => {
                    this.options.perPage = parseInt(selector.value, 10)
                    this.update()

                    this._fixHeight()

                    this.emit("datatable.perpage", this.options.perPage)
                }, false)
            }
        }

        // Search input
        if (this.options.searchable) {
            this.input = this.wrapper.querySelector(`.${this.options.classes.input}`)
            if (this.input) {
                this.input.addEventListener("keyup", () => this.search(this.input.value), false)
            }
        }

        // Pager(s) / sorting
        this.wrapper.addEventListener("click", (event: Event) => {
            const target = event.target as Element
            const hyperlink = target.closest("a")
            if (!hyperlink) {
                return
            }

            if (hyperlink.hasAttribute("data-page")) {
                this.page(parseInt(hyperlink.getAttribute("data-page"), 10))
                event.preventDefault()
            } else if (
                this.options.sortable &&
                hyperlink.classList.contains(this.options.classes.sorter) &&
                hyperlink.parentElement.getAttribute("data-sortable") != "false"
            ) {
                const visibleIndex = Array.from(hyperlink.parentElement.parentElement.children).indexOf(hyperlink.parentElement)
                const columnIndex = visibleToColumnIndex(visibleIndex, this.columns.settings.columns)
                this.columns.sort(columnIndex)
                event.preventDefault()
            }
        }, false)
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", (event: KeyboardEvent) => {
                if (event.key === "ArrowUp") {
                    event.preventDefault()
                    event.stopPropagation()
                    let lastRow
                    this.pages[this.currentPage-1].find((row: {row: cellType[], index: number}) => {
                        if (row.index===this.rows.cursor) {
                            return true
                        }
                        lastRow = row
                        return false
                    })
                    if (lastRow) {
                        this.rows.setCursor(lastRow.index)
                    } else if (!this.onFirstPage) {
                        this.page(this.currentPage-1, true)
                    }
                } else if (event.key === "ArrowDown") {
                    event.preventDefault()
                    event.stopPropagation()
                    let foundRow: boolean
                    const nextRow = this.pages[this.currentPage-1].find((row: {row: cellType[], index: number}) => {
                        if (foundRow) {
                            return true
                        }
                        if (row.index===this.rows.cursor) {
                            foundRow = true
                        }
                        return false
                    })
                    if (nextRow) {
                        this.rows.setCursor(nextRow.index)
                    } else if (!this.onLastPage) {
                        this.page(this.currentPage+1)
                    }
                } else if (["Enter", " "].includes(event.key)) {
                    this.emit("datatable.selectrow", this.rows.cursor, event)
                }
            })
            this.dom.addEventListener("mousedown", (event: Event) => {
                const target = event.target
                if (!(target instanceof Element)) {
                    return
                }
                if (this.dom.matches(":focus")) {
                    const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(target))
                    if (row && row instanceof HTMLElement) {
                        this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event)
                    }
                }

            })
        } else {
            this.dom.addEventListener("mousedown", (event: Event) => {
                const target = event.target
                if (!(target instanceof Element)) {
                    return
                }
                const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(target))
                if (row && row instanceof HTMLElement) {
                    this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event)
                }
            })
        }

        window.addEventListener("resize", this.listeners.onResize)
    }

    /**
     * execute on resize
     */
    _onResize() {
        this.rect = this.container.getBoundingClientRect()
        if (!this.rect.width) {
            // No longer shown, likely no longer part of DOM. Give up.
            return
        }
        this.update(true)
    }

    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        if (!this.options.destroyable) {
            return
        }
        this.dom.innerHTML = this.initialInnerHTML

        // Remove the className
        this.dom.classList.remove(this.options.classes.table)

        // Remove the containers
        if (this.wrapper.parentElement) {
            this.wrapper.parentElement.replaceChild(this.dom, this.wrapper)
        }

        this.initialized = false

        window.removeEventListener("resize", this.listeners.onResize)
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update(measureWidths = false) {
        if (measureWidths) {
            this.columns._measureWidths()
        }
        this.wrapper.classList.remove(this.options.classes.empty)

        this._paginate()
        this._renderPage()

        this.paginationListItems = []

        let i = this.pages.length
        while (i--) {
            const num = i + 1
            this.paginationListItems[i] = paginationListItem(
                i === 0 ? `${this.options.classes.active} ${this.options.classes.paginationListItem}` : this.options.classes.paginationListItem,
                this.options.classes.paginationListItemLink,
                num,
                String(num)
            )
        }
        this._renderPager()

        if (this.options.scrollY.length) {
            this._renderSeparateHeader()
        }

        this.emit("datatable.update")
    }

    _paginate() {
        let rows = this.data.data.map((row, index) => ({
            row,
            index
        }))

        if (this.searching) {
            rows = []

            this.searchData.forEach((index: number) => rows.push({index,
                row: this.data.data[index]}))
        }

        if (this.filterStates.length) {
            this.filterStates.forEach(
                (filterState: filterStateType) => {
                    rows = rows.filter(
                        (row: {index: number, row: cellType[]}) => typeof filterState.state === "function" ? filterState.state(row.row[filterState.column].data) : row.row[filterState.column].data === filterState.state
                    )
                }
            )
        }

        if (this.options.paging && this.options.perPage > 0) {
            // Check for hidden columns
            this.pages = rows
                .map((row: {row: cellType[], index: number}, i: number) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter((page: {row: cellType[], index: number}[]) => page)
        } else {
            this.pages = [rows]
        }

        this.totalPages = this.lastPage = this.pages.length

        this.currentPage = 1
        return this.totalPages
    }

    /**
     * Fix the container height
     */
    _fixHeight() {
        if (this.options.fixedHeight) {
            this.container.style.height = null
            this.rect = this.container.getBoundingClientRect()
            this.container.style.height = `${this.rect.height}px`
        }
    }

    /**
     * Perform a search of the data set
     */
    search(query: string) {
        if (!this.hasRows) return false

        this.currentPage = 1
        this.searching = true
        this.searchData = []

        if (!query.length) {
            this.searching = false
            this.update()
            this.emit("datatable.search", query, this.searchData)
            this.wrapper.classList.remove("search-results")
            return false
        }

        const queryWords : (string | false)[]= this.columns.settings.columns.map(
            column => {
                if (column.hidden || !column.searchable) {
                    return false
                }
                let columnQuery = query
                const sensitivity = column.sensitivity || this.options.sensitivity
                if (["base", "accent"].includes(sensitivity)) {
                    columnQuery = columnQuery.toLowerCase()
                }
                if (["base", "case"].includes(sensitivity)) {
                    columnQuery = columnQuery.normalize("NFD").replace(/\p{Diacritic}/gu, "")
                }
                const ignorePunctuation = column.ignorePunctuation || this.options.ignorePunctuation
                if (ignorePunctuation) {
                    columnQuery = columnQuery.replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "")
                }
                return columnQuery
            }
        )

        this.data.data.forEach((row: cellType[], idx: number) => {
            for (let i=0; i<row.length; i++) {
                const query = queryWords[i]
                if (query) {
                    const cell = row[i]
                    let content = (cell.text || String(cell.data)).trim()
                    if (content.length) {
                        const column = this.columns.settings.columns[i]
                        const sensitivity = column.sensitivity || this.options.sensitivity
                        if (["base", "accent"].includes(sensitivity)) {
                            content = content.toLowerCase()
                        }
                        if (["base", "case"].includes(sensitivity)) {
                            content = content.normalize("NFD").replace(/\p{Diacritic}/gu, "")
                        }
                        const ignorePunctuation = column.ignorePunctuation || this.options.ignorePunctuation
                        if (ignorePunctuation) {
                            content = content.replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "")
                        }
                        if (query.split(" ").find(queryWord => content.includes(queryWord))) {
                            this.searchData.push(idx)
                            break
                        }
                    }
                }
            }
        })

        this.wrapper.classList.add("search-results")
        if (this.searchData.length) {
            this.update()
        } else {
            this.wrapper.classList.remove("search-results")

            this.setMessage(this.options.labels.noResults)
        }

        this.emit("datatable.search", query, this.searchData)
    }

    /**
     * Change page
     */
    page(page: number, lastRowCursor = false) {
        // We don't want to load the current page again.
        if (page === this.currentPage) {
            return false
        }

        if (!isNaN(page)) {
            this.currentPage = page
        }

        if (page > this.pages.length || page < 0) {
            return false
        }

        this._renderPage(lastRowCursor)
        this._renderPager()

        this.emit("datatable.page", page)
    }

    /**
     * Add new row data
     */
    insert(data: (
        {headings?: string[], data?: inputCellType[][]} | { [key: string]: inputCellType}[])) {
        let rows: cellType[][] = []
        if (Array.isArray(data)) {
            const headings = this.data.headings.map((heading: headerCellType) => heading.text ?? String(heading.data))
            data.forEach((row, rIndex) => {
                const r: cellType[] = []
                Object.entries(row).forEach(([heading, cell]) => {

                    const index = headings.indexOf(heading)

                    if (index > -1) {
                        r[index] = readDataCell(cell as inputCellType, this.columns.settings.columns[index])
                    } else if (!this.hasHeadings && !this.hasRows && rIndex === 0) {
                        r[headings.length] = readDataCell(cell as inputCellType, this.columns.settings.columns[headings.length])
                        headings.push(heading)
                        this.data.headings.push(readHeaderCell(heading))
                    }
                })
                rows.push(r)
            })
        } else if (isObject(data)) {
            if (data.headings && !this.hasHeadings && !this.hasRows) {
                this.data = readTableData(this.options.dataConvert, data, undefined, this.columns.settings)
                this.hasRows = Boolean(this.data.data.length)
                this.hasHeadings = Boolean(this.data.headings.length)
            } else if (data.data && Array.isArray(data.data)) {
                rows = data.data.map(row => row.map((cell, index) => readDataCell(cell as inputCellType, this.columns.settings.columns[index])))
            }
        }
        if (rows.length) {
            rows.forEach((row: cellType[]) => this.data.data.push(row))
            this.hasRows = true
        }
        this.hasHeadings = Boolean(this.data.headings.length)

        if (this.columns.settings.sort) {
            this.columns.sort(this.columns.settings.sort.column, this.columns.settings.sort.dir, true)
        }

        this.update(true)
    }

    /**
     * Refresh the instance
     */
    refresh() {
        if (this.options.searchable) {
            this.input.value = ""
            this.searching = false
        }
        this.currentPage = 1
        this.onFirstPage = true
        this.update(true)

        this.emit("datatable.refresh")
    }

    /**
     * Print the table
     */
    print() {
        const tableDOM = createElement("table")
        const tableVirtualDOM = {nodeName: "TABLE"}
        let newTableVirtualDOM = dataToVirtualDOM(
            this.id,
            this.data.headings,
            this.data.data.map((row, index) => ({
                row,
                index
            })),
            this.columns.settings,
            this.columns.widths,
            false, // No row cursor
            this.options,
            {
                noColumnWidths: true,
                unhideHeader: true
            }
        )

        if (this.options.tableRender) {
            const renderedTableVirtualDOM : (elementNodeType | void) = this.options.tableRender(this.data, newTableVirtualDOM, "print")
            if (renderedTableVirtualDOM) {
                newTableVirtualDOM = renderedTableVirtualDOM
            }
        }

        const diff = this.dd.diff(tableVirtualDOM, newTableVirtualDOM)
        this.dd.apply(tableDOM, diff)

        // Open new window
        const w = window.open()

        // Append the table to the body
        w.document.body.appendChild(tableDOM)

        // Print
        w.print()
    }

    /**
     * Show a message in the table
     */
    setMessage(message: string) {
        const activeHeadings = this.data.headings.filter((heading: headerCellType, index: number) => !this.columns.settings.columns[index]?.hidden)
        const colspan = activeHeadings.length || 1

        this.wrapper.classList.add(this.options.classes.empty)

        if (this.label) {
            this.label.innerHTML = ""
        }
        this.totalPages = 0
        this._renderPager()

        let newVirtualDOM = structuredClone(this.virtualDOM)

        let tbody : elementNodeType = newVirtualDOM.childNodes?.find((node: elementNodeType) => node.nodeName === "TBODY") as elementNodeType

        if (!tbody) {
            tbody = {nodeName: "TBODY"}
            newVirtualDOM.childNodes = [tbody]
        }

        tbody.childNodes = [
            {
                nodeName: "TR",
                childNodes: [
                    {
                        nodeName: "TD",
                        attributes: {
                            class: this.options.classes.empty,
                            colspan: String(colspan)
                        },
                        childNodes: [
                            {
                                nodeName: "#text",
                                data: message
                            }
                        ]
                    }
                ]
            }
        ]

        if (this.options.tableRender) {
            const renderedTableVirtualDOM : (elementNodeType | void) = this.options.tableRender(this.data, newVirtualDOM, "message")
            if (renderedTableVirtualDOM) {
                newVirtualDOM = renderedTableVirtualDOM
            }
        }

        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM)
        this.dd.apply(this.dom, diff)
        this.virtualDOM = newVirtualDOM

    }

    /**
     * Add custom event listener
     */
    on(event: string, callback: () => void) {
        this.events[event] = this.events[event] || []
        this.events[event].push(callback)
    }

    /**
     * Remove custom event listener
     */
    off(event: string, callback: () => void) {
        if (event in this.events === false) return
        this.events[event].splice(this.events[event].indexOf(callback), 1)
    }

    /**
     * Fire custom event
     */
    emit(event: string, ...args) {
        if (event in this.events === false) return
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i](...args)
        }
    }
}
