/**
 * Check is item is object
 * @return {Boolean}
 */
const isObject = val => Object.prototype.toString.call(val) === "[object Object]";

/**
 * Check for valid JSON string
 * @param  {String}   str
 * @return {Boolean|Array|Object}
 */
const isJson = str => {
    let t = !1;
    try {
        t = JSON.parse(str);
    } catch (e) {
        return !1
    }
    return !(null === t || (!Array.isArray(t) && !isObject(t))) && t
};

/**
 * Create DOM element node
 * @param  {String}   nodeName nodeName
 * @param  {Object}   attrs properties and attributes
 * @return {Object}
 */
const createElement = (nodeName, attrs) => {
    const dom = document.createElement(nodeName);
    if (attrs && "object" == typeof attrs) {
        for (const attr in attrs) {
            if ("html" === attr) {
                dom.innerHTML = attrs[attr];
            } else {
                dom.setAttribute(attr, attrs[attr]);
            }
        }
    }
    return dom
};

const flush = el => {
    if (el instanceof NodeList) {
        el.forEach(e => flush(e));
    } else {
        el.innerHTML = "";
    }
};

/**
 * Create button helper
 * @param  {String}   class
 * @param  {Number}   page
 * @param  {String}   text
 * @return {Object}
 */
const button = (className, page, text) => createElement(
    "li",
    {
        class: className,
        html: `<a href="#" data-page="${page}">${text}</a>`
    }
);

/**
 * Bubble sort algorithm
 */
const sortItems = (a, b) => {
    let c;
    let d;
    if (1 === b) {
        c = 0;
        d = a.length;
    } else {
        if (b === -1) {
            c = a.length - 1;
            d = -1;
        }
    }
    for (let e = !0; e;) {
        e = !1;
        for (let f = c; f != d; f += b) {
            if (a[f + b] && a[f].value > a[f + b].value) {
                const g = a[f];
                const h = a[f + b];
                const i = g;
                a[f] = h;
                a[f + b] = i;
                e = !0;
            }
        }
    }
    return a
};

/**
 * Pager truncation algorithm
 */
const truncate = (a, b, c, d, ellipsis) => {
    d = d || 2;
    let j;
    const e = 2 * d;
    let f = b - d;
    let g = b + d;
    const h = [];
    const i = [];
    if (b < 4 - d + e) {
        g = 3 + e;
    } else if (b > c - (3 - d + e)) {
        f = c - (2 + e);
    }
    for (let k = 1; k <= c; k++) {
        if (1 == k || k == c || (k >= f && k <= g)) {
            const l = a[k - 1];
            l.classList.remove("active");
            h.push(l);
        }
    }
    h.forEach(c => {
        const d = c.children[0].getAttribute("data-page");
        if (j) {
            const e = j.children[0].getAttribute("data-page");
            if (d - e == 2) i.push(a[e]);
            else if (d - e != 1) {
                const f = createElement("li", {
                    class: "ellipsis",
                    html: `<a href="#">${ellipsis}</a>`
                });
                i.push(f);
            }
        }
        i.push(c);
        j = c;
    });

    return i
};

/**
 * Rows API
 * @param {Object} instance DataTable instance
 * @param {Array} rows
 */
class Rows {
    constructor(dt) {
        this.dt = dt;

        this.cursor = false;
    }

    /**
     * Build a new row
     * @param  {Array} row
     * @return {HTMLElement}
     */
    build(row) {
        const tr = createElement("tr");

        let headings = this.dt.headings;

        if (!headings.length) {
            headings = row.map(() => "");
        }

        headings.forEach((h, i) => {
            const td = createElement("td");

            // Fixes #29
            if (!row[i] || !row[i].length) {
                row[i] = "";
            }

            td.innerHTML = row[i];

            td.data = row[i];

            tr.appendChild(td);
        });

        return tr
    }

    setCursor(row=false) {
        if (this.cursor) {
            this.cursor.classList.remove("dataTable-cursor");
        }
        if (row) {
            row.classList.add("dataTable-cursor");
            this.cursor = row;
        }
    }

    render(row) {
        return row
    }

    /**
     * Add new row
     * @param {Array} select
     */
    add(data) {
        if (Array.isArray(data)) {
            const dt = this.dt;
            // Check for multiple rows
            if (Array.isArray(data[0])) {
                data.forEach(row => {
                    dt.data.push(this.build(row));
                });
            } else {
                dt.data.push(this.build(data));
            }

            // We may have added data to an empty table
            if ( dt.data.length ) {
                dt.hasRows = true;
            }


            this.update();

            dt.columns.rebuild();
        }

    }

    /**
     * Remove row(s)
     * @param  {Array|Number} select
     * @return {Void}
     */
    remove(select) {
        const dt = this.dt;

        if (Array.isArray(select)) {
            // Remove in reverse otherwise the indexes will be incorrect
            select.sort((a, b) => b - a);

            select.forEach(row => {
                dt.data.splice(row, 1);
            });
        } else if (select == "all") {
            dt.data = [];
        } else {
            dt.data.splice(select, 1);
        }

        // We may have emptied the table
        if ( !dt.data.length ) {
            dt.hasRows = false;
        }

        this.update();
        dt.columns.rebuild();
    }

    /**
     * Update row indexes
     * @return {Void}
     */
    update() {
        this.dt.data.forEach((row, i) => {
            row.dataIndex = i;
        });
    }

    /**
     * Find index of row by searching for a value in a column
     * @param  {Number} columnIndex
     * @param  {String} value
     * @return {Number}
     */
    findRowIndex(columnIndex, value) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.findIndex(
            tr => tr.children[columnIndex].innerText.toLowerCase().includes(String(value).toLowerCase())
        )
    }

    /**
     * Find index, row, and column data by searching for a value in a column
     * @param  {Number} columnIndex
     * @param  {String} value
     * @return {Object}
     */
    findRow(columnIndex, value) {
        // get the row index
        const index = this.findRowIndex(columnIndex, value);
        // exit if not found
        if (index < 0) {
            return {
                index: -1,
                row: null,
                cols: []
            }
        }
        // get the row from data
        const row = this.dt.data[index];
        // return innerHTML of each td
        const cols = [...row.cells].map(r => r.innerHTML);
        // return everything
        return {
            index,
            row,
            cols
        }
    }

    /**
     * Update a row with new data
     * @param  {Number} select
     * @param  {Array} data
     * @return {Void}
     */
    updateRow(select, data) {
        const row = this.build(data);
        this.dt.data.splice(select, 1, row);
        this.update();
        this.dt.columns.rebuild();
    }
}

class Columns {
    constructor(dt) {
        this.dt = dt;
    }

    /**
     * Swap two columns
     * @return {Void}
     */
    swap(columns) {
        if (columns.length && columns.length === 2) {
            const cols = [];

            // Get the current column indexes
            this.dt.headings.forEach((h, i) => {
                cols.push(i);
            });

            const x = columns[0];
            const y = columns[1];
            const b = cols[y];
            cols[y] = cols[x];
            cols[x] = b;

            this.order(cols);
        }
    }

    /**
     * Reorder the columns
     * @return {Array} columns  Array of ordered column indexes
     */
    order(columns) {
        let a;
        let b;
        let c;
        let d;
        let h;
        let s;
        let cell;

        const temp = [
            [],
            [],
            [],
            []
        ];

        const dt = this.dt;

        // Order the headings
        columns.forEach((column, x) => {
            h = dt.headings[column];
            s = h.getAttribute("data-sortable") !== "false";
            a = h.cloneNode(true);
            a.originalCellIndex = x;
            a.sortable = s;

            temp[0].push(a);

            if (!dt.hiddenColumns.includes(column)) {
                b = h.cloneNode(true);
                b.originalCellIndex = x;
                b.sortable = s;

                temp[1].push(b);
            }
        });

        // Order the row cells
        dt.data.forEach((row, i) => {
            c = row.cloneNode(false);
            d = row.cloneNode(false);

            c.dataIndex = d.dataIndex = i;

            if (row.searchIndex !== null && row.searchIndex !== undefined) {
                c.searchIndex = d.searchIndex = row.searchIndex;
            }

            // Append the cell to the fragment in the correct order
            columns.forEach(column => {
                cell = row.cells[column].cloneNode(true);
                cell.data = row.cells[column].data;
                c.appendChild(cell);

                if (!dt.hiddenColumns.includes(column)) {
                    cell = row.cells[column].cloneNode(true);
                    cell.data = row.cells[column].data;
                    d.appendChild(cell);
                }
            });

            temp[2].push(c);
            temp[3].push(d);
        });

        dt.headings = temp[0];
        dt.activeHeadings = temp[1];

        dt.data = temp[2];
        dt.activeRows = temp[3];

        // Update
        dt.update();
    }

