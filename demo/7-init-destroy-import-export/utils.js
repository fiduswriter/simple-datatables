var util = {
	extend: function(src, props) {
		props = props || {};
		var p;
		for (p in src) {
			if (!props.hasOwnProperty(p)) {
				props[p] = src[p];
			}
		}
		return props;
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
			for (e in b)
				if ("html" === e) d.innerHTML = b[e];
				else if ("text" === e) {
				var f = c.createTextNode(b[e]);
				d.appendChild(f);
			} else d.setAttribute(e, b[e]);
		}
		return d;
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
	replace: function(n, o) {
		return o.parentNode.replaceChild(n, o);
	},
	closest: function(el, fn) {
		return el && el !== document.body && (fn(el) ? el : util.closest(el.parentNode, fn));
	},
	delegate: function(parent, child, evt, callback, scope) {
		// Allow selector strings
		if (typeof parent === "string") {
			parent = document.querySelector(parent);
		}

		var func = function(e) {
			scope = scope || this;

			var t = e.target;

			// Climb the DOM tree from the current target until we find the matching selector
			for (; t && t !== document; t = t.parentNode) {
				if (t.matches(child)) {
					e.delegateTarget = t;
					callback.call(scope, e);
				}
			}
		};

		// Attach the event listener to the parent
		parent.addEventListener(evt, func, false);
	},
	on: function(e, type, callback, scope) {
		e.addEventListener(type, function(e) {
			scope = scope || this;
			callback.call(scope, e);
		}, false);
	},
	off: function(e, type, callback) {
		e.removeEventListener(type, callback);
	},
  isNumber: function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
  }, 
	isObject: function(a) {
		return "[object Object]" === Object.prototype.toString.call(a);
	},
	isArray: function(a) {
		return "[object Array]" === Object.prototype.toString.call(a);
	},
	isInt: function(val) {
		return !isNaN(val) && (function(x) {
			return (x || 0) === x;
		})(parseFloat(val));
	},
	debounce: function(a, b, c) {
		var d;
		return function() {
			var e = this,
				f = arguments,
				g = function() {
					d = null;
					if (!c) a.apply(e, f);
				},
				h = c && !d;
			clearTimeout(d);
			d = setTimeout(g, b);
			if (h) {
				a.apply(e, f);
			}
		};
	},
	getBoundingRect: function(el, margins) {
		var win = window;
		var doc = document;
		var body = doc.body;
		var rect = el.getBoundingClientRect();
		var offsetX = win.pageXOffset !== undefined ? win.pageXOffset : (doc.documentElement || body.parentNode || body).scrollLeft;
		var offsetY = win.pageYOffset !== undefined ? win.pageYOffset : (doc.documentElement || body.parentNode || body).scrollTop;

		var mt = 0, ml = 0;

		if (margins) {
			mt = parseInt(util.css(el, 'margin-top'), 10);
			ml = parseInt(util.css(el, 'margin-left'), 10);
		}

		return {
			bottom: rect.bottom + offsetY,
			height: rect.height,
			left: rect.left + offsetX - ml,
			right: rect.right + offsetX,
			top: rect.top + offsetY - mt,
			width: rect.width
		};
	},
	includes: function(a, b) {
		return a.indexOf(b) > -1;
	},
	after: function(a, b) {
		a.nextSibling ? a.parentNode.insertBefore(b, a.nextSibling) : a.parentNode.appendChild(b)
	},
	parents: function(el, selector) {
		var elements = [];
		var ishaveselector = selector !== undefined;

		while ((el = el.parentElement) !== null) {
			if (el.nodeType !== Node.ELEMENT_NODE) {
				continue;
			}

			if (!ishaveselector || el.matches(selector)) {
				elements.push(el);
			}
		}

		return elements;
	},
	match: function(a, b) {
		var c = b.charAt(0);
		return !("." !== c || !_hasClass(a, b.substr(1))) || ("#" === c && a.id === b.substr(1) || (!("[" !== c || !a.hasAttribute(b.substr(1, b.length - 1))) || a.tagName.toLowerCase() === b))
	},
  sortNumber: function(a,b) {
      return a - b;
  }	  
};