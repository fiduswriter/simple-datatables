import {
    createElement
} from "../helpers"

import {
    defaultConfig
} from "./config"
import {
    debounce
} from "./helpers"

/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
export class Editor {
    constructor(dataTable, options = {}) {
        this.dataTable = dataTable
        this.options = {
            ...defaultConfig,
            ...options
        }
    }

    /**
     * Init instance
     * @return {Void}
     */
    init() {
        if (this.initialized) {
            return
        }
        this.dataTable.wrapper.classList.add(this.options.classes.editable)
        if (this.options.contextMenu) {
            this.container = createElement("div", {
                id: this.options.classes.container
            })
            this.wrapper = createElement("div", {
                class: this.options.classes.wrapper
            })
            this.menu = createElement("ul", {
                class: this.options.classes.menu
            })
            if (this.options.menuItems && this.options.menuItems.length) {
                this.options.menuItems.forEach(item => {
                    const li = createElement("li", {
                        class: item.separator ? this.options.classes.separator : this.options.classes.item
                    })
                    if (!item.separator) {
                        const a = createElement("a", {
                            class: this.options.classes.action,
                            href: item.url || "#",
                            html: typeof item.text === "function" ? item.text(this) : item.text
                        })
                        li.appendChild(a)
                        if (item.action && typeof item.action === "function") {
                            a.addEventListener("click", event => {
                                event.preventDefault()
                                item.action(this, event)
                            })
                        }
                    }
                    this.menu.appendChild(li)
                })
            }
            this.wrapper.appendChild(this.menu)
            this.container.appendChild(this.wrapper)
            this.update()
        }
        this.data = {}
        this.closed = true
        this.editing = false
        this.editingRow = false
        this.editingCell = false
        this.bindEvents()
        setTimeout(() => {
            this.initialized = true
            this.dataTable.emit("editable.init")
        }, 10)
    }

