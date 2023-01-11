import {
    createElement,
    escapeText
} from "../helpers"

import {
    defaultConfig
} from "./config"
import {
    debounce
} from "./helpers"
import {DataTable} from "../datatable"
/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
export class Editor {
    closed: any

    container: any

    data: any

    disabled: any

    dt: DataTable

    editing: boolean

    editingCell: any

    editingRow: any

    event: any

    events: any

    initialized: any

    limits: any

    menu: any

    modal: any

    options: any

    rect: any

    wrapper: any

    constructor(dataTable: any, options = {}) {
        this.dt = dataTable
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
        this.dt.wrapper.classList.add(this.options.classes.editable)
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
                this.options.menuItems.forEach((item: any) => {
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
                            a.addEventListener("click", (event: any) => {
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
            this.dt.emit("editable.init")
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
        this.dt.dom.addEventListener(this.options.clickEvent, this.events.click)
        // listen for click anywhere but the menu
        document.addEventListener("click", this.events.dismiss)
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown)
        if (this.options.contextMenu) {
            // listen for right-click

            this.dt.dom.addEventListener("contextmenu", this.events.context)
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
    context(event: any) {
        this.event = event
        const cell = event.target.closest("tbody td")
        if (this.options.contextMenu && !this.disabled && cell) {
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
    click(event: any) {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell(this.data.input.value)
        } else if (!this.editing) {
            const cell = event.target.closest("tbody td")
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
    keydown(event: any) {
        if (this.modal) {
            if (event.key === "Escape") { // close button
                this.closeModal()
            } else if (event.key === "Enter") { // save button
                // Save
                this.saveRow(this.data.inputs.map((input: any) => input.value.trim()), this.data.row)
            }
        } else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    this.saveCell(this.data.input.value)
                } else if (this.editingRow) {
                    this.saveRow(this.data.inputs.map((input: any) => input.value.trim()), this.data.row)
                }
            } else if (event.key === "Escape") {
                // Escape key reverts
                this.saveCell(this.data.content)
            }
        }
    }

    /**
     * Edit cell
     * @param  {Object} td    The HTMLTableCellElement
     * @return {Void}
     */
    editCell(td: any) {
        let columnIndex = 0
        let cellIndex = 0
        while (cellIndex < td.cellIndex) {
            const columnSettings = this.dt.columnSettings.columns[columnIndex] || {}
            if (!columnSettings.hidden) {
                cellIndex += 1
            }
            columnIndex += 1
        }
        if (this.options.excludeColumns.includes(columnIndex)) {
            this.closeMenu()
            return
        }
        const rowIndex = parseInt(td.parentNode.dataset.index, 10)
        const row = this.dt.data.data[rowIndex]
        const cell = row[columnIndex]

        this.data = {
            cell,
            rowIndex,
            columnIndex,
            content: cell.text || String(cell.data)
        }
        const label = this.dt.data.headings[columnIndex].text || String(this.dt.data.headings[columnIndex].data)
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            "<h4>Editing cell</h4>",
            `<button class='${this.options.classes.close}' type='button' data-editor-close>×</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<label class='${this.options.classes.label}'>${escapeText(label)}</label>`,
            `<input class='${this.options.classes.input}' value='${escapeText(cell.text || String(cell.data) || "")}' type='text'>`,
            "</div>",
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
        this.modal = modal
        this.openModal()
        this.editing = true
        this.editingCell = true
        this.data.input = modal.querySelector("input[type=text]")
        this.data.input.focus()
        this.data.input.selectionStart = this.data.input.selectionEnd = this.data.input.value.length
        // Close / save
        modal.addEventListener("click", (event: any) => {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                this.closeModal()
            } else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveCell(this.data.input.value)
            }
        })
        this.closeMenu()
    }

    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    saveCell(value: string) {
        const oldData = this.data.content
        // Set the cell content
        this.dt.data.data[this.data.rowIndex][this.data.columnIndex] = {data: value.trim()}
        this.closeModal()
        this.dt.fixColumns()
        this.dt.emit("editable.save.cell", value, oldData, this.data.rowIndex, this.data.columnIndex)
        this.data = {}
    }

    /**
     * Edit row
     * @param  {Object} row    The HTMLTableRowElement
     * @return {Void}
     */
    editRow(tr: any) {
        if (!tr || tr.nodeName !== "TR" || this.editing) return
        const dataIndex = parseInt(tr.dataset.index, 10)
        const row = this.dt.data.data[dataIndex]
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
        if (!inner) {
            return
        }
        const form = inner.lastElementChild?.firstElementChild
        if (!form) {
            return
        }
        // Add the inputs for each cell
        row.forEach((cell: any, i: any) => {
            const columnSettings = this.dt.columnSettings.columns[i] || {}
            if ((!columnSettings.hidden || (columnSettings.hidden && this.options.hiddenColumns)) && !this.options.excludeColumns.includes(i)) {
                const label = this.dt.data.headings[i].text || String(this.dt.data.headings[i].data)
                form.insertBefore(createElement("div", {
                    class: this.options.classes.row,
                    html: [
                        `<div class='${this.options.classes.row}'>`,
                        `<label class='${this.options.classes.label}'>${escapeText(label)}</label>`,
                        `<input class='${this.options.classes.input}' value='${escapeText(cell.text || String(cell.data) || "")}' type='text'>`,
                        "</div>"
                    ].join("")
                }), form.lastElementChild)
            }
        })
        this.modal = modal
        this.openModal()
        // Grab the inputs
        const inputs = Array.from(form.querySelectorAll("input[type=text]"))
        // Remove save button
        inputs.pop()
        this.data = {
            row,
            inputs,
            dataIndex
        }
        this.editing = true
        this.editingRow = true
        // Close / save
        modal.addEventListener("click", (event: any) => {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                this.closeModal()
            } else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveRow(this.data.inputs.map((input: any) => input.value.trim()), this.data.row)
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
    saveRow(data: any, row: any) {
        // Store the old data for the emitter
        const oldData = row.map((cell: any) => cell.text || String(cell.data))
        this.dt.rows.updateRow(this.data.dataIndex, data)
        this.data = {}
        this.closeModal()
        this.dt.emit("editable.save.row", data, oldData, row)
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
            this.modal = this.editing = this.editingRow = this.editingCell = false
        }
    }

    /**
     * Remove a row
     * @param  {Object} tr The HTMLTableRowElement
     * @return {Void}
     */
    removeRow(tr: any) {
        if (!tr || tr.nodeName !== "TR" || this.editing) return
        const index = parseInt(tr.dataset.index, 10)
        this.dt.rows.remove(index)
        this.closeMenu()
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
    dismiss(event: any) {
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
            this.saveCell(this.data.input.value)
        }
        if (this.options.contextMenu) {
            document.body.appendChild(this.container)
            this.closed = false
            this.dt.emit("editable.context.open")
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
            this.dt.emit("editable.context.close")
        }
    }

    /**
     * Destroy the instance
     * @return {Void}
     */
    destroy() {
        this.dt.dom.removeEventListener(this.options.clickEvent, this.events.click)
        this.dt.dom.removeEventListener("contextmenu", this.events.context)
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

export const makeEditable = function(dataTable: any, options = {}) {
    const editor = new Editor(dataTable, options)
    if (dataTable.initialized) {
        editor.init()
    } else {
        dataTable.on("datatable.init", () => editor.init())
    }

    return editor
}
