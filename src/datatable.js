import {DiffDOM, nodeToObj} from "diff-dom"

import {dataToVirtualDOM} from "./virtualdom"
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


export class DataTable {
    constructor(table, options = {}) {

        this.dom = typeof table === "string" ? document.querySelector(table) : table

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

        this.initialSortable = this.options.sortable
        this.initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : "" // preserve in case of later destruction

        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex
        } else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0
        }

        this.listeners = {
            onResize: event => this.onResize(event)
        }

        this.dd = new DiffDOM()

        // Initialize other variables
        this.initialized = false
        this.data = false
        this.virtualDOM = false
        this.rowData = false
        this.currentPage = 0
        this.onFirstPage = true

        this.hiddenColumns = []
        this.columnRenderers = []
        this.selectedColumns = []

        this.init()
    }

    /**
     * Initialize the instance
     */
    init() {
        if (this.initialized || this.dom.classList.contains("dataTable-table")) {
            return false
        }

        this.rows = new Rows(this)
        this.columns = new Columns(this)

        // // Disable manual sorting if no header is present (#4)
        // if (this.dom.tHead === null && !this.options.data?.headings) {
        //     this.options.sortable = false
        // }
        //
        // if (this.dom.tBodies.length && !this.dom.tBodies[0].rows.length && this.options.data && !this.options.data.data) {
        //     throw new Error(
        //         "You seem to be using the data option, but you've not defined any rows."
        //     )
        // }


        this.data = this.readTableData(this.dom, this.options.data)

        this.columnSettings = this.readColumnSettings(this.options.columns)

        this.virtualDOM = nodeToObj(this.dom)

        this.render()

        setTimeout(() => {
            this.emit("datatable.init")
            this.initialized = true
        }, 10)
    }

    readTableData(dom, dataOption) {
        const data = {
            data: [],
            headings: []
        }
        if (dataOption?.data) {
            data.data = dataOption.data.map(row => row.map(cell => ({data: cell,
                text: cell})))
        } else if (dom.tBodies.length) {
            data.data = Array.from(dom.tBodies[0].rows).map(row => Array.from(row.cells).map(cell => ({data: cell.dataset.content || cell.innerHTML,
                text: cell.innerHTML})))
        }
        if (dataOption?.headings) {
            data.headings = dataOption.headings.map(heading => ({data: heading,
                sorted: false}))
        } else if (dom.tHead) {
            data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(th => {
                const heading = {data: th.innerHTML,
                    sorted: false}
                heading.sortable = th.dataset.sortable !== "false"
                return heading
            })
        } else if (dataOption?.data?.data?.length) {
            data.headings = dataOption.data.data[0].map(_cell => "")
        } else if (dom.tBodies.length) {
            data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(_cell => "")
        }

        if (data.data.length && data.data[0].length !== data.headings.length) {
            throw new Error(
                "Data heading length mismatch."
            )
        }
        console.log({dom,
            dataOption,
            data})
        return data
    }

    /**
     * Set up columns
     */
    readColumnSettings(columnOptions = []) {

        const columns = []
        let sort = false

        // Check for the columns option

        columnOptions.forEach(data => {

            // convert single column selection to array
            const columnSelectors = Array.isArray(data.select) ? data.select : [data.select]

            columnSelectors.forEach(selector => {
                if (!columns[selector]) {
                    columns[selector] = {}
                }
                const column = columns[selector]


                if (data.render) {
                    column.render = data.render
                }

                if (data.type) {
                    column.type = data.type
                }

                if (data.format) {
                    column.format = data.format
                }

                if (data.sortable === false) {
                    column.notSortable = true
                }

                if (data.hidden) {
                    column.hidden = true
                }

                if (data.sort) {
                    // We only allow one. The last one will overwrite all other options
                    sort = {column,
                        direction: data.sort}
                }

            })

        })

        return {columns,
            sort}

    }

    /**
     * Render the instance
     */
    render() {

        this.renderTable()

        // Store references
        this.body = this.dom.tBodies[0]
        this.head = this.dom.tHead

        this.hasRows = this.body.rows.length > 0

        this.headings = []
        this.hasHeadings = this.head.rows.length > 0

        if (this.hasHeadings) {
            this.header = this.head.rows[0]
            this.headings = [].slice.call(this.header.cells)
        }

        // Build
        this.wrapper = createElement("div", {
            class: "dataTable-wrapper dataTable-loading"
        })

        // Template for custom layouts
        let template = ""
        template += "<div class='dataTable-top'>"
        template += this.options.layout.top
        template += "</div>"
        if (this.options.scrollY.length) {
            template += `<div class='dataTable-container' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`
        } else {
            template += "<div class='dataTable-container'></div>"
        }
        template += "<div class='dataTable-bottom'>"
        template += this.options.layout.bottom
        template += "</div>"

        // Info placement
        template = template.replace("{info}", this.options.paging ? "<div class='dataTable-info'></div>" : "")

        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {
            let wrap = "<div class='dataTable-dropdown'><label>"
            wrap += this.options.labels.perPage
            wrap += "</label></div>"

            // Create the select
            const select = createElement("select", {
                class: "dataTable-selector"
            })

            // Create the options
            this.options.perPageSelect.forEach(val => {
                const selected = val === this.options.perPage
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
        if (this.options.searchable) {
            const form =
                `<div class='dataTable-search'><input class='dataTable-input' placeholder='${this.options.labels.placeholder}' type='text'></div>`

            // Search input placement
            template = template.replace("{search}", form)
        } else {
            template = template.replace("{search}", "")
        }

        // if (this.hasHeadings) {
        //     // Sortable
        //     this.renderHeader()
        // }


        // Paginator
        const paginatorWrapper = createElement("nav", {
            class: "dataTable-pagination"
        })
        const paginator = createElement("ul", {
            class: "dataTable-pagination-list"
        })
        paginatorWrapper.appendChild(paginator)

        // Pager(s) placement
        template = template.replace(/\{pager\}/g, paginatorWrapper.outerHTML)
        this.wrapper.innerHTML = template

        this.container = this.wrapper.querySelector(".dataTable-container")

        this.pagers = this.wrapper.querySelectorAll(".dataTable-pagination-list")

        this.label = this.wrapper.querySelector(".dataTable-info")

        // Insert in to DOM tree
        this.dom.parentNode.replaceChild(this.wrapper, this.dom)
        this.container.appendChild(this.dom)

        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect()

        // Convert rows to array for processing
        this.rowData = Array.from(this.body.rows)
        this.activeRows = this.rowData.slice()
        this.activeHeadings = this.headings.slice()

        // // Update
        this.update()
        //
        //
        // this.setColumns()
        //
        //
        // // Fix height
        // this.fixHeight()
        //
        // // Fix columns
        // this.fixColumns()

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
    }

    renderTable() {
        const newVirtualDOM = dataToVirtualDOM(
            this.data.headings,
            this.currentPage ? this.pages[this.currentPage - 1] : this.data.data,
            this.columnSettings,
            this.options
        )

        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM)
        console.log({diff,
            newVirtualDOM,
            virtualDOM: this.virtualDOM})
        this.dd.apply(this.dom, diff)
        this.virtualDOM = newVirtualDOM
    }

    /**
     * Render the page
     * @return {Void}
     */
    renderPage(lastRowCursor=false) {

        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1
            }

            // Use a fragment to limit touching the DOM


            this.renderTable()


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
            console.log({current,
                pages: this.pages})
            t = f + this.pages[current].length
            f = f + 1
            items = this.searching ? this.searchData.length : this.rowData.length
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

        if (this.options.rowNavigation) {
            if (!this.rows.cursor || !this.pages[this.currentPage-1].includes(this.rows.cursor)) {
                const rows = this.pages[this.currentPage-1]
                if (lastRowCursor) {
                    this.rows.setCursor(rows[rows.length-1])
                } else {
                    this.rows.setCursor(rows[0])
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
            pager.forEach(p => {
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
     * Bind event listeners
     * @return {[type]} [description]
     */
    bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapper.querySelector(".dataTable-selector")
            if (selector) {
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
            this.input = this.wrapper.querySelector(".dataTable-input")
            if (this.input) {
                this.input.addEventListener("keyup", () => this.search(this.input.value), false)
            }
        }

        // Pager(s) / sorting
        this.wrapper.addEventListener("click", e => {
            const t = e.target.closest("a")
            if (t && (t.nodeName.toLowerCase() === "a")) {
                if (t.hasAttribute("data-page")) {
                    this.page(t.getAttribute("data-page"))
                    e.preventDefault()
                } else if (
                    this.options.sortable &&
                    t.classList.contains("dataTable-sorter") &&
                    t.parentNode.getAttribute("data-sortable") != "false"
                ) {
                    this.columns.sort(this.headings.indexOf(t.parentNode))
                    e.preventDefault()
                }
            }
        }, false)
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", event => {
                if (event.key === "ArrowUp") {
                    if (this.rows.cursor.previousElementSibling) {
                        this.rows.setCursor(this.rows.cursor.previousElementSibling)
                        event.preventDefault()
                        event.stopPropagation()
                    } else if (!this.onFirstPage) {
                        this.page(this.currentPage-1, true)
                    }
                } else if (event.key === "ArrowDown") {
                    if (this.rows.cursor.nextElementSibling) {
                        this.rows.setCursor(this.rows.cursor.nextElementSibling)
                        event.preventDefault()
                        event.stopPropagation()
                    } else if (!this.onLastPage) {
                        this.page(this.currentPage+1)
                    }
                } else if (["Enter", " "].includes(event.key)) {
                    this.emit("datatable.selectrow", this.rows.cursor, event)
                }
            })
            this.body.addEventListener("mousedown", event => {
                if (this.body.matches(":focus")) {
                    const row = Array.from(this.body.rows).find(row => row.contains(event.target))
                    this.emit("datatable.selectrow", row, event)
                }

            })
        } else {
            this.body.addEventListener("mousedown", event => {
                const row = Array.from(this.body.rows).find(row => row.contains(event.target))
                this.emit("datatable.selectrow", row, event)
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
     * Set up columns
     */
    setColumns() {

        this.rowData.forEach(row => {
            Array.from(row.cells).forEach(cell => {
                cell.data = cell.innerHTML
            })
        })

        // Check for the columns option
        if (this.options.columns && this.headings.length) {

            this.options.columns.forEach(data => {

                // convert single column selection to array
                if (!Array.isArray(data.select)) {
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
                data.select.forEach(column => {
                    const th = this.headings[column]
                    if (!th) {
                        return
                    }
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
                            this.columns.hide([column])
                        }
                    }

                    if (data.hasOwnProperty("sort") && data.select.length === 1) {
                        this.columns.sort(data.select[0], data.sort, true)
                    }
                })
            })
        }

        if (this.hasRows) {
            this.rowData.forEach((row, i) => {
                row.dataIndex = i
                Array.from(row.cells).forEach(cell => {
                    cell.data = cell.innerHTML
                })
            })

            this.columns.rebuild()
        }

        this.renderHeader()
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
        this.dom.classList.remove("dataTable-table")

        // Remove the containers
        this.wrapper.parentNode.replaceChild(this.dom, this.wrapper)

        this.initialized = false

        window.removeEventListener("resize", this.listeners.onResize)
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update() {
        this.wrapper.classList.remove("dataTable-empty")

        this.paginate()
        this.renderPage()

        this.links = []

        let i = this.pages.length
        while (i--) {
            const num = i + 1
            this.links[i] = button(i === 0 ? "active" : "", num, num)
        }

        this.sorting = false

        this.renderPager()

        this.rows.update()

        this.emit("datatable.update")
    }

    paginate() {
        let rows = this.data.data

        if (this.searching) {
            rows = []

            this.searchData.forEach(index => rows.push(this.data.data[index]))
        }

        if (this.options.paging) {
            // Check for hidden columns
            this.pages = rows
                .map((row, i) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter(page => page)
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

        if ((this.options.scrollY.length || this.options.fixedColumns) && this.activeHeadings && this.activeHeadings.length) {
            let cells
            let hd = false
            this.columnWidths = []

            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.dom.tHead) {

                if (this.options.scrollY.length) {
                    hd = createElement("thead")
                    hd.appendChild(createElement("tr"))
                    hd.style.height = "0px"
                    if (this.headerTable) {
                        // move real header back into place
                        this.dom.tHead = this.headerTable.tHead
                    }
                }

                // Reset widths
                this.activeHeadings.forEach(cell => {
                    cell.style.width = ""
                })

                const totalOffsetWidth = this.activeHeadings.reduce(
                    (total, cell) => total + cell.offsetWidth,
                    0
                )

                this.activeHeadings.forEach((cell, i) => {
                    const ow = cell.offsetWidth
                    const w = ow / totalOffsetWidth * 100
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
                    const container = this.dom.parentElement
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
                    const thd = this.dom.tHead
                    this.dom.replaceChild(hd, thd)
                    this.headerTable.tHead = thd

                    // Compensate for scrollbars.
                    this.headerTable.parentElement.style.paddingRight = `${
                        this.headerTable.clientWidth -
                        this.dom.clientWidth +
                        parseInt(
                            this.headerTable.parentElement.style.paddingRight ||
                            "0",
                            10
                        )
                    }px`

                    if (container.scrollHeight > container.clientHeight) {
                        // scrollbars on one page means scrollbars on all pages.
                        container.style.overflowY = "scroll"
                    }
                }

            } else {
                cells = []

                // Make temperary headings
                hd = createElement("thead")
                const r = createElement("tr")
                Array.from(this.dom.tBodies[0].rows[0].cells).forEach(() => {
                    const th = createElement("th")
                    r.appendChild(th)
                    cells.push(th)
                })

                hd.appendChild(r)
                this.dom.insertBefore(hd, this.body)

                const widths = []
                cells.forEach((cell, i) => {
                    const ow = cell.offsetWidth
                    const w = ow / this.rect.width * 100
                    widths.push(w)
                    this.columnWidths[i] = ow
                })

                this.rowData.forEach(row => {
                    Array.from(row.cells).forEach((cell, i) => {
                        if (this.columns.visible(cell.cellIndex))
                            cell.style.width = `${widths[i]}%`
                    })
                })

                // Discard the temp header
                this.dom.removeChild(hd)
            }
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

        this.data.data.forEach((row, idx) => {
            const inArray = this.searchData.includes(row)

            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            const doesQueryMatch = query.split(" ").reduce((bool, word) => {
                let includes = false
                let cell = null
                let content = null

                for (let x = 0; x < row.length; x++) {
                    cell = row[x]
                    content = cell.data

                    if (
                        content.toLowerCase().includes(word) &&
                        this.columns.visible(cell.cellIndex)
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
    page(page, lastRowCursor=false) {
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

        this.renderPage(lastRowCursor)
        this.renderPager()

        this.emit("datatable.page", page)
    }

    /**
     * Sort by column
     */
    sortColumn(column, direction) {
        // Use columns API until sortColumn method is removed
        this.columns.sort(column, direction)
    }

    /**
     * Add new row data
     */
    insert(data) {
        let rows = []
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    const tr = createElement("tr")
                    data.headings.forEach(heading => {
                        const th = createElement("th", {
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
                    this.renderHeader()

                    // Activate newly added headings
                    this.activeHeadings = this.headings.slice()
                }
            }

            if (data.data && Array.isArray(data.data)) {
                rows = data.data
            }
        } else if (Array.isArray(data)) {
            data.forEach(row => {
                const r = []
                Object.entries(row).forEach(([heading, cell]) => {

                    const index = this.labels.indexOf(heading)

                    if (index > -1) {
                        r[index] = cell
                    }
                })
                rows.push(r)
            })
        }

        if (rows.length) {
            this.rows.add(rows)

            this.hasRows = true
        }

        this.update()
        this.setColumns()
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
     * @return {void}
     */
    print() {
        const headings = this.activeHeadings
        const rows = this.activeRows
        const table = createElement("table")
        const thead = createElement("thead")
        const tbody = createElement("tbody")

        const tr = createElement("tr")
        headings.forEach(th => {
            tr.appendChild(
                createElement("th", {
                    html: th.textContent
                })
            )
        })

        thead.appendChild(tr)

        rows.forEach(row => {
            const tr = createElement("tr")
            Array.from(row.cells).forEach(cell => {
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
     */
    setMessage(message) {
        let colspan = 1

        if (this.hasRows) {
            colspan = this.data.data[0].length
        } else if (this.activeHeadings.length) {
            colspan = this.activeHeadings.length
        }

        this.wrapper.classList.add("dataTable-empty")

        if (this.label) {
            this.label.innerHTML = ""
        }
        this.totalPages = 0
        this.renderPager()

        const newVirtualDOM = structuredClone(this.virtualDOM)

        const tbody = newVirtualDOM.childNodes.find(node => node.nodeName === "TBODY")

        tbody.childNodes = [
            {
                nodeName: "TR",
                childNodes: [
                    {
                        nodeName: "TD",
                        attributes: {
                            class: "dataTables-empty",
                            colspan
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
        console.log({diff,
            newVirtualDOM,
            virtualDOM: this.virtualDOM})
        this.dd.apply(this.dom, diff)
        this.virtualDOM = newVirtualDOM

    }

    /**
     * Add custom event listener
     */
    on(event, callback) {
        this.events = this.events || {}
        this.events[event] = this.events[event] || []
        this.events[event].push(callback)
    }

    /**
     * Remove custom event listener
     */
    off(event, callback) {
        this.events = this.events || {}
        if (event in this.events === false) return
        this.events[event].splice(this.events[event].indexOf(callback), 1)
    }

    /**
     * Fire custom event
     */
    emit(event) {
        this.events = this.events || {}
        if (event in this.events === false) return
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
        }
    }
}
