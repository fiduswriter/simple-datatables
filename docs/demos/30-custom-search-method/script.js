import {DataTable} from "../dist/module.js"
const datatable = new DataTable("#demo-table", {
    perPageSelect: [5, 10, 15, ["All", -1]],
    columns: [
        {
            select: 1,
            sortable: false,
            searchMethod: (terms, cell, row, _column, source) => {
                let found
                if (source === "class-filter") {
                    found = terms.find(
                        // For each of the terms, check if at least one of the class tags in the cell exactly matches the term
                        term => cell.data.find(span => span.attributes?.class === `class ${term}`)
                    )
                } else {
                    // This is normal search. We just check if one of the terms is part of the text of the cell
                    found = terms.find(
                        term => cell.text.toLowerCase().includes(term.toLowerCase().trim())
                    )
                }
                if (found) return true
                return false
            }
        },
        {
            select: 4,
            searchMethod: (terms, cell, row, _column, source) => {
                if (source === "completion-filter") {
                    const cellPercentage = parseInt(cell.data, 10)
                    const minPercentage = parseInt(terms[0], 10)
                    if (cellPercentage >= minPercentage) return true
                    return false
                }
                // This is normal search. We just check if one of the terms is part of the text of the cell
                const found = terms.find(
                    term => cell.data.includes(term.toLowerCase().trim())
                )

                if (found) return true
                return false
            }
        }
    ]
})


// Multi-select dropdown
let isDropdownOpen = false

const toggleDropdown = () => {
    const checkboxes = document.getElementById("checkboxes")
    if (isDropdownOpen) {
        checkboxes.style.display = "none"
        isDropdownOpen = false
    } else {
        checkboxes.style.display = "block"
        isDropdownOpen = true
    }
}

document.querySelector(".select-box").addEventListener("click", toggleDropdown)
// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches(".select-box") && !event.target.matches(".over-select") && !event.target.closest("#checkboxes")) {
        const checkboxes = document.getElementById("checkboxes")
        checkboxes.style.display = "none"
        isDropdownOpen = false
    }
    if (event.target.closest("#checkboxes label")) {
        // Change in checked classes, restart search
        // Get all checked checkboxes
        const checked = Array.from(document.querySelectorAll("#checkboxes input:checked")).map(checkbox => checkbox.value)
        if (!checked.length) {
            // Don't allow deselecting the last checkbox.
            event.target.closest("#checkboxes label").querySelector("input").checked = true
            return
        }
        datatable.multiSearch([
            {terms: checked,
                columns: [1]}
        ], "class-filter")
    }

}

const updateSliderValue = value => {
    document.getElementById("slider-value").innerHTML = `${value}%`
    datatable.multiSearch([
        {terms: [value],
            columns: [4]}
    ], "completion-filter")
}

document.querySelector("#percentage-slider").addEventListener("input", function() {
    updateSliderValue(this.value)
})


window.dt = datatable