    /**
     * Hide columns
     * @return {Void}
     */
    hide(columns) {
        if (columns.length) {
            const dt = this.dt;

            columns.forEach(column => {
                if (!dt.hiddenColumns.includes(column)) {
                    dt.hiddenColumns.push(column);
                }
            });

            this.rebuild();
        }
    }

    /**
     * Show columns
     * @return {Void}
     */
    show(columns) {
        if (columns.length) {
            let index;
            const dt = this.dt;

            columns.forEach(column => {
                index = dt.hiddenColumns.indexOf(column);
                if (index > -1) {
                    dt.hiddenColumns.splice(index, 1);
                }
            });

            this.rebuild();
        }
    }

    /**
     * Check column(s) visibility
     * @return {Boolean}
     */
    visible(columns) {
        let cols;
        const dt = this.dt;

        columns = columns || dt.headings.map(th => th.originalCellIndex);

        if (!isNaN(columns)) {
            cols = !dt.hiddenColumns.includes(columns);
        } else if (Array.isArray(columns)) {
            cols = [];
            columns.forEach(column => {
                cols.push(!dt.hiddenColumns.includes(column));
            });
        }

        return cols
    }

    /**
     * Add a new column
     * @param {Object} data
     */
    add(data) {
        let td;
        const th = document.createElement("th");

        if (!this.dt.headings.length) {
            this.dt.insert({
                headings: [data.heading],
                data: data.data.map(i => [i])
            });
            this.rebuild();
            return
        }

        if (!this.dt.hiddenHeader) {
            if (data.heading.nodeName) {
                th.appendChild(data.heading);
            } else {
                th.innerHTML = data.heading;
            }
        } else {
            th.innerHTML = "";
        }

        this.dt.headings.push(th);

        this.dt.data.forEach((row, i) => {
            if (data.data[i]) {
                td = document.createElement("td");

                if (data.data[i].nodeName) {
                    td.appendChild(data.data[i]);
                } else {
                    td.innerHTML = data.data[i];
                }

                td.data = td.innerHTML;

                if (data.render) {
                    td.innerHTML = data.render.call(this, td.data, td, row);
                }

                row.appendChild(td);
            }
        });

        if (data.type) {
            th.setAttribute("data-type", data.type);
        }
        if (data.format) {
            th.setAttribute("data-format", data.format);
        }

        if (data.hasOwnProperty("sortable")) {
            th.sortable = data.sortable;
            th.setAttribute("data-sortable", data.sortable === true ? "true" : "false");
        }

        this.rebuild();

        this.dt.renderHeader();
    }

    /**
     * Remove column(s)
     * @param  {Array|Number} select
     * @return {Void}
     */
    remove(select) {
        if (Array.isArray(select)) {
            // Remove in reverse otherwise the indexes will be incorrect
            select.sort((a, b) => b - a);
            select.forEach(column => this.remove(column));
        } else {
            this.dt.headings.splice(select, 1);

            this.dt.data.forEach(row => {
                row.removeChild(row.cells[select]);
            });
        }

        this.rebuild();
    }

    /**
     * Filter by column
     * @param  {int} column - The column no.
     * @param  {string} dir - asc or desc
     * @filter {array} filter - optional parameter with a list of strings
     * @return {void}
     */
    filter(column, dir, init, terms) {
        const dt = this.dt;

        // Creates a internal state that manages filters if there are none
        if ( !dt.filterState ) {
            dt.filterState = {
                originalData: dt.data
            };
        }

        // If that column is was not filtered yet, we need to create its state
        if ( !dt.filterState[column] ) {

            // append a filter that selects all rows, 'resetting' the filter
            const filters = [...terms, () => true];

            dt.filterState[column] = (
                function() {
                    let i = 0;
                    return () => filters[i++ % (filters.length)]
                }()
            );
        }

        // Apply the filter and rebuild table
        const rowFilter = dt.filterState[column](); // fetches next filter
        const filteredRows = Array.from(dt.filterState.originalData).filter(tr => {
            const cell = tr.cells[column];
            const content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.innerText;

            // If the filter is a function, call it, if it is a string, compare it
            return (typeof rowFilter) === "function" ? rowFilter(content) : content === rowFilter;
        });

        dt.data = filteredRows;

        if (!dt.data.length) {
            dt.clear();
            dt.hasRows = false;
            dt.setMessage(dt.options.labels.noRows);
        } else {
            this.rebuild();
            dt.update();
        }

        if (!init) {
            dt.emit("datatable.sort", column, dir);
        }
    }

    /**
     * Sort by column
     * @param  {int} column - The column no.
     * @param  {string} dir - asc or desc
     * @return {void}
     */
    sort(column, dir, init) {
        const dt = this.dt;

        // Check column is present
        if (dt.hasHeadings && (column < 0 || column > dt.headings.length)) {
            return false
        }

        //If there is a filter for this column, apply it instead of sorting
        const filterTerms = dt.options.filters &&
              dt.options.filters[dt.headings[column].textContent];
        if ( filterTerms && filterTerms.length !== 0 ) {
            this.filter(column, dir, init, filterTerms);
            return;
        }

        dt.sorting = true;

        if (!init) {
            dt.emit("datatable.sorting", column, dir);
        }

        let rows = dt.data;
        const alpha = [];
        const numeric = [];
        let a = 0;
        let n = 0;
        const th = dt.headings[column];

        const waitFor = [];

        // Check for date format
        if (th.getAttribute("data-type") === "date") {
            let format = false;
            const formatted = th.hasAttribute("data-format");

            if (formatted) {
                format = th.getAttribute("data-format");
            }
            waitFor.push(Promise.resolve().then(function () { return date; }).then(({parseDate}) => date => parseDate(date, format)));
        }

        Promise.all(waitFor).then(importedFunctions => {
            const parseFunction = importedFunctions[0]; // only defined if date
            Array.from(rows).forEach(tr => {
                const cell = tr.cells[column];
                const content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.innerText;
                let num;
                if (parseFunction) {
                    num = parseFunction(content);
                } else if (typeof content==="string") {
                    num = content.replace(/(\$|,|\s|%)/g, "");
                } else {
                    num = content;
                }

                if (parseFloat(num) == num) {
                    numeric[n++] = {
                        value: Number(num),
                        row: tr
                    };
                } else {
                    alpha[a++] = {
                        value: typeof content==="string" ? content.toLowerCase() : content,
                        row: tr
                    };
                }
            });

            /* Sort according to direction (ascending or descending) */
            if (!dir) {
                if (th.classList.contains("asc")) {
                    dir = "desc";
                } else {
                    dir = "asc";
                }
            }
            let top;
            let btm;
            if (dir == "desc") {
                top = sortItems(alpha, -1);
                btm = sortItems(numeric, -1);
                th.classList.remove("asc");
                th.classList.add("desc");
                th.setAttribute("aria-sort", "descending");
            } else {
                top = sortItems(numeric, 1);
                btm = sortItems(alpha, 1);
                th.classList.remove("desc");
                th.classList.add("asc");
                th.setAttribute("aria-sort", "ascending");
            }

            /* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
            if (dt.lastTh && th != dt.lastTh) {
                dt.lastTh.classList.remove("desc");
                dt.lastTh.classList.remove("asc");
                dt.lastTh.removeAttribute("aria-sort");
            }

            dt.lastTh = th;

            /* Reorder the table */
            rows = top.concat(btm);

            dt.data = [];
            const indexes = [];

            rows.forEach((v, i) => {
                dt.data.push(v.row);

                if (v.row.searchIndex !== null && v.row.searchIndex !== undefined) {
                    indexes.push(i);
                }
            });

            dt.searchData = indexes;

            this.rebuild();

            dt.update();

            if (!init) {
                dt.emit("datatable.sort", column, dir);
            }
        });
    }

