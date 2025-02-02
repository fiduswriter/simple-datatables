import {
    cellToText,
    classNamesToSelector,
    containsClass,
    createElement,
    debounce,
    isObject,
    joinWithSpaces,
    visibleToColumnIndex
} from "./helpers"
import {
    cellType,
    DataTableConfiguration,
    DataTableOptions,
    dataRowType,
    filterStateType,
    headerCellType,
    inputCellType,
    inputRowType,
    elementNodeType,
    renderOptions,
    rowType,
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

    _initialHTML: string

    initialized: boolean

    _label: HTMLElement

    lastPage: number

    _listeners: { [key: string]: () => void}

    onFirstPage: boolean

    onLastPage: boolean

    options: DataTableConfiguration

    _pagerDOMs: HTMLElement[]

    _virtualPagerDOM: elementNodeType

    pages: rowType[][]

    _rect: {width: number, height: number}

    rows: Rows

    _searchData: number[]

    _searchQueries: {source: string, terms: string[], columns: (number[] | undefined)}[]

    _tableAttributes: {[key: string]: string}

    _tableFooters: elementNodeType[]

    _tableCaptions: elementNodeType[]

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

        const diffDomOptions = {
            ...defaultConfig.diffDomOptions,
            ...options.diffDomOptions
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
            diffDomOptions,
            labels,
            classes
        }

        this._initialHTML = this.options.destroyable ? dom.outerHTML : "" // preserve in case of later destruction

        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex
        } else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0
        }

        this._listeners = {
            onResize: () => this._onResize()
        }

        this._dd = new DiffDOM(this.options.diffDomOptions || {})

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
        if (this.initialized || containsClass(this.dom, this.options.classes.table)) {
            return false
        }

        this._virtualDOM = nodeToObj(this.dom, this.options.diffDomOptions || {})

        this._tableAttributes = {...this._virtualDOM.attributes}
        this._tableFooters = this._virtualDOM.childNodes?.filter(node => node.nodeName === "TFOOT") ?? []
        this._tableCaptions = this._virtualDOM.childNodes?.filter(node => node.nodeName === "CAPTION") ?? []
        if (this.options.caption !== undefined) {
            this._tableCaptions.push({
                nodeName: "CAPTION",
                childNodes: [
                    {
                        nodeName: "#text",
                        data: this.options.caption
                    }
                ]
            })
        }

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

        const selectorClassSelector = classNamesToSelector(this.options.classes.selector)
        const selector = this.wrapperDOM.querySelector(`select${selectorClassSelector}`)

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

        const containerSelector = classNamesToSelector(this.options.classes.container)
        this.containerDOM = this.wrapperDOM.querySelector(containerSelector)

        this._pagerDOMs = []
        const paginationSelector = classNamesToSelector(this.options.classes.pagination)
        Array.from(this.wrapperDOM.querySelectorAll(paginationSelector)).forEach(el => {
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


        const infoSelector = classNamesToSelector(this.options.classes.info)
        this._label = this.wrapperDOM.querySelector(infoSelector)

        // Insert in to DOM tree
        this.dom.parentElement.replaceChild(this.wrapperDOM, this.dom)
        this.containerDOM.appendChild(this.dom)

        // Store the table dimensions
        this._rect = this.dom.getBoundingClientRect()

        // Fix height
        this._fixHeight()

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

    _renderTable(renderOptions: renderOptions = {}) {
        let rows: rowType[]
        const isPaged = (this.options.paging || this._searchQueries.length || this.columns._state.filters.length) && this._currentPage && this.pages.length && !renderOptions.noPaging
        if (isPaged) {
            rows = this.pages[this._currentPage - 1]
        } else {
            rows = this.data.data.map((row, index) => ({
                row,
                index
            }))
        }

        let newVirtualDOM = dataToVirtualDOM(
            this._tableAttributes,
            this.data.headings,
            rows,
            this.columns.settings,
            this.columns._state,
            this.rows.cursor,
            this.options,
            renderOptions,
            this._tableFooters,
            this._tableCaptions
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
            attributes: this._tableAttributes,
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
        tableVirtualDOM.attributes.class = joinWithSpaces(tableVirtualDOM.attributes.class, this.options.classes.table)
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
            const selectorClassSelector = classNamesToSelector(this.options.classes.selector)
            const selector = this.wrapperDOM.querySelector(selectorClassSelector)
            if (selector && selector instanceof HTMLSelectElement) {
                // Change per page
                selector.addEventListener("change", () => {
                    this.emit("datatable.perpage:before", this.options.perPage)
                    this.options.perPage = parseInt(selector.value, 10)
                    this.update()

                    this._fixHeight()

                    this.emit("datatable.perpage", this.options.perPage)
                }, false)
            }
        }

        // Search input
        if (this.options.searchable) {
            this.wrapperDOM.addEventListener("input", (event: InputEvent) => {
                const inputSelector = classNamesToSelector(this.options.classes.input)
                const target = event.target
                if (!(target instanceof HTMLInputElement) || !target.matches(inputSelector)) {
                    return
                }
                event.preventDefault()

                const searches: { terms: string[], columns: (number[] | undefined) }[] = []
                const searchFields: HTMLInputElement[] = Array.from(this.wrapperDOM.querySelectorAll(inputSelector))
                searchFields.filter(
                    el => el.value.length
                ).forEach(
                    el => {
                        const andSearch = el.dataset.and || this.options.searchAnd
                        const querySeparator = el.dataset.querySeparator || this.options.searchQuerySeparator
                        const terms = querySeparator ? el.value.split(this.options.searchQuerySeparator) : [el.value]
                        if (andSearch) {
                            terms.forEach(term => {
                                if (el.dataset.columns) {
                                    searches.push({
                                        terms: [term],
                                        columns: (JSON.parse(el.dataset.columns) as number[])
                                    })
                                } else {
                                    searches.push({terms: [term],
                                        columns: undefined})
                                }
                            })
                        } else {
                            if (el.dataset.columns) {
                                searches.push({
                                    terms,
                                    columns: (JSON.parse(el.dataset.columns) as number[])
                                })
                            } else {
                                searches.push({terms,
                                    columns: undefined})
                            }
                        }

                    }
                )
                if (searches.length === 1 && searches[0].terms.length === 1) {
                    const search = searches[0]
                    this.search(search.terms[0], search.columns)
                } else {
                    this.multiSearch(searches)
                }
            })
        }

        // Pager(s) / sorting
        this.wrapperDOM.addEventListener("click", (event: Event) => {
            const target = event.target as Element
            const hyperlink = target.closest("a, button")
            if (!hyperlink) {
                return
            }

            if (hyperlink.hasAttribute("data-page")) {
                this.page(parseInt(hyperlink.getAttribute("data-page"), 10))
                event.preventDefault()
            } else if (containsClass(hyperlink, this.options.classes.sorter)) {
                const visibleIndex = Array.from(hyperlink.parentElement.parentElement.children).indexOf(hyperlink.parentElement)
                const columnIndex = visibleToColumnIndex(visibleIndex, this.columns.settings)
                this.columns.sort(columnIndex)
                event.preventDefault()
            } else if (containsClass(hyperlink, this.options.classes.filter)) {
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
                    let lastRow: rowType
                    this.pages[this._currentPage-1].find((row: rowType) => {
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
                    const nextRow = this.pages[this._currentPage-1].find((row: rowType) => {
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
                    const row = Array.from(this.dom.querySelectorAll("tbody > tr")).find(row => row.contains(target))
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
                const row = Array.from(this.dom.querySelectorAll("tbody > tr")).find(row => row.contains(target))
                if (row && row instanceof HTMLElement) {
                    this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event)
                }
            })
        }

        window.addEventListener("resize", this._listeners.onResize)
    }

    /**
     * execute on resize and debounce to avoid multiple calls
     */
    _onResize = debounce(() => {
        this._rect = this.containerDOM.getBoundingClientRect()
        if (!this._rect.width) {
            return
        }
        this.update(true)
    }, 250)

    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        if (!this.options.destroyable) {
            return
        }
        if (this.wrapperDOM) {
            const parentElement = this.wrapperDOM.parentElement
            if (parentElement) {
                // Restore the initial HTML
                const oldDOM = createElement("div")
                oldDOM.innerHTML = this._initialHTML
                const oldTable = oldDOM.firstElementChild as HTMLTableElement
                parentElement.replaceChild(oldTable, this.wrapperDOM)
                this.dom = oldTable
            } else {
                // Remove the className
                this.options.classes.table?.split(" ").forEach(className => this.wrapperDOM.classList.remove(className))
            }
        }

        window.removeEventListener("resize", this._listeners.onResize)

        this.initialized = false
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update(measureWidths = false) {
        this.emit("datatable.update:before")

        if (measureWidths) {
            this.columns._measureWidths()
            this.hasRows = Boolean(this.data.data.length)
            this.hasHeadings = Boolean(this.data.headings.length)
        }
        this.options.classes.empty?.split(" ").forEach(className => this.wrapperDOM.classList.remove(className))

        this._paginate()
        this._renderPage()

        this._renderPagers()

        if (this.options.scrollY.length) {
            this._renderSeparateHeader()
        }

        this.emit("datatable.update")
    }

    _paginate() {
        let rows: rowType[] = this.data.data.map((row, index) => ({
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
                        (row: {index: number, row: dataRowType}) => {
                            const cell = row.row.cells[column]
                            return typeof filterState === "function" ? filterState(cell.data) : cellToText(cell) === filterState
                        }
                    )
                }
            )
        }

        if (this.options.paging && this.options.perPage > 0) {
            // Check for hidden columns
            this.pages = rows
                .map((_row, i: number) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter((page: {row: dataRowType, index: number}[]) => page)
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
    search(term: string, columns: (number[] | undefined ) = undefined, source: string = "search") {
        this.emit("datatable.search:before", term, this._searchData)

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
            {terms: [term],
                columns: columns ? columns : undefined}
        ], source)

        this.emit("datatable.search", term, this._searchData)

    }

    /**
     * Perform a search of the data set searching for up to multiple strings in various columns
     */
    multiSearch(rawQueries: { terms: string[], columns: (number[] | undefined) }[], source: string = "search") {
        if (!this.hasRows) return false

        this._currentPage = 1
        this._searchData = []
        // Remove empty queries
        let queries = rawQueries.map(query => ({
            columns: query.columns,
            terms: query.terms.map(term => term.trim()).filter(term => term),
            source
        })).filter(query => query.terms.length)

        this.emit("datatable.multisearch:before", queries, this._searchData)

        if (source.length) {
            // Add any existing queries from different source
            queries = queries.concat(this._searchQueries.filter(query => query.source !== source))
        }
        this._searchQueries = queries

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
                let columnQueries = query.terms
                const sensitivity = column.sensitivity || this.options.sensitivity
                if (["base", "accent"].includes(sensitivity)) {
                    columnQueries = columnQueries.map(query => query.toLowerCase())
                }
                if (["base", "case"].includes(sensitivity)) {
                    columnQueries = columnQueries.map(query => query.normalize("NFD").replace(/\p{Diacritic}/gu, ""))
                }
                const ignorePunctuation = column.ignorePunctuation ?? this.options.ignorePunctuation
                if (ignorePunctuation) {
                    columnQueries = columnQueries.map(query => query.replace(/[.,/#!$%^&*;:{}=-_`~()]/g, ""))
                }
                return columnQueries
            }
        ))
        this.data.data.forEach((row: dataRowType, idx: number) => {
            const searchRow = row.cells.map((cell, i) => {
                const column = this.columns.settings[i]
                const customSearchMethod = column.searchMethod || this.options.searchMethod
                if (customSearchMethod) {
                    return cell
                }
                let content = cellToText(cell).trim()
                if (content.length) {
                    const sensitivity = column.sensitivity || this.options.sensitivity
                    if (["base", "accent"].includes(sensitivity)) {
                        content = content.toLowerCase()
                    }
                    if (["base", "case"].includes(sensitivity)) {
                        content = content.normalize("NFD").replace(/\p{Diacritic}/gu, "")
                    }
                    const ignorePunctuation = column.ignorePunctuation ?? this.options.ignorePunctuation
                    if (ignorePunctuation) {
                        content = content.replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "")
                    }
                }
                const searchItemSeparator = column.searchItemSeparator || this.options.searchItemSeparator
                return searchItemSeparator ? content.split(searchItemSeparator) : [content]
            })
            if (
                queryWords.every(
                    (queryColumn, queryIndex) => queryColumn.find(
                        (queryColumnWord, index) => {
                            if (!queryColumnWord) {
                                return false
                            }
                            const column = this.columns.settings[index]
                            const customSearchMethod = column.searchMethod || this.options.searchMethod
                            if (customSearchMethod) {
                                return customSearchMethod(queryColumnWord, (searchRow[index] as cellType), row, index, queries[queryIndex].source)
                            }
                            return queryColumnWord.find(queryWord => (searchRow[index] as string[]).find(searchItem => searchItem.includes(queryWord)))
                        }
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
        this.emit("datatable.page:before", page)

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
        {headings?: string[], data?: (inputRowType | inputCellType[])[]} | { [key: string]: inputCellType}[])) {
        let rows: dataRowType[] = []
        if (Array.isArray(data)) {
            const headings = this.data.headings.map((heading: headerCellType) => heading.data ? String(heading.data) : heading.text)
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
                rows.push({
                    cells: r
                })
            })
        } else if (isObject(data)) {
            if (data.headings && !this.hasHeadings && !this.hasRows) {
                this.data = readTableData(data, undefined, this.columns.settings, this.options.type, this.options.format)
            } else if (data.data && Array.isArray(data.data)) {
                rows = data.data.map(row => {
                    let attributes: { [key: string]: string }
                    let cells: inputCellType[]
                    if (Array.isArray(row)) {
                        attributes = {}
                        cells = row
                    } else {
                        attributes = row.attributes
                        cells = row.cells
                    }
                    return {
                        attributes,
                        cells: cells.map((cell, index) => readDataCell(cell as inputCellType, this.columns.settings[index]))
                    } as dataRowType
                })
            }
        }
        if (rows.length) {
            rows.forEach((row: dataRowType) => this.data.data.push(row))
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
        this.emit("datatable.refresh:before")

        if (this.options.searchable) {
            const inputSelector = classNamesToSelector(this.options.classes.input)
            const inputs: HTMLInputElement[] = Array.from(this.wrapperDOM.querySelectorAll(inputSelector))
            inputs.forEach(el => (el.value = ""))
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
            },
            this._tableFooters,
            this._tableCaptions
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

        this.options.classes.empty?.split(" ").forEach(className => this.wrapperDOM.classList.add(className))

        if (this._label) {
            this._label.innerHTML = ""
        }
        this.totalPages = 0
        this._renderPagers()

        let newVirtualDOM : elementNodeType = {
            nodeName: "TABLE",
            attributes: this._tableAttributes,
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

        this._tableFooters.forEach(footer => newVirtualDOM.childNodes.push(footer))
        this._tableCaptions.forEach(caption => newVirtualDOM.childNodes.push(caption))

        newVirtualDOM.attributes.class = joinWithSpaces(newVirtualDOM.attributes.class, this.options.classes.table)

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
    on(event: string, callback: (...args: any[]) => void) {
        this._events[event] = this._events[event] || []
        this._events[event].push(callback)
    }

    /**
     * Remove custom event listener
     */
    off(event: string, callback: (...args: any[]) => void) {
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
