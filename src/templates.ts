// Template for custom layouts
export const layoutTemplate = options => `<div class='${options.classes.top}'>
    ${options.layout.top}
</div>
<div class='${options.classes.container}'${options.scrollY.length ? ` style='height: ${options.scrollY}; overflow-Y: auto;'` : ""}>
</div>
<div class='${options.classes.bottom}'>
    ${options.layout.bottom}
</div>`

// template to wrap around dropdown.
export const wrapDropdownTemplate = options => `<div class='${options.classes.dropdown}'>
    <label>
        ${options.labels.perPage}
    </label>
</div>`

export const searchFormTemplate = options => `<div class='${options.classes.search}'><input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='text'></div>`
