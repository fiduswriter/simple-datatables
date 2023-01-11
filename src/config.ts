import {DataTableOptions} from "./interfaces"

/**
 * Default configuration
 */
export const defaultConfig: DataTableOptions = {
    sortable: true,
    searchable: true,
    destroyable: true,
    data: {},

    // Pagination
    paging: true,
    perPage: 10,
    perPageSelect: [5, 10, 15, 20, 25],
    nextPrev: true,
    firstLast: false,
    prevText: "&lsaquo;",
    nextText: "&rsaquo;",
    firstText: "&laquo;",
    lastText: "&raquo;",
    ellipsisText: "&hellip;",
    ascText: "▴",
    descText: "▾",
    truncatePager: true,
    pagerDelta: 2,

    scrollY: "",

    fixedColumns: true,
    fixedHeight: false,

    header: true,
    hiddenHeader: false,
    footer: false,

    tabIndex: false,
    rowNavigation: false,
    rowRender: false,

    // Customise the display text
    labels: {
        placeholder: "Search...", // The search input placeholder
        perPage: "{select} entries per page", // per-page dropdown label
        noRows: "No entries found", // Message shown when there are no records to show
        noResults: "No results match your search query", // Message shown when there are no search results
        info: "Showing {start} to {end} of {rows} entries" //
    },

    // Customise the layout
    layout: {
        top: "{select}{search}",
        bottom: "{info}{pager}"
    },

    classes: {
        bottom: "datatable-bottom",
        container: "datatable-container",
        cursor: "datatable-cursor",
        dropdown: "datatable-dropdown",
        empty: "datatable-empty",
        headercontainer: "datatable-headercontainer",
        info: "datatable-info",
        input: "datatable-input",
        loading: "datatable-loading",
        pagination: "datatable-pagination",
        paginationList: "datatable-pagination-list",
        search: "datatable-search",
        selector: "datatable-selector",
        sorter: "datatable-sorter",
        table: "datatable-table",
        top: "datatable-top",
        wrapper: "datatable-wrapper"
    }
}
