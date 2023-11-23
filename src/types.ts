// Same definitions as in diff-dom

interface elementNodeType {
    nodeName: string
    attributes?: { [key: string]: string }
    childNodes?: nodeType[] // eslint-disable-line no-use-before-define
    checked?: boolean
    value?: string | number
    selected?: boolean
}

interface textNodeType {
    nodeName: "#text" | "#comment"
    data: string
    childNodes?: never
}

type nodeType = elementNodeType | textNodeType


// Definitions for table cells and other table relevant data

type cellDataType = string | number | boolean | nodeType | object;

interface cellType {
    data: cellDataType;
    text?: string;
    order?: string | number;
    attributes?: { [key: string]: string };
}

type inputCellType = cellType | string | number | boolean;

interface inputRowType {
    attributes?: { [key: string]: string };
    cells: inputCellType[];
}

interface headerCellType {
    data: cellDataType;
    type?: ("html" | "string");
    text?: string;
    attributes?: { [key: string]: string };
}

type inputHeaderCellType = headerCellType | string | number | boolean;

interface dataRowType {
    attributes?: { [key: string]: string };
    cells: cellType[];
}

interface DataOption {
    headings?: string[];
    data?: (inputRowType | inputCellType[])[];
}

interface TableDataType {
    headings: headerCellType[];
    data: dataRowType[];
}

type renderType = ((cellData: (string | number | boolean | object | elementNodeType[]), td: object, rowIndex: number, cellIndex: number) => elementNodeType | string | void);

interface rowType {
    row: dataRowType;
    index: number;
}

export type DeepPartial<T> = T extends Function ? T : (T extends object ? { [P in keyof T]?: DeepPartial<T[P]>; } : T); // eslint-disable-line @typescript-eslint/ban-types
// Source https://gist.github.com/navix/6c25c15e0a2d3cd0e5bce999e0086fc9

interface ColumnOption{
    /**An integer or array of integers representing the column(s) to be manipulated. */
    select : number | number[];

    /**Automatically sort the selected column. Can only be applied if a single column is selected. */
    sort? : "asc" | "desc";

    /**When set to false the column(s) cannot be sorted. */
    sortable? : boolean;

    /** An array of "asc" and "desc" describing the order sort will be executed as the user clicks on the column header. Note that each can only be mentioned up to one time. */
    sortSequence?: ("asc" | "desc")[],

    /** Default: true (boolean). Influences how string sorting is done. If true multiple numbers will be seen as just one so that "file 1.jpg" will come before "file 100.jpg". */
    numeric?: boolean,

    /**
     * Default: "false" Options: ["false", "upper", "lower"]. Influences how string sorting is done and whether upper or lower case letters are sorted first.
     * If "false" is selected, will use the chosen locale’s default sorting order.
     */
    caseFirst?: "false" | "upper" | "lower",

    /**When set to true the column(s) will not be visible and will be excluded from search results. */
    hidden?:boolean;

    /**
     * A string representing the type of data in the column(s) cells. Choose from the following options:

    string - lexical ordering (default)
    number - any string with currency symbols, . or , thousand separators, %, etc
    date - a valid datetime string
     */
    type?:string;

    /**A string representing the datetime format when using the date type. */
    format?:string;

    /**
     * A callback to customise the rendering of the column(s) cell content. The function takes 3 parameters and should return the formatted cell content.
     *
     */
    render?:renderType;

    /**
     * A filter to be used instead of sorting for the selected column(s).
     */
    filter?: (string | number | boolean | ((arg: (string | number | boolean)) => boolean))[];

    /** CSS classes to apply to the header cell. */
    headerClass?: string;

    /** CSS classes to apply to the body cell. */
    cellClass?: string;

    /**
     * Default: "base". Options: ["base", "accent", "case", "variant"].
     * Influences how searching is done. "base" and "accent" will ignore case differences. "base" and "case" will ignore differences in accent symbols
     * */
    sensitivity?: string,

    /** Default: true (boolean). Influences how sorting and searching is done. */
    ignorePunctuation?: boolean;

    /** Default: " ". Influences searching. When performing search, the cell content is split up using this separator.*/
    searchItemSeparator?: string;

    /**
     * Default: "en-US" (string). Set a locale such as en-UK or de for the column.
     * Influences how string sorting is done. Allows even for specification of specific subvariants such as de-DE-u-co-phonebk.
     */
    locale?: string,
}

