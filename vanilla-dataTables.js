/*!
 *
 __     __          _ _ _         ____        _       _____     _     _
 \ \   / /_ _ _ __ (_) | | __ _  |  _ \  __ _| |_ __ |_   _|_ _| |__ | | ___  ___
  \ \ / / _` | '_ \| | | |/ _` | | | | |/ _` | __/ _` || |/ _` | '_ \| |/ _ \/ __|
   \ V / (_| | | | | | | | (_| | | |_| | (_| | || (_| || | (_| | |_) | |  __/\__ \
	\_/ \__,_|_| |_|_|_|_|\__,_| |____/ \__,_|\__\__,_||_|\__,_|_.__/|_|\___||___/

 * Copyright (c) 2015 Karl Saunders (http://mobiuswebdesign.co.uk)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 0.0.5
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


	/*------------------------------------------
		  _   _      _
		 | | | | ___| |_ __   ___ _ __ ___
		 | |_| |/ _ \ | '_ \ / _ \ '__/ __|
		 |  _  |  __/ | |_) |  __/ |  \__ \
		 |_| |_|\___|_| .__/ \___|_|  |___/
					  |_|

	-------------------------------------------*/

	/**
	 * Merge defaults with user options
	 * @param {Object} source Default settings
	 * @param {Object} props User options
	 */
	var extend = function (source, props) {
		var prop;
		for (prop in props) {
			if (props.hasOwnProperty(prop)) {
				source[prop] = props[prop];
			}
		}
		return source;
	};

	/**
	 * Check var is an integer
	 * @param  {mixed} value
	 * @return {Boolean}
	 */
	var isInt = function( value ) {
		var x;
		if (isNaN(value)) return false;
		x = parseFloat(value);
		return (x | 0) === x;
	}

	/**
	 * Get the width of an element.
	 * @param  {Node} elem The element to get the height of
	 * @return {Number}    The element's height in pixels
	 */
	var getWidth = function ( elem ) {
		return Math.max( elem.scrollWidth, elem.offsetWidth, elem.clientWidth );
	};

	/**
	 * Get the height of an element.
	 * @param  {Node} elem The element to get the height of
	 * @return {Number}    The element's height in pixels
	 */
	var getHeight = function ( elem ) {
		return Math.max( elem.scrollHeight, elem.offsetHeight, elem.clientHeight );
	};

	/**
	 * Create element helper. Create an element and assign given attributes.
	 * @param  {NodeType} type 	Type of element to create.
	 * @param  {Object} attrs 	The attributes to assign to the element.
	 * @return {HTMLElement}
	 */
	var createElement = function(type, attrs) {
		var attr, elem = document.createElement(type);
		if ( attrs && typeof attrs === 'object' ) {
			for (attr in attrs) {
				if ( attr in elem ) {
					if ( attr === 'innerHTML' ) {
						elem.innerHTML = attrs[attr];
					} else {
						elem[attr] = attrs[attr];
					}
				} else {
					if ( attr === 'class' ) {
						if ( attrs[attr] !== '' ) {
							var classNames = attrs[attr].split(' ');
							for (var i = classNames.length - 1; i >= 0; i--) {
								elem.classList.add(classNames[i]);
							};
						}
					} else {
						elem.setAttribute(attr, attrs[attr]);
					}
				}
			}
		}
		return elem;
	};

	/**
	 * https://gist.github.com/scopevale/1663452
	 * @param  {Object} arr [description]
	 * @param  {int} 	dir [description]
	 * @return {Object}     [description]
	 */
	var bubbleSort = function(arr, dir) {
		var start, end;
		if (dir === 1) {
			start = 0;
			end = arr.length;
		} else if (dir === -1) {
			start = arr.length-1;
			end = -1;
		}

		var unsorted = true;
		while (unsorted) {
			unsorted = false;
			for (var i=start; i!=end; i=i+dir) {
				if (arr[i+dir] && arr[i].value > arr[i+dir].value) {
					var a = arr[i], b = arr[i+dir], c = a;
					arr[i] = b;
					arr[i+dir] = c;
					unsorted = true;
				}
			}
		}
		return arr;
	}

	/**
	 * forEach helper
	 */
	var forEach = function (collection, callback, scope) {
		if (Object.prototype.toString.call(collection) === '[object Object]') {
			for (var prop in collection) {
				if (Object.prototype.hasOwnProperty.call(collection, prop)) {
					callback.call(scope, prop, collection[prop], collection);
				}
			}
		} else {
			for (var i = 0, len = collection.length; i < len; i++) {
				callback.call(scope, i, collection[i], collection);
			}
		}
	};

	/**
	 * Detect crappy IE browsers... ugh...
	 * @return {Boolean}
	 */
	var isIE = function(browser) {
		var agent = window.navigator.userAgent, ie = agent.indexOf('MSIE '), tri = agent.indexOf('Trident/');
		return (ie > 0 || tri > 0) ? true : false;
	}

	/**
	 * Plugin Object
	 * @param table The table to initialize
	 * @param {Object} options User options
	 * @constructor
	 */
	function Plugin(table, options) {

		this.table 	= table;
		this.thead 	= this.table.tHead;
		this.tbody 	= this.table.tBodies[0];

		var nodeName = table.tagName.toLowerCase();

		if ( nodeName != "table")
			throw new Error('The selected element ('+nodeName+') is not a table!');

		if ( table.tHead === null && options.sortable )
			throw new Error('The sortable option requires table headings!');

		this.initialised 		= false;
		this.sortEnabled 		= false;

		this.isIE 				= isIE();

		this.paginators 		= [];

		this.initialRows 		= null;

		this.currentPage 		= 1;
		this.first_page 		= 1;
		this.onFirstPage 		= true;
		this.onLastPage 		= false;
		this.info 				= { items: 0, pages: 0, range: 0 };


		this.initialRows = Array.prototype.slice.call(this.tbody.rows);
		this.pages = [];
		this.searchPages = [];
		this.searching = false;

		/**
		 * Plugin defaults
		 * @type {Object}
		 */
		var defaults = {
			perPage: 10,
			navPosition: 'both',
			navButtons: true,
			nextPrev: true,
			prevText: '&lsaquo;',
			nextText: '&rsaquo;',
			sortable: false,
			searchable: false,
			fixedHeight: true,
			info: true,
			hideUnusedNavs: false,
			perPageSelect: [5,10,15,20,25],
			plugins: [],
			change: function() {},
			sorted: function() {},
		};


		this.options = extend(defaults, options);
		this.initialise();
	}


	// Plugin prototype
	Plugin.prototype = {

		initialise: function()
		{
			if (this.initialised) return;

			this.initialised = true;

			var that = this, cells = that.table.tHead.rows[0].cells, tw = getWidth(that.table);

			/**
			 * Fix the column widths so they don't change on page switch.
			 */
			forEach(cells, function(index, cell) {
				var w = (getWidth(cell) / tw) * 100;
				cell.style.width = w + '%';
			});

			this.initPages();
			this.build();

			this.on = function(event, callback) {
				that.table.addEventListener(event, function(e) {
					callback.call(that, this);
				});
			};

			if ( this.options.plugins.length ) {
				forEach(this.options.plugins, function(index, plugin) {
					that[plugin].initialise(that);
				});
			}

			setTimeout(function() {
				that.emit('datatable.init');
			}, 50);

		},

		/**
		 * Set up the initial info to construct the datatable.
		 * @return {void}
		 */
		initPages: function()
		{
			var that = this;

			if ( !!this.searching ) {
				this.searchPages = this.searchRows.map( function(row,i) {
					return i%that.options.perPage==0 ? that.searchRows.slice(i,i+that.options.perPage) : null;
				}).filter(function(e){ return e; });
			}

			this.pages = this.initialRows.map( function(row,i) {
				return i%that.options.perPage==0 ? that.initialRows.slice(i,i+that.options.perPage) : null;
			}).filter(function(e){ return e; });


			this.info.items = !!this.searching ? this.searchRows.length : this.initialRows.length;
			this.info.pages = !!this.searching ? this.searchPages.length : this.pages.length;
			this.last_page = this.info.pages;
		},

		/**
		 * Construct the datatable
		 * @return {void}
		 */
		build: function()
		{
			var topContainer 		= createElement('div', { class: 'dataTable-top' });
			var bottomContainer 	= createElement('div', { class: 'dataTable-bottom' });
			var selector 			= this.getSelector();

			this.wrapper 			= createElement('div', { class: 'dataTable-wrapper' });
			this.tableContainer 	= createElement('div', { class: 'dataTable-container' });
			this.label 				= createElement('div', { class: 'dataTable-info' });


			this.table.classList.add('dataTable-table');


			// Populate bottom container
			bottomContainer.appendChild(this.label);

			// Append the containers
			this.wrapper.appendChild(topContainer);
			this.wrapper.appendChild(this.tableContainer);
			this.wrapper.appendChild(bottomContainer);
			topContainer.appendChild(selector);

			if ( this.options.searchable ) {
				this.searchInput = createElement('input', { type: 'text', 'class': 'dataTable-input', placeholder: 'Search...' })
				this.searchForm = createElement('div', { class: 'dataTable-search' });
				this.searchForm.appendChild(this.searchInput);
				topContainer.appendChild(this.searchForm);
			}

			// Initialise
			this.showPage();

			this.updateInfo();

			var paginatorA = createElement('ul', { class: 'dataTable-pagination' }), paginatorB;
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
					paginatorB = createElement('ul', { class: 'dataTable-pagination' });
					this.paginators.push(paginatorB);
					topContainer.appendChild(paginatorA);
					bottomContainer.appendChild(paginatorB);
					break;
			}

			this.setButtons();
			this.setClasses();

			// Check if the sortable option is set and initialise if so.
			if ( this.options.sortable ) {
				this.initSortable();
			}


			// Insert the main container
			this.table.parentNode.insertBefore(this.wrapper, this.table);

			// Populate table container
			this.tableContainer.appendChild(this.table);

			// Fix the height of the table to keep the bottom container fixed in place.
			if ( this.options.fixedHeight) {
				this.tableContainer.style.height = getHeight(this.tableContainer) + 'px';
			}

			this.addEventListeners();
		},

		/**
		 * Attach required event listeners.
		 */
		addEventListeners: function()
		{
			var that = this;

			that.searchRows = [];

			forEach(that.paginators, function(index, paginator) {
				paginator.addEventListener('click', that.switchPage.bind(that), false);
			})

			that.selector.addEventListener('change', that.update.bind(that), false);

			this.searchInput.addEventListener('keyup', function(event) {
				var val = this.value.toLowerCase(), frag = document.createDocumentFragment();

				that.emit("datatable.search");

				that.searching = true;

				that.searchRows = [];

				if ( !val.length ) {
					that.searching = false;
					that.update();
					return;
				}


				// IE doesn't play nice with innerHTML on tBodies.
				if ( that.isIE ) {
					while(that.tbody.hasChildNodes()) {
						that.tbody.removeChild(that.tbody.firstChild);
					}
				} else {
					that.tbody.innerHTML = '';
				}

				forEach(that.pages, function(index, page) {
					forEach(page, function(idx, tr) {
						forEach(tr.cells, function(i, cell) {
							let text = cell.textContent.toLowerCase();
							var inArray = that.searchRows.indexOf(tr) > -1;
							if ( text.includes(val) && !inArray ) {
								that.searchRows.push(tr);
							}
						});
					});
				});

				that.update();

			}, false);
		},

		/**
		 * Change the page.
		 * @param  {event} event
		 * @return {void}
		 */
		switchPage: function(event)
		{
			event = event || window.event;

			var target = event.target, tagName = target.tagName.toLowerCase();

			if ( tagName != 'a' ) return;

			event.preventDefault();

			var page = target.getAttribute('data-page');

			// We don't want to load the current page again.
			if ( page == this.currentPage && target.parentNode.classList.contains('active') )
				return;

			if ( isInt(page)) {
				this.currentPage = parseInt(page, 10);
			}

			// Check we have the nextPrev option enabled
			if ( this.options.nextPrev ) {
				if ( page == 'prev' ) {
					if ( this.onFirstPage )
						return;

					this.currentPage--;
				}

				if ( page == 'next' ) {
					if ( this.onLastPage )
						return;

					this.currentPage++;
				}
			}

			// Show the selected page;
			this.showPage(this.currentPage-1);

			this.updateInfo();

			this.setClasses();

			this.emit('datatable.change');
		},

		/**
		 * Populate the table with the required page.
		 * @param  {int} index 	The index of the required page.
		 * @return {void}
		 */
		showPage: function(index)
		{
			index = index || 0;

			var pages = this.pages;

			if ( !!this.searching ) {
				pages = this.searchPages;
			}

			var that = this, docFrag = document.createDocumentFragment();

			// IE doesn't play nice with innerHTML on tBodies.
			if ( that.isIE ) {
				while(that.tbody.hasChildNodes()) {
					that.tbody.removeChild(that.tbody.firstChild);
				}
			} else {
				this.tbody.innerHTML = '';
			}

			forEach(pages[index], function (i, row) {
				docFrag.appendChild(row);
			});

			that.tbody.appendChild(docFrag);

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
		},

		/**
		 * Update the table info (Showing x to y of z rows)
		 * @return {void}
		 */
		updateInfo: function()
		{
			if ( !this.options.info ) {
				this.label.innerHTML = '';
				return;
			}

			var pages = !!this.searching ? this.searchPages : this.pages;

			if ( pages.length <= 1 )
				this.label.innerHTML = '';

			var current = this.currentPage-1;
			var f = current * this.options.perPage;
			var t = f + pages[current].length;
			var template = 'Showing {x} to {y} of {r} rows';

			this.label.innerHTML = template.replace('{x}', (f + 1) ).replace('{y}', t).replace('{r}', this.info.items);
		},

		/**
		 * Set the correct number of paginator buttons.
		 * @return {void}
		 */
		setButtons: function()
		{
			var that = this, pages = !!this.searching ? this.searchPages : this.pages;

			forEach(that.paginators, function(index, paginator) {
				paginator.innerHTML = '';

				if ( pages.length <= 1 )
					return;

				if ( that.options.nextPrev )
					paginator.appendChild(that.getButton('prev'));

				if ( that.options.navButtons )
				{
					forEach(pages, function(i, page) {
						var li 	= createElement('li', { class: ( i == 0 ) ? 'active' : '' });
						var a 	= createElement('a', { href: '#', 'data-page': i+1 });
						var t 	= document.createTextNode(i+1);

						a.appendChild(t);
						li.appendChild(a);
						paginator.appendChild(li);
					});
				}

				if ( that.options.nextPrev )
					paginator.appendChild(that.getButton('next'));
			});
		},

		/**
		 * Set the active, disabled and hidden classes on the paginator buttons.
		 * @param {[type]} node [description]
		 */
		setClasses: function(node)
		{
			var self = this,
				onFirstPage = self.onFirstPage,
				onLastPage = self.onLastPage,
				nextPrev = self.options.nextPrev,
				hideNavs = self.options.hideUnusedNavs;

			forEach(self.paginators, function(index, paginator) {
				var links = paginator.children,
					inactive = hideNavs ? 'hidden' : 'disabled';

				forEach(links, function(i, link) {
					// IE won't do multiple removes on classList... ugh...
					if ( self.isIE ) {
						link.setAttribute('class', '');
					} else {
						link.classList.remove('active', 'disabled', 'hidden');
					}
				});

				// We're on the first page so disable / hide the prev button.
				if ( onFirstPage && self.options.nextPrev )
					paginator.firstElementChild.classList.add(inactive);

				// We're on the last page so disable / hide the next button.
				if ( onLastPage && self.options.nextPrev )
					paginator.lastElementChild.classList.add(inactive);

				// Add the 'active' class to the correct button
				var n = nextPrev ? self.currentPage : self.currentPage-1;
				paginator.children[n].classList.add('active');
			});
		},

		/**
		 * Make a next / prev button.
		 * @param  {string} direction The direction we want (next or prev)
		 * @return {HTMLElement}
		 */
		getButton: function(direction)
		{
			var li = createElement('li'),
				a = createElement('a', { href: '#', 'data-page': direction });

			a.innerHTML = direction == 'prev' ? this.options.prevText : this.options.nextText;

			li.appendChild(a);

			return li;
		},

		/**
		 * Update the table contents
		 * @param  {event}
		 * @return {void}
		 */
		update: function(event)
		{
			if ( event ) {
				event = event || window.event;

				var target = event.target;

				if ( target.nodeName.toLowerCase() == 'select' )
					this.options.perPage = parseInt(target.value, 10);
			}

			this.currentPage = 1;

			this.tableContainer.style.height = null;

			this.initPages();
			this.showPage();
			this.setButtons();
			this.updateInfo();

			this.tableContainer.style.height = getHeight(this.tableContainer) + 'px';
		},

		/**
		 * Inititialse the sortable option.
		 * @return {void}
		 */
		initSortable: function()
		{
			if ( this.sortEnabled ) return;

			var self = this, cols = self.thead.rows[0].cells;

			forEach(cols, function(index, heading) {
				var label = heading.innerHTML;
				var link = createElement('a', {
					'href' : '#',
					'class' : 'dataTable-sorter'
				});
				heading.idx = index;
				heading.innerHTML = '';
				heading.appendChild(link);

				link.innerHTML = label;
				link.onclick = function (that) {
					return function (event) {
						self.sortItems(event);
						return false;
					}
				}(this);
			});

			this.sortEnabled = true;
		},

		/**
		 * Perform the sorting
		 * @param  {event} event
		 * @return {void}
		 */
		sortItems: function(event)
		{
			event = event || window.event;

			var that = this, target = event.target;

			if ( target.nodeName.toLowerCase() != 'a' )
				return;

			/*
			 * Get cell data for column that is to be sorted from HTML table
			 */
			var dir;
			var rows = !!that.searching ? that.searchRows : that.initialRows;
			var alpha = [];
			var numeric = [];
			var aIdx = 0;
			var nIdx = 0;
			var th = target.parentNode;

			forEach(rows, function(i, row) {
				var cell 	= row.cells[th.idx];
				var content = cell.textContent ? cell.textContent : cell.innerText;
				var num 	= content.replace(/(\$|\,|\s)/g, "");

				if (parseFloat(num) == num) {
					numeric[nIdx++] = { value: Number(num), row: row }
				} else {
					alpha[aIdx++] = { value: content, row: row }
				}
			});


			/*
			 * Sort according to direction (ascending or descending)
			 */
			var col = [], top, bottom;
			if (th.classList.contains("asc")) {
				top = bubbleSort(alpha, -1);
				bottom = bubbleSort(numeric, -1);
				th.classList.remove('asc');
				th.classList.add('desc');
				dir = 'descending';
			} else {
				top = bubbleSort(numeric, 1);
				bottom = bubbleSort(alpha, 1);
				if (th.classList.contains("desc")) {
					th.classList.remove('desc');
				}
				th.classList.add('asc');
				dir = 'ascending';
			}

			/*
			 * Clear asc/desc class names from the last sorted column's th if it isn't the
			 * same as the one that was just clicked
			 */
			if (this.lastSortedTh && th != this.lastSortedTh) {
				// IE won't do multiple removes on classList... ugh...
				if ( self.isIE ) {
					this.lastSortedTh.setAttribute('class', '');
				} else {
					this.lastSortedTh.classList.remove('desc', 'asc');
				}
			}

			this.lastSortedTh = th;

			/*
			 *  Reorder the table
			 */
			var rows = top.concat(bottom);

			if ( !!that.searching ) {
				that.searchRows = [];

				forEach(rows, function(i, row) {
					that.searchRows.push(row['row']);
				});
			} else {
				that.initialRows = [];

				forEach(rows, function(i, row) {
					that.initialRows.push(row['row']);
				});
			}

			this.sortOrder = dir;

			that.update(event);
			this.emit('datatable.sort');
		},

		/**
		 * Build the perPage selector;
		 * @return {HTMLElement}
		 */
		getSelector: function()
		{
			var frag = document.createDocumentFragment(),
				wrapper = createElement('div', { class: 'dataTable-selectWrapper' }),
				selector = createElement('select', { class: 'dataTable-selector' }),
				pre = createElement('span', { innerHTML: 'Showing' }),
				suff = createElement('span', { innerHTML: 'entries' });

			forEach(this.options.perPageSelect, function(i, value) {
				var option = createElement('option', {
					value: value,
					innerHTML: value
				});
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

		emit: function(event)
		{
			this.table.dispatchEvent(new Event(event));
		},


	};

	return Plugin;
}));