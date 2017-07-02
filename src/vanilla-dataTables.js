/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobius.ovh)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 1.2.2
 *
 */
(function(root, factory) {
	var plugin = 'DataTable';

	if (typeof define === 'function' && define.amd) {
		define([], factory(plugin));
	} else if (typeof exports === 'object') {
		module.exports = factory(plugin);
	} else {
		root[plugin] = factory(plugin);
	}
}(this, function(plugin) {
	'use strict';


	/**
	 * Helpers
	 * @type {Object}
	 */
	var util = {
		extend: function(src, props) {
			var p;
			for (p in props) {
				if (props.hasOwnProperty(p)) {
					if ("[object Object]" === Object.prototype.toString.call(src[p])) {
						util.extend(src[p], props[p]);
					} else {
						src[p] = props[p];
					}
				}
			}
			return src;
		},
		each: function(a, b, c) {
			if ("[object Object]" === Object.prototype.toString.call(a)) {
				for (var d in a) { if (Object.prototype.hasOwnProperty.call(a, d)) { b.call(c, d, a[d], a); } }
			} else {
				for (var e = 0, f = a.length; e < f; e++) { b.call(c, e, a[e], a); }
			}
		},
		css: function(el, prop, val) {
			var style = el && el.style,
				isObj = "[object Object]" === Object.prototype.toString.call(prop);

			if (style) {
				if (val === void 0 && !isObj) {
					val = window.getComputedStyle(el, '');
					return prop === void 0 ? val : val[prop];
				} else {
					if (isObj) {
						util.each(prop, function(p, v) {
							if (!(p in style)) { p = '-webkit-' + p; }
							style[p] = v + (typeof v === 'string' ? '' : p === "opacity" ? "" : "px");
						});
					} else {
						if (!(prop in style)) { prop = '-webkit-' + prop; }
						style[prop] = val + (typeof val === 'string' ? '' : prop === "opacity" ? "" : "px");
					}
				}
			}
		},
		createElement: function(a, b) {
			var c = document,
				d = c.createElement(a);
			if (b && "object" == typeof b) {
				var e;
				for (e in b) {
					if ("html" === e) {
						d.innerHTML = b[e];
					} else if ("text" === e) {
						d.appendChild(c.createTextNode(b[e]));
					} else {
						d.setAttribute(e, b[e]);
					}
				}
			}
			return d;
		},
		createFragment: function() {
			return document.createDocumentFragment();
		},
		hasClass: function(a, b) {
			return a.classList ? a.classList.contains(b) : !!a.className && !!a.className.match(new RegExp("(\\s|^)" + b + "(\\s|$)"));
		},
		addClass: function(a, b) {
			if (!util.hasClass(a, b)) {
				if (a.classList) {
					a.classList.add(b);
				} else {
					a.className = a.className.trim() + " " + b;
				}
			}
		},
		removeClass: function(a, b) {
			if (util.hasClass(a, b)) {
				if (a.classList) {
					a.classList.remove(b);
				} else {
					a.className = a.className.replace(new RegExp("(^|\\s)" + b.split(" ").join("|") + "(\\s|$)", "gi"), " ");
				}
			}
		},
		append: function(p, e) {
			return p && e && p.appendChild(e);
		},
		closest: function(el, fn) {
			return el && el !== document.body && (fn(el) ? el : util.closest(el.parentNode, fn));
		},
		on: function(e, type, callback) {
			e.addEventListener(type, callback, false);
		},
		off: function(e, type, callback) {
			e.removeEventListener(type, callback);
		},
		isObject: function(a) {
			return "[object Object]" === Object.prototype.toString.call(a);
		},
		isArray: function(a) {
			return "[object Array]" === Object.prototype.toString.call(a);
		},
		isInt: function(val) {
			return !isNaN(val);
		},
		isJson: function(str) {
			var json = false;
			try { json = JSON.parse(str); } catch (e) { return false; }

			if (json !== null && (util.isArray(json) || util.isObject(json))) {
				return json;
			}

			return false;
		},
		isDate: function(str) {
			// First check for the pattern
			if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return false;

			// Parse the date parts to integers
			var parts = str.split("/"), day = parseInt(parts[1], 10), month = parseInt(parts[0], 10), year = parseInt(parts[2], 10);

			// Check the ranges of month and year
			if(year < 1000 || year > 3000 || month == 0 || month > 12) return false;

			var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

			// Adjust for leap years
			if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
				monthLength[1] = 29;
			}

			// Check the range of the day
			return day > 0 && day <= monthLength[month - 1];
		},
		getBoundingRect: function(el) {
			var win = window;
			var doc = document;
			var body = doc.body;
			var rect = el.getBoundingClientRect();
			var offsetX = win.pageXOffset !== undefined ? win.pageXOffset : (doc.documentElement || body.parentNode || body).scrollLeft;
			var offsetY = win.pageYOffset !== undefined ? win.pageYOffset : (doc.documentElement || body.parentNode || body).scrollTop;

			return {
				bottom: rect.bottom + offsetY,
				height: rect.height,
				left: rect.left + offsetX,
				right: rect.right + offsetX,
				top: rect.top + offsetY,
				width: rect.width
			};
		},
		preventDefault: function(e) {
			e = e || window.event;
			if (e.preventDefault) {
				return e.preventDefault();
			}
		},
		includes: function(a, b) {
			return a.indexOf(b) > -1;
		},
		button: function(c, p, t) {
			return util.createElement('li', {
				class: c,
				html: '<a href="#" data-page="' + p + '">' + t + '</a>'
			});
		},
		flush: function(el, ie) {
			if ( el instanceof NodeList ) {
				util.each(el, function(i,e) {
					util.flush(e, ie);
				});
			} else {
				if (ie) {
					while (el.hasChildNodes()) {
						el.removeChild(el.firstChild);
					}
				} else {
					el.innerHTML = '';
				}
			}
		}
	};

	/**
	 * Construct the layout
	 * @return {[type]} [description]
	 */
	var build = function() {
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

		if ( !this.body ) {
			this.body = util.createElement("tbody");

			this.table.appendChild(this.body);
		}

		this.hasRows = this.body.rows.length > 0;

		// Make a tHead if there isn't one (fixes #8)
		if ( !this.head ) {
			var h = util.createElement("thead");
			var t = util.createElement("tr");

			if ( this.hasRows ) {
				util.each(this.body.rows[0].cells, function(i, cell) {
					util.append(t, util.createElement("th"));
				});

				util.append(h, t);
			}

			this.head = h;

			this.table.insertBefore(this.head, this.body);
		}

		this.hasHeadings = this.head.rows.length > 0;

		if ( this.hasHeadings ) {
			this.header = this.head.rows[0];
			this.headings = [].slice.call(this.header.cells);
		}

		// Header
		if ( !o.header ) {
			if ( this.head ) {
				this.table.removeChild(this.table.tHead);
			}
		}

		// Footer
		if ( o.footer ) {
			if ( this.head && !this.foot) {
				this.foot = util.createElement('tfoot', {
					html: this.head.innerHTML
				});
				this.table.appendChild(this.foot);
			}
		} else {
			if ( this.foot ) {
				this.table.removeChild(this.table.tFoot);
			}
		}


		// Build
		this.wrapper = util.createElement('div', {
			class: 'dataTable-wrapper',
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
			var select = util.createElement('select', {
				class: 'dataTable-selector'
			});

			// Create the options
			util.each(o.perPageSelect, function(i, val) {
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
			var form = "<div class='dataTable-search'><input class='dataTable-input' placeholder='"+o.labels.placeholder+"' type='text'></div>";

			// Search input placement
			template = template.replace("{search}", form);
		} else {
			template = template.replace("{search}", "");
		}

		if ( this.hasHeadings ) {
			// Sortable
			util.each(this.headings, function(i, th) {
				th.originalCellIndex = th.cellIndex;
				if (o.sortable) {
					var link = util.createElement('a', {
						href: '#',
						class: 'dataTable-sorter',
						html: th.innerHTML
					});
					th.innerHTML = '';
					util.append(th, link);
				}
			});
		}

		// Add table class
		util.addClass(this.table, 'dataTable-table');

		// Paginator
		var w = util.createElement('div', {
			class: 'dataTable-pagination'
		});
		var paginator = util.createElement('ul');
		util.append(w, paginator);

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
		this.rect = util.getBoundingRect(this.table);

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

		if ( this.options.fixedColumns ) {
			this.fixColumns();
		}

		setClassNames.call(this);
		addEventListeners.call(this);
	};

	/**
	 * Set classNames required
	 */
	var setClassNames = function() {
		var o = this.options;
		if ( !o.header ) {
			util.addClass(this.wrapper, 'no-header'); }

		if ( !o.footer ) {
			util.addClass(this.wrapper, 'no-footer'); }

		if ( o.sortable ) {
			util.addClass(this.wrapper, 'sortable'); }

		if (o.searchable) {
			util.addClass(this.wrapper, 'searchable'); }

		if (o.fixedHeight) {
			util.addClass(this.wrapper, 'fixed-height'); }

		if ( o.fixedColumns ) {
			util.addClass(this.wrapper, 'fixed-columns'); }
	};

	/**
	 * Attach the required event listeners
	 */
	var addEventListeners = function() {
		var that = this, o = that.options;

		// Per page selector
		if ( o.perPageSelect ) {
			var selector = that.wrapper.querySelector(".dataTable-selector");
			if ( selector ) {
				// Change per page
				util.on(selector, 'change', function(e) {
					o.perPage = parseInt(this.value, 10);
					that.update();

					if (o.fixedHeight) {
						fixHeight.call(that);
					}

					that.emit('datatable.perpage');
				});
			}
		}

		// Search input
		if ( o.searchable ) {
			that.input = that.wrapper.querySelector(".dataTable-input");
			if ( that.input ) {
				util.on(that.input, 'keyup', function(e) {
					that.search(this.value);
				});
			}
		}

		// Pager(s)
		util.on(that.wrapper, 'click', function(e) {
			var t = e.target;
			if (t.nodeName.toLowerCase() === 'a' && t.hasAttribute('data-page')) {
				util.preventDefault(e);
				that.page(t.getAttribute('data-page'));
			}
		});

		// Sort items
		if ( o.sortable ) {
			util.on(that.head, 'click', function(e) {
				e = e || window.event;
				var target = e.target;

				if (target.nodeName.toLowerCase() === 'a') {
					if (util.hasClass(target, 'dataTable-sorter')) {
						util.preventDefault(e);
						that.sortColumn(that.activeHeadings.indexOf(target.parentNode) + 1);
					}
				}
			});
		}
	};

	// Sort the rows into pages
	var paginate = function() {
		var perPage = this.options.perPage, rows = this.activeRows;

		if ( this.searching ) {
			rows = [];

			util.each(this.searchData, function(i, index) {
				rows.push(this.activeRows[index]);
			}, this);
		}

		// Check for hidden columns
		this.pages = rows.map(function(tr, i) {
			return i % perPage === 0 ? rows.slice(i, i + perPage) : null;
		}).filter(function(page) {
			return page;
		});

		this.totalPages = this.lastPage = this.pages.length;
	};

	// Render a page
	var render = function() {

		if ( this.hasRows && this.totalPages) {

			if (this.currentPage > this.totalPages) {
				this.currentPage = 1;
			}

			// Use a fragment to limit touching the DOM
			var index = this.currentPage - 1,
				frag = util.createFragment();

			util.flush(this.header, this.isIE);
			util.each(this.activeHeadings, function(i, th) {
				this.header.appendChild(th);
			}, this);

			util.each(this.pages[index], function(i, row) {
				frag.appendChild(row);
			}, this);


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

		if ( this.label && this.options.labels.info.length ) {

			// CUSTOM LABELS
			var string = this.options.labels.info.replace("{start}", f)
												.replace("{end}", t)
												.replace("{page}", this.currentPage)
												.replace("{pages}", this.totalPages)
												.replace("{rows}", items);

			this.label.innerHTML = items  ? string : "";
		}

		if (this.options.fixedHeight && this.currentPage == 1) {
			fixHeight.call(this);
		}
	};

	/**
	 * Render the pager(s)
	 */
	var renderPager = function() {

		util.flush(this.pagers, this.isIE);

		if (this.totalPages > 1) {

			var c = 'pager',
				frag = util.createFragment(),
				prev = this.onFirstPage ? 1 : this.currentPage - 1,
				next = this.onlastPage ? this.totalPages : this.currentPage + 1;

			// first button
			if (this.options.firstLast) {
				util.append(frag, util.button(c, 1, this.options.firstText));
			}

			// prev button
			if (this.options.nextPrev) {
				util.append(frag, util.button(c, prev, this.options.prevText));
			}

			var pager = this.links;

			// truncate the links
			if (this.options.truncatePager) {
				pager = truncate(this.links, this.currentPage, this.pages.length, this.options.pagerDelta);
			}

			// active page link
			util.addClass(this.links[this.currentPage - 1], 'active');

			// append the links
			util.each(pager, function(i, p) {
				util.removeClass(p, 'active');
				util.append(frag, p);
			});

			util.addClass(this.links[this.currentPage - 1], 'active');

			// next button
			if (this.options.nextPrev) {
				util.append(frag, util.button(c, next, this.options.nextText));
			}

			// first button
			if (this.options.firstLast) {
				util.append(frag, util.button(c, this.totalPages, this.options.lastText));
			}

			// We may have more than one pager
			util.each(this.pagers, function(i,pager) {
				util.append(pager, frag.cloneNode(true));
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
		for (var e = !0; e;) {
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
		this.rect = util.getBoundingRect(this.container);
		this.container.style.height = this.rect.height + 'px';
	};

	/**
	 * Pager truncation algorithm
	 */
	var truncate = function(a, b, c, d) {
		d = d || 2;
		var j, e = 2 * d,
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
			if (1 == k || k == c || k >= f && k <= g) {
				var l = a[k - 1];
				util.removeClass(l, "active");
				h.push(l);
			}
		}
		util.each(h, function(b, c) {
			var d = c.children[0].getAttribute("data-page");
			if (j) {
				var e = j.children[0].getAttribute("data-page");
				if (d - e == 2) i.push(a[e]);
				else if (d - e != 1) {
					var f = util.createElement("li", {
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
	 * Parse data to HTML
	 */
	var dataToTable = function(data) {
		var thead = false,
			tbody = false;

		data = data || this.options.data;

		if (data.headings) {
			thead = util.createElement('thead');
			var tr = util.createElement('tr');
			util.each(data.headings, function(i, col) {
				var td = util.createElement('th', {
					html: col
				});
				tr.appendChild(td);
			});

			thead.appendChild(tr);
		}

		if (data.rows) {
			tbody = util.createElement('tbody');
			util.each(data.rows, function(i, rows) {
				if (data.headings) {
					if (data.headings.length !== rows.length) {
						throw new Error("The number of rows do not match the number of headings.");
					}
				}
				var tr = util.createElement('tr');
				util.each(rows, function(k, value) {
					var td = util.createElement('td', {
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
			util.append(this.table, thead);
		}

		if (tbody) {
			if (this.table.tBodies.length) {
				this.table.removeChild(this.table.tBodies[0]);
			}
			util.append(this.table, tbody);
		}
	};

	/**
	 * Columns API
	 * @param {Object} instance DataTable instance
	 * @param {Mixed} columns  Column index or array of column indexes
	 */
	function Columns(dt, columns) {
		this.dt = dt;
		this.columns = columns;

		return this;
	}

	/**
	 * Get the columns
	 * @return {Mixed} columns  Column index or array of column indexes
	 */
	Columns.prototype.get = function() {
		var columns = this.columns;
		if ( !util.isArray(columns) ) {
			columns = [];
			columns.push(this.columns);
		}
		return columns;
	};

	/**
	 * Swap two columns
	 * @return {Void}
	 */
	Columns.prototype.swap = function() {
		if ( this.columns.length && this.columns.length === 2 ) {
			var columns = [];

			// Get the current column indexes
			util.each(this.dt.headings, function(i, heading) {
				columns.push(i);
			}, this);

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
	Columns.prototype.order = function(columns) {
		var b, c, d;

		var temp_a = [];
		var temp_b = [];
		var temp_c = [];
		var temp_d = [];

		// Order the headings
		util.each(columns, function(x, column) {
			temp_a.push(this.dt.headings[column].cloneNode(true));

			if ( this.dt.hiddenColumns.indexOf(column) < 0 ) {
				b = this.dt.headings[column].cloneNode(true);
				b.originalCellIndex = x;
				temp_b.push(b);
			}
		}, this);

		// Order the row cells
		util.each(this.dt.rows, function(i, row) {
			c = row.cloneNode();
			d = row.cloneNode();

			if ( row.searchIndex !== null && row.searchIndex !== undefined  ) {
				c.searchIndex = row.searchIndex;
				d.searchIndex = row.searchIndex;
			}

			// Append to cell to the fragment in the correct order
			util.each(columns, function(x, column) {
					c.appendChild(row.cells[column].cloneNode(true));

					if ( this.dt.hiddenColumns.indexOf(column) < 0 ) {
						d.appendChild(row.cells[column].cloneNode(true));
					}
			}, this);

			temp_c.push(c);
			temp_d.push(d);
		}, this);

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
	Columns.prototype.hide = function() {

		var columns = this.get();

		if ( columns.length ) {
			util.each(columns, function(i, column) {
				if ( this.dt.hiddenColumns.indexOf(column) < 0 ) {
					this.dt.hiddenColumns.push(column);
				}
			}, this);

			this.rebuild();
		}
	};

	/**
	 * Show columns
	 * @return {Void}
	 */
	Columns.prototype.show = function() {
		var columns = this.get();

		if ( columns.length ) {
			var index;

			util.each(columns, function(i, column) {
				index = this.dt.hiddenColumns.indexOf(column);
				if ( index > -1 ) {
					this.dt.hiddenColumns.splice(index, 1);
				}
			}, this);

			this.rebuild();
		}
	};

	/**
	 * Check column(s) visibility
	 * @return {Boolean}
	 */
	Columns.prototype.visible = function() {
		var columns;

		if ( util.isInt(this.columns) ) {
			columns = this.dt.hiddenColumns.indexOf(this.columns) < 0;
		} else if ( util.isArray(this.columns) ) {
			columns = [];
			util.each(this.columns, function(i, column) {
				columns.push(this.dt.hiddenColumns.indexOf(column) < 0);
			}, this);
		}

		return columns;
	};

	/**
	 * Check column(s) visibility
	 * @return {Boolean}
	 */
	Columns.prototype.hidden = function() {
		var columns;

		if ( util.isInt(this.columns) ) {
			columns = this.dt.hiddenColumns.indexOf(this.columns) > -1;
		} else if ( util.isArray(this.columns) ) {
			columns = [];
			util.each(this.columns, function(i, column) {
				columns.push(this.dt.hiddenColumns.indexOf(column) > -1);
			}, this);
		}

		return columns;
	};

	/**
	 * Rebuild the columns
	 * @return {Void}
	 */
	Columns.prototype.rebuild = function() {

		var a, b;
		var temp = [];

		this.dt.activeRows = [];
		this.dt.activeHeadings = [];

		util.each(this.dt.headings, function(i, th) {
			th.originalCellIndex = i;
			if ( this.dt.hiddenColumns.indexOf(i) < 0 ) {
				this.dt.activeHeadings.push(th);
			}
		}, this);

		// Loop over the rows and reorder the cells
		util.each(this.dt.rows, function(i, row) {
			a = row.cloneNode();
			b = row.cloneNode();

			if ( row.searchIndex !== null && row.searchIndex !== undefined  ) {
				a.searchIndex = row.searchIndex;
				b.searchIndex = row.searchIndex;
			}

			// Append to cell to the fragment in the correct order
			util.each(row.cells, function(x, cell) {
					a.appendChild(cell.cloneNode(true));

					if ( this.dt.hiddenColumns.indexOf(cell.cellIndex) < 0 ) {
						b.appendChild(cell.cloneNode(true));
					}
			}, this);

			// Append the fragment with the ordered cells
			temp.push(a);
			this.dt.activeRows.push(b);
		}, this);

		this.dt.rows = temp;

		this.dt.update();
	};


	////////////////////
	//    MAIN LIB    //
	////////////////////

	function DataTable(table, options) {

		var defaults = {
			perPage: 10,
			perPageSelect: [5, 10, 15, 20, 25],

			sortable: true,
			searchable: true,

			// Pagination
			nextPrev: true,
			firstLast: false,
			prevText: '&lsaquo;',
			nextText: '&rsaquo;',
			firstText: '&laquo;',
			lastText: '&raquo;',
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
				info: "Showing {start} to {end} of {rows} entries", //
			},

			// Customise the layout
			layout: {
				top: "{select}{search}",
				bottom: "{info}{pager}"
			},
		};

		this.initialized = false;

		this.utils = util;

		// user options
		this.options = util.extend(defaults, options);

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
		if ( !this.options.header ) {
			this.options.sortable = false;
		}

		if (table.tHead === null ) {
			if ( !this.options.data || (this.options.data && !this.options.data.headings) ) {
				this.options.sortable = false;
			}
		}


		if (table.tBodies.length && !table.tBodies[0].rows.length) {
			if (this.options.data) {
				if (!this.options.data.rows) {
					throw new Error("You seem to be using the data option, but you've not defined any rows.");
				}
			}
		}

		this.table = table;

		this.init();
	}

	/**
	 * Add custom property or method to extend DataTable
	 * @param  {String} prop 	- Method name or property
	 * @param  {Mixed} val 		- Function or property value
	 * @return {Void}
	 */
	DataTable.extend = function(prop, val) {
		if (typeof val === 'function') {
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
	DataTable.prototype.init = function(options) {

		if ( this.initialized || util.hasClass(this.table, "dataTable-table") ) {
			return false;
		}

		var that = this;

		this.options = util.extend(this.options, options || {});

		// IE detection
		this.isIE = !!/(msie|trident)/i.test(navigator.userAgent);

		this.currentPage = 1;
		this.onFirstPage = true;

		this.hiddenColumns = [];

		build.call(this);

		if ( this.options.plugins ) {
			util.each(this.options.plugins, function(plugin, options)  {
				this[plugin](options);
			}, this);
		}

		setTimeout(function() {
			that.emit('datatable.init');
			that.initialized = true;
		}, 10);
	};

	/**
	 * Destroy the instance
	 * @return {void}
	 */
	DataTable.prototype.destroy = function() {
		var o = this.options;

		// Remove the sorters
		if ( o.sortable ) {
			util.each(this.head.rows[0].cells, function(i, th) {
				var html = th.firstElementChild.innerHTML;
				th.innerHTML = html;
				th.removeAttribute("style");
			}, this);
		}

		// Populate the table
		var f = util.createFragment();
		util.each(this.rows, function(i, tr) {
			f.appendChild(tr);
		}, this);
		this.clear(f);

		// Remove the className
		util.removeClass(this.table, "dataTable-table");

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
	DataTable.prototype.on = function(event, callback) {
		this._events = this._events || {};
		this._events[event] = this._events[event] || [];
		this._events[event].push(callback);
	};

	/**
	 * Remove custom event listener
	 * @param  {String} event
	 * @param  {Function} callback
	 * @return {Void}
	 */
	DataTable.prototype.off = function(event, callback) {
		this._events = this._events || {};
		if (event in this._events === false) return;
		this._events[event].splice(this._events[event].indexOf(callback), 1);
	};

	/**
	 * Fire custom event
	 * @param  {String} event
	 * @return {Void}
	 */
	DataTable.prototype.emit = function(event) {
		this._events = this._events || {};
		if (event in this._events === false) return;
		for (var i = 0; i < this._events[event].length; i++) {
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};

	/**
	 * Update the instance
	 * @return {Void}
	 */
	DataTable.prototype.update = function() {

		paginate.call(this);
		render.call(this);

		this.links = [];

		var i = this.pages.length;
		while (i--) {
			var num = i + 1;
			this.links[i] = util.button((i === 0) ? 'active' : '', num, num);
		}

		this.sorting = false;

		renderPager.call(this);

		this.emit('datatable.update');
	};

	/**
	 * Fix column widths
	 * @return {Void}
	 */
	DataTable.prototype.fixColumns = function() {
		var cells, hd = false;

		// If we have headings we need only set the widths on them
		// otherwise we need a temp header and the widths need applying to all cells
		if (this.table.tHead && this.activeHeadings.length) {
			// Reset widths
			util.each(this.activeHeadings, function(i, cell) {
				cell.style.width = "";
			}, this);

			util.each(this.activeHeadings, function(i, cell) {
				var ow = cell.offsetWidth;
				var w = (ow / this.rect.width) * 100;
				cell.style.width = w + '%';
			}, this);
		} else {

			cells = [];

			// Make temperary headings
			hd = util.createElement("thead");
			var r = util.createElement("tr");
			var c = this.table.tBodies[0].rows[0].cells;
			util.each(c, function(i, row) {
				var th = util.createElement("th");
				r.appendChild(th);
				cells.push(th);
			});

			hd.appendChild(r);
			this.table.insertBefore(hd, this.body);

			var widths = [];
			util.each(cells, function(i, cell) {
				var ow = cell.offsetWidth;
				var w = (ow / this.rect.width) * 100;
				widths.push(w);
			}, this);

			util.each(this.rows, function(idx, row) {
				util.each(row.cells, function(i, cell) {
					if ( this.columns(cell.cellIndex).visible() )
						cell.style.width = widths[i] + "%";
				}, this);
			}, this);

			// Discard the temp header
			this.table.removeChild(hd);
		}

	};

	/**
	 * Perform a search of the data set
	 * @param  {string} query
	 * @return {void}
	 */
	DataTable.prototype.search = function(query) {

		if ( !this.hasRows ) return false;

		var that = this;

		query = query.toLowerCase();

		this.currentPage = 1;
		this.searching = true;
		this.searchData = [];

		if (!query.length) {
			this.searching = false;
			this.update();
			this.emit("datatable.search", query, this.searchData);
			util.removeClass(this.wrapper, 'search-results');
			return false;
		}

		this.clear();

		util.each(this.rows, function(idx, row) {
			var inArray = util.includes(this.searchData, row);

			// https://github.com/Mobius1/Vanilla-DataTables/issues/12
			var doesQueryMatch = query.split(" ").reduce(function (bool, word) {

				var includes = false;

				for ( var x = 0; x < row.cells.length; x++ ) {
					if ( util.includes(row.cells[x].textContent.toLowerCase(), word) && that.columns(row.cells[x].cellIndex).visible() ) {
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
		}, this);

		util.addClass(this.wrapper, 'search-results');

		if (!this.searchData.length) {
			util.removeClass(this.wrapper, 'search-results');
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
	DataTable.prototype.page = function(page) {
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

		this.emit('datatable.page', page);
	};

	/**
	 * Sort by column
	 * @param  {int} column - The column no.
	 * @param  {string} direction - asc or desc
	 * @return {void}
	 */
	DataTable.prototype.sortColumn = function(column, direction) {

		// Check column is present
		if ( column < 1 || column > this.activeHeadings.length ) {
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

		util.each(rows, function(i, tr) {
			var cell = tr.cells[column];
			var content = cell.textContent;
			var num = content.replace(/(\$|\,|\s|%)/g, "");

			// Parse date strings
			if ( util.isDate(num) ) {
				num = Date.parse(num);
			}

			if (parseFloat(num) == num) {
				numeric[n++] = { value: Number(num), row: tr };
			} else {
				alpha[a++] = { value: content, row: tr };
			}
		});


		/* Sort according to direction (ascending or descending) */
		var top, btm;
		if (util.hasClass(th, "asc") || direction == "asc") {
			top = sortItems(alpha, -1);
			btm = sortItems(numeric, -1);
			dir = 'descending';
			util.removeClass(th, 'asc');
			util.addClass(th, 'desc');
		} else {
			top = sortItems(numeric, 1);
			btm = sortItems(alpha, 1);
			dir = 'ascending';
			util.removeClass(th, 'desc');
			util.addClass(th, 'asc');
		}

		/* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
		if (this.lastTh && th != this.lastTh) {
			util.removeClass(this.lastTh, 'desc');
			util.removeClass(this.lastTh, 'asc');
		}

		this.lastTh = th;

		/* Reorder the table */
		rows = top.concat(btm);

		this.rows = [];
		var indexes = [];

		util.each(rows, function(i, v) {
			this.rows.push(v.row);

			if ( v.row.searchIndex !== null && v.row.searchIndex !== undefined  ) {
				indexes.push(i);
			}
		}, this);

		this.searchData = indexes;

		this.columns().rebuild();

		this.update();

		this.emit('datatable.sort', column, dir);
	};

	/**
	 * Add new row data
	 * @param {object} data
	 */
	DataTable.prototype.addRows = function(data) {
		if ( !util.isObject(data) ) {
			throw new Error("Method addRows requires an object.");
		}

		if (!data.rows) {
			throw new Error("Method addRows requires the 'rows' property.");
		}

		if ( data.headings ) {
			if ( !this.hasHeadings && !this.hasRows ) {
				var tr = util.createElement("tr"), th;
				util.each(data.headings, function(i, heading) {
					th = util.createElement("th", {
						html: heading
					});

					tr.appendChild(th);
				});
				this.head.appendChild(tr);
			}
		}

		util.each(data.rows, function(i, row) {
			var tr = util.createElement("tr");
			util.each(row, function(a, val) {
				var td = util.createElement("td", {
					html: val
				});
				tr.appendChild(td);
			}, this);
			this.rows.push(tr);
		}, this);

		this.columns().rebuild();

		this.hasRows = true;

		this.update();
	};

	/**
	 * Refresh the instance
	 * @return {void}
	 */
	DataTable.prototype.refresh = function() {
		if ( this.options.searchable ) {
			this.input.value = '';
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
	DataTable.prototype.clear = function(html) {
		if (this.body) {
			util.flush(this.body, this.isIE);
		}

		var parent = this.body;
		if (!this.body) {
			parent = this.table;
		}

		if (html) {
			if ( typeof html === "string" ) {
				parent.innerHTML = html;
			} else {
				util.append(parent, html);
			}
		}
	};

	/**
	 * Export table to various formats (csv, txt or sql)
	 * @param  {Object} options User options
	 * @return {Boolean}
	 */
	DataTable.prototype.export = function(options) {

		if ( !this.hasHeadings && !this.hasRows ) return false;

		var headers = this.activeHeadings, rows = [], arr = [], i, x, str, link;

		var defaults = {
			download: true,
			skipColumn: [],

			// csv
			lineDelimiter:  "\n",
			columnDelimiter:  ",",

			// sql
			tableName: "myTable",

			// json
			replacer: null,
			space: 4
		};

		// Check for the options object
		if ( !util.isObject(options) ) {
			return false;
		}

		options = util.extend(defaults, options);

		if ( options.type ) {

			if ( options.type === "txt" || options.type === "csv" ) {
				// Include headings
				rows[0] = this.header;
			}

			// Selection or whole table
			if ( options.selection ) {
				// Page number
				if ( util.isInt(options.selection) ) {
					rows = rows.concat(this.pages[options.selection - 1]);
				}
				// Array of page numbers
				else if ( util.isArray(options.selection) ) {
					for ( i = 0; i < options.selection.length; i++ ) {
						rows = rows.concat(this.pages[options.selection[i] - 1]);
					}
				}
			} else {
				rows = rows.concat(this.activeRows);
			}

			// Only proceed if we have data
			if ( rows.length ) {

				if ( options.type === "txt" || options.type === "csv" ) {
					str = "";

					for ( i = 0; i < rows.length; i++ ) {
						for ( x = 0; x < rows[i].cells.length; x++ ) {
							// Check for column skip and visibility
							if ( options.skipColumn.indexOf(x) < 0 && this.columns(rows[i].cells[x].cellIndex).visible() ) {
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

					if ( options.download ) {
						str = "data:text/csv;charset=utf-8," + str;
					}
				} else if ( options.type === "sql" ) {

					// Begin INSERT statement
					str = "INSERT INTO `" + options.tableName + "` (";

					// Convert table headings to column names
					for ( i = 0; i < headers.length; i++ ) {
						// Check for column skip and column visibility
						if ( options.skipColumn.indexOf(i) < 0 && this.columns(headers[i].cellIndex).visible() ) {
							str += "`" + headers[i].textContent + "`,";
						}
					}

					// Remove trailing comma
					str = str.trim().substring(0, str.length - 1);

					// Begin VALUES
					str += ") VALUES ";

					// Iterate rows and convert cell data to column values
					for ( i = 0; i < rows.length; i++ ) {
						str += "(";

						for ( x = 0; x < rows[i].cells.length; x++ ) {
							// Check for column skip and column visibility
							if ( options.skipColumn.indexOf(x) < 0 && this.columns(rows[i].cells[x].cellIndex).visible() ) {
								str += '"'+ rows[i].cells[x].textContent + '",';
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

					if ( options.download ) {
						str = 'data:application/sql;charset=utf-8,' + str;
					}
				} else if ( options.type === "json" ) {

					// Iterate rows
					for ( x = 0; x < rows.length; x++ ) {
						arr[x] = arr[x] || {};
						// Iterate columns
						for ( i = 0; i < headers.length; i++ ) {
							// Check for column skip and column visibility
							if ( options.skipColumn.indexOf(i) < 0 && this.columns(rows[x].cells[i].cellIndex).visible() ) {
								arr[x][headers[i].textContent] = rows[x].cells[i].textContent;
							}
						}
					}

					// Convert the array of objects to JSON string
					str = JSON.stringify(arr, options.replacer, options.space);

					if ( options.download ) {
						str = 'data:application/json;charset=utf-8,' + str;
					}
				}

				// Download
				if ( options.download ) {
					// Filename
					options.filename = options.filename || 'datatable_export';
					options.filename += "." + options.type;

					// Create a link to trigger the download
					str = encodeURI(str);

					link = document.createElement('a');
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
	DataTable.prototype.import = function(options) {
		var obj = false;
		var defaults = {
			// csv
			lineDelimiter:  "\n",
			columnDelimiter:  ",",
		};

		// Check for the options object
		if ( !util.isObject(options) ) {
			return false;
		}

		options = util.extend(defaults, options);

		if ( options.data.length ) {

			// Import CSV
			if ( options.type === "csv" ) {
				obj = { rows: [] };

				// Split the string into rows
				var rows = options.data.split(options.lineDelimiter);

				if ( rows.length ) {
					util.each(rows, function(i, row) {
						obj.rows[i] = [];

						// Split the rows into values
						var values = row.split(options.columnDelimiter);

						if ( values.length ) {
							util.each(values, function(x, value) {
								obj.rows[i].push(value);
							});
						}
					});
				}
			} else if ( options.type === "json" ) {

				var json = util.isJson(options.data);

				// Valid JSON string
				if ( json ) {

					obj = { headings: [], rows: [] };

					util.each(json, function(i, data) {
						obj.rows[i] = [];
						util.each(data, function(column, value) {
							if ( !util.includes(obj.headings, column) ) {
								obj.headings.push(column);
							}

							obj.rows[i].push(value);
						});
					});
				} else {
					console.warn("That's not valid JSON!");
				}
			}

			if ( obj ) {
				// Add the rows
				this.addRows(obj);
			}
		}

		return false;
	};

	/**
	 * Print the table
	 * @return {void}
	 */
	DataTable.prototype.print = function() {
		var headings = this.activeHeadings;
		var rows = this.activeRows;
		var table = util.createElement("table");
		var thead = util.createElement("thead");
		var tbody = util.createElement("tbody");

		var tr = util.createElement("tr");
		util.each(headings, function(i, th) {
			tr.appendChild(util.createElement("th", {
				html: th.textContent
			}));
		});

		thead.appendChild(tr);

		util.each(rows, function(i, row) {
			var tr = util.createElement('tr');
			util.each(row.cells, function(k, cell) {
				tr.appendChild(util.createElement('td', {
					html: cell.textContent
				}));
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
	DataTable.prototype.setMessage = function(message) {
		var colspan = 1;

		if ( this.hasRows ) {
			colspan = this.rows[0].cells.length;
		}

		this.clear(util.createElement('tr', {
			html: '<td class="dataTables-empty" colspan="' + colspan + '">' + message + '</td>'
		}));
	};

	/**
	 * Columns API access
	 * @return {Object} new Columns instance
	 */
	DataTable.prototype.columns = function(columns) {
		return new Columns(this, columns);
	};

	return DataTable;
}));