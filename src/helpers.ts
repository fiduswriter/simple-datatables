/**
 * Check is item is object
 */
export const isObject = (val: any) => Object.prototype.toString.call(val) === "[object Object]"

/**
 * Check for valid JSON string
 */
export const isJson = (str: string) => {
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
 */
export const createElement = (nodeName: string, attrs?: any) => {
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

export const flush = (el: HTMLElement | HTMLElement[]) => {
    if (Array.isArray(el)) {
        el.forEach(e => flush(e))
    } else {
        el.innerHTML = ""
    }
}

/**
 * Create button helper
 */
export const button = (className: string, page: any, text: string) => createElement(
    "li",
    {
        class: className,
        html: `<a href="#" data-page="${page}">${text}</a>`
    }
)

/**
 * Pager truncation algorithm
 */
export const truncate = (a: any, b: any, c: any, d: any, ellipsis: string) => {
    d = d || 2
    let j: any
    const e = 2 * d
    let f = b - d
    let g = b + d
    const h = []
    const i: any = []
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


export const objToText = (obj: any) => {
    if (obj.nodeName==="#text") {
        return obj.data
    }
    if (obj.childNodes) {
        return obj.childNodes.map((childNode: any) => objToText(childNode)).join("")
    }
    return ""
}


export const escapeText = function(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}
