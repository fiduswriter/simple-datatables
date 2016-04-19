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

	/**
	 * Merge defaults with user options
	 * @param {Object} source Default settings
	 * @param {Object} properties User options
	 */
	var extend = function (source, properties) {
		var property;
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	};

	/**
	 * Check var is an integer
	 * @param  {[type]}  value [the var to be checked]
	 * @return {Boolean}
	 */
	var isInt = function( value ) {
		var x;
		if (isNaN(value)) {
			return false;
		}
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
	 * Create element and assign attributes
	 * @param  {string} classname 	className
	 * @param  {string} id 			id
	 * @return {HTMLElement}
	 */
	var createElement = function(type, attributes) {
		var element = document.createElement(type);

		if ( attributes ) {
			for (var attribute in attributes) {
				element.setAttribute(attribute, attributes[attribute]);
			}
		}

		return element;
	};

	/**
	 * https://gist.github.com/scopevale/1663452
	 * @param  {[type]} arr [description]
	 * @param  {[type]} dir [description]
	 * @return {[type]}     [description]
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
					var a = arr[i],
						b = arr[i+dir],
						c = a;
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
	 * @param  {Object, HTMLElement or Array}   collection
	 * @param  {Function} callback   [description]
	 * @param  {[type]}   scope      [description]
	 * @return {[type]}              [description]
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
	 * Plugin Object
	 * @param table The table to initialize
	 * @param {Object} options User options
	 * @constructor
	 */
	function Plugin(table, options) {

		if (!(this instanceof Plugin)) {
			return new Plugin(name)
		}

		this.sorters = [];
		this.paginators = [];

		this.initialRows = null;
		this.initialDimensions = [];

		this.currentPage = 1;
		this.first_page = 1;
		this.onFirstPage = true;
		this.onLastPage = false;

		this.info = {
			items: 0,
			pages: 0,
			range: 0,
		};

		var nodeName = table.tagName.toLowerCase();

		if ( nodeName != "table") {
			console.warn('The selected element ('+nodeName+') is not a table!');
			return false;
		}

		this.table = table;
		this.thead = this.table.tHead;
		this.tbody = this.table.tBodies[0];
		this.initialRows = Array.prototype.slice.call(this.tbody.rows);

		/**
		 * Plugin defaults
		 * @type {Object}
		 */
		var defaults = {
			perPage: 10,
			navPosition: 'both',
			nextPrev: true,
			prevText: '&lsaquo;',
			nextText: '&rsaquo;',
			sortable: false,
			fixedHeight: true,
			info: true,
			hideUnusedNavs: false,
			perPageSelect: [5,10,15,20,25],
			change: function() {},
		};


		this.options = extend(defaults, options);
		this.initialize();
	}


	// Plugin prototype
	Plugin.prototype = {

		initialize: function()
		{
			this.setInitialDimensions();
			this.initPages();
			this.build();
		},

		build: function()
		{
			var topContainer 		= createElement('div', { class: 'dataTable-top' });
			var bottomContainer 	= createElement('div', { class: 'dataTable-bottom' });
			var container 			= createElement('div', { class: 'dataTable-wrapper' });
			this.tableContainer 	= createElement('div', { class: 'dataTable-container' });
			this.label 				= createElement('div', { class: 'dataTable-info' });
			this.selector 			= this.getSelector();

			// Insert the main container
			this.table.parentNode.insertBefore(container, this.table);

			// Populate table container
			this.tableContainer.appendChild(this.table);

			// Populate bottom container
			bottomContainer.appendChild(this.label);

			// Append the containers
			container.appendChild(topContainer);
			container.appendChild(this.tableContainer);
			container.appendChild(bottomContainer);
			topContainer.appendChild(this.selector);

			// Initialise
			this.updatePages();

			if ( this.options.info ) {
				this.updateInfo();
			}

			var paginatorA = createElement('ul', { class: 'dataTable-pagination' });
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
					var paginatorB = createElement('ul', { class: 'dataTable-pagination' });
					this.paginators.push(paginatorB);
					topContainer.appendChild(paginatorA);
					bottomContainer.appendChild(paginatorB);
					break;
			}

			this.updateLinks();

			if ( this.options.sortable ) {
				this.initSortable();
			}

			if ( this.options.fixedHeight) {
				this.tableContainer.style.height = getHeight(this.tableContainer) + 'px';
			}

			this.addEventListeners();
		},

		initSortable: function()
		{
			var self = this, cols = self.thead.rows[0].cells;

			forEach(cols, function(index, heading) {
				var label = heading.innerHTML;
				var link = createElement('a', {
					'href' : '#',
					'class' : 'dataTable-sorter'
				});
				heading.cIdx = index;
				heading.innerHTML = null;
				heading.className = 'asc';
				heading.appendChild(link);

				link.innerHTML = label;
				link.onclick = function (that) {
					return function (event) {
						self.sortItems(event);
						return false;
					}
				}(this);
			});
		},

		initPages: function()
		{
			var that = this;

			this.pages = this.initialRows.map( function(e,i) {
				return i%that.options.perPage===0 ? that.initialRows.slice(i,i+that.options.perPage) : null;
			}).filter(function(e){ return e; });

			this.info.items = this.initialRows.length;
			this.info.pages = this.pages.length;
			this.last_page = this.info.pages;
		},

		updatePages: function(index)
		{
			index = index || 0;

			var that = this, page = document.createDocumentFragment();

			this.tbody.innerHTML = '';

			forEach(this.pages[index], function (i, row) {
				page.appendChild(row);
			});

			that.tbody.appendChild(page);
		},

		addEventListeners: function()
		{
			var that = this;

			forEach(that.paginators, function(index, paginator) {
				paginator.addEventListener('click', that.switchPage.bind(that), false);
			})

			that.selector.addEventListener('change', that.updateItems.bind(that), false);
		},

		removeEventListeners: function()
		{
			this.links.removeEventListener('click', this.switchPage);
			this.selector.removeEventListener('click', this.switchItems);
		},

		switchPage: function(event)
		{
			event = event || window.event;

			var target = event.target, tagName = target.nodeName.toLowerCase();

			if ( tagName == 'a' || tagName == 'i' )
			{
				// Deal with font icons
				if ( tagName == 'i' ) {
					target = target.parentNode;
				}

				event.preventDefault();

				this.onFirstPage = false;
				this.onLastPage = false;

				var page = target.getAttribute('data-page');

				// We don't want to load the current page again
				if ( page == this.currentPage && target.parentNode.classList.contains('active') ) return false;


				if ( isInt(page)) {
					this.currentPage = parseInt(page,10);
				}

				if ( this.options.nextPrev ) {
					if ( page == 'prev' ) {
						if ( (this.currentPage - 1) < 1 ) {
							return false;
						}

						this.currentPage--;
					}

					if ( page == 'next' ) {
						if ( (this.currentPage + 1) > this.last_page ) {
							return false;
						}

						this.currentPage++;
					}
				}

				switch (this.currentPage) {
					case 1:
						this.onFirstPage = true
						break;
					case this.last_page:
						this.onLastPage = true
						break;
				}

				this.updatePages(this.currentPage-1);

				if ( this.options.info ) {
					this.updateInfo();
				}
				this.setClasses();

				this.options.change(this);
			}

		},

		setClasses: function(node)
		{
			var self = this,
				onFirstPage = self.onFirstPage,
				onLastPage = self.onLastPage,
				nextPrev = self.options.nextPrev,
				hideNavs = self.options.hideUnusedNavs;

			forEach(self.paginators, function(index, paginator) {
				var links = paginator.children;

				forEach(links, function(i, link) {
					link.classList.remove('active', 'disabled', 'hidden')
				});

				if ( onFirstPage ) {
					paginator.firstElementChild.classList.add(hideNavs ? 'hidden' : 'disabled');
				}

				if ( onLastPage ) {
					paginator.lastElementChild.classList.add(hideNavs ? 'hidden' : 'disabled');
				}

				if ( nextPrev ) {
					paginator.children[self.currentPage].classList.add('active');
				} else {
					paginator.children[self.currentPage-1].classList.add('active');
				}

			});
		},

		updateInfo: function()
		{
			if ( this.info.pages <= 1 ) {
				this.label.innerHTML = '';
			}

			var current = this.currentPage-1,
				f = (current) * this.options.perPage,
				t = f + this.pages[current].length;

			this.label.innerHTML = 'Showing ' + (f + 1) + ' to ' + t + ' of ' + this.info.items + ' rows';
		},

		getSelector: function()
		{
			var select 	= createElement('select', { class: 'form-control dataTable-selector' });

			forEach(this.options.perPageSelect, function(i, value) {
				var option = createElement('option');
				option.value = value;
				option.innerHTML = value;
				select.appendChild(option);
			});

			select.value = this.options.perPage;

			return select;
		},

		updateLinks: function()
		{
			var that = this;

			forEach(that.paginators, function(index, paginator) {
				paginator.innerHTML = '';

				if ( that.pages.length <= 1 ) {
					return false;
				}

				if ( that.options.nextPrev ) {
					paginator.appendChild(that.getNav('prev'));
				}

				forEach(that.pages, function(i, page) {
					var li 	= createElement('li', { class: ( i == 0 ) ? 'active' : '' });
					var a 	= createElement('a', { href: '#', 'data-page': i+1 });
					var t 	= document.createTextNode(i+1);

					a.appendChild(t);
					li.appendChild(a);
					paginator.appendChild(li);
				});

				if ( that.options.nextPrev ) {
					paginator.appendChild(that.getNav('next'));
				}
			});
		},

		getNav: function(direction)
		{
			var li = createElement('li'),
				a = createElement('a', { href: '#', 'data-page': direction });

			a.innerHTML = direction == 'prev' ? this.options.prevText : this.options.nextText;

			li.appendChild(a);

			return li;
		},

		setInitialDimensions: function()
		{
			var t = this.table.tHead.rows[0].cells, pw = getWidth(this.table);

			for (var i = 0, len = t.length; i < len; i++) {
				var w = (getWidth(t[i]) / pw) * 100;
				this.initialDimensions.push(w);
				t[i].style.width = w + '%';
			};
		},

		updateItems: function(event)
		{
			event = event || window.event;

			var target = event.target;

			this.currentPage = 1;

			if ( target.nodeName.toLowerCase() == 'select' ) {
				this.options.perPage = parseInt(target.value, 10);
			}

			this.tableContainer.style.height = null;

			this.initPages();
			this.updatePages();
			this.updateLinks();

			if ( this.options.info ) {
				this.updateInfo();
			}

			this.tableContainer.style.height = getHeight(this.tableContainer) + 'px';
		},

		sortItems: function(event)
		{
			event = event || window.event;

			var that = this, target = event.target;

			if ( target.nodeName.toLowerCase() != 'a' ) {
				return false;
			}

			/*
			 * Get cell data for column that is to be sorted from HTML table
			 */
			var rows = that.initialRows;
			var alpha = [], numeric = [];
			var aIdx = 0, nIdx = 0;
			var th = target.parentElement;
			var cellIndex = th.cIdx;
			for (var i=0; rows[i]; i++) {
				var cell = rows[i].cells[cellIndex];
				var content = cell.textContent ? cell.textContent : cell.innerText;
				/*
				 * Split data into two separate arrays, one for numeric content and
				 * one for everything else (alphabetic). Store both the actual data
				 * that will be used for comparison by the sort algorithm (thus the need
				 * to parseFloat() the numeric data) as well as a reference to the
				 * element's parent row. The row reference will be used after the new
				 * order of content is determined in order to actually reorder the HTML
				 * table's rows.
				 */
				var num = content.replace(/(\$|\,|\s)/g, "");
				  if (parseFloat(num) == num) {
					numeric[nIdx++] = {
						value: Number(num),
						row: rows[i]
					}
				} else {
					alpha[aIdx++] = {
						value: content,
						row: rows[i]
					}
				}
			}

			/*
			 * Sort according to direction (ascending or descending)
			 */
			var col = [], top, bottom;
			if (th.className.match("asc")) {
				top = bubbleSort(alpha, -1);
				bottom = bubbleSort(numeric, -1);
				th.className = th.className.replace(/asc/, "desc");
			} else {
				top = bubbleSort(numeric, 1);
				bottom = bubbleSort(alpha, 1);
				if (th.className.match("desc")) {
					th.className = th.className.replace(/desc/, "asc");
				} else {
					th.className += "asc";
				}
			}

			/*
			 * Clear asc/desc class names from the last sorted column's th if it isnt the
			 * same as the one that was just clicked
			 */
			if (this.lastSortedTh && th != this.lastSortedTh) {
				this.lastSortedTh.className = this.lastSortedTh.className.replace(/desc|asc/g, "");
			}
			this.lastSortedTh = th;


			/*
			 *  Reorder HTML table based on new order of data found in the col array
			 */
			var rows = top.concat(bottom);
			this.initialRows = [];

			for ( var id in rows ) {
				that.initialRows.push(rows[id]['row']);
			}

			that.updateItems(event);
		},

	};

	return Plugin;
}));