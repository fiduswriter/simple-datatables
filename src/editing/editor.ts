import {
    classNamesToSelector,
    cellToText,
    columnToVisibleIndex,
    createElement,
    escapeText,
    visibleToColumnIndex
} from "../helpers"
import {
    cellType,
    rowRenderType,
    elementNodeType
} from "../types"
import {DataTable} from "../datatable"
import {parseDate} from "../date"

import {
    defaultConfig
} from "./config"
import {
    debounce
} from "./helpers"
import {menuItemType, dataType, EditorOptions} from "./types"


/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
export class Editor {
    menuOpen: boolean

    containerDOM: HTMLElement

    data: dataType

    disabled: boolean

    dt: DataTable

    editing: boolean

    editingCell: boolean

    editingRow: boolean

    event: Event

    events: { [key: string]: () => void}

    initialized: boolean

    limits: {x: number, y: number}

    menuDOM: HTMLElement

    modalDOM: HTMLElement | false

    options: EditorOptions

    originalRowRender: rowRenderType | false

    rect: {width: number, height: number}

    wrapperDOM: HTMLElement

    constructor(dataTable: DataTable, options = {}) {
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
        this.options.classes.editable?.split(" ").forEach(className => this.dt.wrapperDOM.classList.add(className))
        if (this.options.inline) {
            this.originalRowRender = this.dt.options.rowRender
            this.dt.options.rowRender = (row, tr, index) => {
                let newTr = this.rowRender(row, tr, index)
                if (this.originalRowRender) {
                    newTr = this.originalRowRender(row, newTr, index)
                }
                return newTr
            }
        }
        if (this.options.contextMenu) {
            this.containerDOM = createElement("div", {
                id: this.options.classes.container
            })
            this.wrapperDOM = createElement("div", {
                class: this.options.classes.wrapper
            })
            this.menuDOM = createElement("ul", {
                class: this.options.classes.menu
            })
            if (this.options.menuItems && this.options.menuItems.length) {
                this.options.menuItems.forEach((item: menuItemType) => {
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
                            a.addEventListener("click", (event: Event) => {
                                event.preventDefault()
                                item.action(this, event)
                            })
                        }
                    }
                    this.menuDOM.appendChild(li)
                })
            }
            this.wrapperDOM.appendChild(this.menuDOM)
            this.containerDOM.appendChild(this.wrapperDOM)
            this.updateMenu()
        }
        this.data = {}
        this.menuOpen = false
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
            keydown: this.keydown.bind(this),
            click: this.click.bind(this)
        }
        // listen for click / double-click
        this.dt.dom.addEventListener(this.options.clickEvent, this.events.click)
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown)

        if (this.options.contextMenu) {
            this.events.context = this.context.bind(this)
            this.events.updateMenu = this.updateMenu.bind(this)
            this.events.dismissMenu = this.dismissMenu.bind(this)
            this.events.reset = debounce(() => this.events.updateMenu(), 50)

            // listen for right-click
            this.dt.dom.addEventListener("contextmenu", this.events.context)
            // listen for click everywhere except the menu
            document.addEventListener("click", this.events.dismissMenu)
            // Reset contextmenu on browser window changes
            window.addEventListener("resize", this.events.reset)
            window.addEventListener("scroll", this.events.reset)
        }
    }

    /**
     * contextmenu listener
     * @param  {Object} event Event
     * @return {Void}
     */
    context(event: MouseEvent) {
        const target = event.target
        if (!(target instanceof Element)) {
            return
        }
        this.event = event

        const cell = target.closest("tbody td")
        if (!this.disabled && cell) {
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
            this.wrapperDOM.style.top = `${y}px`
            this.wrapperDOM.style.left = `${x}px`
            this.openMenu()
            this.updateMenu()
        }
    }

    /**
     * dblclick listener
     * @param  {Object} event Event
     * @return {Void}
     */
    click(event: MouseEvent) {
        const target = event.target
        if (!(target instanceof Element)) {
            return
        }
        if (this.editing && this.data && this.editingCell) {
            const inputSelector = classNamesToSelector(this.options.classes.input)
            const input = this.modalDOM ?
                (this.modalDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement) :
                (this.dt.wrapperDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement)
            this.saveCell(input.value)
        } else if (!this.editing) {
            const cell = target.closest("tbody td") as HTMLTableCellElement
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
    keydown(event: KeyboardEvent) {
        const inputSelector = classNamesToSelector(this.options.classes.input)
        if (this.modalDOM) {
            if (event.key === "Escape") { // close button
                if (this.options.cancelModal(this)) {
                    this.closeModal()
                }
            } else if (event.key === "Enter") { // save button
                // Save
                if (this.editingCell) {
                    const input = (this.modalDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement)
                    this.saveCell(input.value)
                } else {
                    const values = (Array.from(this.modalDOM.querySelectorAll(`input${inputSelector}[type=text]`)) as HTMLInputElement[]).map(input => input.value.trim())
                    this.saveRow(values, this.data.row)
                }
            }
        } else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    const input = (this.dt.wrapperDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement)
                    this.saveCell(input.value)
                } else if (this.editingRow) {
                    const values = (Array.from(this.dt.wrapperDOM.querySelectorAll(`input${inputSelector}[type=text]`)) as HTMLInputElement[]).map(input => input.value.trim())
                    this.saveRow(values, this.data.row)
                }
            } else if (event.key === "Escape") {
                // Escape key reverts
                if (this.editingCell) {
                    this.saveCell(this.data.content)
                } else if (this.editingRow) {
                    this.saveRow(null, this.data.row)
                }
            }
        }
    }

    /**
     * Edit cell
     * @param  {Object} td    The HTMLTableCellElement
     * @return {Void}
     */
    editCell(td: HTMLTableCellElement) {
        const columnIndex = visibleToColumnIndex(td.cellIndex, this.dt.columns.settings)
        if (this.options.excludeColumns.includes(columnIndex)) {
            this.closeMenu()
            return
        }
        const rowIndex = parseInt(td.parentElement.dataset.index, 10)
        const row = this.dt.data.data[rowIndex]
        const cell = row.cells[columnIndex]

        this.data = {
            cell,
            rowIndex,
            columnIndex,
            content: cellToText(cell)
        }
        this.editing = true
        this.editingCell = true
        if (this.options.inline) {
            this.dt.update()
        } else {
            this.editCellModal()
        }
        this.closeMenu()
    }

    editCellModal() {
        const cell = this.data.cell
        const columnIndex = this.data.columnIndex
        const label = this.dt.data.headings[columnIndex].text || String(this.dt.data.headings[columnIndex].data)
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            `<h4>${this.options.labels.editCell}</h4>`,
            `<button class='${this.options.classes.close}' type='button' data-editor-cancel>${this.options.labels.closeX}</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<label class='${this.options.classes.label}'>${escapeText(label)}</label>`,
            `<input class='${this.options.classes.input}' value='${escapeText(cellToText(cell))}' type='text'>`,
            "</div>",
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.cancel}' type='button' data-editor-cancel>${this.options.labels.cancel}</button>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>${this.options.labels.save}</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("")
        const modalDOM = createElement("div", {
            class: this.options.classes.modal,
            html: template
        })
        this.modalDOM = modalDOM
        this.openModal()
        const inputSelector = classNamesToSelector(this.options.classes.input)
        const input = (modalDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement)
        input.focus()
        input.selectionStart = input.selectionEnd = input.value.length
        // Close / save
        modalDOM.addEventListener("click", (event: Event) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            if (target.hasAttribute("data-editor-cancel")) { // cancel button
                event.preventDefault()
                if (this.options.cancelModal(this)) {
                    this.closeModal()
                }
            } else if (target.hasAttribute("data-editor-save")) { // save button
                event.preventDefault()
                // Save
                this.saveCell(input.value)
            }
        })
    }

    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    saveCell(value: string) {
        const oldData = this.data.content
        // Get the type of that column
        const type = this.dt.columns.settings[this.data.columnIndex].type || this.dt.options.type
        const stringValue = value.trim()
        let cell
        if (type === "number") {
            cell = {data: parseFloat(stringValue)}
        } else if (type === "boolean") {
            if (["", "false", "0"].includes(stringValue)) {
                cell = {data: false,
                    text: "false",
                    order: 0}
            } else {
                cell = {data: true,
                    text: "true",
                    order: 1}
            }
        } else if (type === "html") {
            cell = {data: [
                {nodeName: "#text",
                    data: value}
            ],
            text: value,
            order: value}
        } else if (type === "string") {
            cell = {data: value}
        } else if (type === "date") {
            const format = this.dt.columns.settings[this.data.columnIndex].format || this.dt.options.format
            cell = {data: value,
                order: parseDate(String(value), format)}
        } else {
            cell = {data: value}
        }
        // Set the cell content
        const row = this.dt.data.data[this.data.rowIndex]
        row.cells[this.data.columnIndex] = cell
        this.closeModal()
        const rowIndex = this.data.rowIndex
        const columnIndex = this.data.columnIndex
        this.data = {}
        this.dt.update(true)
        this.editing = false
        this.editingCell = false
        this.dt.emit("editable.save.cell", value, oldData, rowIndex, columnIndex)
    }

    /**
     * Edit row
     * @param  {Object} row    The HTMLTableRowElement
     * @return {Void}
     */
    editRow(tr: HTMLElement) {
        if (!tr || tr.nodeName !== "TR" || this.editing) return
        const rowIndex = parseInt(tr.dataset.index, 10)
        const row = this.dt.data.data[rowIndex]
        this.data = {
            row: row.cells,
            rowIndex
        }
        this.editing = true
        this.editingRow = true
        if (this.options.inline) {
            this.dt.update()
        } else {
            this.editRowModal()
        }
        this.closeMenu()
    }

    editRowModal() {
        const row = this.data.row

        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            `<h4>${this.options.labels.editRow}</h4>`,
            `<button class='${this.options.classes.close}' type='button' data-editor-cancel>${this.options.labels.closeX}</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.cancel}' type='button' data-editor-cancel>${this.options.labels.cancel}</button>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>${this.options.labels.save}</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("")
        const modalDOM = createElement("div", {
            class: this.options.classes.modal,
            html: template
        })
        const inner = modalDOM.firstElementChild
        if (!inner) {
            return
        }
        const form = inner.lastElementChild?.firstElementChild
        if (!form) {
            return
        }
        // Add the inputs for each cell
        row.forEach((cell: cellType, i: number) => {
            const columnSettings = this.dt.columns.settings[i]
            if ((!columnSettings.hidden || (columnSettings.hidden && this.options.hiddenColumns)) && !this.options.excludeColumns.includes(i)) {
                const label = this.dt.data.headings[i].text || String(this.dt.data.headings[i].data)
                form.insertBefore(createElement("div", {
                    class: this.options.classes.row,
                    html: [
                        `<div class='${this.options.classes.row}'>`,
                        `<label class='${this.options.classes.label}'>${escapeText(label)}</label>`,
                        `<input class='${this.options.classes.input}' value='${escapeText(cellToText(cell))}' type='text'>`,
                        "</div>"
                    ].join("")
                }), form.lastElementChild)
            }
        })
        this.modalDOM = modalDOM
        this.openModal()
        // Grab the inputs
        const inputSelector = classNamesToSelector(this.options.classes.input)
        const inputs = Array.from(form.querySelectorAll(`input${inputSelector}[type=text]`)) as HTMLInputElement[]

        // Close / save
        modalDOM.addEventListener("click", (event: MouseEvent) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }
            if (target.hasAttribute("data-editor-cancel")) { // cancel button
                if (this.options.cancelModal(this)) {
                    this.closeModal()
                }
            } else if (target.hasAttribute("data-editor-save")) { // save button
                // Save
                const values = inputs.map((input: HTMLInputElement) => input.value.trim())
                this.saveRow(values, this.data.row)
            }
        })
    }

    /**
     * Save edited row
     * @param  {Object} row    The HTMLTableRowElement
     * @param  {Array} data   Cell data
     * @return {Void}
     */
    saveRow(data: string[], row: cellType[]) {
        // Store the old data for the emitter
        const oldData = row.map((cell: cellType) => cellToText(cell))
        const updatedRow = this.dt.data.data[this.data.rowIndex]

        if (data) {
            let valueCounter = 0
            updatedRow.cells = row.map((oldItem, colIndex) => {
                if (this.options.excludeColumns.includes(colIndex) || this.dt.columns.settings[colIndex].hidden) {
                    return oldItem
                }
                const type = this.dt.columns.settings[colIndex].type || this.dt.options.type
                const value = data[valueCounter++]
                let cell
                if (type === "number") {
                    cell = {data: parseFloat(value)}
                } else if (type === "boolean") {
                    if (["", "false", "0"].includes(value)) {
                        cell = {data: false,
                            text: "false",
                            order: 0}
                    } else {
                        cell = {data: true,
                            text: "true",
                            order: 1}
                    }
                } else if (type === "html") {
                    cell = {
                        data: [
                            {nodeName: "#text",
                                data: value}
                        ],
                        text: value,
                        order: value
                    }
                } else if (type === "string") {
                    cell = {data: value}
                } else if (type === "date") {
                    const format = this.dt.columns.settings[colIndex].format || this.dt.options.format
                    cell = {data: value,
                        order: parseDate(String(value), format)}
                } else {
                    cell = {data: value}
                }
                return cell

            })
        }

        const newData = updatedRow.cells.map(cell => cellToText(cell))

        this.data = {}
        this.dt.update(true)
        this.closeModal()
        this.editing = false
        this.dt.emit("editable.save.row", newData, oldData, row)
    }

    /**
     * Open the row editor modal
     * @return {Void}
     */
    openModal() {
        if (this.modalDOM) {
            document.body.appendChild(this.modalDOM)
        }
    }

    /**
     * Close the row editor modal
     * @return {Void}
     */
    closeModal() {
        if (this.editing && this.modalDOM) {
            document.body.removeChild(this.modalDOM)
            this.modalDOM = this.editing = this.editingRow = this.editingCell = false
        }
    }

    /**
     * Remove a row
     * @param  {Object} tr The HTMLTableRowElement
     * @return {Void}
     */
    removeRow(tr: HTMLElement) {
        if (!tr || tr.nodeName !== "TR" || this.editing) return
        const index = parseInt(tr.dataset.index, 10)
        this.dt.rows.remove(index)
        this.closeMenu()
    }

    /**
     * Update context menu position
     * @return {Void}
     */
    updateMenu() {
        const scrollX = window.scrollX || window.pageXOffset
        const scrollY = window.scrollY || window.pageYOffset
        this.rect = this.wrapperDOM.getBoundingClientRect()
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
    dismissMenu(event: Event) {
        const target = event.target
        if (!(target instanceof Element) || this.wrapperDOM.contains(target)) {
            return
        }
        let valid = true
        if (this.editing) {
            const inputSelector = classNamesToSelector(this.options.classes.input)
            valid = !(target.matches(`input${inputSelector}[type=text]`))
        }
        if (valid) {
            this.closeMenu()
        }
    }

    /**
     * Open the context menu
     * @return {Void}
     */
    openMenu() {
        if (this.editing && this.data && this.editingCell) {
            const inputSelector = classNamesToSelector(this.options.classes.input)
            const input = this.modalDOM ?
                (this.modalDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement) :
                (this.dt.wrapperDOM.querySelector(`input${inputSelector}[type=text]`) as HTMLInputElement)

            this.saveCell(input.value)
        }
        document.body.appendChild(this.containerDOM)
        this.menuOpen = true
        this.dt.emit("editable.context.open")
    }

    /**
     * Close the context menu
     * @return {Void}
     */
    closeMenu() {
        if (this.menuOpen) {
            this.menuOpen = false
            document.body.removeChild(this.containerDOM)
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
        document.removeEventListener("click", this.events.dismissMenu)
        document.removeEventListener("keydown", this.events.keydown)
        window.removeEventListener("resize", this.events.reset)
        window.removeEventListener("scroll", this.events.reset)
        if (document.body.contains(this.containerDOM)) {
            document.body.removeChild(this.containerDOM)
        }
        if (this.options.inline) {
            this.dt.options.rowRender = this.originalRowRender
        }
        this.initialized = false
    }

    rowRender(row, tr, index) {
        if (!this.data || this.data.rowIndex !== index) {
            return tr
        }

        if (this.editingCell) {
            // cell editing
            const cell = tr.childNodes[columnToVisibleIndex(this.data.columnIndex, this.dt.columns.settings)]
            cell.childNodes = [
                {
                    nodeName: "INPUT",
                    attributes: {
                        type: "text",
                        value: this.data.content,
                        class: this.options.classes.input
                    }
                }
            ]
        } else {
            // row editing

            // Add the inputs for each cell
            tr.childNodes.forEach((cell: elementNodeType, i: number) => {
                const index = visibleToColumnIndex(i, this.dt.columns.settings)
                const dataCell = row[index]
                if (!this.options.excludeColumns.includes(index)) {
                    const cell = tr.childNodes[i]
                    cell.childNodes = [
                        {
                            nodeName: "INPUT",
                            attributes: {
                                type: "text",
                                value: escapeText(dataCell.text || String(dataCell.data) || ""),
                                class: this.options.classes.input
                            }
                        }
                    ]
                }
            })

        }
        return tr

    }
}

export const makeEditable = function(dataTable: DataTable, options = {}) {
    const editor = new Editor(dataTable, options)
    if (dataTable.initialized) {
        editor.init()
    } else {
        dataTable.on("datatable.init", () => editor.init())
    }

    return editor
}
