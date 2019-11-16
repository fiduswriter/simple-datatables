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
        data.headings.forEach(col => {
            const td = createElement("th", {
                html: col
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
            rows.forEach(value => {
                const td = createElement("td", {
                    html: value
                })
                tr.appendChild(td)
            })
            tbody.appendChild(tr)
        })
    }

    if (thead) {
        if (this.table.tHead !== null) {
            this.table.removeChild(this.table.tHead)
        }
        this.table.appendChild(thead)
    }

    if (tbody) {
        if (this.table.tBodies.length) {
            this.table.removeChild(this.table.tBodies[0])
        }
        this.table.appendChild(tbody)
    }
}
