// Source: https://www.freecodecamp.org/news/javascript-debounce-example/

export const debounce = function(this: any, func: any, timeout = 300) {
    let timer: any
    return (...args: any[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.apply(this, args)
        }, timeout)
    }
}
