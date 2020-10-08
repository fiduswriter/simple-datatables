import {createElement} from "./helpers"

/**
 * Create our data model and the corresponding HTML for the table and add it to the DOM.
 * If the HTML table is already there, we just create the model from it.
 */
export const makeHTMLTableFromOptions = function(options) {

    options = options || this.options

    // Store references
    this.head = this.table.tHead
    this.body = this.table.tBodies[0]
    this.foot = this.table.tFoot

    // If there is a table body already defined in the HTML
    // then we populate this.data with it, otherwise we create it
    if (this.body) {
        this.data = Array.from(this.body.rows)
        this.activeRows = this.data.slice()
    } else {
        this.body = createElement("tbody")
        this.table.appendChild(this.body)
        this.data = []
        this.activeRows = []
    }
    this.hasRows = this.body.rows.length > 0

    // If there is a table head already defined in the HTML
    // then we populate this.header and this.headings with it,
    // otherwise we create it
    if (!this.head) {
        this.head = createElement("thead")
        const tr = createElement("tr")

        if (this.hasRows) {
            Array.from(this.body.rows[0].cells).forEach(() => {
                tr.appendChild(createElement("th"))
            })

            this.head.appendChild(tr)
        }

        this.table.insertBefore(this.head, this.body)

        this.hiddenHeader = !options.ajax
    }

    this.hasHeadings = this.head.rows.length > 0

    if (this.hasHeadings) {
        this.header = this.head.rows[0]
        this.headings = [].slice.call(this.header.cells)
    }

    // If header is disabled in options, we remove it
    if (!options.header && this.head) {
        this.table.removeChild(this.table.tHead)
    }

    // If footer is enabled in options then we add it to the table,
    // otherwise we remove a footer if one is there
    if (options.footer) {
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

    // Now we construct the rest of the html from a basic template
    // and substitute in specs from options

    // Add table class
    this.table.classList.add("dataTable-table")

    const heightStyling = options.scrollY.length? `style='height: ${options.scrollY}; overflow-Y: auto;'` : ""

    let template = `
        <div class='dataTable-top'>${options.layout.top}</div>
        <div class='dataTable-container' ${heightStyling}></div>
        <div class='dataTable-bottom'>${options.layout.bottom}</div>
    `

    // Info placement
    template = template.replace("{info}", options.paging? "<div class='dataTable-info'></div>" : "")

    // Per Page Select
    if (options.paging && options.perPageSelect) {
        let wrap = `<div class='dataTable-dropdown'><label>${options.labels.perPage}</label></div>`

        // Create the select
        const select = createElement("select", {
            class: "dataTable-selector"
        })

        // Create the options
        options.perPageSelect.forEach(val => {
            const selected = val === options.perPage
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
    if (options.searchable) {
        const form =
            `<div class='dataTable-search'><input class='dataTable-input' placeholder='${options.labels.placeholder}' type='text'></div>`

        // Search input placement
        template = template.replace("{search}", form)
    } else {
        template = template.replace("{search}", "")
    }

    // We shouldn't do this until after we possibly add headings
    if (this.hasHeadings) {
        // Sortable
        this.render("header")
    }

    // Paginator
    const w = createElement("div", {
        class: "dataTable-pagination"
    })
    const paginator = createElement("ul")
    w.appendChild(paginator)

    // Pager(s) placement
    template = template.replace(/\{pager\}/g, w.outerHTML)

    // Wrap it all up into a nice wrapper
    this.wrapper = createElement("div", {
        class: "dataTable-wrapper dataTable-loading",
        html: template
    })

    this.container = this.wrapper.querySelector(".dataTable-container")
    this.pagers = this.wrapper.querySelectorAll(".dataTable-pagination")
    this.label = this.wrapper.querySelector(".dataTable-info")

    // Insert in to DOM tree
    this.table.parentNode.replaceChild(this.wrapper, this.table)
    this.container.appendChild(this.table)

    // Store the table dimensions
    this.rect = this.table.getBoundingClientRect()

    // Add classes to our datatable as specified by options
    const classes = {
        "no-header": !options.header,
        "no-footer": !options.footer,
        "sortable": options.sortable,
        "searchable": options.searchable,
        "fixed-height": options.fixedHeight,
        "fixed-columns": options.fixedColumns
    }

    Object.entries(classes).forEach((className, yes) => {
        if (yes) {
            this.wrapper.classList.add(className)
        }
    })
}
