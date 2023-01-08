export const readTableData = (dataOption, dom=false) => {
    const data = {
        data: [],
        headings: []
    }
    if (dataOption?.data) {
        data.data = dataOption.data.map(row => row.map(cell => ({data: cell,
            text: cell})))
    } else if (dom?.tBodies.length) {
        data.data = Array.from(dom.tBodies[0].rows).map(row => Array.from(row.cells).map(cell => ({data: cell.dataset.content || cell.innerHTML,
            text: cell.innerHTML})))
    }
    if (dataOption?.headings) {
        data.headings = dataOption.headings.map(heading => ({data: heading,
            sorted: false}))
    } else if (dom?.tHead) {
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(th => {
            const heading = {data: th.innerHTML,
                sorted: false}
            heading.sortable = th.dataset.sortable !== "false"
            return heading
        })
    } else if (dataOption?.data?.data?.length) {
        data.headings = dataOption.data.data[0].map(_cell => "")
    } else if (dom?.tBodies.length) {
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(_cell => "")
    }

    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error(
            "Data heading length mismatch."
        )
    }

    return data
}
