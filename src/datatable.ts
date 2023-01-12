import {DiffDOM, nodeToObj} from "diff-dom"

import {dataToVirtualDOM, headingsToVirtualHeaderRowDOM} from "./virtual_dom"
import {readColumnSettings} from "./column_settings"
import {readTableData, readDataCell} from "./read_data"
import {Rows} from "./rows"
import {Columns} from "./columns"
import {defaultConfig} from "./config"
import {
    isObject,
    createElement,
    flush,
    button,
    truncate
} from "./helpers"
import {
    columnSettingsType,
    DataTableOptions,
    nodeType,
    renderOptions,
    TableDataType
} from "./interfaces"


export class DataTable {
    columnSettings: {
        sort: false | {column: number, dir: "asc" | "desc"},
        columns: (columnSettingsType | undefined)[]
    }

    columnWidths: number[]

    columns: Columns

    container: HTMLDivElement

    currentPage: number

    data: TableDataType

    dd: any

    dom: HTMLTableElement

    events: any

    filterStates: any

    hasHeadings: boolean

    hasRows: boolean

    headerDOM: HTMLDivElement

    id: string

    initialInnerHTML: string

    initialized: boolean

    input: HTMLInputElement

    label: HTMLElement

    lastPage: any

    links: any

    listeners: any

    onFirstPage: boolean

    onLastPage: boolean

    options: DataTableOptions

    pagers: HTMLUListElement[]

    pages: any

    rect: any

    rows: Rows

    searchData: number[]

    searching: boolean

    totalPages: number

    virtualDOM: nodeType

    virtualHeaderDOM: nodeType

    wrapper: HTMLElement

