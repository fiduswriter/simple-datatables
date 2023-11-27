import {DataTableConfiguration} from "./types"
import {layoutTemplate} from "./templates"
/**
 * Default configuration
 */
export const defaultConfig: DataTableConfiguration = {
    // for sorting
    sortable: true,
    locale: "en",
    numeric: true,
    caseFirst: "false",

    // for searching
    searchable: true,
    sensitivity: "base",
    ignorePunctuation: true,
    destroyable: true,
    searchItemSeparator: "", // If specified, splits the content of cells up using this separator before performing search.
    searchQuerySeparator: " ",
    searchAnd: false,

    // data
    data: {},
    type: "html", // Default data type for columns.
    format: "YYYY-MM-DD",
    columns: [],

    // Pagination
    paging: true,
    perPage: 10,
    perPageSelect: [5, 10, 15, 20, 25],
    nextPrev: true,
    firstLast: false,
    prevText: "‹",
    nextText: "›",
    firstText: "«",
    lastText: "»",
    ellipsisText: "…",
    truncatePager: true,
    pagerDelta: 2,

    scrollY: "",

    fixedColumns: true,
    fixedHeight: false,

    footer: false,
    header: true,
    hiddenHeader: false,
    caption: undefined,

    rowNavigation: false,
    tabIndex: false,

    // for overriding rendering
    pagerRender: false,
    rowRender: false,
    tableRender: false,
    diffDomOptions: {
        valueDiffing: false
    },

    // Customise the display text
    labels: {
        placeholder: "Search...", // The search input placeholder
        searchTitle: "Search within table", // The search input title
        perPage: "entries per page", // per-page dropdown label
        pageTitle: "Page {page}", // page label used in Aria-label
        noRows: "No entries found", // Message shown when there are no records to show
        noResults: "No results match your search query", // Message shown when there are no search results
        info: "Showing {start} to {end} of {rows} entries" //
    },

    // Customise the layout
    template: layoutTemplate,

    // Customize the class names used by datatable for different parts
    classes: {
        active: "datatable-active",
        ascending: "datatable-ascending",
        bottom: "datatable-bottom",
        container: "datatable-container",
        cursor: "datatable-cursor",
        descending: "datatable-descending",
        disabled: "datatable-disabled",
        dropdown: "datatable-dropdown",
        ellipsis: "datatable-ellipsis",
        filter: "datatable-filter",
        filterActive: "datatable-filter-active",
        empty: "datatable-empty",
        headercontainer: "datatable-headercontainer",
        hidden: "datatable-hidden",
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
