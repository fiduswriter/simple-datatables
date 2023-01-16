// Source: https://www.freecodecamp.org/news/javascript-debounce-example/

export const debounce = function(func: () => void, timeout = 300) {
    let timer: number
    return (..._args: any[]) => {
        clearTimeout(timer)
        timer = window.setTimeout(() => func(), timeout)
    }
}
