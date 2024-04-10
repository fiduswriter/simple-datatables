// Template for custom layouts
export const layoutTemplate = (options, dom) => `<div class='${options.classes.top}'>
    ${
    options.paging && options.perPageSelect ?
        `<div class='${options.classes.dropdown}'>
            <label>
                <select class='${options.classes.selector}' name="per-page"></select> ${options.labels.perPage}
            </label>
        </div>` :
        ""
}
    ${
    options.searchable ?
        `<div class='${options.classes.search}'>
            <input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='search' name="search" title='${options.labels.searchTitle}'${dom.id ? ` aria-controls="${dom.id}"` : ""}>
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
