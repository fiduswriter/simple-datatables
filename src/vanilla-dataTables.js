/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobius.ovh)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 1.2.4
 *
 */
(function(root, factory) {
	var plugin = "DataTable";

	if (typeof define === "function" && define.amd) {
		define([], factory(plugin));
	} else if (typeof exports === "object") {
		module.exports = factory(plugin);
	} else {
		root[plugin] = factory(plugin);
	}
})(this, function(plugin) {
	
	"use strict";
	
	var win = window,
		doc = document,
		body = doc.body;

	/**
	 * Object.assign polyfill
	 * @param  {Object} target
	 * @param  {Object} args
	 * @return {Object}
	 */
	var extend = function(r, t) {
		for (var e = Object(r), n = 1; n < arguments.length; n++) {
			var a = arguments[n];
			if (null != a)
				for (var o in a)
					Object.prototype.hasOwnProperty.call(a, o) && (e[o] = a[o]);
		}
		return e;
	};

	/**
	 * Iterator helper
	 * @param  {(Array|Object)}   arr Any object, array or array-like collection.
	 * @param  {Function} f   The callback function
	 * @param  {Object}   s      Change the value of this
	 * @return {Void}
	 */
	var each = function(arr, fn, s) {
		if ("[object Object]" === Object.prototype.toString.call(arr)) {
			for (var d in arr) {
				if (Object.prototype.hasOwnProperty.call(arr, d)) {
					fn.call(s, d, arr[d]);
				}
			}
		} else {
			for (var e = 0, f = arr.length; e < f; e++) {
				fn.call(s, e, arr[e]);
			}
		}
	};
	
	/**
	 * Add event listener to target
	 * @param  {Object} el
	 * @param  {String} e
	 * @param  {Function} fn
	 */
	var on = function(el, e, fn) {
		el.addEventListener(e, fn, false);
	};	

	/**
	 * Create DOM element node
	 * @param  {String}   a nodeName
	 * @param  {Object}   b properties and attributes
	 * @return {Object}
	 */
	var createElement = function(a, b) {
		var d = doc.createElement(a);
		if (b && "object" == typeof b) {
			var e;
			for (e in b) {
				if ("html" === e) {
					d.innerHTML = b[e];
				} else {
					d.setAttribute(e, b[e]);
				}
			}
		}
		return d;
	};
	
	/**
	 * Check for valid JSON string
	 * @param  {String}   str
	 * @return {Boolean|Array|Object}
	 */	
	var isJson = function(str) {
		var t = !1;
		try {
			t = JSON.parse(str)
		} catch (str) {
			return !1
		}
		return !(null === t || !Array.isArray(t) && "[object Object]" !== Object.prototype.toString.call(t)) && t
	};
	
	var flush = function(el, ie) {
		if (el instanceof NodeList) {
			each(el, function(i, e) {
				flush(e, ie);
			});
		} else {
			if (ie) {
				while (el.hasChildNodes()) {
					el.removeChild(el.firstChild);
				}
			} else {
				el.innerHTML = "";
			}
		}
	};
	
	/**
	 * Create button helper
	 * @param  {String}   c
	 * @param  {Number}   p
	 * @param  {String}   t
	 * @return {Object}
	 */		
	var button = function(c, p, t) {
		return createElement("li", {
			class: c,
			html: '<a href="#" data-page="' + p + '">' + t + "</a>"
		});
	};	

	/**
	 * classList shim
	 * @type {Object}
	 */
	var classList = {
		add: function(s, a) {
			classList.contains(s, a) ||
				(s.classList
					? s.classList.add(a)
					: (s.className = s.className.trim() + " " + a));
		},
		remove: function(s, a) {
			classList.contains(s, a) &&
				(s.classList
					? s.classList.remove(a)
					: (s.className = s.className.replace(
							new RegExp("(^|\\s)" + a.split(" ").join("|") + "(\\s|$)", "gi"),
							" "
						)));
		},
		contains: function(s, a) {
			if (s)
				return s.classList
					? s.classList.contains(a)
					: !!s.className &&
							!!s.className.match(new RegExp("(\\s|^)" + a + "(\\s|$)"));
		}		
	};


	// Sort the rows into pages
	var paginate = function() {
		var perPage = this.options.perPage,
			rows = this.activeRows;

		if (this.searching) {
			rows = [];

			each(
				this.searchData,
				function(i, index) {
					rows.push(this.activeRows[index]);
				},
				this
			);
		}

		// Check for hidden columns
		this.pages = rows
			.map(function(tr, i) {
				return i % perPage === 0 ? rows.slice(i, i + perPage) : null;
			})
			.filter(function(page) {
				return page;
			});

		this.totalPages = this.lastPage = this.pages.length;
	};

	// Render a page
	var render = function() {
		if (this.hasRows && this.totalPages) {
			if (this.currentPage > this.totalPages) {
				this.currentPage = 1;
			}

			// Use a fragment to limit touching the DOM
			var index = this.currentPage - 1,
				frag = doc.createDocumentFragment();

			flush(this.header, this.isIE);
			each(
				this.activeHeadings,
				function(i, th) {
					this.header.appendChild(th);
				},
				this
			);

			each(
				this.pages[index],
				function(i, row) {
					frag.appendChild(row);
				},
				this
			);

			this.clear(frag);

			this.onFirstPage = false;
			this.onLastPage = false;

			switch (this.currentPage) {
				case 1:
					this.onFirstPage = true;
					break;
				case this.lastPage:
					this.onLastPage = true;
					break;
			}
		}

		// Update the info
		var current = 0,
			f = 0,
			t = 0,
			items;

		if (this.totalPages) {
			current = this.currentPage - 1;
			f = current * this.options.perPage;
			t = f + this.pages[current].length;
			f = f + 1;
			items = !!this.searching ? this.searchData.length : this.rows.length;
		}

		if (this.label && this.options.labels.info.length) {
			// CUSTOM LABELS
			var string = this.options.labels.info
				.replace("{start}", f)
				.replace("{end}", t)
				.replace("{page}", this.currentPage)
				.replace("{pages}", this.totalPages)
				.replace("{rows}", items);

			this.label.innerHTML = items ? string : "";
		}

		if (this.options.fixedHeight && this.currentPage == 1) {
			fixHeight.call(this);
		}
	};

	/**
	 * Render the pager(s)
	 */
	var renderPager = function() {
		flush(this.pagers, this.isIE);

		if (this.totalPages > 1) {
			var c = "pager",
				frag = doc.createDocumentFragment(),
				prev = this.onFirstPage ? 1 : this.currentPage - 1,
				next = this.onlastPage ? this.totalPages : this.currentPage + 1;

			// first button
			if (this.options.firstLast) {
				frag.appendChild(button(c, 1, this.options.firstText));
			}

			// prev button
			if (this.options.nextPrev) {
				frag.appendChild(button(c, prev, this.options.prevText));
			}

			var pager = this.links;

			// truncate the links
			if (this.options.truncatePager) {
				pager = truncate(
					this.links,
					this.currentPage,
					this.pages.length,
					this.options.pagerDelta
				);
			}

			// active page link
			classList.add(this.links[this.currentPage - 1], "active");

			// append the links
			each(pager, function(i, p) {
				classList.remove(p, "active");
				frag.appendChild(p);
			});

			classList.add(this.links[this.currentPage - 1], "active");

			// next button
			if (this.options.nextPrev) {
				frag.appendChild(button(c, next, this.options.nextText));
			}

			// first button
			if (this.options.firstLast) {
				frag.appendChild(button(c, this.totalPages, this.options.lastText));
			}

			// We may have more than one pager
			each(this.pagers, function(i, pager) {
				pager.appendChild(frag.cloneNode(true));
			});
		}
	};

	/**
	 * Bubble sort algorithm
	 */
	var sortItems = function(a, b) {
		var c, d;
		if (1 === b) {
			c = 0;
			d = a.length;
		} else {
			if (b === -1) {
				c = a.length - 1;
				d = -1;
			}
		}
		for (var e = !0; e; ) {
			e = !1;
			for (var f = c; f != d; f += b) {
				if (a[f + b] && a[f].value > a[f + b].value) {
					var g = a[f],
						h = a[f + b],
						i = g;
					a[f] = h;
					a[f + b] = i;
					e = !0;
				}
			}
		}
		return a;
	};

	/**
	 * Fix container height
	 */
	var fixHeight = function() {
		this.container.style.height = null;
		this.rect = this.container.getBoundingClientRect();
		this.container.style.height = this.rect.height + "px";
	};

	/**
	 * Pager truncation algorithm
	 */
	var truncate = function(a, b, c, d) {
		d = d || 2;
		var j,
			e = 2 * d,
			f = b - d,
			g = b + d,
			h = [],
			i = [];
		if (b < 4 - d + e) {
			g = 3 + e;
		} else if (b > c - (3 - d + e)) {
			f = c - (2 + e);
		}
		for (var k = 1; k <= c; k++) {
			if (1 == k || k == c || (k >= f && k <= g)) {
				var l = a[k - 1];
				classList.remove(l, "active");
				h.push(l);
			}
		}
		each(h, function(b, c) {
			var d = c.children[0].getAttribute("data-page");
			if (j) {
				var e = j.children[0].getAttribute("data-page");
				if (d - e == 2) i.push(a[e]);
				else if (d - e != 1) {
					var f = createElement("li", {
						class: "ellipsis",
						html: '<a href="#">&hellip;</a>'
					});
					i.push(f);
				}
			}
			i.push(c);
			j = c;
		});

		return i;
	};

	/**
	 * Parse data to HTML table
	 */
	var dataToTable = function(data) {
		var thead = false,
			tbody = false;

		data = data || this.options.data;

		if (data.headings) {
			thead = createElement("thead");
			var tr = createElement("tr");
			each(data.headings, function(i, col) {
				var td = createElement("th", {
					html: col
				});
				tr.appendChild(td);
			});

			thead.appendChild(tr);
		}

		if (data.rows) {
			tbody = createElement("tbody");
			each(data.rows, function(i, rows) {
				if (data.headings) {
					if (data.headings.length !== rows.length) {
						throw new Error(
							"The number of rows do not match the number of headings."
						);
					}
				}
				var tr = createElement("tr");
				each(rows, function(k, value) {
					var td = createElement("td", {
						html: value
					});
					tr.appendChild(td);
				});
				tbody.appendChild(tr);
			});
		}

		if (thead) {
			if (this.table.tHead !== null) {
				this.table.removeChild(this.table.tHead);
			}
			this.table.appendChild(thead);
		}

		if (tbody) {
			if (this.table.tBodies.length) {
				this.table.removeChild(this.table.tBodies[0]);
			}
			this.table.appendChild(tbody);
		}
	};

	/**
	 * Use moment.js to parse cell contents for sorting
	 * @param  {String} content 	The datetime string to parse
	 * @param  {String} format  	The format for moment to use
	 * @return {String|Boolean} 	Datatime string or false
	 */
	var parseDate = function(content, format) {
		var date = false;

		// moment() throws a fit if the string isn't a valid datetime string
		// so we need to supply the format to the constructor (https://momentjs.com/docs/#/parsing/string-format/)

		// Converting to YYYYMMDD ensures we can accurately sort the column numerically

		if (format) {
			switch (format) {
				case "ISO_8601":
					date = moment(content, moment.ISO_8601).format("YYYYMMDD");
					break;
				case "RFC_2822":
					date = moment(content, "ddd, MM MMM YYYY HH:mm:ss ZZ").format("YYYYMMDD");
					break;
				case "MYSQL":
					date = moment(content, "YYYY-MM-DD hh:mm:ss").format("YYYYMMDD");
					break;
				case "UNIX":
					date = moment(content).unix();
					break;
				// User defined format using the data-format attribute or columns[n].format option
				default:
					date = moment(content, format).format("YYYYMMDD");
					break;
			}
		}

		return date;
	};

	/**
	 * Columns API
	 * @param {Object} instance DataTable instance
	 * @param {Mixed} columns  Column index or array of column indexes
	 */
	var Columns = function(dt, columns) {
		this.dt = dt;
		this.columns = columns;

		return this;
	}
	
	var clms = Columns.prototype;

	/**
	 * Get the columns
	 * @return {Mixed} columns  Column index or array of column indexes
	 */
	clms.select = function() {
		var columns = this.columns;
		if (!Array.isArray(columns)) {
			columns = [];
			columns.push(this.columns);
		}
		return columns;
	};

	/**
	 * Swap two columns
	 * @return {Void}
	 */
	clms.swap = function() {
		if (this.columns.length && this.columns.length === 2) {
			var columns = [];

			// Get the current column indexes
			each(
				this.dt.headings,
				function(i, heading) {
					columns.push(i);
				},
				this
			);

			var x = this.columns[0];
			var y = this.columns[1];
			var b = columns[y];
			columns[y] = columns[x];
			columns[x] = b;

			this.order(columns);
		}
	};

	/**
	 * Reorder the columns
	 * @return {Array} columns  Array of ordered column indexes
	 */
	clms.order = function(columns) {
		var b, c, d;

		var temp_a = [];
		var temp_b = [];
		var temp_c = [];
		var temp_d = [];

		// Order the headings
		each(
			columns,
			function(x, column) {
				temp_a.push(this.dt.headings[column].cloneNode(true));

				if (this.dt.hiddenColumns.indexOf(column) < 0) {
					b = this.dt.headings[column].cloneNode(true);
					b.originalCellIndex = x;
					temp_b.push(b);
				}
			},
			this
		);

		// Order the row cells
		each(
			this.dt.rows,
			function(i, row) {
				c = row.cloneNode();
				d = row.cloneNode();

				if (row.searchIndex !== null && row.searchIndex !== undefined) {
					c.searchIndex = row.searchIndex;
					d.searchIndex = row.searchIndex;
				}

				// Append to cell to the fragment in the correct order
				each(
					columns,
					function(x, column) {
						c.appendChild(row.cells[column].cloneNode(true));

						if (this.dt.hiddenColumns.indexOf(column) < 0) {
							d.appendChild(row.cells[column].cloneNode(true));
						}
					},
					this
				);

				temp_c.push(c);
				temp_d.push(d);
			},
			this
		);

		this.dt.headings = temp_a;
		this.dt.activeHeadings = temp_b;

		this.dt.rows = temp_c;
		this.dt.activeRows = temp_d;

		// Update
		this.dt.update();
	};

	/**
	 * Hide columns
	 * @return {Void}
	 */
	clms.hide = function() {
		var columns = this.select();

		if (columns.length) {
			each(
				columns,
				function(i, column) {
					if (this.dt.hiddenColumns.indexOf(column) < 0) {
						this.dt.hiddenColumns.push(column);
					}
				},
				this
			);

			this.rebuild();
		}
	};

	/**
	 * Show columns
	 * @return {Void}
	 */
	clms.show = function() {
		var columns = this.select();

		if (columns.length) {
			var index;

			each(
				columns,
				function(i, column) {
					index = this.dt.hiddenColumns.indexOf(column);
					if (index > -1) {
						this.dt.hiddenColumns.splice(index, 1);
					}
				},
				this
			);

			this.rebuild();
		}
	};

	/**
	 * Check column(s) visibility
	 * @return {Boolean}
	 */
	clms.visible = function() {
		var columns;

		if (!isNaN(this.columns)) {
			columns = this.dt.hiddenColumns.indexOf(this.columns) < 0;
		} else if (Array.isArray(this.columns)) {
			columns = [];
			each(
				this.columns,
				function(i, column) {
					columns.push(this.dt.hiddenColumns.indexOf(column) < 0);
				},
				this
			);
		}

		return columns;
	};

	/**
	 * Check column(s) visibility
	 * @return {Boolean}
	 */
	clms.hidden = function() {
		var columns;

		if (!isNaN(this.columns)) {
			columns = this.dt.hiddenColumns.indexOf(this.columns) > -1;
		} else if (Array.isArray(this.columns)) {
			columns = [];
			each(
				this.columns,
				function(i, column) {
					columns.push(this.dt.hiddenColumns.indexOf(column) > -1);
				},
				this
			);
		}

		return columns;
	};

	/**
	 * Rebuild the columns
	 * @return {Void}
	 */
	clms.rebuild = function() {
		var a, b;
		var temp = [];

		this.dt.activeRows = [];
		this.dt.activeHeadings = [];

		each(
			this.dt.headings,
			function(i, th) {
				th.originalCellIndex = i;
				if (this.dt.hiddenColumns.indexOf(i) < 0) {
					this.dt.activeHeadings.push(th);
				}
			},
			this
		);

		// Loop over the rows and reorder the cells
		each(
			this.dt.rows,
			function(i, row) {
				a = row.cloneNode();
				b = row.cloneNode();

				if (row.searchIndex !== null && row.searchIndex !== undefined) {
					a.searchIndex = row.searchIndex;
					b.searchIndex = row.searchIndex;
				}

				// Append to cell to the fragment in the correct order
				each(
					row.cells,
					function(x, cell) {
						a.appendChild(cell.cloneNode(true));

						if (this.dt.hiddenColumns.indexOf(cell.cellIndex) < 0) {
							b.appendChild(cell.cloneNode(true));
						}
					},
					this
				);

				// Append the fragment with the ordered cells
				temp.push(a);
				this.dt.activeRows.push(b);
			},
			this
		);

		this.dt.rows = temp;

		this.dt.update();
	};

	////////////////////
	//    MAIN LIB    //
	////////////////////

	var DataTable = function(table, options) {
		var defaults = {
			perPage: 10,
			perPageSelect: [5, 10, 15, 20, 25],

			sortable: true,
			searchable: true,

			// Pagination
			nextPrev: true,
			firstLast: false,
			prevText: "&lsaquo;",
			nextText: "&rsaquo;",
			firstText: "&laquo;",
			lastText: "&raquo;",
			truncatePager: true,
			pagerDelta: 2,

			fixedColumns: true,
			fixedHeight: false,

			header: true,
			footer: false,

			// Customise the display text
			labels: {
				placeholder: "Search...", // The search input placeholder
				perPage: "{select} entries per page", // per-page dropdown label
				noRows: "No entries found", // Message shown when there are no search results
				info: "Showing {start} to {end} of {rows} entries" //
			},

			// Customise the layout
			layout: {
				top: "{select}{search}",
				bottom: "{info}{pager}"
			}
		};

		this.initialized = false;

		// user options
		this.options = extend(defaults, options);

		// Checks
		if (!table) {
			throw new Error("The plugin requires a table as the first parameter");
		}

		if (typeof table === "string") {
			var selector = table;
			table = document.querySelector(table);

			if (!table) {
				throw new Error("The element '" + selector + "' can not be found.");
			}
		}

		if (table.tagName.toLowerCase() !== "table") {
			throw new Error("The selected element is not a table.");
		}

		// Disable manual sorting if no header is present (#4)
		if (!this.options.header) {
			this.options.sortable = false;
		}

		if (table.tHead === null) {
			if (
				!this.options.data ||
				(this.options.data && !this.options.data.headings)
			) {
				this.options.sortable = false;
			}
		}

		if (table.tBodies.length && !table.tBodies[0].rows.length) {
			if (this.options.data) {
				if (!this.options.data.rows) {
					throw new Error(
						"You seem to be using the data option, but you've not defined any rows."
					);
				}
			}
		}

		this.table = table;

		this.init();
	}
	
	var proto = DataTable.prototype;

	/**
	 * Add custom property or method to extend DataTable
	 * @param  {String} prop 	- Method name or property
	 * @param  {Mixed} val 		- Function or property value
	 * @return {Void}
	 */
	DataTable.extend = function(prop, val) {
		if (typeof val === "function") {
			DataTable.prototype[prop] = val;
		} else {
			DataTable[prop] = val;
		}
	};

	/**
	 * Initialize the instance
	 * @param  {object} options
	 * @return {void}
	 */
	proto.init = function(options) {
		if (this.initialized || classList.contains(this.table, "dataTable-table")) {
			return false;
		}

		var that = this;

		this.options = extend(this.options, options || {});

		// IE detection
		this.isIE = !!/(msie|trident)/i.test(navigator.userAgent);

		this.currentPage = 1;
		this.onFirstPage = true;

		this.hiddenColumns = [];

		this.render();

		if (this.options.plugins) {
			each(
				this.options.plugins,
				function(plugin, options) {
					this[plugin](options);
				},
				this
			);
		}

		// Check for the columns option
		if (this.options.columns) {
			each(
				this.options.columns,
				function(x, data) {
					if (data.select) {
						// convert single column selection to array
						if (!Array.isArray(data.select)) {
							data.select = [data.select];
						}

						// Add the data attributes to the th elements
						each(
							data.select,
							function(i, column) {
								var th = this.headings[column];
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
										this.columns(column).hide();
									}
								}
							},
							this
						);
					}
				},
				this
			);
		}

		setTimeout(function() {
			that.emit("datatable.init");
			that.initialized = true;
		}, 10);
	};

	proto.render = function() {
		var o = this.options;
		var template = "";

		// Convert data to HTML
		if (o.data) {
			dataToTable.call(this);
		}

		// Store references
		this.body = this.table.tBodies[0];
		this.head = this.table.tHead;
		this.foot = this.table.tFoot;

		if (!this.body) {
			this.body = createElement("tbody");

			this.table.appendChild(this.body);
		}

		this.hasRows = this.body.rows.length > 0;

		// Make a tHead if there isn't one (fixes #8)
		if (!this.head) {
			var h = createElement("thead");
			var t = createElement("tr");

			if (this.hasRows) {
				each(this.body.rows[0].cells, function(i, cell) {
					t.appendChild(createElement("th"));
				});

				h.appendChild(t);
			}

			this.head = h;

			this.table.insertBefore(this.head, this.body);
		}

		this.hasHeadings = this.head.rows.length > 0;

		if (this.hasHeadings) {
			this.header = this.head.rows[0];
			this.headings = [].slice.call(this.header.cells);
		}

		// Header
		if (!o.header) {
			if (this.head) {
				this.table.removeChild(this.table.tHead);
			}
		}

		// Footer
		if (o.footer) {
			if (this.head && !this.foot) {
				this.foot = createElement("tfoot", {
					html: this.head.innerHTML
				});
				this.table.appendChild(this.foot);
			}
		} else {
			if (this.foot) {
				this.table.removeChild(this.table.tFoot);
			}
		}

		// Build
		this.wrapper = createElement("div", {
			class: "dataTable-wrapper"
		});

		// Template for custom layouts
		template += "<div class='dataTable-top'>";
		template += o.layout.top;
		template += "</div>";
		template += "<div class='dataTable-container'></div>";
		template += "<div class='dataTable-bottom'>";
		template += o.layout.bottom;
		template += "</div>";

		// Info placement
		template = template.replace("{info}", "<div class='dataTable-info'></div>");

		// Per Page Select
		if (o.perPageSelect) {
			var wrap = "<div class='dataTable-dropdown'><label>";
			wrap += o.labels.perPage;
			wrap += "</label></div>";

			// Create the select
			var select = createElement("select", {
				class: "dataTable-selector"
			});

			// Create the options
			each(o.perPageSelect, function(i, val) {
				var selected = val === o.perPage;
				var option = new Option(val, val, selected, selected);
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
		if (o.searchable) {
			var form =
				"<div class='dataTable-search'><input class='dataTable-input' placeholder='" +
				o.labels.placeholder +
				"' type='text'></div>";

			// Search input placement
			template = template.replace("{search}", form);
		} else {
			template = template.replace("{search}", "");
		}

		if (this.hasHeadings) {
			// Sortable
			each(this.headings, function(i, th) {
				th.originalCellIndex = th.cellIndex;
				if (o.sortable) {
					var link = createElement("a", {
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

		// Add table class
		classList.add(this.table, "dataTable-table");

		// Paginator
		var w = createElement("div", {
			class: "dataTable-pagination"
		});
		var paginator = createElement("ul");
		w.appendChild(paginator);

		// Pager(s) placement
		template = template.replace(/\{pager\}/g, w.outerHTML);

		this.wrapper.innerHTML = template;

		this.container = this.wrapper.querySelector(".dataTable-container");

		this.pagers = this.wrapper.querySelectorAll(".dataTable-pagination");

		this.label = this.wrapper.querySelector(".dataTable-info");

		// Insert in to DOM tree
		this.table.parentNode.replaceChild(this.wrapper, this.table);
		this.container.appendChild(this.table);

		// Store the table dimensions
		this.rect = this.table.getBoundingClientRect();

		// Convert rows to array for processing
		this.rows = [].slice.call(this.body.rows);
		this.activeRows = this.rows.slice();
		this.activeHeadings = this.headings.slice();

		// Update
		this.update();

		// Fixed height
		if (o.fixedHeight) {
			fixHeight.call(this);
		}

		if (this.options.fixedColumns) {
			this.fixColumns();
		}

		// Class names
		if (!o.header) {
			classList.add(this.wrapper, "no-header");
		}

		if (!o.footer) {
			classList.add(this.wrapper, "no-footer");
		}

		if (o.sortable) {
			classList.add(this.wrapper, "sortable");
		}

		if (o.searchable) {
			classList.add(this.wrapper, "searchable");
		}

		if (o.fixedHeight) {
			classList.add(this.wrapper, "fixed-height");
		}

		if (o.fixedColumns) {
			classList.add(this.wrapper, "fixed-columns");
		}

		this.bindEvents();
	};

	proto.bindEvents = function() {
		var that = this,
			o = that.options;
		
		// Per page selector
		if (o.perPageSelect) {
			var selector = that.wrapper.querySelector(".dataTable-selector");
			if (selector) {
				// Change per page
				on(selector, "change", function(e) {
					o.perPage = parseInt(this.value, 10);
					that.update();

					if (o.fixedHeight) {
						fixHeight.call(that);
					}

					that.emit("datatable.perpage");
				});
			}
		}

		// Search input
		if (o.searchable) {
			that.input = that.wrapper.querySelector(".dataTable-input");
			if (that.input) {
				on(that.input, "keyup", function(e) {
					that.search(this.value);
				});
			}
		}

		// Pager(s) / sorting
		on(that.wrapper, "click", function(e) {
			var t = e.target;
			if (t.nodeName.toLowerCase() === "a" ) {
				e.preventDefault();
				if ( t.hasAttribute("data-page") ) {
					that.page(t.getAttribute("data-page"));
				} else if ( o.sortable && classList.contains(t, "dataTable-sorter") && t.parentNode.getAttribute("data-sortable") != "false" ) {
					that.sortColumn(that.activeHeadings.indexOf(t.parentNode) + 1);
				}
			}
		});
	};

	/**
	 * Destroy the instance
	 * @return {void}
	 */
	proto.destroy = function() {
		var o = this.options;

		// Remove the sorters
		if (o.sortable) {
			each(
				this.head.rows[0].cells,
				function(i, th) {
					var html = th.firstElementChild.innerHTML;
					th.innerHTML = html;
					th.removeAttribute("style");
				},
				this
			);
		}

		// Populate the table
		var f = doc.createDocumentFragment();
		each(
			this.rows,
			function(i, tr) {
				f.appendChild(tr);
			},
			this
		);
		this.clear(f);

		// Remove the className
		classList.remove(this.table, "dataTable-table");

		// Remove the containers
		this.wrapper.parentNode.replaceChild(this.table, this.wrapper);

		this.initialized = false;
	};

	/**
	 * Add custom event listener
	 * @param  {String} event
	 * @param  {Function} callback
	 * @return {Void}
	 */
	proto.on = function(event, callback) {
		this.events = this.events || {};
		this.events[event] = this.events[event] || [];
		this.events[event].push(callback);
	};

	/**
	 * Remove custom event listener
	 * @param  {String} event
	 * @param  {Function} callback
	 * @return {Void}
	 */
	proto.off = function(event, callback) {
		this.events = this.events || {};
		if (event in this.events === false) return;
		this.events[event].splice(this.events[event].indexOf(callback), 1);
	};

	/**
	 * Fire custom event
	 * @param  {String} event
	 * @return {Void}
	 */
	proto.emit = function(event) {
		this.events = this.events || {};
		if (event in this.events === false) return;
		for (var i = 0; i < this.events[event].length; i++) {
			this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};

	/**
	 * Update the instance
	 * @return {Void}
	 */
	proto.update = function() {
		paginate.call(this);
		render.call(this);

		this.links = [];

		var i = this.pages.length;
		while (i--) {
			var num = i + 1;
			this.links[i] = button(i === 0 ? "active" : "", num, num);
		}

		this.sorting = false;

		renderPager.call(this);

		this.emit("datatable.update");
	};

	/**
	 * Fix column widths
	 * @return {Void}
	 */
	proto.fixColumns = function() {
		var cells,
			hd = false;

		// If we have headings we need only set the widths on them
		// otherwise we need a temp header and the widths need applying to all cells
		if (this.table.tHead && this.activeHeadings.length) {
			// Reset widths
			each(
				this.activeHeadings,
				function(i, cell) {
					cell.style.width = "";
				},
				this
			);

			each(
				this.activeHeadings,
				function(i, cell) {
					var ow = cell.offsetWidth;
					var w = ow / this.rect.width * 100;
					cell.style.width = w + "%";
				},
				this
			);
		} else {
			cells = [];

			// Make temperary headings
			hd = createElement("thead");
			var r = createElement("tr");
			var c = this.table.tBodies[0].rows[0].cells;
			each(c, function(i, row) {
				var th = createElement("th");
				r.appendChild(th);
				cells.push(th);
			});

			hd.appendChild(r);
			this.table.insertBefore(hd, this.body);

			var widths = [];
			each(
				cells,
				function(i, cell) {
					var ow = cell.offsetWidth;
					var w = ow / this.rect.width * 100;
					widths.push(w);
				},
				this
			);

			each(
				this.rows,
				function(idx, row) {
					each(
						row.cells,
						function(i, cell) {
							if (this.columns(cell.cellIndex).visible())
								cell.style.width = widths[i] + "%";
						},
						this
					);
				},
				this
			);

			// Discard the temp header
			this.table.removeChild(hd);
		}
	};

	/**
	 * Perform a search of the data set
	 * @param  {string} query
	 * @return {void}
	 */
	proto.search = function(query) {
		if (!this.hasRows) return false;

		var that = this;

		query = query.toLowerCase();

		this.currentPage = 1;
		this.searching = true;
		this.searchData = [];

		if (!query.length) {
			this.searching = false;
			this.update();
			this.emit("datatable.search", query, this.searchData);
			classList.remove(this.wrapper, "search-results");
			return false;
		}

		this.clear();

		each(
			this.rows,
			function(idx, row) {
				var inArray = this.searchData.indexOf(row) > -1;

				// https://github.com/Mobius1/Vanilla-DataTables/issues/12
				var doesQueryMatch = query.split(" ").reduce(function(bool, word) {
					var includes = false;

					for (var x = 0; x < row.cells.length; x++) {
						if (
							row.cells[x].textContent.toLowerCase().indexOf(word) > -1 &&
							that.columns(row.cells[x].cellIndex).visible()
						) {
							includes = true;
							break;
						}
					}

					return bool && includes;
				}, true);

				if (doesQueryMatch && !inArray) {
					row.searchIndex = idx;
					this.searchData.push(idx);
				} else {
					row.searchIndex = null;
				}
			},
			this
		);

		classList.add(this.wrapper, "search-results");

		if (!this.searchData.length) {
			classList.remove(this.wrapper, "search-results");
			this.setMessage(this.options.labels.noRows);
		}

		this.update();

		this.emit("datatable.search", query, this.searchData);
	};

	/**
	 * Change page
	 * @param  {int} page
	 * @return {void}
	 */
	proto.page = function(page) {
		// We don't want to load the current page again.
		if (page == this.currentPage) {
			return false;
		}

		if (!isNaN(page)) {
			this.currentPage = parseInt(page, 10);
		}

		if (page > this.pages.length || page < 0) {
			return false;
		}

		render.call(this);
		renderPager.call(this);

		this.emit("datatable.page", page);
	};

	/**
	 * Sort by column
	 * @param  {int} column - The column no.
	 * @param  {string} direction - asc or desc
	 * @return {void}
	 */
	proto.sortColumn = function(column, direction) {
		// Check column is present
		if (column < 1 || column > this.activeHeadings.length) {
			return false;
		}

		this.sorting = true;

		// Convert to zero-indexed
		column = column - 1;

		var dir;
		var rows = this.rows;
		var alpha = [];
		var numeric = [];
		var a = 0;
		var n = 0;
		var th = this.activeHeadings[column];

		column = th.originalCellIndex;

		each(rows, function(i, tr) {
			var cell = tr.cells[column];
			var content = cell.textContent;
			var num = content.replace(/(\$|\,|\s|%)/g, "");

			// Check for date format and moment.js
			if (th.getAttribute("data-type") === "date" && window.moment) {
				var format = false,
					formatted = th.hasAttribute("data-format");

				if (formatted) {
					format = th.getAttribute("data-format");
				}

				num = parseDate(content, format);
			}

			if (parseFloat(num) == num) {
				numeric[n++] = { value: Number(num), row: tr };
			} else {
				alpha[a++] = { value: content, row: tr };
			}
		});

		/* Sort according to direction (ascending or descending) */
		var top, btm;
		if (classList.contains(th, "asc") || direction == "asc") {
			top = sortItems(alpha, -1);
			btm = sortItems(numeric, -1);
			dir = "descending";
			classList.remove(th, "asc");
			classList.add(th, "desc");
		} else {
			top = sortItems(numeric, 1);
			btm = sortItems(alpha, 1);
			dir = "ascending";
			classList.remove(th, "desc");
			classList.add(th, "asc");
		}

		/* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
		if (this.lastTh && th != this.lastTh) {
			classList.remove(this.lastTh, "desc");
			classList.remove(this.lastTh, "asc");
		}

		this.lastTh = th;

		/* Reorder the table */
		rows = top.concat(btm);

		this.rows = [];
		var indexes = [];

		each(
			rows,
			function(i, v) {
				this.rows.push(v.row);

				if (v.row.searchIndex !== null && v.row.searchIndex !== undefined) {
					indexes.push(i);
				}
			},
			this
		);

		this.searchData = indexes;

		this.columns().rebuild();

		this.update();

		this.emit("datatable.sort", column, dir);
	};

	/**
	 * Add new row data
	 * @param {object} data
	 */
	proto.insert = function(data) {
		if (!"[object Object]" === Object.prototype.toString.call(data)) {
			throw new Error("Method insert requires an object.");
		}

		if (!data.rows) {
			throw new Error("Method insert requires the 'rows' property.");
		}

		if (data.headings) {
			if (!this.hasHeadings && !this.hasRows) {
				var tr = createElement("tr"),
					th;
				each(data.headings, function(i, heading) {
					th = createElement("th", {
						html: heading
					});

					tr.appendChild(th);
				});
				this.head.appendChild(tr);
			}
		}

		each(
			data.rows,
			function(i, row) {
				var tr = createElement("tr");
				each(
					row,
					function(a, val) {
						var td = createElement("td", {
							html: val
						});
						tr.appendChild(td);
					},
					this
				);
				this.rows.push(tr);
			},
			this
		);

		this.columns().rebuild();

		this.hasRows = true;

		this.update();
	};

	/**
	 * Refresh the instance
	 * @return {void}
	 */
	proto.refresh = function() {
		if (this.options.searchable) {
			this.input.value = "";
			this.searching = false;
		}
		this.currentPage = 1;
		this.onFirstPage = true;
		this.update();

		this.emit("datatable.refresh");
	};

	/**
	 * Truncate the table
	 * @param  {mixes} html - HTML string or HTMLElement
	 * @return {void}
	 */
	proto.clear = function(html) {
		if (this.body) {
			flush(this.body, this.isIE);
		}

		var parent = this.body;
		if (!this.body) {
			parent = this.table;
		}

		if (html) {
			if (typeof html === "string") {
				parent.innerHTML = html;
			} else {
				parent.appendChild(html);
			}
		}
	};

	/**
	 * Export table to various formats (csv, txt or sql)
	 * @param  {Object} options User options
	 * @return {Boolean}
	 */
	proto.export = function(options) {
		if (!this.hasHeadings && !this.hasRows) return false;

		var headers = this.activeHeadings,
			rows = [],
			arr = [],
			i,
			x,
			str,
			link;

		var defaults = {
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
		if (!"[object Object]" === Object.prototype.toString.call(options)) {
			return false;
		}

		options = extend(defaults, options);

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
								options.skipColumn.indexOf(x) < 0 &&
								this.columns(rows[i].cells[x].cellIndex).visible()
							) {
								str += rows[i].cells[x].textContent + options.columnDelimiter;
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
						str = "data:text/csv;charset=utf-8," + str;
					}
				} else if (options.type === "sql") {
					// Begin INSERT statement
					str = "INSERT INTO `" + options.tableName + "` (";

					// Convert table headings to column names
					for (i = 0; i < headers.length; i++) {
						// Check for column skip and column visibility
						if (
							options.skipColumn.indexOf(i) < 0 &&
							this.columns(headers[i].cellIndex).visible()
						) {
							str += "`" + headers[i].textContent + "`,";
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
								options.skipColumn.indexOf(x) < 0 &&
								this.columns(rows[i].cells[x].cellIndex).visible()
							) {
								str += '"' + rows[i].cells[x].textContent + '",';
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
						str = "data:application/sql;charset=utf-8," + str;
					}
				} else if (options.type === "json") {
					// Iterate rows
					for (x = 0; x < rows.length; x++) {
						arr[x] = arr[x] || {};
						// Iterate columns
						for (i = 0; i < headers.length; i++) {
							// Check for column skip and column visibility
							if (
								options.skipColumn.indexOf(i) < 0 &&
								this.columns(rows[x].cells[i].cellIndex).visible()
							) {
								arr[x][headers[i].textContent] = rows[x].cells[i].textContent;
							}
						}
					}

					// Convert the array of objects to JSON string
					str = JSON.stringify(arr, options.replacer, options.space);

					if (options.download) {
						str = "data:application/json;charset=utf-8," + str;
					}
				}

				// Download
				if (options.download) {
					// Filename
					options.filename = options.filename || "datatable_export";
					options.filename += "." + options.type;

					// Create a link to trigger the download
					str = encodeURI(str);

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

				return str;
			}
		}

		return false;
	};

	/**
	 * Import data to the table
	 * @param  {Object} options User options
	 * @return {Boolean}
	 */
	proto.import = function(options) {
		var obj = false;
		var defaults = {
			// csv
			lineDelimiter: "\n",
			columnDelimiter: ","
		};

		// Check for the options object
		if (!"[object Object]" === Object.prototype.toString.call(options)) {
			return false;
		}

		options = extend(defaults, options);

		if (options.data.length) {
			// Import CSV
			if (options.type === "csv") {
				obj = { rows: [] };

				// Split the string into rows
				var rows = options.data.split(options.lineDelimiter);

				if (rows.length) {
					each(rows, function(i, row) {
						obj.rows[i] = [];

						// Split the rows into values
						var values = row.split(options.columnDelimiter);

						if (values.length) {
							each(values, function(x, value) {
								obj.rows[i].push(value);
							});
						}
					});
				}
			} else if (options.type === "json") {
				var json = isJson(options.data);

				// Valid JSON string
				if (json) {
					obj = { headings: [], rows: [] };

					each(json, function(i, data) {
						obj.rows[i] = [];
						each(data, function(column, value) {
							if (obj.headings.indexOf(column) < 0) {
								obj.headings.push(column);
							}

							obj.rows[i].push(value);
						});
					});
				} else {
					console.warn("That's not valid JSON!");
				}
			}

			if (obj) {
				// Add the rows
				this.insert(obj);
			}
		}

		return false;
	};

	/**
	 * Print the table
	 * @return {void}
	 */
	proto.print = function() {
		var headings = this.activeHeadings;
		var rows = this.activeRows;
		var table = createElement("table");
		var thead = createElement("thead");
		var tbody = createElement("tbody");

		var tr = createElement("tr");
		each(headings, function(i, th) {
			tr.appendChild(
				createElement("th", {
					html: th.textContent
				})
			);
		});

		thead.appendChild(tr);

		each(rows, function(i, row) {
			var tr = createElement("tr");
			each(row.cells, function(k, cell) {
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
		var w = window.open();

		// Append the table to the body
		w.document.body.appendChild(table);

		// Print
		w.print();
	};

	/**
	 * Show a message in the table
	 * @param {string} message
	 */
	proto.setMessage = function(message) {
		var colspan = 1;

		if (this.hasRows) {
			colspan = this.rows[0].cells.length;
		}

		this.clear(
			createElement("tr", {
				html:
					'<td class="dataTables-empty" colspan="' +
						colspan +
						'">' +
						message +
						"</td>"
			})
		);
	};

	/**
	 * Columns API access
	 * @return {Object} new Columns instance
	 */
	proto.columns = function(columns) {
		return new Columns(this, columns);
	};

	return DataTable;
});