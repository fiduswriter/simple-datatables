/**
 * Check is item is object
 * @return {Boolean}
 */
export const isObject = val => Object.prototype.toString.call(val) === "[object Object]"

/**
 * Check for valid JSON string
 * @param  {String}   str
 * @return {Boolean|Array|Object}
 */
export const isJson = str => {
    let t = !1
    try {
        t = JSON.parse(str)
    } catch (e) {
        return !1
    }
    return !(null === t || (!Array.isArray(t) && !isObject(t))) && t
}

/**
 * Create DOM element node
 * @param  {String}   nodeName nodeName
 * @param  {Object}   attrs properties and attributes
 * @return {Object}
 */
export const createElement = (nodeName, attrs) => {
    const dom = document.createElement(nodeName)
    if (attrs && "object" == typeof attrs) {
        for (const attr in attrs) {
            if ("html" === attr) {
                dom.innerHTML = attrs[attr]
            } else {
                dom.setAttribute(attr, attrs[attr])
            }
        }
    }
    return dom
}

export const flush = el => {
    if (el instanceof NodeList) {
        el.forEach(e => flush(e))
    } else {
        el.innerHTML = ""
    }
}

/**
 * Create button helper
 * @param  {String}   class
 * @param  {Number}   page
 * @param  {String}   text
 * @return {Object}
 */
export const button = (className, page, text) => createElement(
    "li",
    {
        class: className,
        html: `<a href="#" data-page="${page}">${text}</a>`
    }
)

/**
 * Bubble sort algorithm
 */
export const sortItems = (a, b) => {
    let c
    let d
    if (1 === b) {
        c = 0
        d = a.length
    } else {
        if (b === -1) {
            c = a.length - 1
            d = -1
        }
    }
    for (let e = !0; e;) {
        e = !1
        for (let f = c; f != d; f += b) {
            if (a[f + b] && a[f].value > a[f + b].value) {
                const g = a[f]
                const h = a[f + b]
                const i = g
                a[f] = h
                a[f + b] = i
                e = !0
            }
        }
    }
    return a
}

/**
 * Pager truncation algorithm
 */
export const truncate = (a, b, c, d, ellipsis) => {
    d = d || 2
    let j
    const e = 2 * d
    let f = b - d
    let g = b + d
    const h = []
    const i = []
    if (b < 4 - d + e) {
        g = 3 + e
    } else if (b > c - (3 - d + e)) {
        f = c - (2 + e)
    }
    for (let k = 1; k <= c; k++) {
        if (1 == k || k == c || (k >= f && k <= g)) {
            const l = a[k - 1]
            l.classList.remove("active")
            h.push(l)
        }
    }
    h.forEach(c => {
        const d = c.children[0].getAttribute("data-page")
        if (j) {
            const e = j.children[0].getAttribute("data-page")
            if (d - e == 2) i.push(a[e])
            else if (d - e != 1) {
                const f = createElement("li", {
                    class: "ellipsis",
                    html: `<a href="#">${ellipsis}</a>`
                })
                i.push(f)
            }
        }
        i.push(c)
        j = c
    })

    return i
}
