import {
    isObject,
    createElement,
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
import {createVirtualPagerDOM} from "./virtual_pager_dom"


export class DataTable {

    columns: Columns

    containerDOM: HTMLDivElement

    _currentPage: number

    data: TableDataType

    _dd: DiffDOM

    dom: HTMLTableElement

    _events: { [key: string]: ((...args) => void)[]}

    hasHeadings: boolean

    hasRows: boolean

    headerDOM: HTMLDivElement

    _initialInnerHTML: string

    initialized: boolean

    _label: HTMLElement

    lastPage: number

    _listeners: { [key: string]: () => void}

    onFirstPage: boolean

    onLastPage: boolean

    options: DataTableConfiguration

    _pagerDOMs: HTMLElement[]

    _virtualPagerDOM: elementNodeType

    pages: {row: cellType[], index: number}[][]

    _rect: {width: number, height: number}

    rows: Rows

    _searchData: number[]

    _searchQueries: {term: string, columns: (number[] | undefined)}[]

    _tableAttributes: { [key: string]: string}

    totalPages: number

    _virtualDOM: elementNodeType

    _virtualHeaderDOM: elementNodeType

    wrapperDOM: HTMLElement

    constructor(table: HTMLTableElement | string, options: DataTableOptions = {}) {


        const dom = typeof table === "string" ?
            document.querySelector(table) :
            table

        if (dom instanceof HTMLTableElement) {
            this.dom = dom
        } else {
            this.dom = document.createElement("table")
            dom.appendChild(this.dom)
        }

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

        this._initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : "" // preserve in case of later destruction

        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex
        } else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0
        }

        this._listeners = {
            onResize: () => this._onResize()
        }

        this._dd = new DiffDOM({valueDiffing: false})

        this.initialized = false
        this._events = {}

        this._currentPage = 0
        this.onFirstPage = true
        this.hasHeadings = false
        this.hasRows = false
        this._searchQueries = []

        this.init()
    }

    /**
     * Initialize the instance
     */
    init() {
        if (this.initialized || this.dom.classList.contains(this.options.classes.table)) {
            return false
        }

        this._virtualDOM = nodeToObj(this.dom, {valueDiffing: false})

        this._tableAttributes = {...this._virtualDOM.attributes}

        this.rows = new Rows(this)
        this.columns = new Columns(this)

        this.data = readTableData(this.options.data, this.dom, this.columns.settings, this.options.type, this.options.format)

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
        this.wrapperDOM = createElement("div", {
            class: `${this.options.classes.wrapper} ${this.options.classes.loading}`
        })

        this.wrapperDOM.innerHTML = this.options.template(this.options, this.dom)

        const selector = this.wrapperDOM.querySelector(`select.${this.options.classes.selector}`)

        // Per Page Select
        if (selector && this.options.paging && this.options.perPageSelect) {

            // Create the options
            this.options.perPageSelect.forEach((choice: number | [string, number]) => {
                const [lab, val] = Array.isArray(choice) ? [choice[0], choice[1]] : [String(choice), choice]
                const selected = val === this.options.perPage
                const option = new Option(lab, String(val), selected, selected)
                selector.appendChild(option)
            })

        } else if (selector) {
            selector.parentElement.removeChild(selector)
        }

        this.containerDOM = this.wrapperDOM.querySelector(`.${this.options.classes.container}`)

        this._pagerDOMs = []
        Array.from(this.wrapperDOM.querySelectorAll(`.${this.options.classes.pagination}`)).forEach(el => {
            if (!(el instanceof HTMLElement)) {
                return
            }
            // We remove the inner part of the pager containers to ensure they are all the same.
            el.innerHTML = `<ul class="${this.options.classes.paginationList}"></ul>`
            this._pagerDOMs.push(el.firstElementChild as HTMLElement)
        })

        this._virtualPagerDOM = {
            nodeName: "UL",
            attributes: {
                class: this.options.classes.paginationList
            }
        }


        this._label = this.wrapperDOM.querySelector(`.${this.options.classes.info}`)

        // Insert in to DOM tree
        this.dom.parentElement.replaceChild(this.wrapperDOM, this.dom)
        this.containerDOM.appendChild(this.dom)

        // Store the table dimensions
        this._rect = this.dom.getBoundingClientRect()

        // // Fix height
        this._fixHeight()
        //


        // Class names
        if (!this.options.header) {
            this.wrapperDOM.classList.add("no-header")
        }

        if (!this.options.footer) {
            this.wrapperDOM.classList.add("no-footer")
        }

        if (this.options.sortable) {
            this.wrapperDOM.classList.add("sortable")
        }

        if (this.options.searchable) {
            this.wrapperDOM.classList.add("searchable")
        }

        if (this.options.fixedHeight) {
            this.wrapperDOM.classList.add("fixed-height")
        }

        if (this.options.fixedColumns) {
            this.wrapperDOM.classList.add("fixed-columns")
        }

        this._bindEvents()

        if (this.columns._state.sort) {
            this.columns.sort(this.columns._state.sort.column, this.columns._state.sort.dir, true)
        }

        this.update(true)
    }

    _renderTable(renderOptions: renderOptions ={}) {
        let newVirtualDOM = dataToVirtualDOM(
            this._tableAttributes,
            this.data.headings,
            (this.options.paging || this._searchQueries.length) && this._currentPage && this.pages.length && !renderOptions.noPaging ?
                this.pages[this._currentPage - 1] :
                this.data.data.map((row, index) => ({
                    row,
                    index
                })),
            this.columns.settings,
            this.columns._state,
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
        const diff = this._dd.diff(this._virtualDOM, newVirtualDOM)
        this._dd.apply(this.dom, diff)
        this._virtualDOM = newVirtualDOM
    }

    /**
     * Render the page
     * @return {Void}
     */
    _renderPage(lastRowCursor=false) {
        if (this.hasRows && this.totalPages) {
            if (this._currentPage > this.totalPages) {
                this._currentPage = 1
            }

            // Use a fragment to limit touching the DOM
            this._renderTable()

            this.onFirstPage = this._currentPage === 1
            this.onLastPage = this._currentPage === this.lastPage
        } else {
            this.setMessage(this.options.labels.noRows)
        }

        // Update the info
        let current = 0

        let f = 0
        let t = 0
        let items

        if (this.totalPages) {
            current = this._currentPage - 1
            f = current * this.options.perPage
            t = f + this.pages[current].length
            f = f + 1
            items = this._searchQueries.length ? this._searchData.length : this.data.data.length
        }

        if (this._label && this.options.labels.info.length) {
            // CUSTOM LABELS
            const string = this.options.labels.info
                .replace("{start}", String(f))
                .replace("{end}", String(t))
                .replace("{page}", String(this._currentPage))
                .replace("{pages}", String(this.totalPages))
                .replace("{rows}", String(items))

            this._label.innerHTML = items ? string : ""
        }

        if (this._currentPage == 1) {
            this._fixHeight()
        }

        if (this.options.rowNavigation && this._currentPage) {
            if (!this.rows.cursor || !this.pages[this._currentPage-1].find(
                row => row.index === this.rows.cursor)
            ) {
                const rows = this.pages[this._currentPage-1]
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

    /** Render the pager(s)
     *
     */
    _renderPagers() {
        if (!this.options.paging) {
            return
        }
        let newPagerVirtualDOM = createVirtualPagerDOM(this.onFirstPage, this.onLastPage, this._currentPage, this.totalPages, this.options)

        if (this.options.pagerRender) {
            const renderedPagerVirtualDOM : (elementNodeType | void) = this.options.pagerRender([this.onFirstPage, this.onLastPage, this._currentPage, this.totalPages], newPagerVirtualDOM)
            if (renderedPagerVirtualDOM) {
                newPagerVirtualDOM = renderedPagerVirtualDOM
            }
        }

        const diffs = this._dd.diff(this._virtualPagerDOM, newPagerVirtualDOM)
        // We may have more than one pager
        this._pagerDOMs.forEach((pagerDOM: HTMLElement) => {
            this._dd.apply(pagerDOM, diffs)
        })

        this._virtualPagerDOM = newPagerVirtualDOM
    }

    // Render header that is not in the same table element as the remainder
    // of the table. Used for tables with scrollY.
    _renderSeparateHeader() {
        const container = this.dom.parentElement
        if (!this.headerDOM) {
            this.headerDOM = document.createElement("div")
            this._virtualHeaderDOM = {
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
                            this.data.headings, this.columns.settings, this.columns._state, this.options, {unhideHeader: true})
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

        const diff = this._dd.diff(this._virtualHeaderDOM, newVirtualHeaderDOM)
        this._dd.apply(this.headerDOM, diff)
        this._virtualHeaderDOM = newVirtualHeaderDOM

        // Compensate for scrollbars
        const paddingRight = this.headerDOM.firstElementChild.clientWidth - this.dom.clientWidth
        if (paddingRight) {
            const paddedVirtualHeaderDOM = structuredClone(this._virtualHeaderDOM)
            paddedVirtualHeaderDOM.attributes.style = `padding-right: ${paddingRight}px;`
            const diff = this._dd.diff(this._virtualHeaderDOM, paddedVirtualHeaderDOM)
            this._dd.apply(this.headerDOM, diff)
            this._virtualHeaderDOM = paddedVirtualHeaderDOM
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
            const selector = this.wrapperDOM.querySelector(`select.${this.options.classes.selector}`)
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
            this.wrapperDOM.addEventListener("keyup", (event: KeyboardEvent) => {
                const target = event.target
                if (!(target instanceof HTMLInputElement) || !target.matches(`.${this.options.classes.input}`)) {
                    return
                }
                event.preventDefault()
                const searches : {term: string, columns: (number[] | undefined)}[] = (Array.from(this.wrapperDOM.querySelectorAll(`.${this.options.classes.input}`)) as HTMLInputElement[]).filter(
                    el => el.value.length
                ).map(
                    el => el.dataset.columns ?
                        {term: el.value,
                            columns: (JSON.parse(el.dataset.columns) as number[])} :
                        {term: el.value,
                            columns: undefined}
                )
                if (searches.length === 1) {
                    const search = searches[0]
                    this.search(search.term, search.columns)
                } else {
                    this.multiSearch(searches)
                }

            })
        }

        // Pager(s) / sorting
        this.wrapperDOM.addEventListener("click", (event: Event) => {
            const target = event.target as Element
            const hyperlink = target.closest("a")
            if (!hyperlink) {
                return
            }

            if (hyperlink.hasAttribute("data-page")) {
                this.page(parseInt(hyperlink.getAttribute("data-page"), 10))
                event.preventDefault()
            } else if (
                hyperlink.classList.contains(this.options.classes.sorter)
            ) {
                const visibleIndex = Array.from(hyperlink.parentElement.parentElement.children).indexOf(hyperlink.parentElement)
                const columnIndex = visibleToColumnIndex(visibleIndex, this.columns.settings)
                this.columns.sort(columnIndex)
                event.preventDefault()
            } else if (
                hyperlink.classList.contains(this.options.classes.filter)
            ) {
                const visibleIndex = Array.from(hyperlink.parentElement.parentElement.children).indexOf(hyperlink.parentElement)
                const columnIndex = visibleToColumnIndex(visibleIndex, this.columns.settings)
                this.columns.filter(columnIndex)
                event.preventDefault()
            }
        }, false)
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", (event: KeyboardEvent) => {
                if (event.key === "ArrowUp") {
                    event.preventDefault()
                    event.stopPropagation()
                    let lastRow
                    this.pages[this._currentPage-1].find((row: {row: cellType[], index: number}) => {
                        if (row.index===this.rows.cursor) {
                            return true
                        }
                        lastRow = row
                        return false
                    })
                    if (lastRow) {
                        this.rows.setCursor(lastRow.index)
                    } else if (!this.onFirstPage) {
                        this.page(this._currentPage-1, true)
                    }
                } else if (event.key === "ArrowDown") {
                    event.preventDefault()
                    event.stopPropagation()
                    let foundRow: boolean
                    const nextRow = this.pages[this._currentPage-1].find((row: {row: cellType[], index: number}) => {
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
                        this.page(this._currentPage+1)
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

        window.addEventListener("resize", this._listeners.onResize)
    }

    /**
     * execute on resize
     */
    _onResize() {
        this._rect = this.containerDOM.getBoundingClientRect()
        if (!this._rect.width) {
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
        this.dom.innerHTML = this._initialInnerHTML

        // Remove the className
        this.dom.classList.remove(this.options.classes.table)

        // Remove the containers
        if (this.wrapperDOM.parentElement) {
            this.wrapperDOM.parentElement.replaceChild(this.dom, this.wrapperDOM)
        }

        this.initialized = false

        window.removeEventListener("resize", this._listeners.onResize)
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update(measureWidths = false) {
        if (measureWidths) {
            this.columns._measureWidths()
            this.hasRows = Boolean(this.data.data.length)
            this.hasHeadings = Boolean(this.data.headings.length)
        }
        this.wrapperDOM.classList.remove(this.options.classes.empty)

        this._paginate()
        this._renderPage()

        this._renderPagers()

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

        if (this._searchQueries.length) {
            rows = []

            this._searchData.forEach((index: number) => rows.push({index,
                row: this.data.data[index]}))
        }

        if (this.columns._state.filters.length) {
            this.columns._state.filters.forEach(
                (filterState: (filterStateType | undefined), column: number) => {
                    if (!filterState) {
                        return
                    }
                    rows = rows.filter(
                        (row: {index: number, row: cellType[]}) => typeof filterState === "function" ? filterState(row.row[column].data) : (row.row[column].text ?? row.row[column].data) === filterState
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

        if (!this._currentPage) {
            this._currentPage = 1
        }
        return this.totalPages
    }

    /**
     * Fix the container height
     */
    _fixHeight() {
        if (this.options.fixedHeight) {
            this.containerDOM.style.height = null
            this._rect = this.containerDOM.getBoundingClientRect()
            this.containerDOM.style.height = `${this._rect.height}px`
        }
    }

    /**
     * Perform a simple search of the data set
     */
    search(term: string, columns: (number[] | undefined ) = undefined) {

        if (!term.length) {
            this._currentPage = 1
            this._searchQueries = []
            this._searchData = []
            this.update()
            this.emit("datatable.search", "", [])
            this.wrapperDOM.classList.remove("search-results")
            return false
        }

        this.multiSearch([
            {term,
                columns: columns ? columns : undefined}
        ])

        this.emit("datatable.search", term, this._searchData)

    }

    /**
     * Perform a search of the data set seraching for up to multiple strings in various columns
     */
    multiSearch(queries : {term: string, columns: (number[] | undefined)}[]) {
        if (!this.hasRows) return false

        this._currentPage = 1
        this._searchQueries = queries
        this._searchData = []

        queries = queries.filter(query => query.term.length)

        if (!queries.length) {
            this.update()
            this.emit("datatable.multisearch", queries, this._searchData)
            this.wrapperDOM.classList.remove("search-results")
            return false
        }
        const queryWords = queries.map(query => this.columns.settings.map(
            (column, index) => {
                if (column.hidden || !column.searchable || (query.columns && !query.columns.includes(index))) {
                    return false
                }
                let columnQuery = query.term
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
        )
        this.data.data.forEach((row: cellType[], idx: number) => {
            const searchRow = row.map((cell, i) => {
                let content = (cell.text || String(cell.data)).trim()
                if (content.length) {
                    const column = this.columns.settings[i]
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
                }
                return content
            })
            if (
                queryWords.every(
                    queries => queries.find(
                        (query, index) => query ?
                            query.split(" ").find(queryWord => searchRow[index].includes(queryWord)) :
                            false
                    )
                )
            ) {
                this._searchData.push(idx)
            }

        })

        this.wrapperDOM.classList.add("search-results")
        if (this._searchData.length) {
            this.update()
        } else {
            this.wrapperDOM.classList.remove("search-results")

            this.setMessage(this.options.labels.noResults)
        }

        this.emit("datatable.multisearch", queries, this._searchData)
    }

    /**
     * Change page
     */
    page(page: number, lastRowCursor = false) {
        // We don't want to load the current page again.
        if (page === this._currentPage) {
            return false
        }

        if (!isNaN(page)) {
            this._currentPage = page
        }

        if (page > this.pages.length || page < 0) {
            return false
        }

        this._renderPage(lastRowCursor)
        this._renderPagers()

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
                        r[index] = readDataCell(cell as inputCellType, this.columns.settings[index])
                    } else if (!this.hasHeadings && !this.hasRows && rIndex === 0) {
                        r[headings.length] = readDataCell(cell as inputCellType, this.columns.settings[headings.length])
                        headings.push(heading)
                        this.data.headings.push(readHeaderCell(heading))
                    }
                })
                rows.push(r)
            })
        } else if (isObject(data)) {
            if (data.headings && !this.hasHeadings && !this.hasRows) {
                this.data = readTableData(data, undefined, this.columns.settings, this.options.type, this.options.format)
            } else if (data.data && Array.isArray(data.data)) {
                rows = data.data.map(row => row.map((cell, index) => readDataCell(cell as inputCellType, this.columns.settings[index])))
            }
        }
        if (rows.length) {
            rows.forEach((row: cellType[]) => this.data.data.push(row))
        }
        this.hasHeadings = Boolean(this.data.headings.length)

        if (this.columns._state.sort) {
            this.columns.sort(this.columns._state.sort.column, this.columns._state.sort.dir, true)
        }

        this.update(true)
    }

    /**
     * Refresh the instance
     */
    refresh() {
        if (this.options.searchable) {
            (Array.from(this.wrapperDOM.querySelectorAll(`.${this.options.classes.input}`)) as HTMLInputElement[]).forEach(
                el => {
                    el.value = ""
                }
            )
            this._searchQueries = []
        }
        this._currentPage = 1
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
            this._tableAttributes,
            this.data.headings,
            this.data.data.map((row, index) => ({
                row,
                index
            })),
            this.columns.settings,
            this.columns._state,
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

        const diff = this._dd.diff(tableVirtualDOM, newTableVirtualDOM)
        this._dd.apply(tableDOM, diff)

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
        const activeHeadings = this.data.headings.filter((heading: headerCellType, index: number) => !this.columns.settings[index]?.hidden)
        const colspan = activeHeadings.length || 1

        this.wrapperDOM.classList.add(this.options.classes.empty)

        if (this._label) {
            this._label.innerHTML = ""
        }
        this.totalPages = 0
        this._renderPagers()

        let newVirtualDOM : elementNodeType = {
            nodeName: "TABLE",
            attributes: {
                class: this.options.classes.table
            },
            childNodes: [
                {
                    nodeName: "THEAD",
                    childNodes: [
                        headingsToVirtualHeaderRowDOM(
                            this.data.headings, this.columns.settings, this.columns._state, this.options, {})
                    ]
                },
                {
                    nodeName: "TBODY",
                    childNodes: [
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
                }

            ]
        }

        if (this.options.tableRender) {
            const renderedTableVirtualDOM : (elementNodeType | void) = this.options.tableRender(this.data, newVirtualDOM, "message")
            if (renderedTableVirtualDOM) {
                newVirtualDOM = renderedTableVirtualDOM
            }
        }

        const diff = this._dd.diff(this._virtualDOM, newVirtualDOM)
        this._dd.apply(this.dom, diff)
        this._virtualDOM = newVirtualDOM

    }

    /**
     * Add custom event listener
     */
    on(event: string, callback: () => void) {
        this._events[event] = this._events[event] || []
        this._events[event].push(callback)
    }

    /**
     * Remove custom event listener
     */
    off(event: string, callback: () => void) {
        if (event in this._events === false) return
        this._events[event].splice(this._events[event].indexOf(callback), 1)
    }

    /**
     * Fire custom event
     */
    emit(event: string, ...args) {
        if (event in this._events === false) return
        for (let i = 0; i < this._events[event].length; i++) {
            this._events[event][i](...args)
        }
    }
}
