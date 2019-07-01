import {Rows} from "./rows"
import {Columns} from "./columns"
import {dataToTable} from "./table"
import {defaultConfig} from "./config"
import {
    isObject,
    isArray,
    isJson,
    extend,
    each,
    on,
    createElement,
    flush,
    button,
    classList,
    truncate
} from "./helpers"


export class DataTable {
    constructor(table, options) {
        this.initialized = false

        // user options
        this.options = extend(defaultConfig, options)

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
        if (this.initialized || classList.contains(this.table, "dataTable-table")) {
            return false
        }

        this.options = extend(this.options, options || {})

        // IE detection
        this.isIE = !!/(msie|trident)/i.test(navigator.userAgent)

        this.currentPage = 1
        this.onFirstPage = true

        this.hiddenColumns = []
        this.columnRenderers = []
        this.selectedColumns = []

        this.render()

        setTimeout(() => {
            this.emit("datatable.init")
            this.initialized = true

            if (this.options.plugins) {
                each(this.options.plugins, (options, plugin) => {
                    if (this[plugin] && typeof this[plugin] === "function") {
                        this[plugin] = this[plugin](options, {
                            each,
                            extend,
                            classList,
                            createElement
                        })

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

        const o = this.options
        let template = ""

        // Convert data to HTML
        if (o.data) {
            dataToTable.call(this)
        }

        if (o.ajax) {
            const ajax = o.ajax
            const xhr = new XMLHttpRequest()

            const xhrProgress = e => {
                this.emit("datatable.ajax.progress", e, xhr)
            }

            const xhrLoad = e => {
                if (xhr.readyState === 4) {
                    this.emit("datatable.ajax.loaded", e, xhr)

                    if (xhr.status === 200) {
                        let obj = {}
                        obj.data = ajax.load ? ajax.load.call(this, xhr) : xhr.responseText

                        obj.type = "json"

                        if (ajax.content && ajax.content.type) {
                            obj.type = ajax.content.type

                            obj = extend(obj, ajax.content)
                        }

                        this.import(obj)

                        this.setColumns(true)

                        this.emit("datatable.ajax.success", e, xhr)
                    } else {
                        this.emit("datatable.ajax.error", e, xhr)
                    }
                }
            }

            const xhrFailed = e => {
                this.emit("datatable.ajax.error", e, xhr)
            }

            const xhrCancelled = e => {
                this.emit("datatable.ajax.abort", e, xhr)
            }

            on(xhr, "progress", xhrProgress)
            on(xhr, "load", xhrLoad)
            on(xhr, "error", xhrFailed)
            on(xhr, "abort", xhrCancelled)

            this.emit("datatable.ajax.loading", xhr)

            xhr.open("GET", typeof ajax === "string" ? o.ajax : o.ajax.url)
            xhr.send()
        }

        // Store references
        this.body = this.table.tBodies[0]
        this.head = this.table.tHead
        this.foot = this.table.tFoot

        if (!this.body) {
            this.body = createElement("tbody")

            this.table.appendChild(this.body)
        }

        this.hasRows = this.body.rows.length > 0

        // Make a tHead if there isn't one (fixes #8)
        if (!this.head) {
            const h = createElement("thead")
            const t = createElement("tr")

            if (this.hasRows) {
                each(this.body.rows[0].cells, () => {
                    t.appendChild(createElement("th"))
                })

                h.appendChild(t)
            }

            this.head = h

            this.table.insertBefore(this.head, this.body)

            this.hiddenHeader = !o.ajax
        }

        this.headings = []
        this.hasHeadings = this.head.rows.length > 0

        if (this.hasHeadings) {
            this.header = this.head.rows[0]
            this.headings = [].slice.call(this.header.cells)
        }

        // Header
        if (!o.header) {
            if (this.head) {
                this.table.removeChild(this.table.tHead)
            }
        }

        // Footer
        if (o.footer) {
            if (this.head && !this.foot) {
                this.foot = createElement("tfoot", {
                    html: this.head.innerHTML
                })
                this.table.appendChild(this.foot)
            }
        } else {
            if (this.foot) {
                this.table.removeChild(this.table.tFoot)
            }
        }

        // Build
        this.wrapper = createElement("div", {
            class: "dataTable-wrapper dataTable-loading"
        })

        // Template for custom layouts
        template += "<div class='dataTable-top'>"
        template += o.layout.top
        template += "</div>"
        if (o.scrollY.length) {
            template += `<div class='dataTable-container' style='height: ${o.scrollY}; overflow-Y: auto;'></div>`
        } else {
            template += "<div class='dataTable-container'></div>"
        }
        template += "<div class='dataTable-bottom'>"
        template += o.layout.bottom
        template += "</div>"

        // Info placement
        template = template.replace("{info}", o.paging ? "<div class='dataTable-info'></div>" : "")

        // Per Page Select
        if (o.paging && o.perPageSelect) {
            let wrap = "<div class='dataTable-dropdown'><label>"
            wrap += o.labels.perPage
            wrap += "</label></div>"

            // Create the select
            const select = createElement("select", {
                class: "dataTable-selector"
            })

            // Create the options
            each(o.perPageSelect, val => {
                const selected = val === o.perPage
                const option = new Option(val, val, selected, selected)
                select.add(option)
            })

            // Custom label
            wrap = wrap.replace("{select}", select.outerHTML)

            // Selector placement
            template = template.replace("{select}", wrap)
        } else {
            template = template.replace("{select}", "")
        }

        // Searchable
        if (o.searchable) {
            const form =
                `<div class='dataTable-search'><input class='dataTable-input' placeholder='${o.labels.placeholder}' type='text'></div>`

            // Search input placement
            template = template.replace("{search}", form)
        } else {
            template = template.replace("{search}", "")
        }

        if (this.hasHeadings) {
            // Sortable
            this.render("header")
        }

        // Add table class
        classList.add(this.table, "dataTable-table")

        // Paginator
        const w = createElement("div", {
            class: "dataTable-pagination"
        })
        const paginator = createElement("ul")
        w.appendChild(paginator)

        // Pager(s) placement
        template = template.replace(/\{pager\}/g, w.outerHTML)

        this.wrapper.innerHTML = template

        this.container = this.wrapper.querySelector(".dataTable-container")

        this.pagers = this.wrapper.querySelectorAll(".dataTable-pagination")

        this.label = this.wrapper.querySelector(".dataTable-info")

        // Insert in to DOM tree
        this.table.parentNode.replaceChild(this.wrapper, this.table)
        this.container.appendChild(this.table)

        // Store the table dimensions
        this.rect = this.table.getBoundingClientRect()

        // Convert rows to array for processing
        this.data = [].slice.call(this.body.rows)
        this.activeRows = this.data.slice()
        this.activeHeadings = this.headings.slice()

        // Update
        this.update()

        if (!o.ajax) {
            this.setColumns()
        }

        // Fix height
        this.fixHeight()

        // Fix columns
        this.fixColumns()

        // Class names
        if (!o.header) {
            classList.add(this.wrapper, "no-header")
        }

        if (!o.footer) {
            classList.add(this.wrapper, "no-footer")
        }

        if (o.sortable) {
            classList.add(this.wrapper, "sortable")
        }

        if (o.searchable) {
            classList.add(this.wrapper, "searchable")
        }

        if (o.fixedHeight) {
            classList.add(this.wrapper, "fixed-height")
        }

        if (o.fixedColumns) {
            classList.add(this.wrapper, "fixed-columns")
        }

        this.bindEvents()
    }

    /**
     * Render the page
     * @return {Void}
     */
    renderPage() {
        if (this.hasHeadings) {
            flush(this.header, this.isIE)

            each(this.activeHeadings, function (th) {
                this.header.appendChild(th)
            }, this)
        }


        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1
            }

            // Use a fragment to limit touching the DOM
            const index = this.currentPage - 1

            const frag = document.createDocumentFragment()

            each(this.pages[index], function (row) {
                frag.appendChild(this.rows().render(row))
            }, this)

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
        flush(this.pagers, this.isIE)

        if (this.totalPages > 1) {
            const c = "pager"
            const frag = document.createDocumentFragment()
            const prev = this.onFirstPage ? 1 : this.currentPage - 1
            const next = this.onlastPage ? this.totalPages : this.currentPage + 1

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
            classList.add(this.links[this.currentPage - 1], "active")

            // append the links
            each(pager, p => {
                classList.remove(p, "active")
                frag.appendChild(p)
            })

            classList.add(this.links[this.currentPage - 1], "active")

            // next button
            if (this.options.nextPrev) {
                frag.appendChild(button(c, next, this.options.nextText))
            }

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, this.totalPages, this.options.lastText))
            }

            // We may have more than one pager
            each(this.pagers, pager => {
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
            each(this.headings, (th, i) => {

                this.labels[i] = th.textContent

                if (classList.contains(th.firstElementChild, "dataTable-sorter")) {
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
     * Bind event listeners
     * @return {[type]} [description]
     */
    bindEvents() {
        const o = this.options
        const that = this
        // Per page selector
        if (o.perPageSelect) {
            const selector = this.wrapper.querySelector(".dataTable-selector")
            if (selector) {
                // Change per page
                on(selector, "change", function () {
                    o.perPage = parseInt(this.value, 10)
                    that.update()

                    that.fixHeight()

                    that.emit("datatable.perpage", o.perPage)
                })
            }
        }

        // Search input
        if (o.searchable) {
            this.input = this.wrapper.querySelector(".dataTable-input")
            if (this.input) {
                on(this.input, "keyup", function () {
                    that.search(this.value)
                })
            }
        }

        // Pager(s) / sorting
        on(this.wrapper, "click", e => {
            const t = e.target
            if (t.nodeName.toLowerCase() === "a") {
                if (t.hasAttribute("data-page")) {
                    this.page(t.getAttribute("data-page"))
                    e.preventDefault()
                } else if (
                    o.sortable &&
                    classList.contains(t, "dataTable-sorter") &&
                    t.parentNode.getAttribute("data-sortable") != "false"
                ) {
                    this.columns().sort(this.headings.indexOf(t.parentNode))
                    e.preventDefault()
                }
            }
        })

        on(window, "resize", () => {
            this.rect = this.container.getBoundingClientRect()
            this.fixColumns()
        })
    }

    /**
     * Set up columns
     * @return {[type]} [description]
     */
    setColumns(ajax) {

        if (!ajax) {
            each(this.data, row => {
                each(row.cells, cell => {
                    cell.data = cell.innerHTML
                })
            })
        }

        // Check for the columns option
        if (this.options.columns && this.headings.length) {

            each(this.options.columns, data => {

                // convert single column selection to array
                if (!isArray(data.select)) {
                    data.select = [data.select]
                }

                if (data.hasOwnProperty("render") && typeof data.render === "function") {
                    this.selectedColumns = this.selectedColumns.concat(data.select)

                    this.columnRenderers.push({
                        columns: data.select,
                        renderer: data.render
                    })
                }

                // Add the data attributes to the th elements
                each(data.select, column => {
                    const th = this.headings[column]
                    if (data.type) {
                        th.setAttribute("data-type", data.type)
                    }
                    if (data.format) {
                        th.setAttribute("data-format", data.format)
                    }
                    if (data.hasOwnProperty("sortable")) {
                        th.setAttribute("data-sortable", data.sortable)
                    }

                    if (data.hasOwnProperty("hidden")) {
                        if (data.hidden !== false) {
                            this.columns().hide([column])
                        }
                    }

                    if (data.hasOwnProperty("sort") && data.select.length === 1) {
                        this.columns().sort(data.select[0], data.sort, true)
                    }
                })
            })
        }

        if (this.hasRows) {
            each(this.data, (row, i) => {
                row.dataIndex = i
                each(row.cells, cell => {
                    cell.data = cell.innerHTML
                })
            })

            if (this.selectedColumns.length) {
                each(this.data, row => {
                    each(row.cells, (cell, i) => {
                        if (this.selectedColumns.includes(i)) {
                            each(this.columnRenderers, o => {
                                if (o.columns.includes(i)) {
                                    cell.innerHTML = o.renderer.call(this, cell.data, cell, row)
                                }
                            })
                        }
                    })
                })
            }

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
        classList.remove(this.table, "dataTable-table")

        // Remove the containers
        this.wrapper.parentNode.replaceChild(this.table, this.wrapper)

        this.initialized = false
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update() {
        classList.remove(this.wrapper, "dataTable-empty")

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

            each(this.searchData, function (index) {
                rows.push(this.activeRows[index])
            }, this)
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

        if ((this.options.scrollY.length || this.options.fixedColumns) && this.activeHeadings && this.activeHeadings.length) {
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
                each(this.activeHeadings, cell => {
                    cell.style.width = ""
                }, this)

                each(this.activeHeadings, function (cell, i) {
                    const ow = cell.offsetWidth
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
                }, this)

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
                    this.headerTable.style.paddingRight = `${this.headerTable.clientWidth - this.table.clientWidth}px`

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
                const c = this.table.tBodies[0].rows[0].cells
                each(c, () => {
                    const th = createElement("th")
                    r.appendChild(th)
                    cells.push(th)
                })

                hd.appendChild(r)
                this.table.insertBefore(hd, this.body)

                const widths = []
                each(cells, function (cell, i) {
                    const ow = cell.offsetWidth
                    const w = ow / this.rect.width * 100
                    widths.push(w)
                    this.columnWidths[i] = ow
                }, this)

                each(this.data, function (row) {
                    each(row.cells, function (cell, i) {
                        if (this.columns(cell.cellIndex).visible())
                            cell.style.width = `${widths[i]}%`
                    }, this)
                }, this)

                // Discard the temp header
                this.table.removeChild(hd)
            }
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
            classList.remove(this.wrapper, "search-results")
            return false
        }

        this.clear()

        each(this.data, function (row, idx) {
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
        }, this)

        classList.add(this.wrapper, "search-results")

        if (!this.searchData.length) {
            classList.remove(this.wrapper, "search-results")

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
     * Add new row data
     * @param {object} data
     */
    insert(data) {
        let rows = []
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    const tr = createElement("tr")
                    let th
                    each(data.headings, heading => {
                        th = createElement("th", {
                            html: heading
                        })

                        tr.appendChild(th)
                    })
                    this.head.appendChild(tr)

                    this.header = tr
                    this.headings = [].slice.call(tr.cells)
                    this.hasHeadings = true

                    // Re-enable sorting if it was disabled due
                    // to missing header
                    this.options.sortable = this.initialSortable

                    // Allow sorting on new header
                    this.render("header")

                    // Activate newly added headings
                    this.activeHeadings = this.headings.slice()
                }
            }

            if (data.data && isArray(data.data)) {
                rows = data.data
            }
        } else if (isArray(data)) {
            each(data, row => {
                const r = []
                each(row, (cell, heading) => {

                    const index = this.labels.indexOf(heading)

                    if (index > -1) {
                        r[index] = cell
                    }
                })
                rows.push(r)
            })
        }

        if (rows.length) {
            this.rows().add(rows)

            this.hasRows = true
        }

        this.update()

        this.fixColumns()
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
            flush(this.body, this.isIE)
        }

        let parent = this.body
        if (!this.body) {
            parent = this.table
        }

        if (html) {
            if (typeof html === "string") {
                const frag = document.createDocumentFragment()
                frag.innerHTML = html
            }

            parent.appendChild(html)
        }
    }

    /**
     * Export table to various formats (csv, txt or sql)
     * @param  {Object} options User options
     * @return {Boolean}
     */
    export(options) {
        if (!this.hasHeadings && !this.hasRows) return false

        const headers = this.activeHeadings
        let rows = []
        const arr = []
        let i
        let x
        let str
        let link

        const defaults = {
            download: true,
            skipColumn: [],

            // csv
            lineDelimiter: "\n",
            columnDelimiter: ",",

            // sql
            tableName: "myTable",

            // json
            replacer: null,
            space: 4
        }

        // Check for the options object
        if (!isObject(options)) {
            return false
        }

        const o = extend(defaults, options)

        if (o.type) {
            if (o.type === "txt" || o.type === "csv") {
                // Include headings
                rows[0] = this.header
            }

            // Selection or whole table
            if (o.selection) {
                // Page number
                if (!isNaN(o.selection)) {
                    rows = rows.concat(this.pages[o.selection - 1])
                } else if (isArray(o.selection)) {
                    // Array of page numbers
                    for (i = 0; i < o.selection.length; i++) {
                        rows = rows.concat(this.pages[o.selection[i] - 1])
                    }
                }
            } else {
                rows = rows.concat(this.activeRows)
            }

            // Only proceed if we have data
            if (rows.length) {
                if (o.type === "txt" || o.type === "csv") {
                    str = ""

                    for (i = 0; i < rows.length; i++) {
                        for (x = 0; x < rows[i].cells.length; x++) {
                            // Check for column skip and visibility
                            if (
                                !o.skipColumn.includes(headers[x].originalCellIndex) &&
                                this.columns(headers[x].originalCellIndex).visible()
                            ) {
                                let text = rows[i].cells[x].textContent
                                text = text.trim()
                                text = text.replace(/\s{2,}/g, ' ')
                                text = text.replace(/\n/g, '  ')
                                text = text.replace(/"/g, '""')
                                //have to manually encode "#" as encodeURI leaves it as is.
                                text = text.replace(/#/g, "%23")
                                if (text.includes(","))
                                    text = `"${text}"`


                                str += text + o.columnDelimiter
                            }
                        }
                        // Remove trailing column delimiter
                        str = str.trim().substring(0, str.length - 1)

                        // Apply line delimiter
                        str += o.lineDelimiter
                    }

                    // Remove trailing line delimiter
                    str = str.trim().substring(0, str.length - 1)

                    if (o.download) {
                        str = `data:text/csv;charset=utf-8,${str}`
                    }
                } else if (o.type === "sql") {
                    // Begin INSERT statement
                    str = `INSERT INTO \`${o.tableName}\` (`

                    // Convert table headings to column names
                    for (i = 0; i < headers.length; i++) {
                        // Check for column skip and column visibility
                        if (
                            !o.skipColumn.includes(headers[i].originalCellIndex) &&
                            this.columns(headers[i].originalCellIndex).visible()
                        ) {
                            str += `\`${headers[i].textContent}\`,`
                        }
                    }

                    // Remove trailing comma
                    str = str.trim().substring(0, str.length - 1)

                    // Begin VALUES
                    str += ") VALUES "

                    // Iterate rows and convert cell data to column values
                    for (i = 0; i < rows.length; i++) {
                        str += "("

                        for (x = 0; x < rows[i].cells.length; x++) {
                            // Check for column skip and column visibility
                            if (
                                !o.skipColumn.includes(headers[x].originalCellIndex) &&
                                this.columns(headers[x].originalCellIndex).visible()
                            ) {
                                str += `"${rows[i].cells[x].textContent}",`
                            }
                        }

                        // Remove trailing comma
                        str = str.trim().substring(0, str.length - 1)

                        // end VALUES
                        str += "),"
                    }

                    // Remove trailing comma
                    str = str.trim().substring(0, str.length - 1)

                    // Add trailing colon
                    str += ";"

                    if (o.download) {
                        str = `data:application/sql;charset=utf-8,${str}`
                    }
                } else if (o.type === "json") {
                    // Iterate rows
                    for (x = 0; x < rows.length; x++) {
                        arr[x] = arr[x] || {}
                        // Iterate columns
                        for (i = 0; i < headers.length; i++) {
                            // Check for column skip and column visibility
                            if (
                                !o.skipColumn.includes(headers[i].originalCellIndex) &&
                                this.columns(headers[i].originalCellIndex).visible()
                            ) {
                                arr[x][headers[i].textContent] = rows[x].cells[i].textContent
                            }
                        }
                    }

                    // Convert the array of objects to JSON string
                    str = JSON.stringify(arr, o.replacer, o.space)

                    if (o.download) {
                        str = `data:application/json;charset=utf-8,${str}`
                    }
                }

                // Download
                if (o.download) {
                    // Filename
                    o.filename = o.filename || "datatable_export"
                    o.filename += `.${o.type}`

                    str = encodeURI(str)

                    // Create a link to trigger the download
                    link = document.createElement("a")
                    link.href = str
                    link.download = o.filename

                    // Append the link
                    document.body.appendChild(link)

                    // Trigger the download
                    link.click()

                    // Remove the link
                    document.body.removeChild(link)
                }

                return str
            }
        }

        return false
    }

    /**
     * Import data to the table
     * @param  {Object} options User options
     * @return {Boolean}
     */
    import(options) {
        let obj = false
        const defaults = {
            // csv
            lineDelimiter: "\n",
            columnDelimiter: ","
        }

        // Check for the options object
        if (!isObject(options)) {
            return false
        }

        options = extend(defaults, options)

        if (options.data.length || isObject(options.data)) {
            // Import CSV
            if (options.type === "csv") {
                obj = {
                    data: []
                }

                // Split the string into rows
                const rows = options.data.split(options.lineDelimiter)

                if (rows.length) {

                    if (options.headings) {
                        obj.headings = rows[0].split(options.columnDelimiter)

                        rows.shift()
                    }

                    each(rows, (row, i) => {
                        obj.data[i] = []

                        // Split the rows into values
                        const values = row.split(options.columnDelimiter)

                        if (values.length) {
                            each(values, value => {
                                obj.data[i].push(value)
                            })
                        }
                    })
                }
            } else if (options.type === "json") {
                const json = isJson(options.data)

                // Valid JSON string
                if (json) {
                    obj = {
                        headings: [],
                        data: []
                    }

                    each(json, (data, i) => {
                        obj.data[i] = []
                        each(data, (value, column) => {
                            if (!obj.headings.includes(column)) {
                                obj.headings.push(column)
                            }

                            obj.data[i].push(value)
                        })
                    })
                } else {
                    // console.warn("That's not valid JSON!")
                }
            }

            if (isObject(options.data)) {
                obj = options.data
            }

            if (obj) {
                // Add the rows
                this.insert(obj)
            }
        }

        return false
    }

    /**
     * Print the table
     * @return {void}
     */
    print() {
        const headings = this.activeHeadings
        const rows = this.activeRows
        const table = createElement("table")
        const thead = createElement("thead")
        const tbody = createElement("tbody")

        const tr = createElement("tr")
        each(headings, th => {
            tr.appendChild(
                createElement("th", {
                    html: th.textContent
                })
            )
        })

        thead.appendChild(tr)

        each(rows, row => {
            const tr = createElement("tr")
            each(row.cells, cell => {
                tr.appendChild(
                    createElement("td", {
                        html: cell.textContent
                    })
                )
            })
            tbody.appendChild(tr)
        })

        table.appendChild(thead)
        table.appendChild(tbody)

        // Open new window
        const w = window.open()

        // Append the table to the body
        w.document.body.appendChild(table)

        // Print
        w.print()
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

        classList.add(this.wrapper, "dataTable-empty")

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
