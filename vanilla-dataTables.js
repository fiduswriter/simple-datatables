/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobiuswebdesign.co.uk)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 1.1.6
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

	/* PRIVATE VARS */

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
				for (var d in a) {
					if (Object.prototype.hasOwnProperty.call(a, d)) {
						b.call(c, d, a[d], a);
					}
				}
			} else {
				for (var e = 0, f = a.length; e < f; e++) {
					b.call(c, e, a[e], a);
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
		listen: function(e, type, callback, scope) {
			e.addEventListener(type, function(e) {
				callback.call(scope || this, e);
			}, false);
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

	var build = function() {
		var _ = this, o = _.options;
		var template = "";

		// Event listeners
		Emitter.mixin(_);

		// Convert data to HTML
		if (o.data) {
			dataToTable.call(_);
		}

		// Store references
		_.tbody = _.table.tBodies[0];
		_.tHead = _.table.tHead;
		_.tFoot = _.table.tFoot;

		// Make a tHead if there isn't one (fixes #8)
		if ( !_.tHead ) {
			var h = util.createElement("thead");
			var t = util.createElement("tr");
			util.each(_.tbody.rows[0].cells, function(i, cell) {
				util.append(t, util.createElement("th"));
			});
			util.append(h, t);
			_.tHead = h;
		}

		// Header
		if ( !o.header ) {
			if ( _.tHead ) {
				_.table.removeChild(_.table.tHead);
			}
		}

		// Footer
		if ( o.footer ) {
			if ( _.tHead && !_.tFoot) {
				_.tFoot = util.createElement('tfoot', {
					html: _.tHead.innerHTML
				});
				_.table.appendChild(_.tFoot);
			}
		} else {
			if ( _.tFoot ) {
				_.table.removeChild(_.table.tFoot);
			}
		}

		// Build
		_.wrapper = util.createElement('div', {
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

		// Sortable
		var cols = _.tHead.rows[0].cells;

		util.each(cols, function(i, th) {
			th.idx = i;

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

		// Add table class
		util.addClass(_.table, 'dataTable-table');

		// Paginator
		var w = util.createElement('div', {
			class: 'dataTable-pagination'
		});
		var paginator = util.createElement('ul');
		util.append(w, paginator);

		// Pager(s) placement
		template = template.replace(/\{pager\}/g, w.outerHTML);

		_.wrapper.innerHTML = template;

		_.container = _.wrapper.querySelector(".dataTable-container");

		_.paginators = _.wrapper.querySelectorAll(".dataTable-pagination");

		_.label = _.wrapper.querySelector(".dataTable-info");

		// Insert in to DOM tree
		_.table.parentNode.replaceChild(_.wrapper, _.table);
		_.container.appendChild(_.table);

		// Store the table dimensions
		_.rect = util.getBoundingRect(_.table);

		// Convert rows to array for processing
		_.rows = Array.prototype.slice.call(_.tbody.rows);

		// Update
		_.update();

		// Fixed height
		if (o.fixedHeight) {
			fixHeight.call(_);
		}

		// Fixed column widths
		if (o.fixedColumns) {
			var cells, hd = false;

			// If we have a headings we need only set the widths on them
			// otherwise we need a temp header and the widths need applying to all cells
			if (_.table.tHead) {
				cells = _.table.tHead.rows[0].cells;

				util.each(cells, function(i, cell) {
					var rect = util.getBoundingRect(cell);
					var w = (rect.width / _.rect.width) * 100;
					cell.style.width = w + '%';
				});
			} else {

				cells = [];

				// Make temperary headings
				hd = util.createElement("thead");
				var r = util.createElement("tr");
				var c = _.table.tBodies[0].rows[0].cells;
				util.each(c, function(i, row) {
					var th = util.createElement("th");
					r.appendChild(th);
					cells.push(th);
				});

				hd.appendChild(r);
				_.table.insertBefore(hd, _.table.tBodies[0]);

				var widths = [];
				util.each(cells, function(i, cell) {
					var rect = util.getBoundingRect(cell);
					var w = (rect.width / _.rect.width) * 100;
					widths.push(w);
				});

				util.each(this.rows, function(idx, row) {
					util.each(row.cells, function(i, cell) {
						cell.style.width = widths[i] + "%";
					});
				});

				// Discard the temp header
				_.table.removeChild(hd);
			}
		}

		setClassNames.call(_);
		addEventListeners.call(_);
	};

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

	var addEventListeners = function() {
		var _ = this, o = _.options;

		// Per page selector
		if ( o.perPageSelect ) {
			var selector = _.wrapper.querySelector(".dataTable-selector");
			if ( selector ) {
				// Change per page
				util.listen(selector, 'change', function(e) {
					o.perPage = parseInt(this.value, 10);
					_.update();

					if (o.fixedHeight) {
						fixHeight.call(_);
					}

					_.emit('datatable.perpage');
				});
			}
		}

		// Search input
		if ( o.searchable ) {
			_.input = _.wrapper.querySelector(".dataTable-input");
			if ( _.input ) {
				util.listen(_.input, 'keyup', function(e) {
					_.search(this.value);
				});
			}
		}

		// Pager(s)
		util.listen(_.wrapper, 'click', function(e) {
			var t = e.target;
			if (t.nodeName.toLowerCase() === 'a' && t.hasAttribute('data-page')) {
				util.preventDefault(e);
				_.page(t.getAttribute('data-page'));
			}
		});

		// Sort items
		if ( o.sortable ) {
			util.listen(_.tHead, 'click', function(e) {
				e = e || window.event;
				var target = e.target;

				if (target.nodeName.toLowerCase() === 'a') {
					if (util.hasClass(target, 'dataTable-sorter')) {
						util.preventDefault(e);
						_.sortColumn(target.parentNode.idx + 1);
					}
				}
			});
		}
	};

	// Sort the rows into pages
	var paginate = function() {
		var _ = this,
			perPage = _.options.perPage,
			rows = !!_.searching ? _.searchData : _.rows;

		_.pages = rows.map(function(tr, i) {
			return i % perPage === 0 ? rows.slice(i, i + perPage) : null;
		}).filter(function(page) {
			return page;
		});

		_.totalPages = _.lastPage = _.pages.length;
	};

	// Render a page
	var render = function() {
		var _ = this;

		if (_.totalPages) {

			if (_.currentPage > _.totalPages) {
				_.currentPage = 1;
			}

			// Use a fragment to limit touching the DOM
			var _index = _.currentPage - 1,
				frag = util.createFragment();

			util.each(_.pages[_index], function(i, v) {
				util.append(frag, v);
			});

			_.clear(frag);

			_.onFirstPage = false;
			_.onLastPage = false;

			switch (_.currentPage) {
				case 1:
					_.onFirstPage = true;
					break;
				case _.lastPage:
					_.onLastPage = true;
					break;
			}
		}

		// Update the info
		var current = 0,
			f = 0,
			t = 0,
			items;

		if (_.totalPages) {
			current = _.currentPage - 1;
			f = current * _.options.perPage;
			t = f + _.pages[current].length;
			f = f + 1;
			items = !!_.searching ? _.searchData.length : _.rows.length;
		}

		if ( _.label && _.options.labels.info.length ) {

			// CUSTOM LABELS
			var string = _.options.labels.info.replace("{start}", f)
												.replace("{end}", t)
												.replace("{page}", _.currentPage)
												.replace("{pages}", _.totalPages)
												.replace("{rows}", items);

			_.label.innerHTML = items  ? string : "";
		}

		if (_.options.fixedHeight && _.currentPage == 1) {
			fixHeight.call(_);
		}
	};

	// Render the pager(s)
	var renderPager = function() {
		var _ = this;

		util.flush(_.paginators, _.isIE);

		if (_.totalPages <= 1) return;

		var c = 'pager',
			frag = util.createFragment(),
			prev = _.onFirstPage ? 1 : _.currentPage - 1,
			next = _.onlastPage ? _.totalPages : _.currentPage + 1;

		// first button
		if (_.options.firstLast) {
			util.append(frag, util.button(c, 1, _.options.firstText));
		}

		// prev button
		if (_.options.nextPrev) {
			util.append(frag, util.button(c, prev, _.options.prevText));
		}

		var pager = _.links;

		// truncate the links
		if (_.options.truncatePager) {
			pager = _truncate(_.links, _.currentPage, _.pages.length, _.options.pagerDelta);
		}

		// active page link
		util.addClass(_.links[_.currentPage - 1], 'active');

		// append the links
		util.each(pager, function(i, p) {
			util.removeClass(p, 'active');
			util.append(frag, p);
		});

		util.addClass(_.links[_.currentPage - 1], 'active');

		// next button
		if (_.options.nextPrev) {
			util.append(frag, util.button(c, next, _.options.nextText));
		}

		// first button
		if (_.options.firstLast) {
			util.append(frag, util.button(c, _.totalPages, _.options.lastText));
		}

		// We may have more than one pager
		util.each(_.paginators, function(i,pager) {
			util.append(pager, frag.cloneNode(true));
		});
	};

	// Bubble sort algorithm
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

	// Fix container heigh
	var fixHeight = function() {
		this.container.style.height = null;
		this.rect = util.getBoundingRect(this.container);
		this.container.style.height = this.rect.height + 'px';
	};

	// Pager truncation algorithm
	var _truncate = function(a, b, c, d) {
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

	// Parse data to HTML
	var dataToTable = function() {
		var data = this.options.data,
			thead = false,
			tbody = false;

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

	// Event emitter
	var Emitter = function() {};
	Emitter.prototype = {
		on: function(event, fct) {
			this._events = this._events || {};
			this._events[event] = this._events[event] || [];
			this._events[event].push(fct);
		},
		off: function(event, fct) {
			this._events = this._events || {};
			if (event in this._events === false) return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		},
		emit: function(event /* , args... */ ) {
			this._events = this._events || {};
			if (event in this._events === false) return;
			for (var i = 0; i < this._events[event].length; i++) {
				this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		}
	};

	Emitter.mixin = function(obj) {
		var props = ['on', 'off', 'emit'];
		for (var i = 0; i < props.length; i++) {
			if (typeof obj === 'function') {
				obj.prototype[props[i]] = Emitter.prototype[props[i]];
			} else {
				obj[props[i]] = Emitter.prototype[props[i]];
			}
		}
		return obj;
	};

	/////////////////
	//	DATATABLE	//
	////////////////

	function DataTable(table, options) {

		var _ = this;

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

		// user options
		_.options = util.extend(defaults, options);

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
		if ( !_.options.header ) {
			_.options.sortable = false;
		}

		if (table.tHead === null ) {
			if ( !_.options.data || (_.options.data && !_.options.data.headings) ) {
				_.options.sortable = false;
			}
		}

		if (!table.tBodies.length) {
			if (_.options.data) {
				if (!_.options.data.rows) {
					throw new Error("You seem to be using the data option, but you've not defined any rows.");
				}
			} else {
				throw new Error("You don't seem to have a tbody in your table.");
			}
		}

		if (table.tBodies.length && !table.tBodies[0].rows.length) {
			if (_.options.data) {
				if (!_.options.data.rows) {
					throw new Error("You seem to be using the data option, but you've not defined any rows.");
				}
			} else {
				throw new Error("You don't seem to have any rows in your table.");
			}
		}

		_.table = table;

		// IE detection
		_.isIE = !!/(msie|trident)/i.test(navigator.userAgent);

		_.currentPage = 1;
		_.onFirstPage = true;

		build.call(_);

		setTimeout(function() {
			_.emit('datatable.init');
		}, 10);
	}

	DataTable.prototype.update = function() {
		var _ = this;

		paginate.call(_);
		render.call(_);

		_.links = [];

		var i = _.pages.length;
		while (i--) {
			var num = i + 1;
			_.links[i] = util.button((i === 0) ? 'active' : '', num, num);
		}

		renderPager.call(_);

		_.emit('datatable.update');
	};

	DataTable.prototype.search = function(query) {
		var _ = this;

		query = query.toLowerCase();

		_.currentPage = 1;
		_.searching = true;
		_.searchData = [];

		if (!query.length) {
			_.searching = false;
			_.update();
			_.emit("datatable.search", query, _.searchData);
			util.removeClass(this.wrapper, 'search-results');
			return false;
		}

		_.clear();

		util.each(_.rows, function(idx, row) {
			var inArray = util.includes(_.searchData, row);
			// Cheat and get the row's textContent instead of searching each cell :P
			if (util.includes(row.textContent.toLowerCase(), query) && !inArray) {
				_.searchData.push(row);
			}
		});

		util.addClass(this.wrapper, 'search-results');

		if (!_.searchData.length) {
			util.removeClass(this.wrapper, 'search-results');
			_.setMessage(_.options.labels.noRows);
		}

		_.update();

		_.emit("datatable.search", query, _.searchData);
	};

	/* Change the page. */
	DataTable.prototype.page = function(page) {
		var _ = this;

		// We don't want to load the current page again.
		if (page == _.currentPage) {
			return false;
		}

		if (!isNaN(page)) {
			_.currentPage = parseInt(page, 10);
		}

		if (page > _.pages.length || page < 0) {
			return false;
		}

		render.call(_);
		renderPager.call(_);

		_.emit('datatable.page', page);
	};

	/* Perform the sorting */
	DataTable.prototype.sortColumn = function(column, direction) {

		// Check column is present
		if ( column < 1 || column > this.tHead.rows[0].cells.length ) {
			return false;
		}

		// Convert to zero-indexed
		column = column - 1;

		var _ = this;
		var dir;
		var rows = !!_.searching ? _.searchData : _.rows;
		var alpha = [];
		var numeric = [];
		var a = 0;
		var n = 0;
		var th = _.tHead.rows[0].cells[column];

		util.each(rows, function(i, tr) {
			var cell = tr.cells[column];
			var content = cell.textContent;
			var num = content.replace(/(\$|\,|\s)/g, "");

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

		if (!!_.searching) {
			_.searchData = [];

			util.each(rows, function(i, v) {
				_.searchData.push(v.row);
			});
		} else {
			_.rows = [];

			util.each(rows, function(i, v) {
				_.rows.push(v.row);
			});
		}

		_.update();
		_.emit('datatable.sort', column, dir);
	};

	DataTable.prototype.addRows = function(data) {
		if (Object.prototype.toString.call(data) !== '[object Object]') {
			throw new Error("Function addRows: The method requires an object.");
		}

		if (!data.rows) {
			throw new Error("Function addRows: Your object is missing the 'rows' property.");
		}

		var that = this;
		util.each(data.rows, function(i, row) {
			var tr = util.createElement("tr");
			util.each(row, function(a, val) {
				var td = util.createElement("td", {
					html: val
				});
				tr.appendChild(td);
			});
			that.rows.push(tr);
		});

		this.update();
	};

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

	DataTable.prototype.clear = function(html) {
		if (this.tbody) {
			util.flush(this.tbody, this.isIE);
		}

		var parent = this.tbody;
		if (!this.tbody) {
			parent = this.table;
		}

		if (html) {
			util.append(parent, html);
		}
	};

	DataTable.prototype.setMessage = function(message) {
		var colspan = this.rows[0].cells.length;
		this.clear(util.createElement('tr', {
			html: '<td class="dataTables-empty" colspan="' + colspan + '">' + message + '</td>'
		}));
	};

	return DataTable;
}));