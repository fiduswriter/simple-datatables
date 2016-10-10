/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015 Karl Saunders (http://mobiuswebdesign.co.uk)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 0.0.7
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


	/* HELPERS */
	var extend = function(a, b) {
		var c;
		for (c in b) b.hasOwnProperty(c) && (a[c] = b[c]);
		return a
	};

	var _hasClass = function(e,c) { return e.classList ? e.classList.contains(c) : !!e.className.match(new RegExp('(\\s|^)'+c+'(\\s|$)')) }

	var _addClass = function(e,c) { e.classList ? e.classList.add(c) : _hasClass(c) || (e.className = e.className.trim() + " " + c) }

	var _removeClass = function(a,c) { a.classList ? a.classList.remove(c) : _hasClass(c) && (a.className = a.className.replace(new RegExp("(^|\\c)" + c.split(" ").join("|") + "(\\c|$)", "gi"), " ")) }

	var _newFragment = function() { return document.createDocumentFragment() }

	var _newElement = function(a, b) {
		var c = document,
			d = c.createElement(a);
		if (b && "object" == typeof b) {
			var e;
			for (e in b)
				if ("html" === e) d.innerHTML = b[e];
				else if ("text" === e) {
				var f = c.createTextNode(b[e]);
				d.appendChild(f)
			} else d.setAttribute(e, b[e])
		}
		return d
	};

	/**
	 * https://gist.github.com/scopevale/1663452
	 */
	var _sort = function(a, b) {
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

	var _forEach = function(a, b, c) {
		if ("[object Object]" === Object.prototype.toString.call(a))
			for (var d in a) Object.prototype.hasOwnProperty.call(a, d) && b.call(c, d, a[d], a);
		else
			for (var e = 0, f = a.length; e < f; e++) b.call(c, e, a[e], a)
	};

	/**
	 * Plugin Object
	 */
	function Plugin(table, options) {

		/* Plugin defaults */
		var defaults = {
			perPage: 10,
			perPageSelect: [5,10,15,20,25],
			navPosition: 'bottom',
			navButtons: true,
			nextPrev: true,
			prevText: '&lsaquo;',
			nextText: '&rsaquo;',
			sortable: false,
			searchable: false,
			fixedHeight: false,
			info: true,
			hideUnusedNavs: false,
			plugins: [],
		};

		this.options = extend(defaults, options);

		var nodeName = table.tagName.toLowerCase();

		if ( nodeName != "table" ) throw new Error('The selected element ('+nodeName+') is not a table!');

		if ( table.tHead === null && this.options.sortable ) throw new Error('The sortable option requires table headings!');

		this.table 	= table;
		this.thead 	= this.table.tHead;

		if ( this.options.data ) {
			this.jsonToTable();
		}

		this.tbody = this.table.tBodies[0];
		this.rows = Array.prototype.slice.call(this.tbody.rows);

		this.colspan = this.thead.rows[0].cells.length;

		this.initialised 		= false;
		this.sortEnabled 		= false;

		this.isIE 				= !!/(msie|trident)/i.test(navigator.userAgent);

		this.paginators 		= [];

		this.currentPage 		= 1;
		this.first_page 		= 1;
		this.onFirstPage 		= true;
		this.onLastPage 		= false;
		this.info 				= { items: 0, pages: 0, range: 0 };

		this.pages = [];
		this.searchPages = [];
		this.searching = false;

		this.init();
	}

	Plugin.prototype = {

		init: function()
		{
			if (this.initialised) return;

			var _this = this;

			this.initPages();
			this.build();

			/* Events */
			this.table.on = function(event, callback) {
				_this.table.addEventListener(event, function(e) {
					callback.call(_this, this);
				});
			};

			/* Plugins */
			if ( this.options.plugins.length ) {
				_forEach(this.options.plugins, function(i, plugin) {
					if ( _this[plugin] && typeof _this[plugin].init === 'function' ) {
						_this[plugin].init(_this);
					}
				});
			}

			setTimeout(function() {
				_this.emit('datatable.init');
			}, 10);

			this.initialised = true;
		},

		/**
		 * Set up the initial info to construct the datatable.
		 */
		initPages: function()
		{
			var _this = this;

			if ( !!this.searching ) {
				this.searchPages = this.searchRows.map( function(row,i) {
					return i%_this.options.perPage==0 ? _this.searchRows.slice(i,i+_this.options.perPage) : null;
				}).filter(function(e){ return e; });
			}

			this.pages = this.rows.map( function(row,i) {
				return i%_this.options.perPage==0 ? _this.rows.slice(i,i+_this.options.perPage) : null;
			}).filter(function(e){ return e; });


			this.info.items = !!this.searching ? this.searchRows.length : this.rows.length;
			this.info.pages = !!this.searching ? this.searchPages.length : this.pages.length;
			this.last_page = this.info.pages;
		},

		/**
		 * Construct the datatable
		 */
		build: function()
		{
			var _this = this;
			var topContainer 		= _newElement('div', { class: 'dataTable-top' });
			var bottomContainer 	= _newElement('div', { class: 'dataTable-bottom' });
			var selector 			= this.getSelect();

			this.wrapper 			= _newElement('div', { class: 'dataTable-wrapper' });
			this.tableContainer 	= _newElement('div', { class: 'dataTable-container' });
			this.label 				= _newElement('div', { class: 'dataTable-info' });

			_addClass(this.table, 'dataTable-table');

			// Populate bottom container
			bottomContainer.appendChild(this.label);

			// Append the containers
			this.wrapper.appendChild(topContainer);
			this.wrapper.appendChild(this.tableContainer);
			this.wrapper.appendChild(bottomContainer);
			topContainer.appendChild(selector);

			if ( this.options.searchable ) {
				this.searchInput = _newElement('input', { type: 'text', 'class': 'dataTable-input', placeholder: 'Search...' })
				this.searchForm = _newElement('div', { class: 'dataTable-search' });
				this.searchForm.appendChild(this.searchInput);
				topContainer.appendChild(this.searchForm);
				_addClass(topContainer, 'searchable');
			}

			// Initialise
			this.showPage();

			this.updateInfo();

			var paginatorA = _newElement('ul', { class: 'dataTable-pagination' }), paginatorB;
			this.paginators.push(paginatorA);

			switch(this.options.navPosition)
			{
				case 'top':
					topContainer.appendChild(paginatorA);
					break;

				case 'bottom':
					bottomContainer.appendChild(paginatorA);
					break;

				case 'both':
					paginatorB = _newElement('ul', { class: 'dataTable-pagination' });
					this.paginators.push(paginatorB);
					topContainer.appendChild(paginatorA);
					bottomContainer.appendChild(paginatorB);
					break;
			}

			this.setButtons();
			this.setClasses();

			// Check if the sortable option is set
			if ( this.options.sortable ) {
				this.initSortable();
			}

			// Insert the main container
			this.table.parentNode.insertBefore(this.wrapper, this.table);

			// Populate table container
			this.tableContainer.appendChild(this.table);

			this.containerRect = this.tableContainer.getBoundingClientRect();

			// Fix the height of the table to keep the bottom container fixed in place.
			if ( this.options.fixedHeight) {
				this.tableContainer.style.height = this.containerRect.height + 'px';
			}

			/* Fix the column widths so they don't change on page switch.
			 * Use percentages so we don't have to update the width of each cell on window resize */
			var cells = _this.table.tHead.rows[0].cells;

			_forEach(cells, function(index, cell) {
				var rect = cell.getBoundingClientRect();
				var w = (rect.width / _this.containerRect.width) * 100;
				cell.style.width = w + '%';
			});

			this.addEventListeners();
		},

		/* Attach required event listeners. */
		addEventListeners: function()
		{
			var _this = this;

			_this.searchRows = [];

			this.handleClickEvents = this.handleEvents.bind(this);

			this.wrapper.addEventListener('click', this.handleClickEvents, false);

			_this.selector.addEventListener('change', _this.update.bind(_this), false);

			_this.searchInput.addEventListener('keyup', _this.search.bind(_this), false);
		},

		handleEvents: function(e)
		{
			e = e || window.event;
			var target = e.target;
			var node = target.nodeName.toLowerCase();

			if ( node === 'a' ) {
				if ( target.hasAttribute('data-page') ) {
					this.switchPage(target);
				}

				if ( _hasClass(target, 'dataTable-sorter') ) {
					this.sortItems(e);
				}

				e.preventDefault();
			}
		},

		/* Change the page. */
		switchPage: function(target)
		{
			var page = target.getAttribute('data-page');

			// We don't want to load the current page again.
			if ( page == this.currentPage && target.parentNode.classList.contains('active') )
				return;

			if ( !isNaN(page)) {
				this.currentPage = parseInt(page, 10);
			}

			// Check we have the nextPrev option enabled
			if ( this.options.nextPrev ) {
				if ( page == 'prev' ) {
					if ( this.onFirstPage ) return;

					this.currentPage--;
				}

				if ( page == 'next' ) {
					if ( this.onLastPage ) return;

					this.currentPage++;
				}
			}

			// Show the selected page;
			this.showPage(this.currentPage-1);
			this.updateInfo();
			this.setClasses();

			this.emit('datatable.change');
		},

		/* Populate the table with the required page. */
		showPage: function(index)
		{
			index = index || 0;

			var pages = this.pages;

			if ( !!this.searching ) {
				pages = this.searchPages;
			}

			if ( pages.length ) {

				var that = this, frag = _newFragment();

				this.truncate();

				_forEach(pages[index], function (i, row) {
					frag.appendChild(row);
				});

				that.tbody.appendChild(frag);

				this.onFirstPage = false;
				this.onLastPage = false;

				switch (this.currentPage) {
					case 1:
						this.onFirstPage = true;
						break;
					case this.last_page:
						this.onLastPage = true
						break;
				}
			}
		},

		/* Update the table info (Showing x to y of z rows) */
		updateInfo: function()
		{
			if ( !this.options.info ) return;

			var pages = !!this.searching ? this.searchPages : this.pages, current = 0, f = 0, t = 0;

			if ( pages.length ) {
				current = this.currentPage-1;
				f = current * this.options.perPage;
				t = f + pages[current].length;
				f = f+1;
			}

			var template = ['Showing ', f, ' to ', t, ' of ', this.info.items, ' rows'];

			this.label.innerHTML = template.join('');
		},

		search: function(event)
		{
			var _this = this, val = this.searchInput.value.toLowerCase();

			this.searching = true;

			this.searchRows = [];

			if ( !val.length ) {
				this.searching = false;
				this.update();
				this.emit("datatable.search");
				return;
			}

			this.truncate();

			_forEach(_this.pages, function(index, page) {
				_forEach(page, function(idx, tr) {
					_forEach(tr.cells, function(i, cell) {
						var text = cell.textContent.toLowerCase();
						var inArray = _this.searchRows.indexOf(tr) > -1;
						if ( text.indexOf(val) > -1 && !inArray ) {
							_this.searchRows.push(tr);
						}
					});
				});
			});

			if ( !_this.searchRows.length ) {
				_this.setMessage('No entries found.');
			}

			this.update();

			this.emit("datatable.search");
		},

		setMessage: function(message)
		{
			this.truncate();
			this.tbody.appendChild(_newElement('tr', { html: '<td class="dataTables-empty" colspan="'+this.colspan+'">'+message+'</td>' }));
		},

		/* Set the correct number of paginator buttons. */
		setButtons: function()
		{
			var that = this, pages = !!this.searching ? this.searchPages : this.pages;

			_forEach(that.paginators, function(index, paginator) {
				var frag = _newFragment();

				paginator.innerHTML = '';

				if ( pages.length <= 1 )
					return;

				if ( that.options.nextPrev ) {
					frag.appendChild(that.getButton('prev'));
				}

				if ( that.options.navButtons )
				{
					_forEach(pages, function(i, page) {
						var li 	= _newElement('li', { class: ( i == 0 ) ? 'active' : '' });
						var a 	= _newElement('a', { href: '#', 'data-page': i+1, html: i+1 });

						li.appendChild(a);
						frag.appendChild(li);
					});
				}

				if ( that.options.nextPrev ) {
					frag.appendChild(that.getButton('next'));
				}

				paginator.appendChild(frag);
			});
		},

		/* Set the active, disabled and hidden classes on the paginator buttons. */
		setClasses: function(node)
		{
			var _this = this,
				onFirstPage = _this.onFirstPage,
				onLastPage = _this.onLastPage,
				nextPrev = _this.options.nextPrev,
				hideNavs = _this.options.hideUnusedNavs;

			_forEach(_this.paginators, function(index, paginator) {
				var links = paginator.children,
					inactive = hideNavs ? 'hidden' : 'disabled';

				_forEach(links, function(i, link) {
					_removeClass(link, 'active');
					_removeClass(link, 'disabled');
					_removeClass(link, 'hidden');
				});

				// We're on the first page so disable / hide the prev button.
				if ( onFirstPage && _this.options.nextPrev )
					_addClass(paginator.firstElementChild, inactive);

				// We're on the last page so disable / hide the next button.
				if ( onLastPage && _this.options.nextPrev )
					_addClass(paginator.lastElementChild, inactive);

				// Add the 'active' class to the correct button
				var n = nextPrev ? _this.currentPage : _this.currentPage-1;
				_addClass(paginator.children[n], 'active');
			});
		},

		/* Make a next / prev button. */
		getButton: function(direction)
		{
			var li = _newElement('li'),
				a = _newElement('a', { href: '#', 'data-page': direction, html: direction == 'prev' ? this.options.prevText : this.options.nextText });
			li.appendChild(a);
			return li;
		},

		/* Update the table contents */
		update: function(e)
		{
			if ( e ) {
				var t = e.target;
				if ( t === this.selector ) {
					this.options.perPage = parseInt(t.value, 10);
				}

				this.emit('datatable.perpage');
			}

			this.currentPage = 1;

			this.initPages();
			this.showPage();
			this.setButtons();
			this.updateInfo();

			this.tableContainer.style.height = null;
			if ( this.options.fixedHeight ) {
				this.containerRect = this.tableContainer.getBoundingClientRect();
				this.tableContainer.style.height = this.containerRect.height + 'px';
			}
		},

		/* Inititialse the sortable option. */
		initSortable: function()
		{
			if ( this.sortEnabled ) return;

			var _this = this, cols = _this.thead.rows[0].cells;

			_forEach(cols, function(i, head) {
				var link = _newElement('a', { 'href' : '#', 'class' : 'dataTable-sorter', html: head.innerHTML });
				head.idx = i;
				head.innerHTML = '';
				head.appendChild(link);
			});

			this.sortEnabled = true;
		},

		/* Perform the sorting */
		sortItems: function(e)
		{
			var _this = this, target = e.target;
			var dir;
			var rows = !!_this.searching ? _this.searchRows : _this.rows;
			var alpha = [];
			var num = [];
			var a = 0;
			var n = 0;
			var th = target.parentNode;

			_forEach(rows, function(i, row) {
				var cell 	= row.cells[th.idx];
				var content = cell.textContent ? cell.textContent : cell.innerText;
				var num 	= content.replace(/(\$|\,|\s)/g, "");

				if (parseFloat(num) == num) {
					num[n++] = { value: Number(num), row: row }
				} else {
					alpha[a++] = { value: content, row: row }
				}
			});


			/* Sort according to direction (ascending or descending) */
			var col = [], top, bottom;
			if (_hasClass(th, "asc")) {
				top = _sort(alpha, -1); bottom = _sort(num, -1); dir = 'descending';
				_removeClass(th, 'asc');
				_addClass(th, 'desc');
			} else {
				top = _sort(num, 1); bottom = _sort(alpha, 1); dir = 'ascending';
				_removeClass(th, 'desc');
				_addClass(th, 'asc');
			}

			/* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
			if (this.lastTh && th != this.lastTh) {
				_removeClass(this.lastTh, 'desc');
				_removeClass(this.lastTh, 'asc');
			}

			this.lastTh = th;

			/* Reorder the table */
			var rows = top.concat(bottom);

			if ( !!_this.searching ) {
				_this.searchRows = [];

				_forEach(rows, function(i, row) {
					_this.searchRows.push(row['row']);
				});
			} else {
				_this.rows = [];

				_forEach(rows, function(i, row) {
					_this.rows.push(row['row']);
				});
			}

			_this.sortOrder = dir;

			_this.update(e);
			_this.emit('datatable.sort');
		},

		/**
		 * Build the perPage selector.
		 */
		getSelect: function()
		{
			var frag = _newFragment(),
				wrapper = _newElement('div', { class: 'dataTable-selectWrapper' }),
				selector = _newElement('select', { class: 'dataTable-selector' }),
				pre = _newElement('span', { html: 'Showing' }),
				suff = _newElement('span', { html: 'entries' });

			_forEach(this.options.perPageSelect, function(i, val) {
				var option = _newElement('option', { value: val, html: val });
				selector.appendChild(option);
			});

			selector.value = this.options.perPage;

			frag.appendChild(pre);
			frag.appendChild(selector);
			frag.appendChild(suff);

			wrapper.appendChild(frag);

			this.selector = selector;

			return wrapper;
		},

		truncate: function()
		{
			// IE doesn't play nice with innerHTML on tBodies.
			if ( this.isIE ) {
				while(this.tbody.hasChildNodes()) {
					this.tbody.removeChild(this.tbody.firstChild);
				}
			} else {
				this.tbody.innerHTML = '';
			}
		},

		emit: function(event) { this.table.dispatchEvent(new Event(event)) },

		/**
		 * Parse JSON data to HTML
		 */
		jsonToTable: function()
		{
			var frag = _newFragment(), tbody = _newElement('tbody');

			_forEach(this.options.data, function(i, row) {
				var tr = _newElement('tr');
				_forEach(row, function(k, value) {
					var td = _newElement('td', { html: value });
					tr.appendChild(td);
				});
				frag.appendChild(tr);
			});

			tbody.appendChild(frag);
			this.table.appendChild(tbody);
		},

	};

	return Plugin;
}));