interface LabelsConfiguration {
    placeholder: string;
    /**
     * default: 'Search...'
     * Sets the placeholder of the search input.
     */
    searchTitle: string;
    /**
     * default: 'Search within table'
     * Sets the title of the search input.
     */
    perPage: string;
    /**
     * default: 'entries per page'
     * Sets the per-page dropdown's label
     */
    pageTitle: string;
    /**
     * default: 'Page {page}'
     * Displays current range as used in aria-labeel
     *
     * {page} - The current page number
     */
    noRows: string;
    /**
     * default: 'No entries found'
     * The message displayed when there are no search results
     */
    noResults: string;
    /**
     * default: 'No results match your search query'
     * The message displayed when there are no search results
     */
    info: string;
    /**
     * default: 'Showing {start} to {end} of {rows} entries'
     * Displays current range, page number, etc
     *
     * {start} - The first row number of the current page
     * {end} - The last row number of the current page
     * {page} - The current page number
     * {pages} - Total pages
     * {rows} - Total rows
     */
}

interface ClassConfiguration {
    active: string;
    ascending: string;
    bottom: string;
    container: string;
    cursor: string;
    descending: string;
    disabled: string;
    dropdown: string;
    ellipsis: string;
    empty: string;
    filter: string;
    filterActive: string;
    headercontainer: string;
    hidden: string;
    info: string;
    input: string;
    loading: string;
    pagination: string;
    paginationList: string;
    paginationListItem: string;
    paginationListItemLink: string;
    search: string;
    selector: string;
    sorter: string;
    table: string;
    top: string;
    wrapper: string;
}

type pagerRenderType = ((data: [onFirstPage: boolean, onLastPage: boolean, currentPage: number, totalPages: number], pager: elementNodeType) => elementNodeType | void);

type rowRenderType = ((row: dataRowType, tr: elementNodeType, index: number) => elementNodeType | void);

type renderTypeEnum = "main" | "print" | "header" | "message"

type tableRenderType = ((data: object, table: elementNodeType, type: renderTypeEnum) => elementNodeType | void);


interface DataTableConfiguration {
    /**
     * Display a table caption with [<caption>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption).
     * No caption is displayed by default.
     *
     * Docs: https://fiduswriter.github.io/simple-datatables/documentation/caption
     */
    caption: string | undefined;
    classes: ClassConfiguration;
    columns: ColumnOption[];
    /**Controls various aspects of individual or groups of columns. Should be an array of objects with the following properties:
     *
     * Docs :https://fiduswriter.github.io/simple-datatables/documentation/columns
     */
    data: DataOption;
    /**
     * Pass an object of data to populate the table.
     *
     * You can set both the headings and rows with headings and data properties, respectively. The headings property is optional.
     *
     * Docs : https://fiduswriter.github.io/simple-datatable/documentation/data
     */
    type: ("date" | "html" | "number" | "boolean" | "string" | "other");
    /**
     * Default data type.
     * 'html' by default.
     */
    format: string;
    /**
     * Default date format.
     * 'YYYY-MM-DD' by default.
     */
    destroyable: boolean;
    /**
     * Default: true
     * Whether enough information should be retained to be able to recreate the initial dom state before the table was initiated.
     */
    ellipsisText: string;
    /**
     * Default: '…'
     * Text to be used for ellipsis.
     */
    firstLast: boolean;
    /**Toggle the skip to first page and skip to last page buttons.
     * Default: false
     */
    firstText: string;
    /**
     * default: '«'
     * Set the content of the skip to first page button.
     *
     */
    fixedColumns: boolean;
    /**
     * Default: true
     * Fix the width of the columns. This stops the columns changing width when loading a new page.
     */
    fixedHeight: boolean;
    /**
     * Default: false
     * Fix the height of the table. This is useful if your last page contains less rows than set in the perPage options and simply stops the table from changing size and affecting the layout of the page.
     */
    footer: boolean;
    /**
     * Default: false
     * Enable or disable the table footer.
     */
    header: boolean;
    /**
     * Default: true
     * Enable or disable the table header.
     */
    hiddenHeader: boolean;
    /**
     * Default: false
     * Whether to hide the table header.
     */
    labels: LabelsConfiguration;
    /**
     * Customise the displayed labels.
     *
     * Defaults :
     *
     * labels: {
     *
            placeholder: "Search...",
            searchTitle: "Search within table",
            perPage: "entries per page",
            noRows: "No entries to found",
            info: "Showing {start} to {end} of {rows} entries",
        }
     *
     * Docs: https://fiduswriter.github.io/simple-datatables/documentation/labels
     */
    template: (DataTableConfiguration, HTMLTableElement) => string;
    /**
     * Allows for custom arranging of the DOM elements in the top and bottom containers. There are for 4 variables you can utilize:
     *
     * Docs: https://fiduswriter.github.io/simple-datatables/documentation/layout
     */
    lastText: string;
    /**
     * default: '»'
     * Set the content of the skip to last page button.
     */
    nextPrev: boolean;
    /**
     * Default : true
     * Toggle the next and previous pagination buttons.
     */
    nextText: string;
    /**
     * default: '›'
     * Set the content on the next button.
     */
    pagerDelta: number;
    /**
     * Default: 2
     * Delta to use with pager
     */
    pagerRender: false | pagerRenderType;
     /**
     * Default: false
     * Method to call to modify pager rendering output.
     */
    paging: boolean;
    /**
     * Default : true
     * Whether or not paging is enabled for the table
     */
    perPage: number;
    /**
     * Default : 10
     * Sets the maximum number of rows to display on each page.
     */
    perPageSelect: (number | [string, number])[];
    /**
     * Default: [5, 10, 15, 20, 25]
     *
     * Sets the per page options in the dropdown. Must be an array of integers.
     *
     *   Setting this to false will hide the dropdown.
     */
    prevText: string;
    /**
     * default: '‹'
     * Set the content on the previous button.
     */
    rowNavigation: boolean;
    /**
     * Default: true
     * Whether to allow row based navigation
     */
    rowRender: false | rowRenderType;
    /**
     * Default: false
     * Method to call to modify row rendering output.
     */
    scrollY: string;
    /**
     * Default : ""
     *
     * Enable vertical scrolling. Vertical scrolling will constrain the DataTable to the given height, and enable scrolling for any data which overflows the current viewport. This can be used as an alternative to paging to display a lot of data in a small area.
     *
     * The value given here can be given in any CSS unit.
     */
    // for searching
    searchable: boolean;
    sensitivity: string,
    ignorePunctuation: boolean;
    searchItemSeparator: string;
    searchQuerySeparator: string;
    searchAnd: boolean;
    // for sorting
    /**
     * Default: true
     * Toggle the ability to sort the columns.
     *
     * This option will be forced to false if the table has no headings.
     */
    sortable: boolean;
    locale: string;
    numeric: boolean;
    caseFirst: "false" | "upper" | "lower";

