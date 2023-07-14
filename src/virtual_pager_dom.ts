import {DataTableConfiguration, elementNodeType} from "./types"

/**
 * Pager truncation algorithm
 */
const truncate = (paginationListItems: elementNodeType[], currentPage: number, pagesLength: number, options: DataTableConfiguration) : elementNodeType[] => {
    const pagerDelta = options.pagerDelta
    const classes = options.classes
    const ellipsisText = options.ellipsisText

    const doublePagerDelta = 2 * pagerDelta
    let previousPage = currentPage - pagerDelta
    let nextPage = currentPage + pagerDelta

    if (currentPage < 4 - pagerDelta + doublePagerDelta) {
        nextPage = 3 + doublePagerDelta
    } else if (currentPage > pagesLength - (3 - pagerDelta + doublePagerDelta)) {
        previousPage = pagesLength - (2 + doublePagerDelta)
    }
    const paginationListItemsToModify: elementNodeType[] = []
    for (let k = 1; k <= pagesLength; k++) {
        if (1 == k || k == pagesLength || (k >= previousPage && k <= nextPage)) {
            const li = paginationListItems[k - 1]
            paginationListItemsToModify.push(li)
        }
    }
    let previousLi: elementNodeType
    const modifiedLis: elementNodeType[] = []
    paginationListItemsToModify.forEach(li => {
        const pageNumber = parseInt((li.childNodes[0] as elementNodeType).attributes["data-page"], 10)
        if (previousLi) {
            const previousPageNumber = parseInt((previousLi.childNodes[0] as elementNodeType).attributes["data-page"], 10)
            if (pageNumber - previousPageNumber == 2) {
                modifiedLis.push(paginationListItems[previousPageNumber])
            } else if (pageNumber - previousPageNumber != 1) {
                const newLi: elementNodeType = {
                    nodeName: "LI",
                    attributes: {
                        class: `${classes.paginationListItem} ${classes.ellipsis} ${classes.disabled}`
                    },
                    childNodes: [
                        {
                            nodeName: "BUTTON",
                            attributes: {
                                class: classes.paginationListItemLink
                            },
                            childNodes: [
                                {
                                    nodeName: "#text",
                                    data: ellipsisText
                                }
                            ]
                        }
                    ]
                }
                modifiedLis.push(newLi)
            }
        }
        modifiedLis.push(li)
        previousLi = li
    })

    return modifiedLis
}


const paginationListItem = (page: number, label: string, options: DataTableConfiguration, state: {active?: boolean, hidden?: boolean} = {}) : elementNodeType => ({
    nodeName: "LI",
    attributes: {
        class:
        (state.active && !state.hidden) ?
            `${options.classes.paginationListItem} ${options.classes.active}` :
            state.hidden ?
                `${options.classes.paginationListItem} ${options.classes.hidden} ${options.classes.disabled}` :
                options.classes.paginationListItem
    },
    childNodes: [
        {
            nodeName: "BUTTON",
            attributes: {
                "data-page": String(page),
                class: options.classes.paginationListItemLink,
                "aria-label": options.labels.pageTitle.replace("{page}", String(page))
            },
            childNodes: [
                {
                    nodeName: "#text",
                    data: label
                }
            ]
        }
    ]
})

export const createVirtualPagerDOM = (onFirstPage: boolean, onLastPage: boolean, currentPage: number, totalPages: number, options) => {

    let pagerListItems : elementNodeType[] = []

    // first button
    if (options.firstLast) {
        pagerListItems.push(paginationListItem(1, options.firstText, options))
    }

    // prev button
    if (options.nextPrev) {
        const prev = onFirstPage ? 1 : currentPage - 1
        pagerListItems.push(paginationListItem(prev, options.prevText, options, {hidden: onFirstPage}))
    }

    let pages = [...Array(totalPages).keys()].map(index => paginationListItem(index+1, String(index+1), options, {active: (index === (currentPage-1))}))

    if (options.truncatePager) {
        // truncate the paginationListItems
        pages = truncate(
            pages,
            currentPage,
            totalPages,
            options
        )

    }

    // append the paginationListItems
    pagerListItems = pagerListItems.concat(pages)

    // next button
    if (options.nextPrev) {
        const next = onLastPage ? totalPages : currentPage + 1
        pagerListItems.push(paginationListItem(next, options.nextText, options, {hidden: onLastPage}))
    }

    // last button
    if (options.firstLast) {
        pagerListItems.push(paginationListItem(totalPages, options.lastText, options))
    }

    const pager : elementNodeType = {
        nodeName: "UL",
        attributes: {
            class: options.classes.paginationList
        },
        childNodes: pages.length > 1 ? pagerListItems : [] // Don't show single page
    }

    return pager

}
