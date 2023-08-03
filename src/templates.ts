// Template for custom layouts
export const layoutTemplate = (options, dom) => `<div class='${options.classes.top}'>
    ${
    options.paging && options.perPageSelect ?
        `<div class='${options.classes.dropdown}'>
            <label>
                <select class='${options.classes.selector}'></select> ${options.labels.perPage}
            </label>
        </div>` :
        ""
}
    ${
    options.searchable ?
        `<div class='${options.classes.search}'>
            <input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='search' title='${options.labels.searchTitle}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
        </div>` :
        ""
}
${
    options.columnFilterButton ?
        `<div class="${options.classes.filterButton}">
            <button type="button" onclick="this?.parentElement.querySelector('.datatable-filter-button-dropdown').classList.toggle('show');" title="${options.labels.filterButton}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16">
                    <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
                </svg>
            </button>
            <ul class="datatable-filter-button-dropdown">
                <li><h4>Hide/Show Columns</h4></li>
                <li><hr></li>

                <div class="datatable-filter-columns">

                </div>
        
                <li><hr></li>
                <li><button role="button" class="datatable-filter-columns-reset">Reset Columns</button></li>
            </ul>
        </div>` :
        ""
}
</div>
<div class='${options.classes.container}'${options.scrollY.length ? ` style='height: ${options.scrollY}; overflow-Y: auto;'` : ""}></div>
<div class='${options.classes.bottom}'>
    ${
    options.paging ?
        `<div class='${options.classes.info}'></div>` :
        ""
}
    <nav class='${options.classes.pagination}'></nav>
</div>`
