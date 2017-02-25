/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobiuswebdesign.co.uk)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 1.0.0
 *
 */

(function (root, factory) {
	var plugin = 'DataTable';

	if (typeof define === 'function' && define.amd) {
		define([], factory(plugin));
	} else if (typeof exports === 'object') {
		module.exports = factory(plugin);
	} else {
		root[plugin] = factory(plugin);
	}
}(this, function (plugin) {
	'use strict';


	/* PRIVATE VARS */

	var util = {
		extend: function(src, props) {
			var p;
			for (p in props)
				if (props.hasOwnProperty(p)) src[p] = props[p];
			return src;
		},
		each: function(a, b, c) {
			if ("[object Object]" === Object.prototype.toString.call(a))
				for (var d in a) {if ( Object.prototype.hasOwnProperty.call(a, d) ) { b.call(c, d, a[d], a); }}
			else
				for (var e = 0, f = a.length; e < f; e++) { b.call(c, e, a[e], a); }
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
			if (!util.hasClass(a, b)) { if (a.classList) { a.classList.add(b); } else { a.className = a.className.trim() + " " + b); } }
		},
		removeClass: function(a, b) {
			if (util.hasClass(a, b)) { if (a.classList) { a.classList.remove(b); } else { a.className = a.className.replace(new RegExp("(^|\\s)" + b.split(" ").join("|") + "(\\s|$)", "gi"), " ")); }}
		},
		append: function(p, e) {
			return p && e && p.appendChild(e);
		},
		listen: function(e, type, callback, scope) {
			e.addEventListener(type, function(e) { callback.call(scope||this, e); }, false);
		},
		getBoundingRect: function(el) {
			var win = window;
			var rect = el.getBoundingClientRect();
			var offsetX = win.pageXOffset !== undefined ? win.pageXOffset : (doc.documentElement || body.parentNode || body).scrollLeft;
			var offsetY = win.pageYOffset !== undefined ? win.pageYOffset : (doc.documentElement || body.parentNode || body).scrollTop;

			return {
				bottom: rect.bottom + offsetY,
				height: rect.height,
				left  : rect.left + offsetX,
				right : rect.right + offsetX,
				top   : rect.top + offsetY,
				width : rect.width
			};
		},
		preventDefault: function(e) {
			e = e || window.event;
			if (e.preventDefault) {
				return e.preventDefault();
			}
		},
		includes: function(a,b) {
			return a.indexOf(b) > -1;
		},
		button: function(c, p, t){
			return util.createElement('li', { class: c, html: '<a href="#" data-page="'+p+'">'+t+'</a>'});
		},
		flush: function(el, ie) {
			if (ie) { while (el.hasChildNodes()) { el.removeChild(el.firstChild); } } else { el.innerHTML = ''; }
		}
	};

	var build = function() {
		var _ = this;

		if ( _.options.data ) {
			dataToTable.call(_);
		}

		_.tbody = _.table.tBodies[0];

		var _wrapper = util.createElement('div', { class: 'dataTable-wrapper'});
		_.container = util.createElement('div', { class: 'dataTable-container'})
		var _columnSelector = util.createElement('select', { class: 'dataTable-selector'});
		_.label = util.createElement('div', { class: 'dataTable-info' });

		var top = util.createElement('div', { class: 'dataTable-top' });
		var bottom = util.createElement('div', { class: 'dataTable-bottom' });


		// Per Page Select
		if (_.options.perPageSelect) {
			// Build the selector
			var wrap = util.createElement('label', { class: 'dataTable-selectWrapper' });
			var _ppSelector = util.createElement('select', { class: 'dataTable-selector'});

			util.each(_.options.perPageSelect, function(i, val) {
				util.append(_ppSelector, util.createElement('option', { value: val, html: val }));
			});

			_ppSelector.value = _.options.perPage;

			util.append(wrap, _ppSelector);
			wrap.insertAdjacentHTML('beforeend', ' entries per page');
			util.append(top, wrap);

			// Change per page
			util.listen(_ppSelector, 'change', function(e) {
				_.options.perPage = parseInt(this.value, 10);
				_.update();

				if ( _.options.fixedHeight ) {
					fixHeight.call(_);
				}

				_.emit('datatable.perpage');
			});
		}

		// Searchable
		if (_.options.searchable) {

			var form = util.createElement('div', { class: 'dataTable-search' });
			_.input = util.createElement('input', { type: 'text', class: 'dataTable-input', placeholder: 'Search...'});
			util.append(form, _.input);
			util.append(top, form);
			util.addClass(top, 'searchable');

			util.listen(_.input, 'keyup', function(e) {
				_.search(this.value);
			});
		}

		// Sortable
		if (_.options.sortable) {
			var cols = _.table.tHead.rows[0].cells;

			util.each(cols, function(i, head) {
				var link = util.createElement('a', { href: '#', class: 'dataTable-sorter', html: head.innerHTML });
				head.idx = i;
				head.innerHTML = '';
				util.append(head, link);
			});

			// Sort items
			util.listen(_.table.tHead, 'click', function(e) {
				e = e || window.event;
				var target = e.target;

				if (target.nodeName.toLowerCase() === 'a') {
					if (util.hasClass(target, 'dataTable-sorter')) {
						_.sortColumn(target.parentNode.idx);
						util.preventDefault(e);
					}
				}
			});
		}

		// Add class
		util.addClass(_.table, 'dataTable-table');

		// Populate bottom container
		util.append(bottom, _.label);

		// Append the containers
		util.append(_wrapper, top);
		util.append(_wrapper, _.container);
		util.append(_wrapper, bottom);

		// Paginator
		_.paginator = util.createElement('ul', { class: 'dataTable-pagination' });
		util.append(bottom, _.paginator);

		// Switch pages
		util.listen(_.paginator, 'click', function(e) {
			var t = e.target;
			if (t.nodeName.toLowerCase() === 'a' && t.hasAttribute('data-page')) {
				_.page(t.getAttribute('data-page'));
				util.preventDefault(e);
			}
		});

		// Insert the main container
		_.table.parentNode.insertBefore(_wrapper, _.table);

		// Populate table container
		util.append(_.container, _.table);

		_.rect = util.getBoundingRect(_.table);

		_.rows = Array.prototype.slice.call(_.tbody.rows);

		// Event listeners
		Emitter.mixin(_);

		_.update();

		// Fixed height
		if (_.options.fixedHeight) {
			fixHeight.call(_);
		}

		/* Fixed column widths */
		if (_.options.fixedColumns) {
			var cells = _.table.tHead.rows[0].cells;

			util.each(cells, function(i, cell) {
				var rect = util.getBoundingRect(cell);
				var w = (rect.width / _.rect.width) * 100;
				cell.style.width = w + '%';
			});
		}

	};

	var paginate = function() {
		var _ = this, perPage = _.options.perPage,
			rows = !!_.searching ? _.searchData : _.rows;

		_.pages = rows.map(function(tr, i) {
			return i % perPage == 0 ? rows.slice(i, i + perPage) : null;
		}).filter(function(page) {
			return page;
		});

		_.totalPages = _.lastPage = _.pages.length;
	};

	var render = function() {
		var _ = this;

		if ( _.totalPages ) {

			if ( _.currentPage > _.totalPages ) {
				_.currentPage = 1;
			}

			// Use a fragment to limit touching the DOM
			var _index = _.currentPage - 1, frag = util.createFragment();

			util.each(_.pages[_index], function (i, v) {
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
					_.onLastPage = true
					break;
			}
		}

		// Update the info
		var current = 0, f = 0, t = 0, items;

		if ( _.totalPages ) {
			current = _.currentPage-1;
			f = current * _.options.perPage;
			t = f + _.pages[current].length;
			f = f+1;
			items = !!_.searching ? _.searchData.length : _.rows.length;
		}

		_.label.innerHTML = ['Showing ', f, ' to ', t, ' of ', items, ' rows'].join('');

		if (_.options.fixedHeight && _.currentPage == 1) {
			fixHeight.call(_);
		}
	};

	var renderPager = function() {
		var _ = this;

		util.flush(_.paginator, _.isIE);

		if (_.totalPages <= 1) return;

		var frag = util.createFragment(),
			c = _.options.hideNavs ? 'hidden' : 'disabled',
			prev = _.onFirstPage ? 1 : _.currentPage - 1,
			next = _.onlastPage ? _.totalPages : _.currentPage + 1;


		// first button
		if (_.options.firstLast) {
			util.append(frag, util.button(_.onFirstPage ? c : '', 1, _.options.firstText)); }

		// prev button
		if (_.options.nextPrev) {
			util.append(frag, util.button(_.onFirstPage ? c : '', prev, _.options.prevText)); }

		var pager = _.links;

		// truncate the links
		if (_.options.truncatePager) {
			pager = _truncate(_.links, _.currentPage, _.pages.length, _.options.pagerDelta); }

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
			util.append(frag, util.button(_.onLastPage ? c : '', next, _.options.nextText)); }

		// first button
		if (_.options.firstLast) {
			util.append(frag, util.button(_.onLastPage ? c : '', _.totalPages, _.options.lastText)); }

		// append the fragment
		util.append(_.paginator, frag);
	};

	var sortItems = function(a, b) {
		var c, d;
		1 === b ? (c = 0, d = a.length) : b === -1 && (c = a.length - 1, d = -1);
		for (var e = !0; e;) {
			e = !1;
			for (var f = c; f != d; f += b)
				if (a[f + b] && a[f].value > a[f + b].value) {
					var g = a[f],
						h = a[f + b],
						i = g;
					a[f] = h, a[f + b] = i, e = !0
				}
		}
		return a
	};

	var fixHeight = function() {
		this.container.style.height = null;
		this.rect = util.getBoundingRect(this.container);
		this.container.style.height = this.rect.height + 'px';
	};

	var _truncate = function(a, b, c, d) {
		d = d || 2;
		var j, e = 2 * d,
			f = b - d,
			g = b + d,
			h = [],
			i = [];
		b < 4 - d + e ? g = 3 + e : b > c - (3 - d + e) && (f = c - (2 + e));
		for (var k = 1; k <= c; k++)
			if (1 == k || k == c || k >= f && k <= g) {
				var l = a[k - 1];
				util.removeClass(l, "active"), h.push(l)
			}
		return util.each(h, function(b, c) {
			var d = c.children[0].getAttribute("data-page");
			if (j) {
				var e = j.children[0].getAttribute("data-page");
				if (d - e == 2) i.push(a[e]);
				else if (d - e != 1) {
					var f = util.createElement("li", { class: "ellipsis", html: '<a href="#">&hellip;</a>' });
					i.push(f)
				}
			}
			i.push(c), j = c
		}), i
	};


	var dataToTable = function() {
		var data = this.options.data,
			thead = false,
			tbody = false;

		if ( data.headings ) {
			thead = util.createElement('thead');
			var tr = util.createElement('tr');
			util.each(data.headings, function(i,col) {
				var td = util.createElement('th', {
					html: col
				});
				tr.appendChild(td);
			});

			thead.appendChild(tr);
		}

		if ( data.rows ) {
			tbody = util.createElement('tbody')
			util.each(data.rows, function(i, row) {
				var tr = util.createElement('tr');
				util.each(row, function(k, value) {
					var td = util.createElement('td', {
						html: value
					});
					tr.appendChild(td);
				});
				tbody.appendChild(tr);
			});
		}

		if ( thead ) {
			if ( this.table.tHead !== null ) {
				this.table.removeChild(this.table.tHead);
			}
			util.append(this.table, thead);
		}

		if ( tbody ) {
			if ( this.table.tBodies.length ) {
				this.table.removeChild(this.table.tBodies[0]);
			}
			util.append(this.table, tbody);
		}
	};

	// Emitter
	var Emitter = function() {};
	Emitter.prototype = {
		on: function(a, b) {
			this._events = this._events || {}, this._events[a] = this._events[a] || [], this._events[a].push(b)
		},
		off: function(a, b) {
			this._events = this._events || {}, a in this._events != !1 && this._events[a].splice(this._events[a].indexOf(b), 1)
		},
		emit: function(a) {
			if (this._events = this._events || {}, a in this._events != !1)
				for (var b = 0; b < this._events[a].length; b++) this._events[a][b].apply(this, Array.prototype.slice.call(arguments, 1))
		}
	};

	Emitter.mixin = function(a) {
		for (var b = ["on", "off", "emit"], c = 0; c < b.length; c++) "function" == typeof a ? a.prototype[b[c]] = Emitter.prototype[b[c]] : a[b[c]] = Emitter.prototype[b[c]];
		return a
	};

	/////////////////
	//	DATATABLE	//
	////////////////

	function Plugin(table, options) {

		var _ = this;

		var defaults = {
			perPage: 10,
			perPageSelect: [5, 10, 15, 20, 25],
			nextPrev: true,
			firstLast: true,
			prevText: '&lsaquo;',
			nextText: '&rsaquo;',
			firstText: '&laquo;',
			lastText: '&raquo;',
			sortable: true,
			searchable: true,
			fixedColumns: false,
			fixedHeight: false,
			truncatePager: true,
			pagerDelta: 2,
		};

		// user options
		_.options = util.extend(defaults, options);

		// Checks
		if (!table) {
			throw new Error("The plugin requires a table as the first parameter"); }

		if (table.tagName.toLowerCase() != "table") {
			throw new Error("The selected element is not a table."); }

		if (table.tHead === null && _.options.sortable) {
			if ( _.options.data ) {
				if ( !_.options.data.headings ) {
					throw new Error("You seem to be using the data option, but you've not defined any headings.");
				}
			} else {
				throw new Error("The sortable option requires table headings.");
			}
		}

		if (!table.tBodies.length) {
			if ( _.options.data ) {
				if ( !_.options.data.rows ) {
					throw new Error("You seem to be using the data option, but you've not defined any rows.");
				}
			} else {
				throw new Error("You don't seem to have a tbody in your table.");
			}
		}

		if (table.tBodies.length && !table.tBodies[0].rows.length) {
			if ( _.options.data ) {
				if ( !_.options.data.rows ) {
					throw new Error("You seem to be using the data option, but you've not defined any rows.");
				}
			} else {
				throw new Error("You don't seem to have any rows in your table.");
			}
		}

		_.table = table;

		// IE detection
		_.isIE = !!/(msie|trident)/i.test(navigator.userAgent);

		_.currentPage 		= 1;
		_.onFirstPage 		= true;

		build.call(_);

		setTimeout(function() {
			_.emit('datatable.init');
		}, 10);
	};

	Plugin.prototype.update = function() {
		var _ = this;

		paginate.call(_);
		render.call(_);

		_.links = [];

		var i = _.pages.length;
		while(i--) {
			var num = i + 1;
			_.links[i] = util.button((i == 0) ? 'active' : '', num, num);
		}

		renderPager.call(_);

		_.emit('datatable.update');
	};

	Plugin.prototype.search = function(query) {
		var _ = this;

		query = query.toLowerCase();

		_.currentPage = 1;
		_.searching = true;
		_.searchData = [];

		if ( !query.length ) {
			_.searching = false;
			_.update();
			_.emit("datatable.search", query, _.searchData);
			return;
		}

		_.clear();

		util.each(_.rows, function(idx, row) {
			var inArray = util.includes(_.searchData, row);
			// Cheat and get the row's textContent instead of searching each cell :P
			if ( util.includes(row.textContent.toLowerCase(), query) && !inArray) {
				_.searchData.push(row);
			}
		});

		if ( !_.searchData.length ) {
			_.setMessage('No entries found.'); }

		_.update();

		_.emit("datatable.search", query, _.searchData);
	};

	/* Change the page. */
	Plugin.prototype.page = function(page) {
		var _ = this;

		// We don't want to load the current page again.
		if ( page == _.currentPage ) {
			return; }

		if ( !isNaN(page)) {
			_.currentPage = parseInt(page, 10); }

		if ( page > _.pages.length || page < 0 ) {
			return; }

		render.call(_);
		renderPager.call(_);

		_.emit('datatable.page', page);
	};

	/* Perform the sorting */
	Plugin.prototype.sortColumn = function(column, direction) {
		var _ = this;
		var dir;
		var rows = !!_.searching ? _.searchData : _.rows;
		var alpha = [];
		var numeric = [];
		var a = 0;
		var n = 0;
		var th = _.table.tHead.rows[0].cells[column];

		util.each(rows, function(i, tr) {
			var cell 	= tr.cells[th.idx];
			var content = cell.textContent;
			var num 	= content.replace(/(\$|\,|\s)/g, "");

			if (parseFloat(num) == num) {
				numeric[n++] = { value: Number(num), row: tr }
			} else {
				alpha[a++] = { value: content, row: tr }
			}
		});


		/* Sort according to direction (ascending or descending) */
		var col = [], top, btm;
		if (util.hasClass(th, "asc") || direction == "asc") {
			top = sortItems(alpha, -1); btm = sortItems(numeric, -1); dir = 'descending';
			util.removeClass(th, 'asc');
			util.addClass(th, 'desc');
		} else {
			top = sortItems(numeric, 1); btm = sortItems(alpha, 1); dir = 'ascending';
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
		var rows = top.concat(btm);

		if ( !!_.searching ) {
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

	Plugin.prototype.addRows = function(data) {
		if ( Object.prototype.toString.call(data) !== '[object Object]') {
			throw new Error("Function addRows: The method requires an object.");
		}

		if ( !data.rows ) {
			throw new Error("Function addRows: Your object is missing the 'rows' property.");
		}

		var that = this;
		util.each(data.rows, function(i, row) {
			var tr = util.createElement("tr");
			util.each(row, function(a, val) {
				var td = util.createElement("td", { html: val });
				tr.appendChild(td);
			});
			that.rows.push(tr);
		});

		this.update();
	},

	Plugin.prototype.refresh = function() {
		this.input.value = '';
		this.searching = false;
		this.update();

		this.emit("datatable.refresh");
	},

	Plugin.prototype.clear = function(html) {
		if ( this.tbody ) {
			util.flush(this.tbody, this.isIE);
		}

		var parent = this.tbody;
		if ( !this.tbody ) {
			parent = this.table;
		}

		if ( html ) {
			util.append(parent, html); }
	};

	Plugin.prototype.setMessage = function(message) {
		var colspan = this.table.tHead.rows[0].cells.length;
		this.clear(util.createElement('tr', { html: '<td class="dataTables-empty" colspan="'+colspan+'">'+message+'</td>' }));
	};

	return Plugin;
}));