    constructor(table: HTMLTableElement | string, options: DataTableOptions = {}) {

        this.dom = typeof table === "string" ? document.querySelector(table) : table

        this.id = this.dom.id

        // user options
        this.options = {
            ...defaultConfig,
            ...options,
            layout: {
                ...defaultConfig.layout,
                ...options.layout
            },
            labels: {
                ...defaultConfig.labels,
                ...options.labels
            },
            classes: {
                ...defaultConfig.classes,
                ...options.classes
            }
        }

        this.initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : "" // preserve in case of later destruction

        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex
        } else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0
        }

        this.listeners = {
            onResize: () => this.onResize()
        }

        this.dd = new DiffDOM()

        this.initialized = false
        this.events = {}

        this.currentPage = 0
        this.onFirstPage = true
        this.hasHeadings = false
        this.hasRows = false

        this.columnWidths = []
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

        this.columnSettings = readColumnSettings(this.options.columns)
        this.data = readTableData(this.options.data, this.dom, this.columnSettings)
        this.hasRows = Boolean(this.data.data.length)
        this.hasHeadings = Boolean(this.data.headings.length)


        this.render()

        setTimeout(() => {
            this.emit("datatable.init")
            this.initialized = true
        }, 10)
    }


    /**
     * Render the instance
     */
    render() {

        // Build
        this.wrapper = createElement("div", {
            class: `${this.options.classes.wrapper} ${this.options.classes.loading}`
        })

        // Template for custom layouts
        let template = ""
        template += `<div class='${this.options.classes.top}'>`
        template += this.options.layout.top
        template += "</div>"
        if (this.options.scrollY.length) {
            template += `<div class='${this.options.classes.container}' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`
        } else {
            template += `<div class='${this.options.classes.container}'></div>`
        }
        template += `<div class='${this.options.classes.bottom}'>`
        template += this.options.layout.bottom
        template += "</div>"

        // Info placement
        template = template.replace("{info}", this.options.paging ? `<div class='${this.options.classes.info}'></div>` : "")

        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {
            let wrap = `<div class='${this.options.classes.dropdown}'><label>`
            wrap += this.options.labels.perPage
            wrap += "</label></div>"

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

            // Custom label
            wrap = wrap.replace("{select}", select.outerHTML)

            // Selector placement
            template = template.replace("{select}", wrap)
        } else {
            template = template.replace("{select}", "")
        }

        // Searchable
        if (this.options.searchable) {
            const form =
                `<div class='${this.options.classes.search}'><input class='${this.options.classes.input}' placeholder='${this.options.labels.placeholder}' type='text'></div>`

            // Search input placement
            template = template.replace("{search}", form)
        } else {
            template = template.replace("{search}", "")
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
        this.dom.parentNode.replaceChild(this.wrapper, this.dom)
        this.container.appendChild(this.dom)

        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect()

        // // Update
        this.update(false)
        //
        // // Fix height
        this.fixHeight()
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

        this.bindEvents()

        if (this.columnSettings.sort) {
            this.columns.sort(this.columnSettings.sort.column, this.columnSettings.sort.dir, true)
        }

        // // Fix columns
        this.fixColumns()
    }

    renderTable(renderOptions: renderOptions ={}) {

        const newVirtualDOM = dataToVirtualDOM(
            this.id,
            this.data.headings,
            this.options.paging && this.currentPage && !renderOptions.noPaging ?
                this.pages[this.currentPage - 1] :
                this.data.data.map((row, index) => ({
                    row,
                    index
                })),
            this.columnSettings,
            this.columnWidths,
            this.rows.cursor,
            this.options,
            renderOptions
        )

        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM)
        this.dd.apply(this.dom, diff)
        this.virtualDOM = newVirtualDOM
    }

    /**
     * Render the page
     * @return {Void}
     */
    renderPage(renderTable=true, lastRowCursor=false) {
        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1
            }

            // Use a fragment to limit touching the DOM
            if (renderTable) {
                this.renderTable()
            }

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
            this.fixHeight()
        }

        if (this.options.rowNavigation && this.currentPage) {
            if (!this.rows.cursor || !this.pages[this.currentPage-1].find((page: any) => page.index === this.rows.cursor)) {
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
    renderPager() {
        flush(this.pagers)

        if (this.totalPages > 1) {
            const c = "pager"
            const frag = document.createDocumentFragment()
            const prev = this.onFirstPage ? 1 : this.currentPage - 1
            const next = this.onLastPage ? this.totalPages : this.currentPage + 1

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, 1, this.options.firstText))
            }

            // prev button
            if (this.options.nextPrev && !this.onFirstPage) {
                frag.appendChild(button(c, prev, this.options.prevText))
            }

            let pager = this.links

            // truncate the links
            if (this.options.truncatePager) {
                pager = truncate(
                    this.links,
                    this.currentPage,
                    this.pages.length,
                    this.options.pagerDelta,
                    this.options.ellipsisText
                )
            }

            // active page link
            this.links[this.currentPage - 1].classList.add("active")

            // append the links
            pager.forEach((p: any) => {
                p.classList.remove("active")
                frag.appendChild(p)
            })

            this.links[this.currentPage - 1].classList.add("active")

            // next button
            if (this.options.nextPrev && !this.onLastPage) {
                frag.appendChild(button(c, next, this.options.nextText))
            }

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, this.totalPages, this.options.lastText))
            }

            // We may have more than one pager
            this.pagers.forEach((pager: any) => {
                pager.appendChild(frag.cloneNode(true))
            })
        }
    }

    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapper.querySelector(`select.${this.options.classes.selector}`)
            if (selector && selector instanceof HTMLSelectElement) {
                // Change per page
                selector.addEventListener("change", () => {
                    this.options.perPage = parseInt(selector.value, 10)
                    this.update()

                    this.fixHeight()

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
        this.wrapper.addEventListener("click", (e: any) => {
            const t = e.target.closest("a")
            if (t && (t.nodeName.toLowerCase() === "a")) {
                if (t.hasAttribute("data-page")) {
                    this.page(parseInt(t.getAttribute("data-page"), 10))
                    e.preventDefault()
                } else if (
                    this.options.sortable &&
                    t.classList.contains(this.options.classes.sorter) &&
                    t.parentNode.getAttribute("data-sortable") != "false"
                ) {
                    this.columns.sort(Array.from(t.parentNode.parentNode.children).indexOf(t.parentNode))
                    e.preventDefault()
                }
            }
        }, false)
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", (event: any) => {
                if (event.key === "ArrowUp") {
                    event.preventDefault()
                    event.stopPropagation()
                    let lastRow
                    this.pages[this.currentPage-1].find((row: any) => {
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
                    let foundRow: any
                    const nextRow = this.pages[this.currentPage-1].find((row: any) => {
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
            this.dom.addEventListener("mousedown", (event: any) => {
                if (this.dom.matches(":focus")) {
                    const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(event.target))
                    if (row && row instanceof HTMLElement) {
                        this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event)
                    }
                }

            })
        } else {
            this.dom.addEventListener("mousedown", (event: any) => {
                const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(event.target))
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
    onResize() {
        this.rect = this.container.getBoundingClientRect()
        if (!this.rect.width) {
            // No longer shown, likely no longer part of DOM. Give up.
            return
        }
        this.fixColumns()
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
        if (this.wrapper.parentNode) {
            this.wrapper.parentNode.replaceChild(this.dom, this.wrapper)
        }

        this.initialized = false

        window.removeEventListener("resize", this.listeners.onResize)
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update(renderTable = true) {
        this.wrapper.classList.remove(this.options.classes.empty)

        this.paginate()
        this.renderPage(renderTable)

        this.links = []

        let i = this.pages.length
        while (i--) {
            const num = i + 1
            this.links[i] = button(i === 0 ? "active" : "", num, num)
        }

        this.renderPager()

        this.emit("datatable.update")
    }

    paginate() {
        let rows = this.data.data.map((row, index) => ({
            row,
            index
        }))

        if (this.searching) {
            rows = []

            this.searchData.forEach((index: any) => rows.push({index,
                row: this.data.data[index]}))
        }

        if (this.filterStates.length) {
            this.filterStates.forEach(
                (filterState: any) => {
                    rows = rows.filter(
                        (row: any) => typeof filterState.state === "function" ? filterState.state(row.row[filterState.column].data) : row.row[filterState.column].data === filterState.state
                    )
                }
            )
        }

        if (this.options.paging && this.options.perPage > 0) {
            // Check for hidden columns
            this.pages = rows
                .map((row: any, i: any) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter((page: any) => page)
        } else {
            this.pages = [rows]
        }

        this.totalPages = this.lastPage = this.pages.length

        this.currentPage = 1

        return this.totalPages
    }

    /**
     * Fix column widths
     */
    fixColumns() {
        const activeHeadings = this.data.headings.filter((heading: any, index: any) => !this.columnSettings.columns[index]?.hidden)
        if ((this.options.scrollY.length || this.options.fixedColumns) && activeHeadings?.length) {

            this.columnWidths = []
            const renderOptions: {noPaging?: true, noColumnWidths?: true, unhideHeader?: true, renderHeader?: true} = {
                noPaging: true
            }
            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.options.header || this.options.footer) {

                if (this.options.scrollY.length) {
                    renderOptions.unhideHeader = true
                }
                if (this.headerDOM) {
                    // Remove headerDOM for accurate measurements
                    this.headerDOM.parentElement.removeChild(this.headerDOM)
                }

                // Reset widths
                renderOptions.noColumnWidths = true
                this.renderTable(renderOptions)

                const activeDOMHeadings : HTMLTableCellElement[] = Array.from(this.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || [])
                const absoluteColumnWidths = activeDOMHeadings.map(cell => cell.offsetWidth)
                const totalOffsetWidth = absoluteColumnWidths.reduce(
                    (total, cellWidth) => total + cellWidth,
                    0
                )
                this.columnWidths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100)


                if (this.options.scrollY.length) {
                    const container = this.dom.parentElement
                    if (!this.headerDOM) {
                        this.headerDOM = document.createElement("div")
                        this.virtualHeaderDOM = {
                            nodeName: "DIV"
                        }

                    }
                    container.parentElement.insertBefore(this.headerDOM, container)
                    const newVirtualHeaderDOM = {
                        nodeName: "DIV",
                        attributes: {
                            class: this.options.classes.headercontainer
                        },
                        childNodes: [
                            {
                                nodeName: "TABLE",
                                attributes: {
                                    class: this.options.classes.table
                                },
                                childNodes: [
                                    {
                                        nodeName: "THEAD",
                                        childNodes: [
                                            headingsToVirtualHeaderRowDOM(
                                                this.data.headings, this.columnSettings, this.columnWidths, this.options, {unhideHeader: true})
                                        ]

                                    }

                                ]
                            }
                        ]
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

            } else {
                renderOptions.renderHeader = true
                this.renderTable(renderOptions)

                const activeDOMHeadings: HTMLTableCellElement[] = Array.from(this.dom.querySelector("thead, tfoot")?.firstElementChild?.querySelectorAll("th") || [])
                const absoluteColumnWidths = activeDOMHeadings.map(cell => cell.offsetWidth)
                const totalOffsetWidth = absoluteColumnWidths.reduce(
                    (total, cellWidth) => total + cellWidth,
                    0
                )
                this.columnWidths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100)
            }
            // render table without options for measurements
            this.renderTable()
        }
    }

    /**
     * Fix the container height
     */
    fixHeight() {
        if (this.options.fixedHeight) {
            this.container.style.height = null
            this.rect = this.container.getBoundingClientRect()
            this.container.style.height = `${this.rect.height}px`
        }
    }

    /**
     * Perform a search of the data set
     */
    search(query: any) {
        if (!this.hasRows) return false

        query = query.toLowerCase()

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

        this.data.data.forEach((row: any, idx: number) => {
            const inArray = this.searchData.includes(idx)

            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            const doesQueryMatch = query.split(" ").reduce((bool: any, word: any) => {
                let includes = false
                let cell = null
                let content = null

                for (let x = 0; x < row.length; x++) {
                    cell = row[x]
                    content = cell.text || String(cell.data)
                    if (
                        this.columns.visible(x) && content.toLowerCase().includes(word)
                    ) {
                        includes = true
                        break
                    }
                }

                return bool && includes
            }, true)

            if (doesQueryMatch && !inArray) {
                this.searchData.push(idx)
            }
        })

        this.wrapper.classList.add("search-results")

        if (!this.searchData.length) {
            this.wrapper.classList.remove("search-results")

            this.setMessage(this.options.labels.noResults)
        } else {
            this.update()
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

        this.renderPage(undefined, lastRowCursor)
        this.renderPager()

        this.emit("datatable.page", page)
    }

    /**
     * Add new row data
     */
    insert(data: any) {
        let rows = []
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    this.data = readTableData(data, undefined, this.columnSettings)
                    this.hasRows = Boolean(this.data.data.length)
                    this.hasHeadings = Boolean(this.data.headings.length)
                }
            }

            if (data.data && Array.isArray(data.data)) {
                rows = data.data
            }
        } else if (Array.isArray(data)) {
            const headings = this.data.headings.map((heading: any) => heading.data)
            data.forEach(row => {
                const r: any = []
                Object.entries(row).forEach(([heading, cell]) => {

                    const index = headings.indexOf(heading)

                    if (index > -1) {
                        r[index] = cell
                    }
                })
                rows.push(r)
            })
        }

        if (rows.length) {
            rows.forEach((row: any) => this.data.data.push(row.map((cell: any, index: any) => {
                const cellOut = readDataCell(cell, this.columnSettings.columns[index])
                return cellOut
            })))
            this.hasRows = true
        }


        if (this.columnSettings.sort) {
            this.columns.sort(this.columnSettings.sort.column, this.columnSettings.sort.dir, true)
        } else {
            this.update(false)
        }
        this.fixColumns()
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
        this.update()

        this.emit("datatable.refresh")
    }

    /**
     * Print the table
     */
    print() {
        const tableDOM = createElement("table")
        const tableVirtualDOM = {nodeName: "TABLE"}
        const newTableVirtualDOM = dataToVirtualDOM(
            this.id,
            this.data.headings,
            this.data.data.map((row, index) => ({
                row,
                index
            })),
            this.columnSettings,
            this.columnWidths,
            false, // No row cursor
            this.options,
            {
                noColumnWidths: true,
                unhideHeader: true
            }
        )

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
    setMessage(message: any) {
        const activeHeadings = this.data.headings.filter((heading: any, index: any) => !this.columnSettings.columns[index]?.hidden)
        const colspan = activeHeadings.length || 1

        this.wrapper.classList.add(this.options.classes.empty)

        if (this.label) {
            this.label.innerHTML = ""
        }
        this.totalPages = 0
        this.renderPager()

        const newVirtualDOM = structuredClone(this.virtualDOM)

        let tbody : nodeType = newVirtualDOM.childNodes?.find((node: nodeType) => node.nodeName === "TBODY") as nodeType

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


        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM)
        this.dd.apply(this.dom, diff)
        this.virtualDOM = newVirtualDOM

    }

    /**
     * Add custom event listener
     */
    on(event: any, callback: any) {
        this.events[event] = this.events[event] || []
        this.events[event].push(callback)
    }

    /**
     * Remove custom event listener
     */
    off(event: any, callback: any) {
        if (event in this.events === false) return
        this.events[event].splice(this.events[event].indexOf(callback), 1)
    }

    /**
     * Fire custom event
     */
    emit(event: any, ...args) {
        if (event in this.events === false) return
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i](...args)
        }
    }
}
