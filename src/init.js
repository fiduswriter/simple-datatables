/*
 * This module contains functions that only get called once on DataTable
 * instantiation so they don't really need to be prototype methods.
 */

import {createElement} from "./helpers"

/**
 * Create our data model and the corresponding HTML for the table and add it to the DOM.
 * If the HTML table is already there, we just create the model from it.
 *
 * @param {DataTable} dt -- The target DataTable object
 */
const makeHTMLTableFromOptions = function(dt) {

    const options = dt.options

    // If there is a table body already defined in the HTML
    // then we populate dt.data with it, otherwise we create it
    if (dt.body) {
        dt.data = Array.from(dt.body.rows)
        dt.activeRows = dt.data.slice()
    } else {
        const tbody = createElement("tbody")
        dt.table.appendChild(tbody)
        dt.data = []
        dt.activeRows = []
    }

    // If there is a table head already defined in the HTML
    // then we populate dt.header and dt.headings with it,
    // otherwise we create it
    if (!dt.head) {
        const thead = createElement("thead")
        const tr = createElement("tr")

        if (dt.hasRows) {
            Array.from(dt.body.rows[0].cells).forEach(() => {
                tr.appendChild(createElement("th"))
            })

            thead.appendChild(tr)
        }

        dt.table.insertBefore(thead, dt.body)

        dt.hiddenHeader = !options.ajax
    }

    // If header is disabled in options, we remove it
    if (!options.header && dt.head) {
        dt.table.removeChild(dt.head)
    }

    // If footer is enabled in options then we add it to the table,
    // otherwise we remove a footer if one is there
    if (options.footer) {
        if (dt.head && !dt.foot) {
            const tfoot = createElement("tfoot", {
                html: dt.head.innerHTML
            })
            dt.table.appendChild(tfoot)
        }
    } else {
        if (dt.foot) {
            dt.table.removeChild(dt.foot)
        }
    }

    // Now we construct the rest of the html from a basic template
    // and substitute in specs from options

    // Add table class
    dt.table.classList.add("dataTable-table")

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
    if (dt.hasHeadings) {
        // Sortable
        dt.render("header")
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
    dt.wrapper = createElement("div", {
        class: "dataTable-wrapper dataTable-loading",
        html: template
    })

    dt.container = dt.wrapper.querySelector(".dataTable-container")
    dt.pagers = dt.wrapper.querySelectorAll(".dataTable-pagination")
    dt.label = dt.wrapper.querySelector(".dataTable-info")

    // Insert in to DOM tree
    dt.table.parentNode.replaceChild(dt.wrapper, dt.table)
    dt.container.appendChild(dt.table)

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
            dt.wrapper.classList.add(className)
        }
    })
}


/**
 * Bind event listeners (sort buttons, pager links, resizing, etc)
 * @param {DataTable} [dt] -- the DataTable object
 */
const bindEvents = function(dt) {
    const options = dt.options
    // Per page selector
    if (options.perPageSelect) {
        const selector = dt.wrapper.querySelector(".dataTable-selector")
        if (selector) {
            // Change per page
            selector.addEventListener("change", () => {
                options.perPage = parseInt(selector.value, 10)
                dt.update()

                dt.fixHeight()

                dt.emit("datatable.perpage", options.perPage)
            }, false)
        }
    }

    // Search input
    if (options.searchable) {
        dt.input = dt.wrapper.querySelector(".dataTable-input")
        if (dt.input) {
            dt.input.addEventListener("keyup", () => dt.search(dt.input.value), false)
        }
    }

    // Pager(s) / sorting
    dt.wrapper.addEventListener("click", e => {
        const t = e.target.closest('a')
        if (!t) {
            return;
        }
        if (t.nodeName.toLowerCase() === "a") {
            if (t.hasAttribute("data-page")) {
                dt.page(t.getAttribute("data-page"))
                e.preventDefault()
            } else if (
                options.sortable &&
                t.classList.contains("dataTable-sorter") &&
                t.parentNode.getAttribute("data-sortable") != "false"
            ) {
                dt.columns().sort(dt.headings.indexOf(t.parentNode))
                e.preventDefault()
            }
        }
    }, false)

    window.addEventListener("resize", () => {
        dt.fixColumns()
    })
}

export const createTable = function(dt) {
    makeHTMLTableFromOptions(dt)
    bindEvents(dt)
}