    /**
     * Bind events to DOM
     * @return {Void}
     */
    bindEvents() {
        this.events = {
            context: this.context.bind(this),
            update: this.update.bind(this),
            dismiss: this.dismiss.bind(this),
            keydown: this.keydown.bind(this),
            click: this.click.bind(this)
        }
        // listen for click / double-click
        this.dataTable.body.addEventListener(this.options.clickEvent, this.events.click)
        // listen for click anywhere but the menu
        document.addEventListener("click", this.events.dismiss)
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown)
        if (this.options.contextMenu) {
            // listen for right-click

            this.dataTable.body.addEventListener("contextmenu", this.events.context)
            // reset
            this.events.reset = debounce(this.events.update, 50)
            window.addEventListener("resize", this.events.reset)
            window.addEventListener("scroll", this.events.reset)
        }
    }

    /**
     * contextmenu listener
     * @param  {Object} event Event
     * @return {Void}
     */
    context(event) {
        this.event = event
        const valid = this.dataTable.body.contains(event.target)
        if (this.options.contextMenu && !this.disabled && valid) {
            event.preventDefault()
            // get the mouse position
            let x = event.pageX
            let y = event.pageY
            // check if we're near the right edge of window
            if (x > this.limits.x) {
                x -= this.rect.width
            }
            // check if we're near the bottom edge of window
            if (y > this.limits.y) {
                y -= this.rect.height
            }
            this.wrapper.style.top = `${y}px`
            this.wrapper.style.left = `${x}px`
            this.openMenu()
            this.update()
        }
    }

    /**
     * dblclick listener
     * @param  {Object} event Event
     * @return {Void}
     */
    click(event) {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell()
        } else if (!this.editing) {
            const cell = event.target.closest("td")
            if (cell) {
                this.editCell(cell)
                event.preventDefault()
            }
        }
    }

    /**
     * keydown listener
     * @param  {Object} event Event
     * @return {Void}
     */
    keydown(event) {
        if (this.modal) {
            if (event.key === "Escape") { // close button
                this.closeModal()
            } else if (event.key === "Enter") { // save button
                // Save
                this.saveRow()
            }
        } else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    this.saveCell()
                } else if (this.editingRow) {
                    this.saveRow()
                }
            } else if (event.key === "Escape") {
                // Escape key reverts
                this.saveCell(this.data.content)
            }
        }
    }

    /**
     * Edit cell
     * @param  {Object} cell    The HTMLTableCellElement
     * @return {Void}
     */
    editCell(cell) {
        if (this.options.excludeColumns.includes(cell.cellIndex)) {
            this.closeMenu()
            return
        }
        const row = this.dataTable.body.rows[cell.parentNode.dataIndex]
        cell = row.cells[cell.cellIndex]
        this.data = {
            cell,
            content: cell.dataset.content || cell.innerHTML,
            input: createElement("input", {
                type: "text",
                value: cell.dataset.content || cell.innerHTML,
                class: this.options.classes.input
            })
        }
        cell.innerHTML = ""
        cell.appendChild(this.data.input)
        setTimeout(() => {
            this.data.input.focus()
            this.data.input.selectionStart = this.data.input.selectionEnd = this.data.input.value.length
            this.editing = true
            this.editingCell = true
            this.closeMenu()
        }, 10)
    }

    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    saveCell(value, cell) {
        cell = cell || this.data.cell
        value = value || this.data.input.value
        const oldData = this.data.content
        // Set the cell content
        this.dataTable.data[cell.parentNode.dataIndex].cells[cell.cellIndex].innerHTML = cell.innerHTML = value.trim()
        this.data = {}
        this.editing = this.editingCell = false
        this.dataTable.emit("editable.save.cell", value, oldData, cell)
    }

    /**
     * Edit row
     * @param  {Object} cell    The HTMLTableRowElement
     * @return {Void}
     */
    editRow(row) {
        row = row || this.event.target.closest("tr")
        if (!row || row.nodeName !== "TR" || this.editing) return
        row = this.dataTable.body.rows[row.dataIndex]
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            "<h4>Editing row</h4>",
            `<button class='${this.options.classes.close}' type='button' data-editor-close>×</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>Save</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("")
        const modal = createElement("div", {
            class: this.options.classes.modal,
            html: template
        })
        const inner = modal.firstElementChild
        const form = inner.lastElementChild.firstElementChild
        // Add the inputs for each cell
        Array.from(row.cells).forEach((cell, i) => {
            if ((!cell.hidden || (cell.hidden && this.options.hiddenColumns)) && !this.options.excludeColumns.includes(i)) {
                form.insertBefore(createElement("div", {
                    class: this.options.classes.row,
                    html: [
                        `<div class='${this.options.classes.row}'>`,
                        `<label class='${this.options.classes.label}'>${this.dataTable.header.cells[i].textContent}</label>`,
                        `<input class='${this.options.classes.input}' value='${cell.dataset.content || cell.innerHTML}' type='text'>`,
                        "</div>"
                    ].join("")
                }), form.lastElementChild)
            }
        })
        this.modal = modal
        this.openModal()
        // Grab the inputs
        const inputs = Array.from(form.elements)
        // Remove save button
        inputs.pop()
        this.data = {
            row,
            inputs
        }
        this.editing = true
        this.editingRow = true
        // Close / save
        modal.addEventListener("click", event => {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                this.closeModal()
            } else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveRow()
            }
        })
        this.closeMenu()
    }

    /**
     * Save edited row
     * @param  {Object} row    The HTMLTableRowElement
     * @param  {Array} data   Cell data
     * @return {Void}
     */
    saveRow(data, row) {
        data = data || this.data.inputs.map(input => input.value.trim())
        row = row || this.data.row
        // Store the old data for the emitter
        const oldData = Array.from(row.cells).map(cell => cell.dataset.content || cell.innerHTML)
        Array.from(row.cells).forEach((cell, i) => {
            cell.innerHTML = data[i]
        })
        this.closeModal()
        this.dataTable.emit("editable.save.row", data, oldData, row)
    }

    /**
     * Open the row editor modal
     * @return {Void}
     */
    openModal() {
        if (!this.editing && this.modal) {
            document.body.appendChild(this.modal)
        }
    }

    /**
     * Close the row editor modal
     * @return {Void}
     */
    closeModal() {
        if (this.editing && this.modal) {
            document.body.removeChild(this.modal)
            this.modal = this.editing = this.editingRow = false
        }
    }

    /**
     * Remove a row
     * @param  {Number|Object} row The HTMLTableRowElement or dataIndex property
     * @return {Void}
     */
    removeRow(row) {
        if (!row) {
            row = this.event.target.closest("tr")
            if (row && row.dataIndex !== undefined) {
                this.dataTable.rows.remove(row.dataIndex)
                this.closeMenu()
            }
        } else {
            // User passed a HTMLTableRowElement
            if (row instanceof Element && row.nodeName === "TR" && row.dataIndex !== undefined) {
                row = row.dataIndex
            }
            this.dataTable.rows.remove(row)
            this.closeMenu()
        }
    }

    /**
     * Update context menu position
     * @return {Void}
     */
    update() {
        const scrollX = window.scrollX || window.pageXOffset
        const scrollY = window.scrollY || window.pageYOffset
        this.rect = this.wrapper.getBoundingClientRect()
        this.limits = {
            x: window.innerWidth + scrollX - this.rect.width,
            y: window.innerHeight + scrollY - this.rect.height
        }
    }

    /**
     * Dismiss the context menu
     * @param  {Object} event Event
     * @return {Void}
     */
    dismiss(event) {
        let valid = true
        if (this.options.contextMenu) {
            valid = !this.wrapper.contains(event.target)
            if (this.editing) {
                valid = !this.wrapper.contains(event.target) && event.target !== this.data.input
            }
        }
        if (valid) {
            if (this.editingCell) {
                // Revert
                this.saveCell(this.data.content)
            }
            this.closeMenu()
        }
    }

    /**
     * Open the context menu
     * @return {Void}
     */
    openMenu() {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell()
        }
        if (this.options.contextMenu) {
            document.body.appendChild(this.container)
            this.closed = false
            this.dataTable.emit("editable.context.open")
        }
    }

    /**
     * Close the context menu
     * @return {Void}
     */
    closeMenu() {
        if (this.options.contextMenu && !this.closed) {
            this.closed = true
            document.body.removeChild(this.container)
            this.dataTable.emit("editable.context.close")
        }
    }

    /**
     * Destroy the instance
     * @return {Void}
     */
    destroy() {
        this.dataTable.body.removeEventListener(this.options.clickEvent, this.events.click)
        this.dataTable.body.removeEventListener("contextmenu", this.events.context)
        document.removeEventListener("click", this.events.dismiss)
        document.removeEventListener("keydown", this.events.keydown)
        window.removeEventListener("resize", this.events.reset)
        window.removeEventListener("scroll", this.events.reset)
        if (document.body.contains(this.container)) {
            document.body.removeChild(this.container)
        }
        this.initialized = false
    }
}

export const makeEditable = function(dataTable, options = {}) {
    const editor = new Editor(dataTable, options)
    if (dataTable.initialized) {
        editor.init()
    } else {
        dataTable.on("datatable.init", () => editor.init())
    }

    return editor
}