    tabIndex: false | number;
    /**
     * Default: false
     * A tab index number to be assigned to the table.
     */
    tableRender: false | tableRenderType;
    /**
     * Default: false
     * Method to call to modify table rendering output.
     */
    diffDomOptions: object;
    /**
     * Default: { valueDiffing: false }
     * Options to parse on to diffDOM.
     */
    truncatePager: boolean;
    /**
     * Default: true
     * Truncate the page links to prevent overflow with large datasets.
     */
}

interface DataTableOptions extends DeepPartial<DataTableConfiguration> {
    columns?: ColumnOption[];
    data?: DataOption;
    perPageSelect?: (number | [string, number])[];
    rowRender?: false | rowRenderType;
    tableRender?: false | tableRenderType;
}


interface columnSettingsType {
    render?: renderType,
    type: ("date" | "html" | "number" | "boolean" | "string" | "other"),
    format?: string,
    // for sorting
    sortable?: boolean,
    locale?: string,
    numeric?: boolean,
    caseFirst?: "false" | "upper" | "lower",
    // for searching
    searchable?: boolean,
    sensitivity?: string,
    ignorePunctuation?: boolean,
    searchItemSeparator?: string;
    //
    headerClass?: string,
    cellClass?: string,
    hidden?: boolean,
    filter?: (string | number | boolean | ((arg: (string | number | boolean)) => boolean))[],
    sort?: "asc" | "desc",
    sortSequence?: ("asc" | "desc")[],
}

interface renderOptions {
    noPaging?: true;
    noColumnWidths?: true;
    unhideHeader?: true;
    renderHeader?: true
}

type filterStateType = (string | number | boolean | elementNodeType[] | object | ((arg: (string | number | boolean | elementNodeType[] | object)) => boolean));

interface columnsStateType {
    sort: (false | {column: number, dir: "asc" | "desc"}),
    filters: (filterStateType | undefined)[]
    widths: number[]
}


export {
    cellDataType,
    cellType,
    columnsStateType,
    DataOption,
    DataTableConfiguration,
    DataTableOptions,
    dataRowType,
    filterStateType,
    headerCellType,
    inputCellType,
    inputHeaderCellType,
    inputRowType,
    elementNodeType,
    nodeType,
    renderOptions,
    renderType,
    rowRenderType,
    rowType,
    columnSettingsType,
    TableDataType,
    textNodeType
}
