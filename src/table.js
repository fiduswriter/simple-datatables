import {createElement} from "./helpers"

/**
 * Parse data to HTML table
 */
export const dataToTable = function (data) {
    let thead = false
    let tbody = false

    data = data || this.options.data

    if (data.headings) {
        thead = createElement("thead")
        const tr = createElement("tr")
        data.headings.forEach((col, index) => {
            const current_params = this.options.columns.find(o => o.name === data.headings[index] || o.select === index)
            const td = createElement("th", {
                html: col!=='actions' ? col : '',
                class: (current_params!==undefined && current_params.hasOwnProperty('headerClass')) ? current_params.headerClass : ''
            })
            tr.appendChild(td)
        })

        thead.appendChild(tr)
    }

    if (data.data && data.data.length) {
        tbody = createElement("tbody")
        data.data.forEach(rows => {
            if (data.headings) {
                if (data.headings.length !== rows.length) {
                    throw new Error(
                        "The number of rows do not match the number of headings."
                    )
                }
            }
            const tr = createElement("tr")
            rows.forEach((value, index) => {
                const current_params = this.options.columns.find(o => o.name === this.options.data.headings[index] || o.select === index)
                if(current_params && current_params.hasOwnProperty('renderBefore')){
                    value = current_params.renderBefore(value)
                }
                const td = createElement("td", {
                    html: value,
                    class: (current_params!==undefined) ? current_params.cellClass : ''
                })
                tr.appendChild(td)
            })
            tbody.appendChild(tr)
        })
    }

    if (thead) {
        if (this.dom.tHead !== null) {
            this.dom.removeChild(this.dom.tHead)
        }
        this.dom.appendChild(thead)
    }

    if (tbody) {
        if (this.dom.tBodies.length) {
            this.dom.removeChild(this.dom.tBodies[0])
        }
        this.dom.appendChild(tbody)
    }
}