    /**
     * Rebuild the columns
     * @return {Void}
     */
    rebuild() {
        let a;
        let b;
        let c;
        let d;
        const dt = this.dt;
        const temp = [];

        dt.activeRows = [];
        dt.activeHeadings = [];

        dt.headings.forEach((th, i) => {
            th.originalCellIndex = i;
            th.sortable = th.getAttribute("data-sortable") !== "false";
            if (!dt.hiddenColumns.includes(i)) {
                dt.activeHeadings.push(th);
            }
        });

        // Loop over the rows and reorder the cells
        dt.data.forEach((row, i) => {
            a = row.cloneNode(false);
            b = row.cloneNode(false);

            a.dataIndex = b.dataIndex = i;

            if (row.searchIndex !== null && row.searchIndex !== undefined) {
                a.searchIndex = b.searchIndex = row.searchIndex;
            }

            // Append the cell to the fragment in the correct order
            Array.from(row.cells).forEach(cell => {
                c = cell.cloneNode(true);
                c.data = cell.data;
                a.appendChild(c);

                if (!dt.hiddenColumns.includes(c.cellIndex)) {
                    d = c.cloneNode(true);
                    d.data = c.data;
                    b.appendChild(d);
                }
            });

            // Append the fragment with the ordered cells
            temp.push(a);
            dt.activeRows.push(b);
        });

        dt.data = temp;

        dt.update();
    }
}

/**
 * Parse data to HTML table
 */
