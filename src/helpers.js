/**
 * Check is item is object
 * @return {Boolean}
 */
export const isObject = val => Object.prototype.toString.call(val) === "[object Object]"

/**
 * Check is item is array
 * @return {Boolean}
 */
export const isArray = val => Array.isArray(val)

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
    return !(null === t || (!isArray(t) && !isObject(t))) && t
}

/**
 * Merge objects (reccursive)
 * @param  {Object} r
 * @param  {Object} t
 * @return {Object}
 */
export const extend = (src, props) => {
    for (const prop in props) {
        if (props.hasOwnProperty(prop)) {
            const val = props[prop]
            if (val && isObject(val)) {
                src[prop] = src[prop] || {}
                extend(src[prop], val)
            } else {
                src[prop] = val
            }
        }
    }
    return src
}

/**
 * Iterator helper
 * @param  {(Array|Object)}   arr     Any object, array or array-like collection.
 * @param  {Function}         fn      Callback
 * @param  {Object}           scope   Change the value of this
 * @return {Void}
 */
export const each = (arr, fn, scope) => {
    let n
    if (isObject(arr)) {
        for (n in arr) {
            if (Object.prototype.hasOwnProperty.call(arr, n)) {
                fn.call(scope, arr[n], n)
            }
        }
    } else {
        for (n = 0; n < arr.length; n++) {
            fn.call(scope, arr[n], n)
        }
    }
}

/**
 * Add event listener to target
 * @param  {Object} el
 * @param  {String} e
 * @param  {Function} fn
 */
export const on = (el, e, fn) => {
    el.addEventListener(e, fn, false)
}

/**
 * Create DOM element node
 * @param  {String}   a nodeName
 * @param  {Object}   b properties and attributes
 * @return {Object}
 */
export const createElement = (a, b) => {
    const d = document.createElement(a)
    if (b && "object" == typeof b) {
        let e
        for (e in b) {
            if ("html" === e) {
                d.innerHTML = b[e]
            } else {
                d.setAttribute(e, b[e])
            }
        }
    }
    return d
}

export const flush = (el, ie) => {
    if (el instanceof NodeList) {
        each(el, e => {
            flush(e, ie)
        })
    } else {
        if (ie) {
            while (el.hasChildNodes()) {
                el.removeChild(el.firstChild)
            }
        } else {
            el.innerHTML = ""
        }
    }
}

/**
 * Create button helper
 * @param  {String}   c
 * @param  {Number}   p
 * @param  {String}   t
 * @return {Object}
 */
export const button = (c, p, t) => createElement("li", {
    class: c,
    html: `<a href="#" data-page="${p}">${t}</a>`
})

/**
 * classList shim
 * @type {Object}
 */
export const classList = {
    add(s, a) {
        if (s.classList) {
            s.classList.add(a)
        } else {
            if (!classList.contains(s, a)) {
                s.className = `${s.className.trim()} ${a}`
            }
        }
    },
    remove(s, a) {
        if (s.classList) {
            s.classList.remove(a)
        } else {
            if (classList.contains(s, a)) {
                s.className = s.className.replace(
                    new RegExp(`(^|\\s)${a.split(" ").join("|")}(\\s|$)`, "gi"),
                    " "
                )
            }
        }
    },
    contains(s, a) {
        if (s)
            return s.classList ?
                s.classList.contains(a) :
                !!s.className &&
                !!s.className.match(new RegExp(`(\\s|^)${a}(\\s|$)`))
    }
}


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
            classList.remove(l, "active")
            h.push(l)
        }
    }
    each(h, c => {
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
