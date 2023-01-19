import {DataTableConfiguration} from "./types"
import {layoutTemplate} from "./templates"
/**
 * Default configuration
 */
export const defaultConfig: DataTableConfiguration = {
    sortable: true,
    searchable: true,
    destroyable: true,
    // Whether to attempt to convert input data (not from dom). If false, we
    // assume input data is in simple-datatables native format.
    dataConvert: true,
    data: {},
    columns: [],

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
    tableRender: false,

    // Customise the display text
    labels: {
        placeholder: "Search...", // The search input placeholder
        perPage: "entries per page", // per-page dropdown label
        noRows: "No entries found", // Message shown when there are no records to show
        noResults: "No results match your search query", // Message shown when there are no search results
        info: "Showing {start} to {end} of {rows} entries" //
    },

    // Customise the layout
    template: layoutTemplate,

    classes: { // Note: use single class names
        active: "active", // TODO in 7.0.0: datatable-active
        bottom: "datatable-bottom",
        container: "datatable-container",
        cursor: "datatable-cursor",
        disabled: "disabled", // TODO in 7.0.0: datatable-disabled
        dropdown: "datatable-dropdown",
        ellipsis: "ellipsis", // TODO in 7.0.0: datatable-ellipsis
        empty: "datatable-empty",
        headercontainer: "datatable-headercontainer",
        info: "datatable-info",
        input: "datatable-input",
        loading: "datatable-loading",
        pagination: "datatable-pagination",
        paginationList: "datatable-pagination-list",
        paginationListItem: "datatable-pagination-list-item",
        paginationListItemLink: "datatable-pagination-list-item-link",
        search: "datatable-search",
        selector: "datatable-selector",
        sorter: "datatable-sorter",
        table: "datatable-table",
        top: "datatable-top",
        wrapper: "datatable-wrapper"
    }
}