const dataToTable = function (data) {
    let thead = false;
    let tbody = false;

    data = data || this.options.data;

    if (data.headings) {
        thead = createElement("thead");
        const tr = createElement("tr");
        data.headings.forEach(col => {
            const td = createElement("th", {
                html: col
            });
            tr.appendChild(td);
        });

        thead.appendChild(tr);
    }

    if (data.data && data.data.length) {
        tbody = createElement("tbody");
        data.data.forEach(rows => {
            if (data.headings) {
                if (data.headings.length !== rows.length) {
                    throw new Error(
                        "The number of rows do not match the number of headings."
                    )
                }
            }
            const tr = createElement("tr");
            rows.forEach(value => {
                const td = createElement("td", {
                    html: value
                });
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    if (thead) {
        if (this.dom.tHead !== null) {
            this.dom.removeChild(this.dom.tHead);
        }
        this.dom.appendChild(thead);
    }

    if (tbody) {
        if (this.dom.tBodies.length) {
            this.dom.removeChild(this.dom.tBodies[0]);
        }
        this.dom.appendChild(tbody);
    }
};

/**
 * Default configuration
 * @typ {Object}
 */
const defaultConfig = {
    sortable: true,
    searchable: true,

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
    }
};

class DataTable {
    constructor(table, options = {}) {

        const dom = typeof table === "string" ? document.querySelector(table) : table;

        // user options
        this.options = {
            ...defaultConfig,
            ...options,
            layout: {
                ...defaultConfig.layout,
                ...options.layout
            },
            labels: {
                ...defaultConfig.labels,
                ...options.labels
            }
        };

        this.rows = new Rows(this);
        this.columns = new Columns(this);

        this.initialized = false;

        this.initialLayout = dom.innerHTML;
        this.initialSortable = this.options.sortable;

        if (this.options.tabIndex) {
            dom.tabIndex = this.options.tabIndex;
        } else if (this.options.rowNavigation && dom.tabIndex === -1) {
            dom.tabIndex = 0;
        }

        // Disable manual sorting if no header is present (#4)
        if (!this.options.header) {
            this.options.sortable = false;
        }

        if (dom.tHead === null) {
            if (!this.options.data ||
                (this.options.data && !this.options.data.headings)
            ) {
                this.options.sortable = false;
            }
        }

        if (dom.tBodies.length && !dom.tBodies[0].rows.length) {
            if (this.options.data) {
                if (!this.options.data.data) {
                    throw new Error(
                        "You seem to be using the data option, but you've not defined any rows."
                    )
                }
            }
        }

        this.dom = dom;

        this.table = this.dom; // For compatibility. Remove in version 4

        this.listeners = {
            onResize: event => this.onResize(event)
        };

        this.init();
    }

    /**
     * Initialize the instance
     * @param  {Object} options
     * @return {Void}
     */
    init(options) {
        if (this.initialized || this.dom.classList.contains("dataTable-table")) {
            return false
        }

        Object.assign(this.options, options || {});

        this.currentPage = 1;
        this.onFirstPage = true;

        this.hiddenColumns = [];
        this.columnRenderers = [];
        this.selectedColumns = [];

        this.render();

        setTimeout(() => {
            this.emit("datatable.init");
            this.initialized = true;

            if (this.options.plugins) {
                Object.entries(this.options.plugins).forEach(([plugin, options]) => {
                    if (this[plugin] && typeof this[plugin] === "function") {
                        this[plugin] = this[plugin](options, {createElement});

                        // Init plugin
                        if (options.enabled && this[plugin].init && typeof this[plugin].init === "function") {
                            this[plugin].init();
                        }
                    }
                });
            }
        }, 10);
    }

    /**
     * Render the instance
     * @param  {String} type
     * @return {Void}
     */
    render() {
        let template = "";

        // Convert data to HTML
        if (this.options.data) {
            dataToTable.call(this);
        }

        // Store references
        this.body = this.dom.tBodies[0];
        this.head = this.dom.tHead;
        this.foot = this.dom.tFoot;

        if (!this.body) {
            this.body = createElement("tbody");

            this.dom.appendChild(this.body);
        }

        this.hasRows = this.body.rows.length > 0;

        // Make a tHead if there isn't one (fixes #8)
        if (!this.head) {
            const h = createElement("thead");
            const t = createElement("tr");

            if (this.hasRows) {
                Array.from(this.body.rows[0].cells).forEach(() => {
                    t.appendChild(createElement("th"));
                });

                h.appendChild(t);
            }

            this.head = h;

            this.dom.insertBefore(this.head, this.body);

            this.hiddenHeader = this.options.hiddenHeader;
        }

        this.headings = [];
        this.hasHeadings = this.head.rows.length > 0;

        if (this.hasHeadings) {
            this.header = this.head.rows[0];
            this.headings = [].slice.call(this.header.cells);
        }

        // Header
        if (!this.options.header) {
            if (this.head) {
                this.dom.removeChild(this.dom.tHead);
            }
        }

        // Footer
        if (this.options.footer) {
            if (this.head && !this.foot) {
                this.foot = createElement("tfoot", {
                    html: this.head.innerHTML
                });
                this.dom.appendChild(this.foot);
            }
        } else {
            if (this.foot) {
                this.dom.removeChild(this.dom.tFoot);
            }
        }

        // Build
        this.wrapper = createElement("div", {
            class: "dataTable-wrapper dataTable-loading"
        });

        // Template for custom layouts
        template += "<div class='dataTable-top'>";
        template += this.options.layout.top;
        template += "</div>";
        if (this.options.scrollY.length) {
            template += `<div class='dataTable-container' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`;
        } else {
            template += "<div class='dataTable-container'></div>";
        }
        template += "<div class='dataTable-bottom'>";
        template += this.options.layout.bottom;
        template += "</div>";

        // Info placement
        template = template.replace("{info}", this.options.paging ? "<div class='dataTable-info'></div>" : "");

        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {
            let wrap = "<div class='dataTable-dropdown'><label>";
            wrap += this.options.labels.perPage;
            wrap += "</label></div>";

            // Create the select
            const select = createElement("select", {
                class: "dataTable-selector"
            });

            // Create the options
            this.options.perPageSelect.forEach(val => {
                const selected = val === this.options.perPage;
                const option = new Option(val, val, selected, selected);
                select.add(option);
            });

            // Custom label
            wrap = wrap.replace("{select}", select.outerHTML);

            // Selector placement
            template = template.replace("{select}", wrap);
        } else {
            template = template.replace("{select}", "");
        }

        // Searchable
        if (this.options.searchable) {
            const form =
                `<div class='dataTable-search'><input class='dataTable-input' placeholder='${this.options.labels.placeholder}' type='text'></div>`;

            // Search input placement
            template = template.replace("{search}", form);
        } else {
            template = template.replace("{search}", "");
        }

        if (this.hasHeadings) {
            // Sortable
            this.renderHeader();
        }

        // Add table class
        this.dom.classList.add("dataTable-table");

        // Paginator
        const paginatorWrapper = createElement("nav", {
            class: "dataTable-pagination"
        });
        const paginator = createElement("ul", {
            class: "dataTable-pagination-list"
        });
        paginatorWrapper.appendChild(paginator);

        // Pager(s) placement
        template = template.replace(/\{pager\}/g, paginatorWrapper.outerHTML);
        this.wrapper.innerHTML = template;

        this.container = this.wrapper.querySelector(".dataTable-container");

        this.pagers = this.wrapper.querySelectorAll(".dataTable-pagination-list");

        this.label = this.wrapper.querySelector(".dataTable-info");

        // Insert in to DOM tree
        this.dom.parentNode.replaceChild(this.wrapper, this.dom);
        this.container.appendChild(this.dom);

        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect();

        // Convert rows to array for processing
        this.data = Array.from(this.body.rows);
        this.activeRows = this.data.slice();
        this.activeHeadings = this.headings.slice();

        // Update
        this.update();


        this.setColumns();


        // Fix height
        this.fixHeight();

        // Fix columns
        this.fixColumns();

        // Class names
        if (!this.options.header) {
            this.wrapper.classList.add("no-header");
        }

        if (!this.options.footer) {
            this.wrapper.classList.add("no-footer");
        }

        if (this.options.sortable) {
            this.wrapper.classList.add("sortable");
        }

        if (this.options.searchable) {
            this.wrapper.classList.add("searchable");
        }

        if (this.options.fixedHeight) {
            this.wrapper.classList.add("fixed-height");
        }

        if (this.options.fixedColumns) {
            this.wrapper.classList.add("fixed-columns");
        }

        this.bindEvents();
    }

    /**
     * Render the page
     * @return {Void}
     */
    renderPage(lastRowCursor=false) {
        if (this.hasHeadings) {
            flush(this.header);

            this.activeHeadings.forEach(th => this.header.appendChild(th));
        }


        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1;
            }

            // Use a fragment to limit touching the DOM
            const index = this.currentPage - 1;

            const frag = document.createDocumentFragment();
            this.pages[index].forEach(row => frag.appendChild(this.rows.render(row)));

            this.clear(frag);

            this.onFirstPage = this.currentPage === 1;
            this.onLastPage = this.currentPage === this.lastPage;
        } else {
            this.setMessage(this.options.labels.noRows);
        }

        // Update the info
        let current = 0;

        let f = 0;
        let t = 0;
        let items;

        if (this.totalPages) {
            current = this.currentPage - 1;
            f = current * this.options.perPage;
            t = f + this.pages[current].length;
            f = f + 1;
            items = this.searching ? this.searchData.length : this.data.length;
        }

        if (this.label && this.options.labels.info.length) {
            // CUSTOM LABELS
            const string = this.options.labels.info
                .replace("{start}", f)
                .replace("{end}", t)
                .replace("{page}", this.currentPage)
                .replace("{pages}", this.totalPages)
                .replace("{rows}", items);

            this.label.innerHTML = items ? string : "";
        }

        if (this.currentPage == 1) {
            this.fixHeight();
        }

        if (this.options.rowNavigation) {
            if (!this.rows.cursor || !this.pages[this.currentPage-1].includes(this.rows.cursor)) {
                const rows = this.pages[this.currentPage-1];
                if (lastRowCursor) {
                    this.rows.setCursor(rows[rows.length-1]);
                } else {
                    this.rows.setCursor(rows[0]);
                }

            }
        }
    }

    /**
     * Render the pager(s)
     * @return {Void}
     */
    renderPager() {
        flush(this.pagers);

        if (this.totalPages > 1) {
            const c = "pager";
            const frag = document.createDocumentFragment();
            const prev = this.onFirstPage ? 1 : this.currentPage - 1;
            const next = this.onLastPage ? this.totalPages : this.currentPage + 1;

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, 1, this.options.firstText));
            }

            // prev button
            if (this.options.nextPrev && !this.onFirstPage) {
                frag.appendChild(button(c, prev, this.options.prevText));
            }

            let pager = this.links;

            // truncate the links
            if (this.options.truncatePager) {
                pager = truncate(
                    this.links,
                    this.currentPage,
                    this.pages.length,
                    this.options.pagerDelta,
                    this.options.ellipsisText
                );
            }

            // active page link
            this.links[this.currentPage - 1].classList.add("active");

            // append the links
            pager.forEach(p => {
                p.classList.remove("active");
                frag.appendChild(p);
            });

            this.links[this.currentPage - 1].classList.add("active");

            // next button
            if (this.options.nextPrev && !this.onLastPage) {
                frag.appendChild(button(c, next, this.options.nextText));
            }

            // first button
            if (this.options.firstLast) {
                frag.appendChild(button(c, this.totalPages, this.options.lastText));
            }

            // We may have more than one pager
            this.pagers.forEach(pager => {
                pager.appendChild(frag.cloneNode(true));
            });
        }
    }

    /**
     * Render the header
     * @return {Void}
     */
    renderHeader() {
        this.labels = [];

        if (this.headings && this.headings.length) {
            this.headings.forEach((th, i) => {

                this.labels[i] = th.textContent;

                if (th.firstElementChild && th.firstElementChild.classList.contains("dataTable-sorter")) {
                    th.innerHTML = th.firstElementChild.innerHTML;
                }

                th.sortable = th.getAttribute("data-sortable") !== "false";

                th.originalCellIndex = i;
                if (this.options.sortable && th.sortable) {
                    const link = createElement("a", {
                        href: "#",
                        class: "dataTable-sorter",
                        html: th.innerHTML
                    });

                    th.innerHTML = "";
                    th.setAttribute("data-sortable", "");
                    th.appendChild(link);
                }
            });
        }

        this.fixColumns();
    }

    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapper.querySelector(".dataTable-selector");
            if (selector) {
                // Change per page
                selector.addEventListener("change", () => {
                    this.options.perPage = parseInt(selector.value, 10);
                    this.update();

                    this.fixHeight();

                    this.emit("datatable.perpage", this.options.perPage);
                }, false);
            }
        }

        // Search input
        if (this.options.searchable) {
            this.input = this.wrapper.querySelector(".dataTable-input");
            if (this.input) {
                this.input.addEventListener("keyup", () => this.search(this.input.value), false);
            }
        }

        // Pager(s) / sorting
        this.wrapper.addEventListener("click", e => {
            const t = e.target.closest("a");
            if (t && (t.nodeName.toLowerCase() === "a")) {
                if (t.hasAttribute("data-page")) {
                    this.page(t.getAttribute("data-page"));
                    e.preventDefault();
                } else if (
                    this.options.sortable &&
                    t.classList.contains("dataTable-sorter") &&
                    t.parentNode.getAttribute("data-sortable") != "false"
                ) {
                    this.columns.sort(this.headings.indexOf(t.parentNode));
                    e.preventDefault();
                }
            }
        }, false);

        if (this.options.rowNavigation) {
            this.table.addEventListener("keydown", event => {
                if (event.keyCode === 38) {
                    if (this.rows.cursor.previousElementSibling) {
                        this.rows.setCursor(this.rows.cursor.previousElementSibling);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (!this.onFirstPage) {
                        this.page(this.currentPage-1, true);
                    }
                } else if (event.keyCode === 40) {
                    if (this.rows.cursor.nextElementSibling) {
                        this.rows.setCursor(this.rows.cursor.nextElementSibling);
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (!this.onLastPage) {
                        this.page(this.currentPage+1);
                    }
                } else if ([13, 32].includes(event.keyCode)) {
                    this.emit("datatable.selectrow", this.rows.cursor, event);
                }
            });
            this.body.addEventListener("mousedown", event => {
                if (this.table.matches(":focus")) {
                    const row = Array.from(this.body.rows).find(row => row.contains(event.target));
                    this.emit("datatable.selectrow", row, event);
                }

            });
        } else {
            this.body.addEventListener("mousedown", event => {
                const row = Array.from(this.body.rows).find(row => row.contains(event.target));
                this.emit("datatable.selectrow", row, event);
            });
        }

        window.addEventListener("resize", this.listeners.onResize);
    }

    /**
     * execute on resize
     */
    onResize() {
        this.rect = this.container.getBoundingClientRect();
        if (!this.rect.width) {
            // No longer shown, likely no longer part of DOM. Give up.
            return
        }
        this.fixColumns();
    }

    /**
     * Set up columns
     * @return {[type]} [description]
     */
    setColumns(ajax) {

        if (!ajax) {
            this.data.forEach(row => {
                Array.from(row.cells).forEach(cell => {
                    cell.data = cell.innerHTML;
                });
            });
        }

        // Check for the columns option
        if (this.options.columns && this.headings.length) {

            this.options.columns.forEach(data => {

                // convert single column selection to array
                if (!Array.isArray(data.select)) {
                    data.select = [data.select];
                }

                if (data.hasOwnProperty("render") && typeof data.render === "function") {
                    this.selectedColumns = this.selectedColumns.concat(data.select);

                    this.columnRenderers.push({
                        columns: data.select,
                        renderer: data.render
                    });
                }

                // Add the data attributes to the th elements
                data.select.forEach(column => {
                    const th = this.headings[column];
                    if (!th) {
                        return
                    }
                    if (data.type) {
                        th.setAttribute("data-type", data.type);
                    }
                    if (data.format) {
                        th.setAttribute("data-format", data.format);
                    }
                    if (data.hasOwnProperty("sortable")) {
                        th.setAttribute("data-sortable", data.sortable);
                    }

                    if (data.hasOwnProperty("hidden")) {
                        if (data.hidden !== false) {
                            this.columns.hide([column]);
                        }
                    }

                    if (data.hasOwnProperty("sort") && data.select.length === 1) {
                        this.columns.sort(data.select[0], data.sort, true);
                    }
                });
            });
        }

        if (this.hasRows) {
            this.data.forEach((row, i) => {
                row.dataIndex = i;
                Array.from(row.cells).forEach(cell => {
                    cell.data = cell.innerHTML;
                });
            });

            if (this.selectedColumns.length) {
                this.data.forEach(row => {
                    Array.from(row.cells).forEach((cell, i) => {
                        if (this.selectedColumns.includes(i)) {
                            this.columnRenderers.forEach(options => {
                                if (options.columns.includes(i)) {
                                    cell.innerHTML = options.renderer.call(this, cell.data, cell, row);
                                }
                            });
                        }
                    });
                });
            }

            this.columns.rebuild();
        }

        this.renderHeader();
    }

    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        this.dom.innerHTML = this.initialLayout;

        // Remove the className
        this.dom.classList.remove("dataTable-table");

        // Remove the containers
        this.wrapper.parentNode.replaceChild(this.dom, this.wrapper);

        this.initialized = false;

        window.removeEventListener("resize", this.listeners.onResize);
    }

    /**
     * Update the instance
     * @return {Void}
     */
    update() {
        this.wrapper.classList.remove("dataTable-empty");

        this.paginate();
        this.renderPage();

        this.links = [];

        let i = this.pages.length;
        while (i--) {
            const num = i + 1;
            this.links[i] = button(i === 0 ? "active" : "", num, num);
        }

        this.sorting = false;

        this.renderPager();

        this.rows.update();

        this.emit("datatable.update");
    }

    /**
     * Sort rows into pages
     * @return {Number}
     */
    paginate() {
        let rows = this.activeRows;

        if (this.searching) {
            rows = [];

            this.searchData.forEach(index => rows.push(this.activeRows[index]));
        }

        if (this.options.paging) {
            // Check for hidden columns
            this.pages = rows
                .map((tr, i) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter(page => page);
        } else {
            this.pages = [rows];
        }

        this.totalPages = this.lastPage = this.pages.length;

        return this.totalPages
    }

    /**
     * Fix column widths
     * @return {Void}
     */
    fixColumns() {

        if ((this.options.scrollY.length || this.options.fixedColumns) && this.activeHeadings && this.activeHeadings.length) {
            let cells;
            let hd = false;
            this.columnWidths = [];

            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.dom.tHead) {

                if (this.options.scrollY.length) {
                    hd = createElement("thead");
                    hd.appendChild(createElement("tr"));
                    hd.style.height = "0px";
                    if (this.headerTable) {
                        // move real header back into place
                        this.dom.tHead = this.headerTable.tHead;
                    }
                }

                // Reset widths
                this.activeHeadings.forEach(cell => {
                    cell.style.width = "";
                });

                const totalOffsetWidth = this.activeHeadings.reduce(
                    (total, cell) => total + cell.offsetWidth,
                    0
                );

                this.activeHeadings.forEach((cell, i) => {
                    const ow = cell.offsetWidth;
                    const w = ow / totalOffsetWidth * 100;
                    cell.style.width = `${w}%`;
                    this.columnWidths[i] = ow;
                    if (this.options.scrollY.length) {
                        const th = createElement("th");
                        hd.firstElementChild.appendChild(th);
                        th.style.width = `${w}%`;
                        th.style.paddingTop = "0";
                        th.style.paddingBottom = "0";
                        th.style.border = "0";
                    }
                });

                if (this.options.scrollY.length) {
                    const container = this.dom.parentElement;
                    if (!this.headerTable) {
                        this.headerTable = createElement("table", {
                            class: "dataTable-table"
                        });
                        const headercontainer = createElement("div", {
                            class: "dataTable-headercontainer"
                        });
                        headercontainer.appendChild(this.headerTable);
                        container.parentElement.insertBefore(headercontainer, container);
                    }
                    const thd = this.dom.tHead;
                    this.dom.replaceChild(hd, thd);
                    this.headerTable.tHead = thd;

                    // Compensate for scrollbars.
                    this.headerTable.parentElement.style.paddingRight = `${
                        this.headerTable.clientWidth -
                        this.dom.clientWidth +
                        parseInt(
                            this.headerTable.parentElement.style.paddingRight ||
                            "0",
                            10
                        )
                    }px`;

                    if (container.scrollHeight > container.clientHeight) {
                        // scrollbars on one page means scrollbars on all pages.
                        container.style.overflowY = "scroll";
                    }
                }

            } else {
                cells = [];

                // Make temperary headings
                hd = createElement("thead");
                const r = createElement("tr");
                Array.from(this.dom.tBodies[0].rows[0].cells).forEach(() => {
                    const th = createElement("th");
                    r.appendChild(th);
                    cells.push(th);
                });

                hd.appendChild(r);
                this.dom.insertBefore(hd, this.body);

                const widths = [];
                cells.forEach((cell, i) => {
                    const ow = cell.offsetWidth;
                    const w = ow / this.rect.width * 100;
                    widths.push(w);
                    this.columnWidths[i] = ow;
                });

                this.data.forEach(row => {
                    Array.from(row.cells).forEach((cell, i) => {
                        if (this.columns.visible(cell.cellIndex))
                            cell.style.width = `${widths[i]}%`;
                    });
                });

                // Discard the temp header
                this.dom.removeChild(hd);
            }
        }
    }

    /**
     * Fix the container height
     * @return {Void}
     */
    fixHeight() {
        if (this.options.fixedHeight) {
            this.container.style.height = null;
            this.rect = this.container.getBoundingClientRect();
            this.container.style.height = `${this.rect.height}px`;
        }
    }

    /**
     * Perform a search of the data set
     * @param  {string} query
     * @return {void}
     */
    search(query) {
        if (!this.hasRows) return false

        query = query.toLowerCase();

        this.currentPage = 1;
        this.searching = true;
        this.searchData = [];

        if (!query.length) {
            this.searching = false;
            this.update();
            this.emit("datatable.search", query, this.searchData);
            this.wrapper.classList.remove("search-results");
            return false
        }

        this.clear();

        this.data.forEach((row, idx) => {
            const inArray = this.searchData.includes(row);

            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            const doesQueryMatch = query.split(" ").reduce((bool, word) => {
                let includes = false;
                let cell = null;
                let content = null;

                for (let x = 0; x < row.cells.length; x++) {
                    cell = row.cells[x];
                    content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.textContent;

                    if (
                        content.toLowerCase().includes(word) &&
                        this.columns.visible(cell.cellIndex)
                    ) {
                        includes = true;
                        break
                    }
                }

                return bool && includes
            }, true);

            if (doesQueryMatch && !inArray) {
                row.searchIndex = idx;
                this.searchData.push(idx);
            } else {
                row.searchIndex = null;
            }
        });

        this.wrapper.classList.add("search-results");

        if (!this.searchData.length) {
            this.wrapper.classList.remove("search-results");

            this.setMessage(this.options.labels.noResults);
        } else {
            this.update();
        }

        this.emit("datatable.search", query, this.searchData);
    }

    /**
     * Change page
     * @param  {int} page
     * @return {void}
     */
    page(page, lastRowCursor=false) {
        // We don't want to load the current page again.
        if (page == this.currentPage) {
            return false
        }

        if (!isNaN(page)) {
            this.currentPage = parseInt(page, 10);
        }

        if (page > this.pages.length || page < 0) {
            return false
        }

        this.renderPage(lastRowCursor);
        this.renderPager();

        this.emit("datatable.page", page);
    }

    /**
     * Sort by column
     * @param  {int} column - The column no.
     * @param  {string} direction - asc or desc
     * @return {void}
     */
    sortColumn(column, direction) {
        // Use columns API until sortColumn method is removed
        this.columns.sort(column, direction);
    }

    /**
     * Add new row data
     * @param {object} data
     */
    insert(data) {
        let rows = [];
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    const tr = createElement("tr");
                    data.headings.forEach(heading => {
                        const th = createElement("th", {
                            html: heading
                        });

                        tr.appendChild(th);
                    });
                    this.head.appendChild(tr);

                    this.header = tr;
                    this.headings = [].slice.call(tr.cells);
                    this.hasHeadings = true;

                    // Re-enable sorting if it was disabled due
                    // to missing header
                    this.options.sortable = this.initialSortable;

                    // Allow sorting on new header
                    this.renderHeader();

                    // Activate newly added headings
                    this.activeHeadings = this.headings.slice();
                }
            }

            if (data.data && Array.isArray(data.data)) {
                rows = data.data;
            }
        } else if (Array.isArray(data)) {
            data.forEach(row => {
                const r = [];
                Object.entries(row).forEach(([heading, cell]) => {

                    const index = this.labels.indexOf(heading);

                    if (index > -1) {
                        r[index] = cell;
                    }
                });
                rows.push(r);
            });
        }

        if (rows.length) {
            this.rows.add(rows);

            this.hasRows = true;
        }

        this.update();
        this.setColumns();
        this.fixColumns();
    }

    /**
     * Refresh the instance
     * @return {void}
     */
    refresh() {
        if (this.options.searchable) {
            this.input.value = "";
            this.searching = false;
        }
        this.currentPage = 1;
        this.onFirstPage = true;
        this.update();

        this.emit("datatable.refresh");
    }

    /**
     * Truncate the table
     * @param  {mixes} html - HTML string or HTMLElement
     * @return {void}
     */
    clear(html) {
        if (this.body) {
            flush(this.body);
        }

        let parent = this.body;
        if (!this.body) {
            parent = this.dom;
        }

        if (html) {
            if (typeof html === "string") {
                const frag = document.createDocumentFragment();
                frag.innerHTML = html;
            }

            parent.appendChild(html);
        }
    }

    /**
     * Export table to various formats (csv, txt or sql)
     * @param  {Object} userOptions User options
     * @return {Boolean}
     */
    export(userOptions) {
        if (!this.hasHeadings && !this.hasRows) return false

        const headers = this.activeHeadings;
        let rows = [];
        const arr = [];
        let i;
        let x;
        let str;
        let link;

        const defaults = {
            download: true,
            skipColumn: [],

            // csv
            lineDelimiter: "\n",
            columnDelimiter: ",",

            // sql
            tableName: "myTable",

            // json
            replacer: null,
            space: 4
        };

        // Check for the options object
        if (!isObject(userOptions)) {
            return false
        }

        const options = {
            ...defaults,
            ...userOptions
        };

        if (options.type) {
            if (options.type === "txt" || options.type === "csv") {
                // Include headings
                rows[0] = this.header;
            }

            // Selection or whole table
            if (options.selection) {
                // Page number
                if (!isNaN(options.selection)) {
                    rows = rows.concat(this.pages[options.selection - 1]);
                } else if (Array.isArray(options.selection)) {
                    // Array of page numbers
                    for (i = 0; i < options.selection.length; i++) {
                        rows = rows.concat(this.pages[options.selection[i] - 1]);
                    }
                }
            } else {
                rows = rows.concat(this.activeRows);
            }

            // Only proceed if we have data
            if (rows.length) {
                if (options.type === "txt" || options.type === "csv") {
                    str = "";

                    for (i = 0; i < rows.length; i++) {
                        for (x = 0; x < rows[i].cells.length; x++) {
                            // Check for column skip and visibility
                            if (
                                !options.skipColumn.includes(headers[x].originalCellIndex) &&
                                this.columns.visible(headers[x].originalCellIndex)
                            ) {
                                let text = rows[i].cells[x].textContent;
                                text = text.trim();
                                text = text.replace(/\s{2,}/g, " ");
                                text = text.replace(/\n/g, "  ");
                                text = text.replace(/"/g, "\"\"");
                                //have to manually encode "#" as encodeURI leaves it as is.
                                text = text.replace(/#/g, "%23");
                                if (text.includes(","))
                                    text = `"${text}"`;


                                str += text + options.columnDelimiter;
                            }
                        }
                        // Remove trailing column delimiter
                        str = str.trim().substring(0, str.length - 1);

                        // Apply line delimiter
                        str += options.lineDelimiter;
                    }

                    // Remove trailing line delimiter
                    str = str.trim().substring(0, str.length - 1);

                    if (options.download) {
                        str = `data:text/csv;charset=utf-8,${str}`;
                    }
                } else if (options.type === "sql") {
                    // Begin INSERT statement
                    str = `INSERT INTO \`${options.tableName}\` (`;

                    // Convert table headings to column names
                    for (i = 0; i < headers.length; i++) {
                        // Check for column skip and column visibility
                        if (
                            !options.skipColumn.includes(headers[i].originalCellIndex) &&
                            this.columns.visible(headers[i].originalCellIndex)
                        ) {
                            str += `\`${headers[i].textContent}\`,`;
                        }
                    }

                    // Remove trailing comma
                    str = str.trim().substring(0, str.length - 1);

                    // Begin VALUES
                    str += ") VALUES ";

                    // Iterate rows and convert cell data to column values
                    for (i = 0; i < rows.length; i++) {
                        str += "(";

                        for (x = 0; x < rows[i].cells.length; x++) {
                            // Check for column skip and column visibility
                            if (
                                !options.skipColumn.includes(headers[x].originalCellIndex) &&
                                this.columns.visible(headers[x].originalCellIndex)
                            ) {
                                str += `"${rows[i].cells[x].textContent}",`;
                            }
                        }

                        // Remove trailing comma
                        str = str.trim().substring(0, str.length - 1);

                        // end VALUES
                        str += "),";
                    }

                    // Remove trailing comma
                    str = str.trim().substring(0, str.length - 1);

                    // Add trailing colon
                    str += ";";

                    if (options.download) {
                        str = `data:application/sql;charset=utf-8,${str}`;
                    }
                } else if (options.type === "json") {
                    // Iterate rows
                    for (x = 0; x < rows.length; x++) {
                        arr[x] = arr[x] || {};
                        // Iterate columns
                        for (i = 0; i < headers.length; i++) {
                            // Check for column skip and column visibility
                            if (
                                !options.skipColumn.includes(headers[i].originalCellIndex) &&
                                this.columns.visible(headers[i].originalCellIndex)
                            ) {
                                arr[x][headers[i].textContent] = rows[x].cells[i].textContent;
                            }
                        }
                    }

                    // Convert the array of objects to JSON string
                    str = JSON.stringify(arr, options.replacer, options.space);

                    if (options.download) {
                        str = `data:application/json;charset=utf-8,${str}`;
                    }
                }

                // Download
                if (options.download) {
                    // Filename
                    options.filename = options.filename || "datatable_export";
                    options.filename += `.${options.type}`;

                    str = encodeURI(str);

                    // Create a link to trigger the download
                    link = document.createElement("a");
                    link.href = str;
                    link.download = options.filename;

                    // Append the link
                    document.body.appendChild(link);

                    // Trigger the download
                    link.click();

                    // Remove the link
                    document.body.removeChild(link);
                }

                return str
            }
        }

        return false
    }

    /**
     * Import data to the table
     * @param  {Object} userOptions User options
     * @return {Boolean}
     */
    import(userOptions) {
        let obj = false;
        const defaults = {
            // csv
            lineDelimiter: "\n",
            columnDelimiter: ",",
            removeDoubleQuotes: false
        };

        // Check for the options object
        if (!isObject(userOptions)) {
            return false
        }

        const options = {
            ...defaults,
            ...userOptions
        };

        if (options.data.length || isObject(options.data)) {
            // Import CSV
            if (options.type === "csv") {
                obj = {
                    data: []
                };

                // Split the string into rows
                const rows = options.data.split(options.lineDelimiter);

                if (rows.length) {

                    if (options.headings) {
                        obj.headings = rows[0].split(options.columnDelimiter);
                        if (options.removeDoubleQuotes) {
                            obj.headings = obj.headings.map(e => e.trim().replace(/(^"|"$)/g, ""));
                        }
                        rows.shift();
                    }

                    rows.forEach((row, i) => {
                        obj.data[i] = [];

                        // Split the rows into values
                        const values = row.split(options.columnDelimiter);

                        if (values.length) {
                            values.forEach(value => {
                                if (options.removeDoubleQuotes) {
                                    value = value.trim().replace(/(^"|"$)/g, "");
                                }
                                obj.data[i].push(value);
                            });
                        }
                    });
                }
            } else if (options.type === "json") {
                const json = isJson(options.data);

                // Valid JSON string
                if (json) {
                    obj = {
                        headings: [],
                        data: []
                    };

                    json.forEach((data, i) => {
                        obj.data[i] = [];
                        Object.entries(data).forEach(([column, value]) => {
                            if (!obj.headings.includes(column)) {
                                obj.headings.push(column);
                            }

                            obj.data[i].push(value);
                        });
                    });
                } //else {
                // console.warn("That's not valid JSON!")
                //}
            }

            if (isObject(options.data)) {
                obj = options.data;
            }

            if (obj) {
                // Add the rows
                this.insert(obj);
            }
        }

        return false
    }

    /**
     * Print the table
     * @return {void}
     */
    print() {
        const headings = this.activeHeadings;
        const rows = this.activeRows;
        const table = createElement("table");
        const thead = createElement("thead");
        const tbody = createElement("tbody");

        const tr = createElement("tr");
        headings.forEach(th => {
            tr.appendChild(
                createElement("th", {
                    html: th.textContent
                })
            );
        });

        thead.appendChild(tr);

        rows.forEach(row => {
            const tr = createElement("tr");
            Array.from(row.cells).forEach(cell => {
                tr.appendChild(
                    createElement("td", {
                        html: cell.textContent
                    })
                );
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        // Open new window
        const w = window.open();

        // Append the table to the body
        w.document.body.appendChild(table);

        // Print
        w.print();
    }

    /**
     * Show a message in the table
     * @param {string} message
     */
    setMessage(message) {
        let colspan = 1;

        if (this.hasRows) {
            colspan = this.data[0].cells.length;
        } else if (this.activeHeadings.length) {
            colspan = this.activeHeadings.length;
        }

        this.wrapper.classList.add("dataTable-empty");

        if (this.label) {
            this.label.innerHTML = "";
        }
        this.totalPages = 0;
        this.renderPager();

        this.clear(
            createElement("tr", {
                html: `<td class="dataTables-empty" colspan="${colspan}">${message}</td>`
            })
        );
    }

    /**
     * Add custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    on(event, callback) {
        this.events = this.events || {};
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }

    /**
     * Remove custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    off(event, callback) {
        this.events = this.events || {};
        if (event in this.events === false) return
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    }

    /**
     * Fire custom event
     * @param  {String} event
     * @return {Void}
     */
    emit(event) {
        this.events = this.events || {};
        if (event in this.events === false) return
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var dayjs_min = {exports: {}};

(function (module, exports) {
	!function(t,e){module.exports=e();}(commonjsGlobal,(function(){var t=1e3,e=6e4,n=36e5,r="millisecond",i="second",s="minute",u="hour",a="day",o="week",f="month",h="quarter",c="year",d="date",$="Invalid Date",l=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},m=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},g={s:m,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+m(r,2,"0")+":"+m(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,f),s=n-i<0,u=e.clone().add(r+(s?-1:1),f);return +(-(r+(n-i)/(s?i-u:u-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return {M:f,y:c,w:o,d:a,D:d,h:u,m:s,s:i,ms:r,Q:h}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},v="en",D={};D[v]=M;var p=function(t){return t instanceof _},S=function t(e,n,r){var i;if(!e)return v;if("string"==typeof e){var s=e.toLowerCase();D[s]&&(i=s),n&&(D[s]=n,i=s);var u=e.split("-");if(!i&&u.length>1)return t(u[0])}else {var a=e.name;D[a]=e,i=a;}return !r&&i&&(v=i),i||!r&&v},w=function(t,e){if(p(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new _(n)},O=g;O.l=S,O.i=p,O.w=function(t,e){return w(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var _=function(){function M(t){this.$L=S(t.locale,null,!0),this.parse(t);}var m=M.prototype;return m.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(O.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match(l);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init();},m.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},m.$utils=function(){return O},m.isValid=function(){return !(this.$d.toString()===$)},m.isSame=function(t,e){var n=w(t);return this.startOf(e)<=n&&n<=this.endOf(e)},m.isAfter=function(t,e){return w(t)<this.startOf(e)},m.isBefore=function(t,e){return this.endOf(e)<w(t)},m.$g=function(t,e,n){return O.u(t)?this[e]:this.set(n,t)},m.unix=function(){return Math.floor(this.valueOf()/1e3)},m.valueOf=function(){return this.$d.getTime()},m.startOf=function(t,e){var n=this,r=!!O.u(e)||e,h=O.p(t),$=function(t,e){var i=O.w(n.$u?Date.UTC(n.$y,e,t):new Date(n.$y,e,t),n);return r?i:i.endOf(a)},l=function(t,e){return O.w(n.toDate()[t].apply(n.toDate("s"),(r?[0,0,0,0]:[23,59,59,999]).slice(e)),n)},y=this.$W,M=this.$M,m=this.$D,g="set"+(this.$u?"UTC":"");switch(h){case c:return r?$(1,0):$(31,11);case f:return r?$(1,M):$(0,M+1);case o:var v=this.$locale().weekStart||0,D=(y<v?y+7:y)-v;return $(r?m-D:m+(6-D),M);case a:case d:return l(g+"Hours",0);case u:return l(g+"Minutes",1);case s:return l(g+"Seconds",2);case i:return l(g+"Milliseconds",3);default:return this.clone()}},m.endOf=function(t){return this.startOf(t,!1)},m.$set=function(t,e){var n,o=O.p(t),h="set"+(this.$u?"UTC":""),$=(n={},n[a]=h+"Date",n[d]=h+"Date",n[f]=h+"Month",n[c]=h+"FullYear",n[u]=h+"Hours",n[s]=h+"Minutes",n[i]=h+"Seconds",n[r]=h+"Milliseconds",n)[o],l=o===a?this.$D+(e-this.$W):e;if(o===f||o===c){var y=this.clone().set(d,1);y.$d[$](l),y.init(),this.$d=y.set(d,Math.min(this.$D,y.daysInMonth())).$d;}else $&&this.$d[$](l);return this.init(),this},m.set=function(t,e){return this.clone().$set(t,e)},m.get=function(t){return this[O.p(t)]()},m.add=function(r,h){var d,$=this;r=Number(r);var l=O.p(h),y=function(t){var e=w($);return O.w(e.date(e.date()+Math.round(t*r)),$)};if(l===f)return this.set(f,this.$M+r);if(l===c)return this.set(c,this.$y+r);if(l===a)return y(1);if(l===o)return y(7);var M=(d={},d[s]=e,d[u]=n,d[i]=t,d)[l]||1,m=this.$d.getTime()+r*M;return O.w(m,this)},m.subtract=function(t,e){return this.add(-1*t,e)},m.format=function(t){var e=this,n=this.$locale();if(!this.isValid())return n.invalidDate||$;var r=t||"YYYY-MM-DDTHH:mm:ssZ",i=O.z(this),s=this.$H,u=this.$m,a=this.$M,o=n.weekdays,f=n.months,h=function(t,n,i,s){return t&&(t[n]||t(e,r))||i[n].slice(0,s)},c=function(t){return O.s(s%12||12,t,"0")},d=n.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},l={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:O.s(a+1,2,"0"),MMM:h(n.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:O.s(this.$D,2,"0"),d:String(this.$W),dd:h(n.weekdaysMin,this.$W,o,2),ddd:h(n.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:O.s(s,2,"0"),h:c(1),hh:c(2),a:d(s,u,!0),A:d(s,u,!1),m:String(u),mm:O.s(u,2,"0"),s:String(this.$s),ss:O.s(this.$s,2,"0"),SSS:O.s(this.$ms,3,"0"),Z:i};return r.replace(y,(function(t,e){return e||l[t]||i.replace(":","")}))},m.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},m.diff=function(r,d,$){var l,y=O.p(d),M=w(r),m=(M.utcOffset()-this.utcOffset())*e,g=this-M,v=O.m(this,M);return v=(l={},l[c]=v/12,l[f]=v,l[h]=v/3,l[o]=(g-m)/6048e5,l[a]=(g-m)/864e5,l[u]=g/n,l[s]=g/e,l[i]=g/t,l)[y]||g,$?v:O.a(v)},m.daysInMonth=function(){return this.endOf(f).$D},m.$locale=function(){return D[this.$L]},m.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=S(t,e,!0);return r&&(n.$L=r),n},m.clone=function(){return O.w(this.$d,this)},m.toDate=function(){return new Date(this.valueOf())},m.toJSON=function(){return this.isValid()?this.toISOString():null},m.toISOString=function(){return this.$d.toISOString()},m.toString=function(){return this.$d.toUTCString()},M}(),T=_.prototype;return w.prototype=T,[["$ms",r],["$s",i],["$m",s],["$H",u],["$W",a],["$M",f],["$y",c],["$D",d]].forEach((function(t){T[t[1]]=function(e){return this.$g(e,t[0],t[1])};})),w.extend=function(t,e){return t.$i||(t(e,_,w),t.$i=!0),w},w.locale=S,w.isDayjs=p,w.unix=function(t){return w(1e3*t)},w.en=D[v],w.Ls=D,w.p={},w}));
} (dayjs_min));

var dayjs = dayjs_min.exports;

var customParseFormat$1 = {exports: {}};

(function (module, exports) {
	!function(e,t){module.exports=t();}(commonjsGlobal,(function(){var e={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},t=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|YYYY|YY?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,n=/\d\d/,r=/\d\d?/,i=/\d*[^-_:/,()\s\d]+/,o={},s=function(e){return (e=+e)+(e>68?1900:2e3)};var a=function(e){return function(t){this[e]=+t;}},f=[/[+-]\d\d:?(\d\d)?|Z/,function(e){(this.zone||(this.zone={})).offset=function(e){if(!e)return 0;if("Z"===e)return 0;var t=e.match(/([+-]|\d\d)/g),n=60*t[1]+(+t[2]||0);return 0===n?0:"+"===t[0]?-n:n}(e);}],h=function(e){var t=o[e];return t&&(t.indexOf?t:t.s.concat(t.f))},u=function(e,t){var n,r=o.meridiem;if(r){for(var i=1;i<=24;i+=1)if(e.indexOf(r(i,0,t))>-1){n=i>12;break}}else n=e===(t?"pm":"PM");return n},d={A:[i,function(e){this.afternoon=u(e,!1);}],a:[i,function(e){this.afternoon=u(e,!0);}],S:[/\d/,function(e){this.milliseconds=100*+e;}],SS:[n,function(e){this.milliseconds=10*+e;}],SSS:[/\d{3}/,function(e){this.milliseconds=+e;}],s:[r,a("seconds")],ss:[r,a("seconds")],m:[r,a("minutes")],mm:[r,a("minutes")],H:[r,a("hours")],h:[r,a("hours")],HH:[r,a("hours")],hh:[r,a("hours")],D:[r,a("day")],DD:[n,a("day")],Do:[i,function(e){var t=o.ordinal,n=e.match(/\d+/);if(this.day=n[0],t)for(var r=1;r<=31;r+=1)t(r).replace(/\[|\]/g,"")===e&&(this.day=r);}],M:[r,a("month")],MM:[n,a("month")],MMM:[i,function(e){var t=h("months"),n=(h("monthsShort")||t.map((function(e){return e.slice(0,3)}))).indexOf(e)+1;if(n<1)throw new Error;this.month=n%12||n;}],MMMM:[i,function(e){var t=h("months").indexOf(e)+1;if(t<1)throw new Error;this.month=t%12||t;}],Y:[/[+-]?\d+/,a("year")],YY:[n,function(e){this.year=s(e);}],YYYY:[/\d{4}/,a("year")],Z:f,ZZ:f};function c(n){var r,i;r=n,i=o&&o.formats;for(var s=(n=r.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(t,n,r){var o=r&&r.toUpperCase();return n||i[r]||e[r]||i[o].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(e,t,n){return t||n.slice(1)}))}))).match(t),a=s.length,f=0;f<a;f+=1){var h=s[f],u=d[h],c=u&&u[0],l=u&&u[1];s[f]=l?{regex:c,parser:l}:h.replace(/^\[|\]$/g,"");}return function(e){for(var t={},n=0,r=0;n<a;n+=1){var i=s[n];if("string"==typeof i)r+=i.length;else {var o=i.regex,f=i.parser,h=e.slice(r),u=o.exec(h)[0];f.call(t,u),e=e.replace(u,"");}}return function(e){var t=e.afternoon;if(void 0!==t){var n=e.hours;t?n<12&&(e.hours+=12):12===n&&(e.hours=0),delete e.afternoon;}}(t),t}}return function(e,t,n){n.p.customParseFormat=!0,e&&e.parseTwoDigitYear&&(s=e.parseTwoDigitYear);var r=t.prototype,i=r.parse;r.parse=function(e){var t=e.date,r=e.utc,s=e.args;this.$u=r;var a=s[1];if("string"==typeof a){var f=!0===s[2],h=!0===s[3],u=f||h,d=s[2];h&&(d=s[2]),o=this.$locale(),!f&&d&&(o=n.Ls[d]),this.$d=function(e,t,n){try{if(["x","X"].indexOf(t)>-1)return new Date(("X"===t?1e3:1)*e);var r=c(t)(e),i=r.year,o=r.month,s=r.day,a=r.hours,f=r.minutes,h=r.seconds,u=r.milliseconds,d=r.zone,l=new Date,m=s||(i||o?1:l.getDate()),M=i||l.getFullYear(),Y=0;i&&!o||(Y=o>0?o-1:l.getMonth());var p=a||0,v=f||0,D=h||0,g=u||0;return d?new Date(Date.UTC(M,Y,m,p,v,D,g+60*d.offset*1e3)):n?new Date(Date.UTC(M,Y,m,p,v,D,g)):new Date(M,Y,m,p,v,D,g)}catch(e){return new Date("")}}(t,a,r),this.init(),d&&!0!==d&&(this.$L=this.locale(d).$L),u&&t!=this.format(a)&&(this.$d=new Date("")),o={};}else if(a instanceof Array)for(var l=a.length,m=1;m<=l;m+=1){s[1]=a[m-1];var M=n.apply(this,s);if(M.isValid()){this.$d=M.$d,this.$L=M.$L,this.init();break}m===l&&(this.$d=new Date(""));}else i.call(this,e);};}}));
} (customParseFormat$1));

var customParseFormat = customParseFormat$1.exports;

dayjs.extend(customParseFormat);

/**
 * Use dayjs to parse cell contents for sorting
 * @param  {String} content     The datetime string to parse
 * @param  {String} format      The format for dayjs to use
 * @return {String|Boolean}     Datatime string or false
 */
const parseDate = (content, format) => {
    let date = false;

    // Converting to YYYYMMDD ensures we can accurately sort the column numerically

    if (format) {
        switch (format) {
        case "ISO_8601":
            // ISO8601 is already lexiographically sorted, so we can just sort it as a string.
            date = content;
            break
        case "RFC_2822":
            date = dayjs(content.slice(5), "DD MMM YYYY HH:mm:ss ZZ").unix();
            break
        case "MYSQL":
            date = dayjs(content, "YYYY-MM-DD hh:mm:ss").unix();
            break
        case "UNIX":
            date = dayjs(content).unix();
            break
        // User defined format using the data-format attribute or columns[n].format option
        default:
            date = dayjs(content, format, true).valueOf();
            break
        }
    }
    return date
};

var date = /*#__PURE__*/Object.freeze({
    __proto__: null,
    parseDate: parseDate
});

export { DataTable };
//# sourceMappingURL=module.js.map
