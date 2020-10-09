import {Rows} from "./rows"
import {Columns} from "./columns"
import {defaultConfig} from "./config"
import {createTable} from "./init"

import {
    insert,
    importData,
    ajaxImport,
    exportData,
    print
} from "./io.js"

import {
    createElement,
    flush,
    button,
    truncate
} from "./helpers"


export class DataTable {
    /*
     * define any getters and setters for the DataTable object here
     * These eliminate potential bugs coming from a developer forgetting
     * to explicitly update the values when they change
     */
    get head() {
        return this.table.tHead
    }

    get header() {
        return this.head.rows[0]
    }

    get headings() {
        return [].slice.call(this.header.cells)
    }

    get hasHeadings() {
        return this.head && this.head.rows.length
    }

    get body() {
        return this.table.tBodies[0]
    }

    get foot() {
        return this.table.tFoot
    }

    get hasRows() {
        return this.body && (this.body.rows.length || this.data.length)
    }

    get rect() {
        // Current table dimensions
        return this.table.getBoundingClientRect()
    }

    // Constructor
    constructor(table, options = {}) {
        this.initialized = false

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
            }
        }

        if (typeof table === "string") {
            table = document.querySelector(table)
        }

        this.initialLayout = table.innerHTML
        this.initialSortable = this.options.sortable

        // Disable manual sorting if no header is present (#4)
        if (!this.options.header) {
            this.options.sortable = false
        }

        if (table.tHead === null) {
            if (!this.options.data ||
                (this.options.data && !this.options.data.headings)
            ) {
                this.options.sortable = false
            }
        }

        if (table.tBodies.length && !table.tBodies[0].rows.length) {
            if (this.options.data) {
                if (!this.options.data.data) {
                    throw new Error(
                        "You seem to be using the data option, but you've not defined any rows."
                    )
                }
            }
        }

        this.table = table

        this.init()
    }

    /**
     * Add custom property or method to extend DataTable
     * @param  {String} prop    - Method name or property
     * @param  {Mixed} val      - Function or property value
     * @return {Void}
     */
    static extend(prop, val) {
        if (typeof val === "function") {
            DataTable.prototype[prop] = val
        } else {
            DataTable[prop] = val
        }
    }

    /**
     * Initialize the instance
     * @param  {Object} options
     * @return {Void}
     */
    init(options) {
        if (this.initialized || this.table.classList.contains("dataTable-table")) {
            return false
        }

        Object.assign(this.options, options || {})

        this.currentPage = 1
        this.onFirstPage = true

        this.hiddenColumns = []
        this.renderers = {}

        createTable(this)

        if (this.options.ajax) {

            this.ajaxImport(this.options.ajax)

        } else if (this.options.data) {

            this.insert(this.options.data)
        }

        setTimeout(() => {
            this.emit("datatable.init")
            this.initialized = true

            if (this.options.plugins) {
                Object.entries(this.options.plugins).forEach(([plugin, options]) => {
                    if (this[plugin] && typeof this[plugin] === "function") {
                        this[plugin] = this[plugin](options, {createElement})

                        // Init plugin
                        if (options.enabled && this[plugin].init && typeof this[plugin].init === "function") {
                            this[plugin].init()
                        }
                    }
                })
            }
        }, 10)
    }

    /**
     * Render the instance
     * @param  {String} type
     * @return {Void}
     */
    render(type) {
        if (type) {
            switch (type) {
            case "page":
                this.renderPage()
                break
            case "pager":
                this.renderPager()
                break
            case "header":
                this.renderHeader()
                break
            }

            return false
        }
    }

    /**
     * Render the page
     * @return {Void}
     */
    renderPage() {
        if (this.hasHeadings) {
            flush(this.header)

            this.activeHeadings.forEach(th => this.header.appendChild(th))
        }


        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1
            }

            // Use a fragment to limit touching the DOM
            const index = this.currentPage - 1

            const frag = document.createDocumentFragment()
            const renderRow = this.rows().render

            this.pages[index].forEach(row => frag.appendChild(renderRow(row)))

            this.clear(frag)

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
            items = this.searching ? this.searchData.length : this.data.length
        }

        if (this.label && this.options.labels.info.length) {
            // CUSTOM LABELS
            const string = this.options.labels.info
                .replace("{start}", f)
                .replace("{end}", t)
                .replace("{page}", this.currentPage)
                .replace("{pages}", this.totalPages)
                .replace("{rows}", items)

            this.label.innerHTML = items ? string : ""
        }

        if (this.currentPage == 1) {
            this.fixHeight()
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
            if (this.options.nextPrev) {
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
            pager.forEach(p => {
                p.classList.remove("active")
                frag.appendChild(p)
            })

            this.links[this.currentPage - 1].classList.add("active")

            // next button
            if (this.options.nextPrev) {
                frag.appendChild(button(c, next, this.options.nextText))
            }

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, this.totalPages, this.options.lastText))
            }

            // We may have more than one pager
            this.pagers.forEach(pager => {
                pager.appendChild(frag.cloneNode(true))
            })
        }
    }

    /**
     * Render the header
     * @return {Void}
     */
    renderHeader() {
        this.labels = []

        if (this.headings && this.headings.length) {
            this.headings.forEach((th, i) => {

                this.labels[i] = th.textContent

                if (th.firstElementChild && th.firstElementChild.classList.contains("dataTable-sorter")) {
                    th.innerHTML = th.firstElementChild.innerHTML
                }

                th.sortable = th.getAttribute("data-sortable") !== "false"

                th.originalCellIndex = i
                if (this.options.sortable && th.sortable) {
                    const link = createElement("a", {
                        href: "#",
                        class: "dataTable-sorter",
                        html: th.innerHTML
                    })

                    th.innerHTML = ""
                    th.setAttribute("data-sortable", "")
                    th.appendChild(link)
                }
            })
        }

        this.fixColumns()
    }

    /**
     * Set up columns. This method sets properties for each column,
     *   from specifications in options.columns.  Since it also sets the renderer for
     *   each column, it should be called before adding any row data
     *   and after adding a new column.
     */
    setColumns() {

        // Check for the columns option
        if (this.options.columns && this.headings.length) {

            this.hiddenColumns = []
            const selected = new Set()

            this.options.columns.forEach(colSpec => {

                // convert single column selection to array
                if (!Array.isArray(colSpec.select)) {
                    colSpec.select = [colSpec.select]
                }

                // Add the attributes specified in this column specification to the th elements
                colSpec.select.forEach(column => {

                    // we only allow one "select" for each column
                    if (selected.has(column)) {
                        throw new Error(`column ${column} specifications have already been set`)
                    } else {
                        selected.add(column)
                    }

                    const th = this.headings[column]

                    for (const spec of ["type", "format", "sortable"]) {
                        if (colSpec.hasOwnProperty(spec)) {
                            // note: th.dataset is an object consisting of "data-*" attributes
                            th.dataset[spec] = colSpec[spec]
                        }
                    }

                    if (colSpec.hasOwnProperty("hidden") && colSpec.hidden !== false) {
                        this.columns().hide([column])
                    }

                    /* It makes no sense to sort since columns haven't been rendered yet */
                    // if (colSpec.hasOwnProperty("sort") && colSpec.select.length === 1) {
                    //     this.columns().sort(colSpec.select[0], colSpec.sort, true)
                    // }

                    if (colSpec.hasOwnProperty("render") && typeof colSpec.render === "function") {
                        this.renderers[column] = colSpec.render
                    }

                })
            })
        }

        if (this.hasRows) {

            this.columns().rebuild()
        }

        this.render("header")
    }

    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        this.table.innerHTML = this.initialLayout

        // Remove the className
        this.table.classList.remove("dataTable-table")

        // Remove the containers
        this.wrapper.parentNode.replaceChild(this.table, this.wrapper)

        this.initialized = false
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update() {
        this.wrapper.classList.remove("dataTable-empty")

        this.paginate(this)
        this.render("page")

        this.links = []

        let i = this.pages.length
        while (i--) {
            const num = i + 1
            this.links[i] = button(i === 0 ? "active" : "", num, num)
        }

        this.sorting = false

        this.render("pager")

        this.rows().update()

        this.emit("datatable.update")
    }

    /**
     * Sort rows into pages
     * @return {Number}
     */
    paginate() {
        const perPage = this.options.perPage
        let rows = this.activeRows

        if (this.searching) {
            rows = []

            this.searchData.forEach(index => rows.push(this.activeRows[index]))
        }

        if (this.options.paging) {
            // Check for hidden columns
            this.pages = rows
                .map((tr, i) => i % perPage === 0 ? rows.slice(i, i + perPage) : null)
                .filter(page => page)
        } else {
            this.pages = [rows]
        }

        this.totalPages = this.lastPage = this.pages.length

        return this.totalPages
    }

    /**
     * Fix column widths
     * @return {Void}
     */
    fixColumns() {
        if (!this.activeHeadings || !this.activeHeadings.length ||
            !(this.options.scrollY.length || this.options.fixedColumns)) {
            return
        }

        let cells
        let hd = false
        this.columnWidths = []

        // If we have headings we need only set the widths on them
        // otherwise we need a temp header and the widths need applying to all cells
        if (this.table.tHead) {

            if (this.options.scrollY.length) {
                hd = createElement("thead")
                hd.appendChild(createElement("tr"))
                hd.style.height = '0px'
                if (this.headerTable) {
                    // move real header back into place
                    this.table.tHead = this.headerTable.tHead
                }
            }

            // Reset widths
            this.activeHeadings.forEach(cell => {
                cell.style.width = ""
            })

            this.activeHeadings.forEach((cell, i) => {
                const ow = cell.offsetWidth
                /*
                 * this.rect.width is sometimes 0, making w = NaN.
                 *   that can't be good.
                 */
                const w = ow / this.rect.width * 100
                cell.style.width = `${w}%`
                this.columnWidths[i] = ow
                if (this.options.scrollY.length) {
                    const th = createElement("th")
                    hd.firstElementChild.appendChild(th)
                    th.style.width = `${w}%`
                    th.style.paddingTop = "0"
                    th.style.paddingBottom = "0"
                    th.style.border = "0"
                }
            })

            if (this.options.scrollY.length) {
                const container = this.table.parentElement
                if (!this.headerTable) {
                    this.headerTable = createElement("table", {
                        class: "dataTable-table"
                    })
                    const headercontainer = createElement("div", {
                        class: "dataTable-headercontainer"
                    })
                    headercontainer.appendChild(this.headerTable)
                    container.parentElement.insertBefore(headercontainer, container)
                }
                const thd = this.table.tHead
                this.table.replaceChild(hd, thd)
                this.headerTable.tHead = thd

                // Compensate for scrollbars.
                this.headerTable.parentElement.style.paddingRight = `${
                    this.headerTable.clientWidth -
                    this.table.clientWidth +
                    parseInt(
                        this.headerTable.parentElement.style.paddingRight ||
                        '0',
                        10
                    )
                }px`

                if (container.scrollHeight > container.clientHeight) {
                    // scrollbars on one page means scrollbars on all pages.
                    container.style.overflowY = 'scroll'
                }
            }

        } else {
            cells = []

            // Make temperary headings
            hd = createElement("thead")
            const r = createElement("tr")
            Array.from(this.table.tBodies[0].rows[0].cells).forEach(() => {
                const th = createElement("th")
                r.appendChild(th)
                cells.push(th)
            })

            hd.appendChild(r)
            this.table.insertBefore(hd, this.body)

            const widths = []
            cells.forEach((cell, i) => {
                const ow = cell.offsetWidth

                /* this.rect.width can be zero. this is a problem  */
                const w = ow / this.rect.width * 100
                widths.push(w)
                this.columnWidths[i] = ow
            })

            this.data.forEach(row => {
                Array.from(row.cells).forEach((cell, i) => {
                    if (this.columns(cell.cellIndex).visible())
                        cell.style.width = `${widths[i]}%`
                })
            })

            // Discard the temp header
            this.table.removeChild(hd)
        }

    }

    /**
     * Fix the container height
     * @return {Void}
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
     * @param  {string} query
     * @return {void}
     */
    search(query) {
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

        this.clear()

        this.data.forEach((row, idx) => {
            const inArray = this.searchData.includes(row)

            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            const doesQueryMatch = query.split(" ").reduce((bool, word) => {
                let includes = false
                let cell = null
                let content = null

                for (let x = 0; x < row.cells.length; x++) {
                    cell = row.cells[x]
                    content = cell.hasAttribute('data-content') ? cell.getAttribute('data-content') : cell.textContent

                    if (
                        content.toLowerCase().includes(word) &&
                        this.columns(cell.cellIndex).visible()
                    ) {
                        includes = true
                        break
                    }
                }

                return bool && includes
            }, true)

            if (doesQueryMatch && !inArray) {
                row.searchIndex = idx
                this.searchData.push(idx)
            } else {
                row.searchIndex = null
            }
        })

        this.wrapper.classList.add("search-results")

        if (!this.searchData.length) {
            this.wrapper.classList.remove("search-results")

            this.setMessage(this.options.labels.noRows)
        } else {
            this.update()
        }

        this.emit("datatable.search", query, this.searchData)
    }

    /**
     * Change page
     * @param  {int} page
     * @return {void}
     */
    page(page) {
        // We don't want to load the current page again.
        if (page == this.currentPage) {
            return false
        }

        if (!isNaN(page)) {
            this.currentPage = parseInt(page, 10)
        }

        if (page > this.pages.length || page < 0) {
            return false
        }

        this.render("page")
        this.render("pager")

        this.emit("datatable.page", page)
    }

    /**
     * Sort by column
     * @param  {int} column - The column no.
     * @param  {string} direction - asc or desc
     * @return {void}
     */
    sortColumn(column, direction) {
        // Use columns API until sortColumn method is removed
        this.columns().sort(column, direction)
    }


    /**
     * Refresh the instance
     * @return {void}
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
     * Truncate the table
     * @param  {mixes} html - HTML string or HTMLElement
     * @return {void}
     */
    clear(html) {
        if (this.body) {
            flush(this.body)
        }

        const parent = this.body || this.table

        if (html) {
            if (typeof html === "string") {
                const frag = document.createDocumentFragment()
                frag.innerHTML = html
            }

            parent.appendChild(html)
        }
    }

    /**
     * Show a message in the table
     * @param {string} message
     */
    setMessage(message) {
        let colspan = 1

        if (this.hasRows) {
            colspan = this.data[0].cells.length
        } else if (this.activeHeadings.length) {
            colspan = this.activeHeadings.length
        }

        this.wrapper.classList.add("dataTable-empty")

        if (this.label) {
            this.label.innerHTML = ""
        }
        this.totalPages = 0
        this.render("pager")

        this.clear(
            createElement("tr", {
                html: `<td class="dataTables-empty" colspan="${colspan}">${message}</td>`
            })
        )
    }

    /**
     * Columns API access
     * @return {Object} new Columns instance
     */
    columns(columns) {
        return new Columns(this, columns)
    }

    /**
     * Rows API access
     * @return {Object} new Rows instance
     */
    rows(rows) {
        return new Rows(this, rows)
    }

    /**
     * Add custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    on(event, callback) {
        this.events = this.events || {}
        this.events[event] = this.events[event] || []
        this.events[event].push(callback)
    }

    /**
     * Remove custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    off(event, callback) {
        this.events = this.events || {}
        if (event in this.events === false) return
        this.events[event].splice(this.events[event].indexOf(callback), 1)
    }

    /**
     * Fire custom event
     * @param  {String} event
     * @return {Void}
     */
    emit(event) {
        this.events = this.events || {}
        if (event in this.events === false) return
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
        }
    }
}


/*
 * some functions imported from other modules are actually DataTable methods
 * Note that import and export are JavaScript keywords so we cannot define
 * functions or variables with those names
 */
DataTable.prototype.insert = insert
DataTable.prototype.import = importData
DataTable.prototype.export = exportData
DataTable.prototype.print = print
DataTable.prototype.ajaxImport = ajaxImport
