import {DataTable} from "../datatable"
import {classNamesToSelector, createElement} from "../helpers"

import {
    defaultConfig
} from "./config"

import {ColumnFilterOptions} from "./types"

class ColumnFilter {

    addedButtonDOM: boolean

    menuOpen: boolean

    buttonDOM: HTMLElement

    dt: DataTable

    events: { [key: string]: () => void}

    initialized: boolean

    options: ColumnFilterOptions

    menuDOM: HTMLElement

    containerDOM: HTMLElement

    wrapperDOM: HTMLElement

    limits: {x: number, y: number}

    rect: {width: number, height: number}

    event: Event

    constructor(dataTable: DataTable, options = {}) {
        this.dt = dataTable
        this.options = {
            ...defaultConfig,
            ...options
        }
    }

    init() {

        if (this.initialized) {
            return
        }

        const buttonSelector = classNamesToSelector(this.options.classes.button)
        let buttonDOM : (HTMLElement | null) = this.dt.wrapperDOM.querySelector(buttonSelector)
        if (!buttonDOM) {
            buttonDOM = createElement(
                "button",
                {
                    class: this.options.classes.button,
                    html: "▦"
                }
            )
            // filter button not part of template (could be default template. We add it to search.)
            const searchSelector = classNamesToSelector(this.dt.options.classes.search)
            const searchWrapper = this.dt.wrapperDOM.querySelector(searchSelector)
            if (searchWrapper) {
                searchWrapper.appendChild(buttonDOM)
            } else {
                this.dt.wrapperDOM.appendChild(buttonDOM)
            }
            this.addedButtonDOM = true
        }
        this.buttonDOM = buttonDOM


        this.containerDOM = createElement("div", {
            id: this.options.classes.container
        })
        this.wrapperDOM = createElement("div", {
            class: this.options.classes.wrapper
        })
        this.menuDOM = createElement("ul", {
            class: this.options.classes.menu,
            html: this.dt.data.headings.map(
                (heading, index) => {
                    const settings = this.dt.columns.settings[index]
                    if (this.options.hiddenColumns.includes(index)) {
                        return ""
                    }
                    return `<li data-column="${index}">
                        <input type="checkbox" value="${heading.text || heading.data}" ${settings.hidden ? "" : "checked=''"}>
                        <label>
                            ${heading.text || heading.data}
                        </label>
                    </li>`
                }
            ).join("")
        })
        this.wrapperDOM.appendChild(this.menuDOM)
        this.containerDOM.appendChild(this.wrapperDOM)
        this._measureSpace()

        this._bind()

        this.initialized = true

    }

    dismiss() {
        if (this.addedButtonDOM && this.buttonDOM.parentElement) {
            this.buttonDOM.parentElement.removeChild(this.buttonDOM)
        }
        document.removeEventListener("click", this.events.click)
    }

    _bind() {
        this.events = {
            click: this._click.bind(this)
        }
        document.addEventListener("click", this.events.click)
    }

    _openMenu() {
        document.body.appendChild(this.containerDOM)
        this._measureSpace()
        this.menuOpen = true
        this.dt.emit("columnFilter.menu.open")
    }

    _closeMenu() {
        if (this.menuOpen) {
            this.menuOpen = false
            document.body.removeChild(this.containerDOM)
            this.dt.emit("columnFilter.menu.close")
        }
    }

    _measureSpace() {
        const scrollX = window.scrollX || window.pageXOffset
        const scrollY = window.scrollY || window.pageYOffset
        this.rect = this.wrapperDOM.getBoundingClientRect()
        this.limits = {
            x: window.innerWidth + scrollX - this.rect.width,
            y: window.innerHeight + scrollY - this.rect.height
        }
    }

    _click(event: MouseEvent) {
        const target = event.target
        if (!(target instanceof Element)) {
            return
        }
        this.event = event

        if (this.buttonDOM.contains(target)) {
            event.preventDefault()
            if (this.menuOpen) {
                this._closeMenu()
                return
            }
            this._openMenu()
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
        } else if (this.menuDOM.contains(target)) {
            const menuSelector = classNamesToSelector(this.options.classes.menu)
            const li = target.closest(`${menuSelector} > li`) as HTMLElement
            if (!li) {
                return
            }
            const checkbox = li.querySelector("input[type=checkbox]") as HTMLInputElement
            if (!checkbox.contains(target)) {
                checkbox.checked = !checkbox.checked
            }
            const column = Number(li.dataset.column)
            if (checkbox.checked) {
                this.dt.columns.show([column])
            } else {
                this.dt.columns.hide([column])
            }
        } else if (this.menuOpen) {
            this._closeMenu()
        }
    }

}


export const addColumnFilter = function(dataTable: DataTable, options = {}) {
    const columnFilter = new ColumnFilter(dataTable, options)
    if (dataTable.initialized) {
        columnFilter.init()
    } else {
        dataTable.on("datatable.init", () => columnFilter.init())
    }

    return columnFilter
}
