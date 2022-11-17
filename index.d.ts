declare module "simple-datatables"{
    /**A lightweight, extendable, dependency-free javascript HTML table plugin. Similar to jQuery DataTables for use in modern browsers, but without the jQuery dependency.
     *
     * Docs :https://github.com/fiduswriter/Simple-DataTables/wiki/Getting-Started#browser
     */
    class DataTable {

        constructor(table: string | HTMLElement, option?: DataTableOptions);
        /**Returns a reference to the HTMLTableElement. */
        table:HTMLElement;
        /**Returns a reference to the HTML <thead> element. */
        head:HTMLTableCellElement;
        /**Returns a reference to the HTML <tbody> element. */
        body:HTMLElement;
        /**Returns a reference to the HTML <tfoot> element. */
        foot:HTMLElement;
        /**Returns a reference to the main HTMLDivElement that wraps the entire layout. */
        wrapper:HTMLDivElement;
        /**Returns a reference to the main HTMLDivElement that contains the table. */
        container:HTMLDivElement;
        /**Returns a reference to the currently displayed pagers. */
        pagers : [];
        /** Returns a live HTMLCollection of the the table headings.*/
        headings : HTMLCollection;
        /**Returns the current configuration options. */
        options:DataTableOptions;
        /**Returns true if the library is fully loaded and all HTML is rendered. */
        initialized:boolean;
        /** Returns a collection of all HTMLTableRowElements in the table.*/
        data : HTMLTableRowElement[];
        /** All rows in the data array have a custom propery named dataIndex. This represents the position in the data array. It can be useful for getting the correct position of a row as the native rowIndex property may be either -1 if the row isn't rendered or incorrect if you're on any other page than page 1.
        Also, in some browsers, the first row of a tbody element will have a rowIndex of 1 instead of 0 as they take the thead row as the first row.*/
        dataIndex : Number;
        /** The activeRows property is similar to the data property in that it contains all rows of the current instance, but it takes into account the number of hidden columns as well.*/
        activeRows: [];
        /**Returns a collection of pages each of which contain collections of HTMLTableRowElements. */
        pages: HTMLTableRowElement[];
        /**Returns true if the current table has rows. */
        hasRows : boolean;
        /**Returns true if the current table has headings. */
        hasHeadings : boolean;
        /**Returns the current page number. */
        currentPage : Number;
        /**Returns the number of pages. */
        totalPages : Number;
        /**Returns true if the current page is also the first page. */
        onFirstPage : boolean;
        /** Returns true if the current page is also the last page. */
        onLastPage: boolean;
        /**Returns true if a search is currently being done and search results are displayed. */
        searching : boolean;
        /**Returns a collection of HTMLTableRowElements containing matching results. */
        searchData : [];
        /**Search Input Element */
        input : HTMLInputElement;
        /**Pagination Label Element */
        label : HTMLElement;
        /**To use the columns API just access the  columns property on the current instance: Docs : https://github.com/fiduswriter/Simple-DataTables/wiki/columns-API */
        columns : Columns;
        /**To use the rows API just access the rows property on the current instance: Docs : https://github.com/fiduswriter/Simple-DataTables/wiki/rows-API */
        rows : Rows;
        /**Simple-DataTables fires it's own events which you can listen for by utilising the .on() method: Docs: https://github.com/fiduswriter/Simple-DataTables/wiki/on()*/
        on(event : tableEvents, func :any):void;
        /**Refreshes the table. This will recount the rows, reset any search and remove any set message, but will not reset any sorting. */
        refresh():void;
        /**Insert new data in to the table. If you attempt to pass new headings to a table that has headings, they'll be ignored. Docs : https://github.com/fiduswriter/Simple-DataTables/wiki/insert()*/
        insert(data : object[]):void;
        /**Loads a given page. Page number must be an integer. */
        page(number : number):void;
        /**Display a message in the table. */
        setMessage(message : string):void;
        /** Initialise the instance after destroying.
         *
         *You can pass an optional object of options to the method if you require new a new config.
         *
         * Docs: https://github.com/fiduswriter/Simple-DataTables/wiki/init()
        */
        init(options? : DataTableOptions):void;
        /**Destroy this data table instance*/
        destroy():void;
        /**Export the table data to various formats.
         *
         * The options argument must be an object of which the only required property is the type property which accepts either csv, txt, json or sql as it's value. The rest are optional:
         *
         * {
                type: "csv" // "csv", "txt", "json" or "sql"

                download: true, // trigger download of file or return the string
                skipColumn: [], // array of column indexes to skip

                // csv
                lineDelimiter:  "\n", // line delimiter for csv type
                columnDelimiter:  ",", // column delimiter for csv type

                // sql
                tableName: "myTable", // SQL table name for sql type

                // json
                replacer: null, // JSON.stringify's replacer parameter for json type
                space: 4 // JSON.stringify's space parameter for json type
            };
         *
            Docs : https://github.com/fiduswriter/Simple-DataTables/wiki/export()
        */
        export(options? : object):boolean;
        /**Import data into the table from json or csv strings.
         *
         * The options argument must be an object of which the only required properties are data and type. The data property should be the csv or json string and the type property should indicate the type of data being imported - csv or json.
         *
         * {
                type: "csv" // or "json"
                data: // the csv or json string

                // csv only
                headings: false, // specifies whether the first line contains the headings
                lineDelimiter:  "\n", // line delimiter for csv type
                columnDelimiter:  ",", // column delimiter for csv type
            };

            Note that if the table already has headings, the first line will be treated as tbody cell data regardless of whether the headings property is set to true or not.

            Note that whilst checks are performed for valid json strings, none are present for csv checking so it's up to you to make sure the formatting is correct.
         *
         * Docs :https://github.com/fiduswriter/Simple-DataTables/wiki/import()
        */
       import(options? : object): boolean;
        /**NOTE: The print() method has been deprecated and will be removed in v2.0 in favour of the Exportable extension : https://github.com/Mobius1/Exportable.
         *
         *
         * Docs :https://github.com/fiduswriter/Simple-DataTables/wiki/print()
         */
        print():void;

    }

    interface Rows{
        /**Add new row data to the current instance. The data parameter must be an array of strings to be inserted into each of the new row's cells. */
        add(data : string[]):void;
        /**Remove existing rows from the current instance. The select parameter can either be an integer or array of integers representing the row indexes. */
        remove(select : [] | number):void;

    }

    interface NewColumnData{
        heading:string;
        data? : string[];
    }
    interface Columns {
        /**Sort the selected column. The column parameter should be a non-zero-based integer. The direction parameter is optional. */
        sort(column : Number, direction? : 'desc' | 'asc'):any;
        /**Add a new column to the current instance. The data parameter should be an object with the required heading and data properties set. The heading property should be a string representing the new column's heading. The data property should be an array of strings representing the cell content of the new column. */
        add(data : NewColumnData):void;
        /**Remove a column or columns from the current instance. The select parameter should be either an integer or an array of integers representing the column indexes to be removed. */
        remove(select : number[] | number):void;
        /**Hides the selected column(s). The columns will not be visible and will be omitted from search results and exported data. */
        hide(select : number[] | number):void;
        /**Shows the selected column(s) (if hidden). The columns will be visible and will be included in search results and exported data. */
        show(select : number[] | number) : void;
        /**Checks to see if the selected column(s) are visible. Returns a boolean for single indexes or an array of booleans for multiple indexes. */
        visible(select : number[] | number) :void;
        /**Checks to see if the selected column(s) are visible. Returns a boolean for single indexes or an array of booleans for multiple indexes. */
        hidden(select : number[] | number) : boolean | boolean[];
        /**Swap th position of two columns. Just pass an array of 2 integers representing the column indexes you require swapping. */
        swap(indexes : number[]):void;
        /**Order the columns based on the given order. Just pass an array of column indexes in the order you require: */
        order(indexes : number[]) :void;

    }



    interface ColumnOption{
        /**An integer or array of integers representing the column(s) to be manipulated. */
        select : number;
        /**Automatically sort the selected column. Can only be applied if a single column is selected. */
        sort? : "asc" | "desc";
        /**When set to false the column(s) cannot be sorted. */
        sortable? : boolean;
        /**When set to true the column(s) will not be visible and will be excluded from search results. */
        hidden?:boolean;
        /**
         * A string reperesenting the type of data in the column(s) cells. Choose from the following options:

        string - lexical ordering (default)
        number - any string with currency symbols, . or , thousand seperators, %, etc
        date - a valid datetime string
         */
        type?:string;
        /**A string representing the datetime format when using the date type. */
        format?:string;
        /**
         * A callback to customise the rendering of the column(s) cell content. The function takes 3 parameters and should return the formatted cell content.
         *
         *
            * @param {String} data The cell's content (innerHTML)
            * @param {Object} cell The HTMLTableCellElement
            * @param {Object} row The cell's parent HTMLTableRowElement
            *
            render: function(data, cell, row) {

            }
         */
        render(callback : render):any;

    }
    type render =  (data : string,cell: Object,row:Object,) => void;

    interface DataOption{
        headings?: string[];
        data : string[];
    }
    interface DataTableOptions{
        /**Controls various aspects of individual or groups of columns. Should be an array of objects with the following properties:
         *
         * Docs :https://github.com/fiduswriter/Simple-DataTables/wiki/columns
         */
        columns?:ColumnOption[];
        /**
         * Pass an object of data to populate the table.
         *
         * You can set both the headings and rows with headings and data properties, respectively. The headings property is optional.
         *
         * Docs : https://github.com/fiduswriter/Simple-DataTables/wiki/data
         */
        data?:DataOption;
        /**Toggle the skip to first page and skip to last page buttons.
         * Default: false
         */
        firstLast?:boolean;
        /**
         * default: '&laquo;'
         * Set the content of the skip to first page button.
         *
         */
        firstText?:string;
        /**
         * Default: true
         * Fix the width of the columns. This stops the columns changing width when loading a new page.
         */
        fixedColumns?:boolean;
        /**
         * Default: false
         * Fix the height of the table. This is useful if your last page contains less rows than set in the perPage options and simply stops the table from changing size and affecting the layout of the page.
         */
        fixedHeight?:boolean;
        /**
         * Default: false
         * Enable or disable the table footer.
         */
        footer?:boolean;
        /**
         * Default :true
         * Enable or disable the table header.
         */
        header?:boolean;
        /**
         * Default:false
         * Whether to hide the table header.
         */
        hiddenHeader?:boolean;
        /**
         * Customise the displayed labels. (v1.0.6 and above)
         *
         * Defaults :
         *
         * labels: {
         *
                placeholder: "Search...",
                perPage: "{select} entries per page",
                noRows: "No entries to found",
                info: "Showing {start} to {end} of {rows} entries",
            }
         *
         * Docs : https://github.com/fiduswriter/Simple-DataTables/wiki/labels
         */
        labels?:LabelsOptions;
        /**
         * Default:
         * layout: {
         *
         *           top: "{select}{search}",
         *           bottom: "{info}{pager}"
         *   },
         *
         *Allows for custom arranging of the DOM elements in the top and bottom containers. There are for 4 variables you can utilize:
         *
         *       {select} - The per-page dropdown
         *       {search} - The search input
         *       {info} - The info label (Showing X of Y entries)
         *       {pager} - The pager
         *   A maximum of 2 variables per container (top or bottom) is recommended. If you need to use more than 2 then you'll have to sort the CSS out to make them fit.
         *
         *   Note, also, that while the {select}, {search} and {info} variables are single-use only, the {pager} variable can be used multiple times to produce multiple pagers.
         *
         *   Use of the {select} variable depends on the option perPageSelect being enabled and use of the {search} variable depends on the option searchable being enabled. Trying to use these variables while their corresponding options are disabled will result in nothing being inserted.
         *
         *
         * Docs :https://github.com/fiduswriter/Simple-DataTables/wiki/layout
         */
        layout?:LayoutOptions;
        /**
         * default: '&raquo;'
         * Set the content of the skip to last page button.
         */
        lastText?:string;
        /**
         * Default : true
         * Toggle the next and previous pagination buttons.
         */
        nextPrev?: number;
        /**
         * default: '&rsaquo;'
         * Set the content on the next button.
         */
        nextText?:string;
        /**
         * Default : true
         * Whether or not paging is enabled for the table
         */
        paging?:boolean;
        /**
         * Default : 10
         * Sets the maximum number of rows to display on each page.
         */
        perPage?:number;
        /**
         * Default: [5, 10, 15, 20, 25]
         *
         * Sets the per page options in the dropdown. Must be an array of integers.
         *
         *   Setting this to false will hide the dropdown.
         */
        perPageSelect?: number[];
        /**
         * default: '&lsaquo;'
         * Set the content on the previous button.
         */
        prevText?:string;
        /**
         * Default : ""
         *
         * Enable vertical scrolling. Vertical scrolling will constrain the DataTable to the given height, and enable scrolling for any data which overflows the current viewport. This can be used as an alternative to paging to display a lot of data in a small area.
         *
         * The value given here can be given in any CSS unit.
         */
        scrollY?:string;
        /**
         * Default: true
         * Toggle the ability to search the dataset
         */
        searchable?:boolean;
        /**
         * Default: true
         * Toggle the ability to sort the columns.
         *
         * This option will be forced to false if the table has no headings.
         */
        sortable?:boolean;
        /**
         * Default: true
         * Truncate the page links to prevent overflow with large datasets.
         */
        truncatePager?:boolean;

    }

    interface LabelsOptions {
        /**
         * default: 'Search...'
         * Sets the placeholder of the search input.
         */
        placeholder?:string;
        /**
         * default: '{select} entries per page'
         * Sets the per-page dropdown's label
         *
         * {select} - the per-page dropdown (required)
         */
        perPage?:string;
        /**
         * default: 'No entries found'
         * The message displayed when there are no search results
         */
        noRows?:string;
        /**
         * default: 'No results match your search query'
         * The message displayed when there are no search results
         */
        noResults?:string;
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
        info?:string;
    }

    interface LayoutOptions {
        /**
         * default: '{select}{search}'
         * Sets the top container content
         *
         * {select} - The per-page dropdown
         * {search} - The search input
         * {info} - The info label (Showing X of Y entries)
         * {pager} - The pager
         */
        top?:string;
        /**
         * default: '{info}{pager}'
         * Sets the bottom container content
         *
         * {select} - The per-page dropdown
         * {search} - The search input
         * {info} - The info label (Showing X of Y entries)
         * {pager} - The pager
         */
        bottom?:string;
    }

    /**See list of events here : https://github.com/fiduswriter/Simple-DataTables/wiki/Events */
    type tableEvents =
    "datatable.page"
    | "datatable.init"
    | "datatable.refresh"
    | "datatable.update"
    | "datatable.sort"
    | "datatable.perpage"
    | "datatable.search"
    | "datatable.selectrow"

    export {DataTable, DataTableOptions}
}
