var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var stringToObj;
var nodeToObj;
var DiffDOM;
function e(t,o,n){var s;return "#text"===t.nodeName?s=n.document.createTextNode(t.data):"#comment"===t.nodeName?s=n.document.createComment(t.data):(o?s=n.document.createElementNS("http://www.w3.org/2000/svg",t.nodeName):"svg"===t.nodeName.toLowerCase()?(s=n.document.createElementNS("http://www.w3.org/2000/svg","svg"),o=!0):s=n.document.createElement(t.nodeName),t.attributes&&Object.entries(t.attributes).forEach((function(e){var t=e[0],o=e[1];return s.setAttribute(t,o)})),t.childNodes&&t.childNodes.forEach((function(t){return s.appendChild(e(t,o,n))})),n.valueDiffing&&(t.value&&(s.value=t.value),t.checked&&(s.checked=t.checked),t.selected&&(s.selected=t.selected))),s}function t(e,t){for(t=t.slice();t.length>0;){if(!e.childNodes)return !1;var o=t.splice(0,1)[0];e=e.childNodes[o];}return e}function o(o,n,s){var i,a,l,c,r=t(o,n[s._const.route]),u={diff:n,node:r};if(s.preDiffApply(u))return !0;switch(n[s._const.action]){case s._const.addAttribute:if(!r||!r.setAttribute)return !1;r.setAttribute(n[s._const.name],n[s._const.value]);break;case s._const.modifyAttribute:if(!r||!r.setAttribute)return !1;r.setAttribute(n[s._const.name],n[s._const.newValue]),"INPUT"===r.nodeName&&"value"===n[s._const.name]&&(r.value=n[s._const.newValue]);break;case s._const.removeAttribute:if(!r||!r.removeAttribute)return !1;r.removeAttribute(n[s._const.name]);break;case s._const.modifyTextElement:if(!r||3!==r.nodeType)return !1;s.textDiff(r,r.data,n[s._const.oldValue],n[s._const.newValue]);break;case s._const.modifyValue:if(!r||void 0===r.value)return !1;r.value=n[s._const.newValue];break;case s._const.modifyComment:if(!r||void 0===r.data)return !1;s.textDiff(r,r.data,n[s._const.oldValue],n[s._const.newValue]);break;case s._const.modifyChecked:if(!r||void 0===r.checked)return !1;r.checked=n[s._const.newValue];break;case s._const.modifySelected:if(!r||void 0===r.selected)return !1;r.selected=n[s._const.newValue];break;case s._const.replaceElement:r.parentNode.replaceChild(e(n[s._const.newValue],"svg"===n[s._const.newValue].nodeName.toLowerCase(),s),r);break;case s._const.relocateGroup:Array.apply(void 0,new Array(n.groupLength)).map((function(){return r.removeChild(r.childNodes[n[s._const.from]])})).forEach((function(e,t){0===t&&(a=r.childNodes[n[s._const.to]]),r.insertBefore(e,a||null);}));break;case s._const.removeElement:r.parentNode.removeChild(r);break;case s._const.addElement:c=(l=n[s._const.route].slice()).splice(l.length-1,1)[0],(r=t(o,l)).insertBefore(e(n[s._const.element],"http://www.w3.org/2000/svg"===r.namespaceURI,s),r.childNodes[c]||null);break;case s._const.removeTextElement:if(!r||3!==r.nodeType)return !1;r.parentNode.removeChild(r);break;case s._const.addTextElement:if(c=(l=n[s._const.route].slice()).splice(l.length-1,1)[0],i=s.document.createTextNode(n[s._const.value]),!(r=t(o,l))||!r.childNodes)return !1;r.insertBefore(i,r.childNodes[c]||null);break;default:console.log("unknown action");}return u.newNode=i,s.postDiffApply(u),!0}function n(e,t,o){var n=e[t];e[t]=e[o],e[o]=n;}function s(e,t,s){t.length||(t=[t]),(t=t.slice()).reverse(),t.forEach((function(t){!function(e,t,s){switch(t[s._const.action]){case s._const.addAttribute:t[s._const.action]=s._const.removeAttribute,o(e,t,s);break;case s._const.modifyAttribute:n(t,s._const.oldValue,s._const.newValue),o(e,t,s);break;case s._const.removeAttribute:t[s._const.action]=s._const.addAttribute,o(e,t,s);break;case s._const.modifyTextElement:case s._const.modifyValue:case s._const.modifyComment:case s._const.modifyChecked:case s._const.modifySelected:case s._const.replaceElement:n(t,s._const.oldValue,s._const.newValue),o(e,t,s);break;case s._const.relocateGroup:n(t,s._const.from,s._const.to),o(e,t,s);break;case s._const.removeElement:t[s._const.action]=s._const.addElement,o(e,t,s);break;case s._const.addElement:t[s._const.action]=s._const.removeElement,o(e,t,s);break;case s._const.removeTextElement:t[s._const.action]=s._const.addTextElement,o(e,t,s);break;case s._const.addTextElement:t[s._const.action]=s._const.removeTextElement,o(e,t,s);break;default:console.log("unknown action");}}(e,t,s);}));}var i=function(e){var t=this;void 0===e&&(e={}),Object.entries(e).forEach((function(e){var o=e[0],n=e[1];return t[o]=n}));};function a(e){var t=[];return t.push(e.nodeName),"#text"!==e.nodeName&&"#comment"!==e.nodeName&&e.attributes&&(e.attributes.class&&t.push(e.nodeName+"."+e.attributes.class.replace(/ /g,".")),e.attributes.id&&t.push(e.nodeName+"#"+e.attributes.id)),t}function l(e){var t={},o={};return e.forEach((function(e){a(e).forEach((function(e){var n=e in t;n||e in o?n&&(delete t[e],o[e]=!0):t[e]=!0;}));})),t}function c(e,t){var o=l(e),n=l(t),s={};return Object.keys(o).forEach((function(e){n[e]&&(s[e]=!0);})),s}function r(e){return delete e.outerDone,delete e.innerDone,delete e.valueDone,!e.childNodes||e.childNodes.every(r)}function u(e,t){if(!["nodeName","value","checked","selected","data"].every((function(o){return e[o]===t[o]})))return !1;if(Boolean(e.attributes)!==Boolean(t.attributes))return !1;if(Boolean(e.childNodes)!==Boolean(t.childNodes))return !1;if(e.attributes){var o=Object.keys(e.attributes),n=Object.keys(t.attributes);if(o.length!==n.length)return !1;if(!o.every((function(o){return e.attributes[o]===t.attributes[o]})))return !1}if(e.childNodes){if(e.childNodes.length!==t.childNodes.length)return !1;if(!e.childNodes.every((function(e,o){return u(e,t.childNodes[o])})))return !1}return !0}function d(e,t,o,n,s){if(!e||!t)return !1;if(e.nodeName!==t.nodeName)return !1;if("#text"===e.nodeName)return !!s||e.data===t.data;if(e.nodeName in o)return !0;if(e.attributes&&t.attributes){if(e.attributes.id){if(e.attributes.id!==t.attributes.id)return !1;if(e.nodeName+"#"+e.attributes.id in o)return !0}if(e.attributes.class&&e.attributes.class===t.attributes.class)if(e.nodeName+"."+e.attributes.class.replace(/ /g,".")in o)return !0}if(n)return !0;var i=e.childNodes?e.childNodes.slice().reverse():[],a=t.childNodes?t.childNodes.slice().reverse():[];if(i.length!==a.length)return !1;if(s)return i.every((function(e,t){return e.nodeName===a[t].nodeName}));var l=c(i,a);return i.every((function(e,t){return d(e,a[t],l,!0,!0)}))}function h(e){return JSON.parse(JSON.stringify(e))}function f(e,t,o,n){var s=0,i=[],l=e.length,r=t.length,u=Array.apply(void 0,new Array(l+1)).map((function(){return []})),h=c(e,t),f=l===r;f&&e.some((function(e,o){var n=a(e),s=a(t[o]);return n.length!==s.length?(f=!1,!0):(n.some((function(e,t){if(e!==s[t])return f=!1,!0})),!f||void 0)}));for(var p=0;p<l;p++)for(var m=e[p],_=0;_<r;_++){var V=t[_];o[p]||n[_]||!d(m,V,h,f)?u[p+1][_+1]=0:(u[p+1][_+1]=u[p][_]?u[p][_]+1:1,u[p+1][_+1]>=s&&(s=u[p+1][_+1],i=[p+1,_+1]));}return 0!==s&&{oldValue:i[0]-s,newValue:i[1]-s,length:s}}function p(e,t){return Array.apply(void 0,new Array(e)).map((function(){return t}))}i.prototype.toString=function(){return JSON.stringify(this)},i.prototype.setValue=function(e,t){return this[e]=t,this};var m=function(){this.list=[];};function _(e,t){var o,n,s=e;for(t=t.slice();t.length>0;){if(!s.childNodes)return !1;n=t.splice(0,1)[0],o=s,s=s.childNodes[n];}return {node:s,parentNode:o,nodeIndex:n}}function V(e,t,o){return t.forEach((function(t){!function(e,t,o){var n,s,i,a=_(e,t[o._const.route]),l=a.node,c=a.parentNode,r=a.nodeIndex,u=[],d={diff:t,node:l};if(o.preVirtualDiffApply(d))return !0;switch(t[o._const.action]){case o._const.addAttribute:l.attributes||(l.attributes={}),l.attributes[t[o._const.name]]=t[o._const.value],"checked"===t[o._const.name]?l.checked=!0:"selected"===t[o._const.name]?l.selected=!0:"INPUT"===l.nodeName&&"value"===t[o._const.name]&&(l.value=t[o._const.value]);break;case o._const.modifyAttribute:l.attributes[t[o._const.name]]=t[o._const.newValue];break;case o._const.removeAttribute:delete l.attributes[t[o._const.name]],0===Object.keys(l.attributes).length&&delete l.attributes,"checked"===t[o._const.name]?l.checked=!1:"selected"===t[o._const.name]?delete l.selected:"INPUT"===l.nodeName&&"value"===t[o._const.name]&&delete l.value;break;case o._const.modifyTextElement:l.data=t[o._const.newValue];break;case o._const.modifyValue:l.value=t[o._const.newValue];break;case o._const.modifyComment:l.data=t[o._const.newValue];break;case o._const.modifyChecked:l.checked=t[o._const.newValue];break;case o._const.modifySelected:l.selected=t[o._const.newValue];break;case o._const.replaceElement:(n=h(t[o._const.newValue])).outerDone=!0,n.innerDone=!0,n.valueDone=!0,c.childNodes[r]=n;break;case o._const.relocateGroup:l.childNodes.splice(t[o._const.from],t.groupLength).reverse().forEach((function(e){return l.childNodes.splice(t[o._const.to],0,e)})),l.subsets&&l.subsets.forEach((function(e){if(t[o._const.from]<t[o._const.to]&&e.oldValue<=t[o._const.to]&&e.oldValue>t[o._const.from]){e.oldValue-=t.groupLength;var n=e.oldValue+e.length-t[o._const.to];n>0&&(u.push({oldValue:t[o._const.to]+t.groupLength,newValue:e.newValue+e.length-n,length:n}),e.length-=n);}else if(t[o._const.from]>t[o._const.to]&&e.oldValue>t[o._const.to]&&e.oldValue<t[o._const.from]){e.oldValue+=t.groupLength;var s=e.oldValue+e.length-t[o._const.to];s>0&&(u.push({oldValue:t[o._const.to]+t.groupLength,newValue:e.newValue+e.length-s,length:s}),e.length-=s);}else e.oldValue===t[o._const.from]&&(e.oldValue=t[o._const.to]);}));break;case o._const.removeElement:c.childNodes.splice(r,1),c.subsets&&c.subsets.forEach((function(e){e.oldValue>r?e.oldValue-=1:e.oldValue===r?e.delete=!0:e.oldValue<r&&e.oldValue+e.length>r&&(e.oldValue+e.length-1===r?e.length--:(u.push({newValue:e.newValue+r-e.oldValue,oldValue:r,length:e.length-r+e.oldValue-1}),e.length=r-e.oldValue));})),l=c;break;case o._const.addElement:s=t[o._const.route].slice(),i=s.splice(s.length-1,1)[0],l=_(e,s).node,(n=h(t[o._const.element])).outerDone=!0,n.innerDone=!0,n.valueDone=!0,l.childNodes||(l.childNodes=[]),i>=l.childNodes.length?l.childNodes.push(n):l.childNodes.splice(i,0,n),l.subsets&&l.subsets.forEach((function(e){if(e.oldValue>=i)e.oldValue+=1;else if(e.oldValue<i&&e.oldValue+e.length>i){var t=e.oldValue+e.length-i;u.push({newValue:e.newValue+e.length-t,oldValue:i+1,length:t}),e.length-=t;}}));break;case o._const.removeTextElement:c.childNodes.splice(r,1),"TEXTAREA"===c.nodeName&&delete c.value,c.subsets&&c.subsets.forEach((function(e){e.oldValue>r?e.oldValue-=1:e.oldValue===r?e.delete=!0:e.oldValue<r&&e.oldValue+e.length>r&&(e.oldValue+e.length-1===r?e.length--:(u.push({newValue:e.newValue+r-e.oldValue,oldValue:r,length:e.length-r+e.oldValue-1}),e.length=r-e.oldValue));})),l=c;break;case o._const.addTextElement:s=t[o._const.route].slice(),i=s.splice(s.length-1,1)[0],(n={}).nodeName="#text",n.data=t[o._const.value],(l=_(e,s).node).childNodes||(l.childNodes=[]),i>=l.childNodes.length?l.childNodes.push(n):l.childNodes.splice(i,0,n),"TEXTAREA"===l.nodeName&&(l.value=t[o._const.newValue]),l.subsets&&l.subsets.forEach((function(e){if(e.oldValue>=i&&(e.oldValue+=1),e.oldValue<i&&e.oldValue+e.length>i){var t=e.oldValue+e.length-i;u.push({newValue:e.newValue+e.length-t,oldValue:i+1,length:t}),e.length-=t;}}));break;default:console.log("unknown action");}l.subsets&&(l.subsets=l.subsets.filter((function(e){return !e.delete&&e.oldValue!==e.newValue})),u.length&&(l.subsets=l.subsets.concat(u))),d.newNode=n,o.postVirtualDiffApply(d);}(e,t,o);})),!0}function g(e,t){void 0===t&&(t={});var o={};if(o.nodeName=e.nodeName,"#text"===o.nodeName||"#comment"===o.nodeName)o.data=e.data;else {if(e.attributes&&e.attributes.length>0)o.attributes={},Array.prototype.slice.call(e.attributes).forEach((function(e){return o.attributes[e.name]=e.value}));if("TEXTAREA"===o.nodeName)o.value=e.value;else if(e.childNodes&&e.childNodes.length>0){o.childNodes=[],Array.prototype.slice.call(e.childNodes).forEach((function(e){return o.childNodes.push(g(e,t))}));}t.valueDiffing&&(void 0!==e.checked&&e.type&&["radio","checkbox"].includes(e.type.toLowerCase())?o.checked=e.checked:void 0!==e.value&&(o.value=e.value),void 0!==e.selected&&(o.selected=e.selected));}return o}m.prototype.add=function(e){var t;(t=this.list).push.apply(t,e);},m.prototype.forEach=function(e){this.list.forEach((function(t){return e(t)}));};var v=/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g,N=Object.create?Object.create(null):{},b=/\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;function y(e){return e.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}var w={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,menuItem:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0};function E(e){var t={nodeName:"",attributes:{}},o=e.match(/<\/?([^\s]+?)[/\s>]/);if(o&&(t.nodeName=o[1].toUpperCase(),(w[o[1]]||"/"===e.charAt(e.length-2))&&(t.voidElement=!0),t.nodeName.startsWith("!--"))){var n=e.indexOf("--\x3e");return {type:"comment",data:-1!==n?e.slice(4,n):""}}for(var s=new RegExp(b),i=null,a=!1;!a;)if(null===(i=s.exec(e)))a=!0;else if(i[0].trim())if(i[1]){var l=i[1].trim(),c=[l,""];l.indexOf("=")>-1&&(c=l.split("=")),t.attributes[c[0]]=c[1],s.lastIndex--;}else i[2]&&(t.attributes[i[2]]=i[3].trim().substring(1,i[3].length-1));return t}function k(e){return delete e.voidElement,e.childNodes&&e.childNodes.forEach((function(e){return k(e)})),e}function x(e){return k(function(e,t){void 0===t&&(t={components:N});var o,n=[],s=-1,i=[],a=!1;if(0!==e.indexOf("<")){var l=e.indexOf("<");n.push({nodeName:"#text",data:-1===l?e:e.substring(0,l)});}return e.replace(v,(function(l,c){if(a){if(l!=="</"+o.nodeName+">")return;a=!1;}var r,u="/"!==l.charAt(1),d=l.startsWith("\x3c!--"),h=c+l.length,f=e.charAt(h);if(d){var p=E(l);return s<0?(n.push(p),n):((r=i[s])&&(r.childNodes||(r.childNodes=[]),r.childNodes.push(p)),n)}if(u&&(o=E(l),s++,"tag"===o.type&&t.components[o.nodeName]&&(o.type="component",a=!0),o.voidElement||a||!f||"<"===f||(o.childNodes||(o.childNodes=[]),o.childNodes.push({nodeName:"#text",data:y(e.slice(h,e.indexOf("<",h)))})),0===s&&n.push(o),(r=i[s-1])&&(r.childNodes||(r.childNodes=[]),r.childNodes.push(o)),i[s]=o),(!u||o.voidElement)&&(s>-1&&(o.voidElement||o.nodeName===l.slice(2,-1).toUpperCase())&&(s--,o=-1===s?n:i[s]),!a&&"<"!==f&&f)){r=-1===s?n:i[s].childNodes||[];var m=e.indexOf("<",h),_=y(e.slice(h,-1===m?void 0:m));r.push({nodeName:"#text",data:_});}})),n[0]}(e))}var A=function(e,t,o){this.options=o,this.t1="undefined"!=typeof HTMLElement&&e instanceof HTMLElement?g(e,this.options):"string"==typeof e?x(e,this.options):JSON.parse(JSON.stringify(e)),this.t2="undefined"!=typeof HTMLElement&&t instanceof HTMLElement?g(t,this.options):"string"==typeof t?x(t,this.options):JSON.parse(JSON.stringify(t)),this.diffcount=0,this.foundAll=!1,this.debug&&(this.t1Orig=g(e,this.options),this.t2Orig=g(t,this.options)),this.tracker=new m;};A.prototype.init=function(){return this.findDiffs(this.t1,this.t2)},A.prototype.findDiffs=function(e,t){var o;do{if(this.options.debug&&(this.diffcount+=1,this.diffcount>this.options.diffcap))throw new Error("surpassed diffcap:"+JSON.stringify(this.t1Orig)+" -> "+JSON.stringify(this.t2Orig));0===(o=this.findNextDiff(e,t,[])).length&&(u(e,t)||(this.foundAll?console.error("Could not find remaining diffs!"):(this.foundAll=!0,r(e),o=this.findNextDiff(e,t,[])))),o.length>0&&(this.foundAll=!1,this.tracker.add(o),V(e,o,this.options));}while(o.length>0);return this.tracker.list},A.prototype.findNextDiff=function(e,t,o){var n,s;if(this.options.maxDepth&&o.length>this.options.maxDepth)return [];if(!e.outerDone){if(n=this.findOuterDiff(e,t,o),this.options.filterOuterDiff&&(s=this.options.filterOuterDiff(e,t,n))&&(n=s),n.length>0)return e.outerDone=!0,n;e.outerDone=!0;}if(!e.innerDone){if((n=this.findInnerDiff(e,t,o)).length>0)return n;e.innerDone=!0;}if(this.options.valueDiffing&&!e.valueDone){if((n=this.findValueDiff(e,t,o)).length>0)return e.valueDone=!0,n;e.valueDone=!0;}return []},A.prototype.findOuterDiff=function(e,t,o){var n,s,a,l,c,r,u=[];if(e.nodeName!==t.nodeName){if(!o.length)throw new Error("Top level nodes have to be of the same kind.");return [(new i).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,h(e)).setValue(this.options._const.newValue,h(t)).setValue(this.options._const.route,o)]}if(o.length&&this.options.maxNodeDiffCount<Math.abs((e.childNodes||[]).length-(t.childNodes||[]).length))return [(new i).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,h(e)).setValue(this.options._const.newValue,h(t)).setValue(this.options._const.route,o)];if(e.data!==t.data)return "#text"===e.nodeName?[(new i).setValue(this.options._const.action,this.options._const.modifyTextElement).setValue(this.options._const.route,o).setValue(this.options._const.oldValue,e.data).setValue(this.options._const.newValue,t.data)]:[(new i).setValue(this.options._const.action,this.options._const.modifyComment).setValue(this.options._const.route,o).setValue(this.options._const.oldValue,e.data).setValue(this.options._const.newValue,t.data)];for(s=e.attributes?Object.keys(e.attributes).sort():[],a=t.attributes?Object.keys(t.attributes).sort():[],l=s.length,r=0;r<l;r++)n=s[r],-1===(c=a.indexOf(n))?u.push((new i).setValue(this.options._const.action,this.options._const.removeAttribute).setValue(this.options._const.route,o).setValue(this.options._const.name,n).setValue(this.options._const.value,e.attributes[n])):(a.splice(c,1),e.attributes[n]!==t.attributes[n]&&u.push((new i).setValue(this.options._const.action,this.options._const.modifyAttribute).setValue(this.options._const.route,o).setValue(this.options._const.name,n).setValue(this.options._const.oldValue,e.attributes[n]).setValue(this.options._const.newValue,t.attributes[n])));for(l=a.length,r=0;r<l;r++)n=a[r],u.push((new i).setValue(this.options._const.action,this.options._const.addAttribute).setValue(this.options._const.route,o).setValue(this.options._const.name,n).setValue(this.options._const.value,t.attributes[n]));return u},A.prototype.findInnerDiff=function(e,t,o){var n=e.childNodes?e.childNodes.slice():[],s=t.childNodes?t.childNodes.slice():[],a=Math.max(n.length,s.length),l=Math.abs(n.length-s.length),c=[],r=0;if(!this.options.maxChildCount||a<this.options.maxChildCount){var d=e.subsets&&e.subsetsAge--,m=d?e.subsets:e.childNodes&&t.childNodes?function(e,t){for(var o=e.childNodes?e.childNodes:[],n=t.childNodes?t.childNodes:[],s=p(o.length,!1),i=p(n.length,!1),a=[],l=!0,c=function(){return arguments[1]};l;)(l=f(o,n,s,i))&&(a.push(l),Array.apply(void 0,new Array(l.length)).map(c).forEach((function(e){return t=e,s[l.oldValue+t]=!0,void(i[l.newValue+t]=!0);var t;})));return e.subsets=a,e.subsetsAge=100,a}(e,t):[];if(m.length>0&&(c=this.attemptGroupRelocation(e,t,m,o,d)).length>0)return c}for(var _=0;_<a;_+=1){var V=n[_],g=s[_];l&&(V&&!g?"#text"===V.nodeName?(c.push((new i).setValue(this.options._const.action,this.options._const.removeTextElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.value,V.data)),r-=1):(c.push((new i).setValue(this.options._const.action,this.options._const.removeElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.element,h(V))),r-=1):g&&!V&&("#text"===g.nodeName?c.push((new i).setValue(this.options._const.action,this.options._const.addTextElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.value,g.data)):c.push((new i).setValue(this.options._const.action,this.options._const.addElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.element,h(g))))),V&&g&&(!this.options.maxChildCount||a<this.options.maxChildCount?c=c.concat(this.findNextDiff(V,g,o.concat(r))):u(V,g)||(n.length>s.length?("#text"===V.nodeName?c.push((new i).setValue(this.options._const.action,this.options._const.removeTextElement).setValue(this.options._const.route,o.concat(r)).setValue(this.options._const.value,V.data)):c.push((new i).setValue(this.options._const.action,this.options._const.removeElement).setValue(this.options._const.element,h(V)).setValue(this.options._const.route,o.concat(r))),n.splice(_,1),_-=1,r-=1,l-=1):n.length<s.length?(c=c.concat([(new i).setValue(this.options._const.action,this.options._const.addElement).setValue(this.options._const.element,h(g)).setValue(this.options._const.route,o.concat(r))]),n.splice(_,0,{}),l-=1):c=c.concat([(new i).setValue(this.options._const.action,this.options._const.replaceElement).setValue(this.options._const.oldValue,h(V)).setValue(this.options._const.newValue,h(g)).setValue(this.options._const.route,o.concat(r))]))),r+=1;}return e.innerDone=!0,c},A.prototype.attemptGroupRelocation=function(e,t,o,n,s){for(var a,l,c,r,u,f,m=function(e,t,o){var n=e.childNodes?p(e.childNodes.length,!0):[],s=t.childNodes?p(t.childNodes.length,!0):[],i=0;return o.forEach((function(e){for(var t=e.oldValue+e.length,o=e.newValue+e.length,a=e.oldValue;a<t;a+=1)n[a]=i;for(var l=e.newValue;l<o;l+=1)s[l]=i;i+=1;})),{gaps1:n,gaps2:s}}(e,t,o),_=m.gaps1,V=m.gaps2,g=Math.min(_.length,V.length),v=[],N=0,b=0;N<g;b+=1,N+=1)if(!s||!0!==_[N]&&!0!==V[N]){if(!0===_[N])if("#text"===(r=e.childNodes[b]).nodeName)if("#text"===t.childNodes[N].nodeName){if(r.data!==t.childNodes[N].data){for(f=b;e.childNodes.length>f+1&&"#text"===e.childNodes[f+1].nodeName;)if(f+=1,t.childNodes[N].data===e.childNodes[f].data){u=!0;break}if(!u)return v.push((new i).setValue(this.options._const.action,this.options._const.modifyTextElement).setValue(this.options._const.route,n.concat(N)).setValue(this.options._const.oldValue,r.data).setValue(this.options._const.newValue,t.childNodes[N].data)),v}}else v.push((new i).setValue(this.options._const.action,this.options._const.removeTextElement).setValue(this.options._const.route,n.concat(N)).setValue(this.options._const.value,r.data)),_.splice(N,1),g=Math.min(_.length,V.length),N-=1;else v.push((new i).setValue(this.options._const.action,this.options._const.removeElement).setValue(this.options._const.route,n.concat(N)).setValue(this.options._const.element,h(r))),_.splice(N,1),g=Math.min(_.length,V.length),N-=1;else if(!0===V[N])"#text"===(r=t.childNodes[N]).nodeName?(v.push((new i).setValue(this.options._const.action,this.options._const.addTextElement).setValue(this.options._const.route,n.concat(N)).setValue(this.options._const.value,r.data)),_.splice(N,0,!0),g=Math.min(_.length,V.length),b-=1):(v.push((new i).setValue(this.options._const.action,this.options._const.addElement).setValue(this.options._const.route,n.concat(N)).setValue(this.options._const.element,h(r))),_.splice(N,0,!0),g=Math.min(_.length,V.length),b-=1);else if(_[N]!==V[N]){if(v.length>0)return v;if(c=o[_[N]],(l=Math.min(c.newValue,e.childNodes.length-c.length))!==c.oldValue){a=!1;for(var y=0;y<c.length;y+=1)d(e.childNodes[l+y],e.childNodes[c.oldValue+y],[],!1,!0)||(a=!0);if(a)return [(new i).setValue(this.options._const.action,this.options._const.relocateGroup).setValue("groupLength",c.length).setValue(this.options._const.from,c.oldValue).setValue(this.options._const.to,l).setValue(this.options._const.route,n)]}}}return v},A.prototype.findValueDiff=function(e,t,o){var n=[];return e.selected!==t.selected&&n.push((new i).setValue(this.options._const.action,this.options._const.modifySelected).setValue(this.options._const.oldValue,e.selected).setValue(this.options._const.newValue,t.selected).setValue(this.options._const.route,o)),(e.value||t.value)&&e.value!==t.value&&"OPTION"!==e.nodeName&&n.push((new i).setValue(this.options._const.action,this.options._const.modifyValue).setValue(this.options._const.oldValue,e.value||"").setValue(this.options._const.newValue,t.value||"").setValue(this.options._const.route,o)),e.checked!==t.checked&&n.push((new i).setValue(this.options._const.action,this.options._const.modifyChecked).setValue(this.options._const.oldValue,e.checked).setValue(this.options._const.newValue,t.checked).setValue(this.options._const.route,o)),n};var D={debug:!1,diffcap:10,maxDepth:!1,maxChildCount:50,valueDiffing:!0,textDiff:function(e,t,o,n){e.data=n;},preVirtualDiffApply:function(){},postVirtualDiffApply:function(){},preDiffApply:function(){},postDiffApply:function(){},filterOuterDiff:null,compress:!1,_const:!1,document:!("undefined"==typeof window||!window.document)&&window.document},T=function(e){var t=this;if(void 0===e&&(e={}),this.options=e,Object.entries(D).forEach((function(e){var o=e[0],n=e[1];Object.prototype.hasOwnProperty.call(t.options,o)||(t.options[o]=n);})),!this.options._const){var o=["addAttribute","modifyAttribute","removeAttribute","modifyTextElement","relocateGroup","removeElement","addElement","removeTextElement","addTextElement","replaceElement","modifyValue","modifyChecked","modifySelected","modifyComment","action","route","oldValue","newValue","element","group","from","to","name","value","data","attributes","nodeName","childNodes","checked","selected"];this.options._const={},this.options.compress?o.forEach((function(e,o){return t.options._const[e]=o})):o.forEach((function(e){return t.options._const[e]=e}));}this.DiffFinder=A;};T.prototype.apply=function(e,t){return function(e,t,n){return t.every((function(t){return o(e,t,n)}))}(e,t,this.options)},T.prototype.undo=function(e,t){return s(e,t,this.options)},T.prototype.diff=function(e,t){return new this.DiffFinder(e,t,this.options).init()};var O=function(e){var t=this;void 0===e&&(e={}),this.pad="│   ",this.padding="",this.tick=1,this.messages=[];var o=function(e,o){var n=e[o];e[o]=function(){for(var s=[],i=arguments.length;i--;)s[i]=arguments[i];t.fin(o,Array.prototype.slice.call(s));var a=n.apply(e,s);return t.fout(o,a),a};};for(var n in e)"function"==typeof e[n]&&o(e,n);this.log("┌ TRACELOG START");};O.prototype.fin=function(e,t){this.padding+=this.pad,this.log("├─> entering "+e,t);},O.prototype.fout=function(e,t){this.log("│<──┘ generated return value",t),this.padding=this.padding.substring(0,this.padding.length-this.pad.length);},O.prototype.format=function(e,t){return function(e){for(e=""+e;e.length<4;)e="0"+e;return e}(t)+"> "+this.padding+e},O.prototype.log=function(){var e=Array.prototype.slice.call(arguments),t=function(e){return e?"string"==typeof e?e:e instanceof HTMLElement?e.outerHTML||"<empty>":e instanceof Array?"["+e.map(t).join(",")+"]":e.toString()||e.valueOf()||"<unknown>":"<falsey>"};e=e.map(t).join(", "),this.messages.push(this.format(e,this.tick++));},O.prototype.toString=function(){for(var e="└───";e.length<=this.padding.length+this.pad.length;)e+="×   ";var t=this.padding;return this.padding="",e=this.format(e,this.tick),this.padding=t,this.messages.join("\n")+"\n"+e},DiffDOM = T,nodeToObj = g,stringToObj = x;

const headingsToVirtualHeaderRowDOM = (headings, columnSettings, columnWidths, { hiddenHeader, sortable, scrollY }, { noColumnWidths, unhideHeader }) => ({
    nodeName: "TR",
    childNodes: headings.map((heading, index) => {
        const column = columnSettings.columns[index] || {};
        if (column.hidden) {
            return false;
        }
        const attributes = {};
        if (!column.notSortable && sortable) {
            attributes["data-sortable"] = "true";
        }
        if (heading.sorted) {
            // @ts-expect-error TS(2339): Property 'class' does not exist on type '{}'.
            attributes.class = heading.sorted;
            attributes["aria-sort"] = heading.sorted === "asc" ? "ascending" : "descending";
        }
        let style = "";
        if (columnWidths[index] && !noColumnWidths) {
            style += `width: ${columnWidths[index]}%;`;
        }
        if (scrollY.length && !unhideHeader) {
            style += "padding-bottom: 0;padding-top: 0;border: 0;";
        }
        if (style.length) {
            // @ts-expect-error TS(2339): Property 'style' does not exist on type '{}'.
            attributes.style = style;
        }
        return {
            nodeName: "TH",
            attributes,
            childNodes: [
                ((hiddenHeader || scrollY.length) && !unhideHeader) ?
                    { nodeName: "#text",
                        data: "" } :
                    column.notSortable || !sortable ?
                        {
                            nodeName: "#text",
                            data: heading.data
                        } :
                        {
                            nodeName: "a",
                            attributes: {
                                href: "#",
                                class: "datatable-sorter"
                            },
                            childNodes: [
                                {
                                    nodeName: "#text",
                                    data: heading.data
                                }
                            ]
                        }
            ]
        };
    }).filter((column) => column)
});
const dataToVirtualDOM = (headings, rows, columnSettings, columnWidths, rowCursor, { hiddenHeader, header, footer, sortable, scrollY, rowRender, tabIndex }, { noColumnWidths, unhideHeader, renderHeader }) => {
    const table = {
        nodeName: "TABLE",
        attributes: {
            class: "datatable-table"
        },
        childNodes: [
            {
                nodeName: "TBODY",
                childNodes: rows.map(({ row, index }) => {
                    const tr = {
                        nodeName: "TR",
                        attributes: {
                            "data-index": index
                        },
                        childNodes: row.map((cell, cIndex) => {
                            const column = columnSettings.columns[cIndex] || {};
                            if (column.hidden) {
                                return false;
                            }
                            const td = cell.type === "node" ?
                                {
                                    nodeName: "TD",
                                    childNodes: cell.data
                                } :
                                {
                                    nodeName: "TD",
                                    childNodes: [
                                        {
                                            nodeName: "#text",
                                            data: String(cell.data)
                                        }
                                    ]
                                };
                            if (!header && !footer && columnWidths[cIndex] && !noColumnWidths) {
                                // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ no... Remove this comment to see the full error message
                                td.attributes = {
                                    style: `width: ${columnWidths[cIndex]}%;`
                                };
                            }
                            if (column.render) {
                                const renderedCell = column.render(cell.data, td, index, cIndex);
                                if (renderedCell) {
                                    if (typeof renderedCell === "string") {
                                        // Convenience method to make it work similarly to what it did up to version 5.
                                        const node = stringToObj(`<td>${renderedCell}</td>`);
                                        // @ts-expect-error TS(2367): This condition will always return 'true' since the... Remove this comment to see the full error message
                                        if (!node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text") {
                                            td.childNodes = node.childNodes;
                                        }
                                        else {
                                            td.childNodes[0].data = renderedCell;
                                        }
                                    }
                                    else {
                                        return renderedCell;
                                    }
                                }
                            }
                            return td;
                        }).filter((column) => column)
                    };
                    if (index === rowCursor) {
                        // @ts-expect-error TS(2339): Property 'class' does not exist on type '{ "data-i... Remove this comment to see the full error message
                        tr.attributes.class = "datatable-cursor";
                    }
                    if (rowRender) {
                        const renderedRow = rowRender(row, tr, index);
                        if (renderedRow) {
                            if (typeof renderedRow === "string") {
                                // Convenience method to make it work similarly to what it did up to version 5.
                                const node = stringToObj(`<tr>${renderedRow}</tr>`);
                                if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
                                    tr.childNodes = node.childNodes;
                                }
                                else {
                                    tr.childNodes[0].data = renderedRow;
                                }
                            }
                            else {
                                return renderedRow;
                            }
                        }
                    }
                    return tr;
                })
            }
        ]
    };
    if (header || footer || renderHeader) {
        const headerRow = headingsToVirtualHeaderRowDOM(headings, columnSettings, columnWidths, { hiddenHeader,
            sortable,
            scrollY }, { noColumnWidths,
            unhideHeader });
        if (header || renderHeader) {
            const thead = {
                nodeName: "THEAD",
                childNodes: [headerRow]
            };
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ no... Remove this comment to see the full error message
                thead.attributes = { style: "height: 0px;" };
            }
            table.childNodes.unshift(thead);
        }
        if (footer) {
            const footerRow = header ? structuredClone(headerRow) : headerRow;
            const tfoot = {
                nodeName: "TFOOT",
                childNodes: [footerRow]
            };
            if ((scrollY.length || hiddenHeader) && !unhideHeader) {
                // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ no... Remove this comment to see the full error message
                tfoot.attributes = { style: "height: 0px;" };
            }
            table.childNodes.push(tfoot);
        }
    }
    if (tabIndex !== false) {
        // @ts-expect-error TS(2339): Property 'tabindex' does not exist on type '{ clas... Remove this comment to see the full error message
        table.attributes.tabindex = String(tabIndex);
    }
    return table;
};

const readColumnSettings = (columnOptions = []) => {
    const columns = [];
    let sort = false;
    // Check for the columns option
    columnOptions.forEach(data => {
        // convert single column selection to array
        const columnSelectors = Array.isArray(data.select) ? data.select : [data.select];
        columnSelectors.forEach((selector) => {
            if (!columns[selector]) {
                columns[selector] = {};
            }
            const column = columns[selector];
            if (data.render) {
                column.render = data.render;
            }
            if (data.type) {
                column.type = data.type;
            }
            if (data.format) {
                column.format = data.format;
            }
            if (data.sortable === false) {
                column.notSortable = true;
            }
            if (data.hidden) {
                column.hidden = true;
            }
            if (data.filter) {
                column.filter = data.filter;
            }
            if (data.sort) {
                // We only allow one. The last one will overwrite all other options
                // @ts-expect-error TS(2322): Type '{ column: any; dir: any; }' is not assignabl... Remove this comment to see the full error message
                sort = { column,
                    dir: data.sort };
            }
        });
    });
    return { columns,
        sort };
};

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
 */
const parseDate = (content, format) => {
    let date = false;
    // Converting to YYYYMMDD ensures we can accurately sort the column numerically
    if (format) {
        switch (format) {
            case "ISO_8601":
                // ISO8601 is already lexiographically sorted, so we can just sort it as a string.
                date = content;
                break;
            case "RFC_2822":
                date = dayjs(content.slice(5), "DD MMM YYYY HH:mm:ss ZZ").unix();
                break;
            case "MYSQL":
                date = dayjs(content, "YYYY-MM-DD hh:mm:ss").unix();
                break;
            case "UNIX":
                date = dayjs(content).unix();
                break;
            // User defined format using the data-format attribute or columns[n].format option
            default:
                date = dayjs(content, format, true).valueOf();
                break;
        }
    }
    return date;
};

/**
 * Check is item is object
 */
const isObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
/**
 * Check for valid JSON string
 */
const isJson = (str) => {
    let t = !1;
    try {
        t = JSON.parse(str);
    }
    catch (e) {
        return !1;
    }
    return !(null === t || (!Array.isArray(t) && !isObject(t))) && t;
};
/**
 * Create DOM element node
 */
const createElement = (nodeName, attrs) => {
    const dom = document.createElement(nodeName);
    if (attrs && "object" == typeof attrs) {
        for (const attr in attrs) {
            if ("html" === attr) {
                dom.innerHTML = attrs[attr];
            }
            else {
                dom.setAttribute(attr, attrs[attr]);
            }
        }
    }
    return dom;
};
const flush = (el) => {
    if (el instanceof NodeList) {
        el.forEach(e => flush(e));
    }
    else {
        el.innerHTML = "";
    }
};
/**
 * Create button helper
 */
const button = (className, page, text) => createElement("li", {
    class: className,
    html: `<a href="#" data-page="${page}">${text}</a>`
});
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
    }
    else if (b > c - (3 - d + e)) {
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
            if (d - e == 2)
                i.push(a[e]);
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
    return i;
};
const objToText = (obj) => {
    if (obj.nodeName === "#text") {
        return obj.data;
    }
    if (obj.childNodes) {
        return obj.childNodes.map((childNode) => objToText(childNode)).join("");
    }
    return "";
};
const escapeText = function (text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
};

const readDataCell = (cell, columnSettings = {}) => {
    if (cell.constructor == Object) {
        return cell;
    }
    const cellData = {
        data: cell
    };
    if (typeof cell === "string" && cell.length) {
        const node = stringToObj(`<td>${cell}</td>`);
        if (node.childNodes && (node.childNodes.length !== 1 || node.childNodes[0].nodeName !== "#text")) {
            cellData.data = node.childNodes;
            // @ts-expect-error TS(2339): Property 'type' does not exist on type '{ data: an... Remove this comment to see the full error message
            cellData.type = "node";
            const text = objToText(node);
            // @ts-expect-error TS(2339): Property 'text' does not exist on type '{ data: an... Remove this comment to see the full error message
            cellData.text = text;
            // @ts-expect-error TS(2339): Property 'order' does not exist on type '{ data: a... Remove this comment to see the full error message
            cellData.order = text;
        }
    }
    // @ts-expect-error TS(2339): Property 'type' does not exist on type '{}'.
    if (columnSettings.type === "date" && columnSettings.format) {
        // @ts-expect-error TS(2339): Property 'order' does not exist on type '{ data: a... Remove this comment to see the full error message
        cellData.order = parseDate(cell, columnSettings.format);
    }
    return cellData;
};
const readTableData = (dataOption, dom = false, columnSettings) => {
    var _a, _b;
    const data = {
        data: [],
        headings: []
    };
    if (dataOption === null || dataOption === void 0 ? void 0 : dataOption.data) {
        data.data = dataOption.data.map((row) => row.map((cell, index) => readDataCell(cell, columnSettings.columns[index])));
        // @ts-expect-error TS(2339): Property 'tBodies' does not exist on type 'boolean... Remove this comment to see the full error message
    }
    else if (dom === null || dom === void 0 ? void 0 : dom.tBodies.length) {
        // @ts-expect-error TS(2322): Type 'any[][]' is not assignable to type 'never[]'... Remove this comment to see the full error message
        data.data = Array.from(dom.tBodies[0].rows).map(
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        row => Array.from(row.cells).map(
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        (cell, index) => readDataCell(cell.dataset.content || cell.innerHTML, columnSettings.columns[index])));
    }
    if (dataOption === null || dataOption === void 0 ? void 0 : dataOption.headings) {
        data.headings = dataOption.headings.map((heading) => ({
            data: heading,
            sorted: false
        }));
        // @ts-expect-error TS(2339): Property 'tHead' does not exist on type 'boolean'.
    }
    else if (dom === null || dom === void 0 ? void 0 : dom.tHead) {
        // @ts-expect-error TS(2322): Type '{ data: any; sorted: boolean; }[]' is not as... Remove this comment to see the full error message
        data.headings = Array.from(dom.tHead.querySelectorAll("th")).map(th => {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            const heading = { data: th.innerHTML,
                sorted: false };
            // @ts-expect-error TS(2339): Property 'sortable' does not exist on type '{ data... Remove this comment to see the full error message
            heading.sortable = th.dataset.sortable !== "false";
            return heading;
        });
    }
    else if ((_b = (_a = dataOption === null || dataOption === void 0 ? void 0 : dataOption.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.length) {
        data.headings = dataOption.data.data[0].map((_cell) => "");
        // @ts-expect-error TS(2339): Property 'tBodies' does not exist on type 'boolean... Remove this comment to see the full error message
    }
    else if (dom === null || dom === void 0 ? void 0 : dom.tBodies.length) {
        // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'never[]... Remove this comment to see the full error message
        data.headings = Array.from(dom.tBodies[0].rows[0].cells).map(_cell => "");
    }
    if (data.data.length && data.data[0].length !== data.headings.length) {
        throw new Error("Data heading length mismatch.");
    }
    return data;
};

/**
 * Rows API
 */
class Rows {
    constructor(dt) {
        this.dt = dt;
        this.cursor = false;
    }
    setCursor(index = false) {
        if (index === this.cursor) {
            return;
        }
        const oldCursor = this.cursor;
        this.cursor = index;
        this.dt.renderTable();
        if (index !== false && this.dt.options.scrollY) {
            const cursorDOM = this.dt.dom.querySelector("tr.datatable-cursor");
            if (cursorDOM) {
                cursorDOM.scrollIntoView({ block: "nearest" });
            }
        }
        this.dt.emit("datatable.cursormove", this.cursor, oldCursor);
    }
    /**
     * Add new row
     */
    add(data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {};
            return readDataCell(cell, columnSettings);
        });
        this.dt.data.data.push(row);
        // We may have added data to an empty table
        if (this.dt.data.data.length) {
            this.dt.hasRows = true;
        }
        this.dt.update(false);
        this.dt.fixColumns();
    }
    /**
     * Remove row(s)
     */
    remove(select) {
        if (Array.isArray(select)) {
            this.dt.data.data = this.dt.data.data.filter((_row, index) => !select.includes(index));
            // We may have emptied the table
            if (!this.dt.data.data.length) {
                this.dt.hasRows = false;
            }
            this.dt.update(false);
            this.dt.fixColumns();
        }
        else {
            return this.remove([select]);
        }
    }
    /**
     * Find index of row by searching for a value in a column
     */
    findRowIndex(columnIndex, value) {
        // returns row index of first case-insensitive string match
        // inside the td innerText at specific column index
        return this.dt.data.data.findIndex((row) => String(row[columnIndex].data).toLowerCase().includes(String(value).toLowerCase()));
    }
    /**
     * Find index, row, and column data by searching for a value in a column
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
            };
        }
        // get the row from data
        const row = this.dt.data.data[index];
        // return innerHTML of each td
        const cols = row.map((cell) => cell.data);
        // return everything
        return {
            index,
            row,
            cols
        };
    }
    /**
     * Update a row with new data
     */
    updateRow(select, data) {
        const row = data.map((cell, index) => {
            const columnSettings = this.dt.columnSettings.columns[index] || {};
            return readDataCell(cell, columnSettings);
        });
        this.dt.data.data.splice(select, 1, row);
        this.dt.update(false);
        this.dt.fixColumns();
    }
}

class Columns {
    constructor(dt) {
        this.dt = dt;
    }
    /**
     * Swap two columns
     */
    swap(columns) {
        if (columns.length === 2) {
            // Get the current column indexes
            const cols = this.dt.data.headings.map((_node, index) => index);
            const x = columns[0];
            const y = columns[1];
            const b = cols[y];
            cols[y] = cols[x];
            cols[x] = b;
            return this.order(cols);
        }
    }
    /**
     * Reorder the columns
     */
    order(columns) {
        this.dt.headings = columns.map((index) => this.dt.headings[index]);
        this.dt.data.data = this.dt.data.data.map((row) => columns.map((index) => row[index]));
        this.dt.columnSettings.columns = columns.map((index) => this.dt.columnSettings.columns[index]);
        // Update
        this.dt.update();
    }
    /**
     * Hide columns
     */
    hide(columns) {
        if (!columns.length) {
            return;
        }
        columns.forEach((index) => {
            if (!this.dt.columnSettings.columns[index]) {
                this.dt.columnSettings.columns[index] = {};
            }
            const column = this.dt.columnSettings.columns[index];
            column.hidden = true;
        });
        this.dt.update();
    }
    /**
     * Show columns
     */
    show(columns) {
        if (!columns.length) {
            return;
        }
        columns.forEach((index) => {
            if (!this.dt.columnSettings.columns[index]) {
                this.dt.columnSettings.columns[index] = {};
            }
            const column = this.dt.columnSettings.columns[index];
            delete column.hidden;
        });
        this.dt.update();
    }
    /**
     * Check column(s) visibility
     */
    visible(columns) {
        var _a;
        if (Array.isArray(columns)) {
            return columns.map(index => { var _a; return !((_a = this.dt.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); });
        }
        return !((_a = this.dt.columnSettings.columns[columns]) === null || _a === void 0 ? void 0 : _a.hidden);
    }
    /**
     * Add a new column
     */
    add(data) {
        const newColumnSelector = this.dt.data.headings.length;
        this.dt.data.headings = this.dt.data.headings.concat([{ data: data.heading }]);
        this.dt.data.data = this.dt.data.data.map((row, index) => row.concat([readDataCell(data.data[index], data)]));
        if (data.type || data.format || data.sortable || data.render) {
            if (!this.dt.columnSettings.columns[newColumnSelector]) {
                this.dt.columnSettings.columns[newColumnSelector] = {};
            }
            const column = this.dt.columnSettings.columns[newColumnSelector];
            if (data.type) {
                column.type = data.type;
            }
            if (data.format) {
                column.format = data.format;
            }
            if (data.sortable) {
                column.sortable = data.sortable;
            }
            if (data.filter) {
                column.filter = data.filter;
            }
            if (data.type) {
                column.type = data.type;
            }
        }
        this.dt.update(false);
        this.dt.fixColumns();
    }
    /**
     * Remove column(s)
     */
    remove(columns) {
        if (Array.isArray(columns)) {
            this.dt.data.headings = this.dt.data.headings.filter((_heading, index) => !columns.includes(index));
            this.dt.data.data = this.dt.data.data.map((row) => row.filter((_cell, index) => !columns.includes(index)));
            this.dt.update(false);
            this.dt.fixColumns();
        }
        else {
            return this.remove([columns]);
        }
    }
    /**
     * Filter by column
     */
    filter(column, init) {
        var _a, _b;
        if (!((_b = (_a = this.dt.columnSettings.columns[column]) === null || _a === void 0 ? void 0 : _a.filter) === null || _b === void 0 ? void 0 : _b.length)) {
            // There is no filter to apply.
            return;
        }
        const currentFilter = this.dt.filterStates.find((filterState) => filterState.column === column);
        let newFilterState;
        if (currentFilter) {
            let returnNext = false;
            newFilterState = this.dt.columnSettings.columns[column].filter.find((filter) => {
                if (returnNext) {
                    return true;
                }
                if (filter === currentFilter.state) {
                    returnNext = true;
                }
                return false;
            });
        }
        else {
            newFilterState = this.dt.columnSettings.columns[column].filter[0];
        }
        if (currentFilter && newFilterState) {
            currentFilter.state = newFilterState;
        }
        else if (currentFilter) {
            this.dt.filterStates = this.dt.filterStates.filter((filterState) => filterState.column !== column);
        }
        else {
            this.dt.filterStates.push({ column,
                state: newFilterState });
        }
        this.dt.update();
        if (!init) {
            this.dt.emit("datatable.filter", column, newFilterState);
        }
    }
    /**
     * Sort by column
     */
    sort(column, dir, init) {
        var _a, _b;
        // If there is a filter for this column, apply it instead of sorting
        if ((_b = (_a = this.dt.columnSettings.columns[column]) === null || _a === void 0 ? void 0 : _a.filter) === null || _b === void 0 ? void 0 : _b.length) {
            return this.filter(column, init);
        }
        if (!init) {
            this.dt.emit("datatable.sorting", column, dir);
        }
        if (!dir) {
            const currentDir = this.dt.data.headings[column].sorted;
            dir = currentDir === "asc" ? "desc" : "asc";
        }
        // Remove all other sorting
        this.dt.data.headings.forEach((heading) => {
            heading.sorted = false;
        });
        this.dt.data.data.sort((row1, row2) => {
            let order1 = row1[column].order || row1[column].data, order2 = row2[column].order || row2[column].data;
            if (dir === "desc") {
                const temp = order1;
                order1 = order2;
                order2 = temp;
            }
            if (order1 < order2) {
                return -1;
            }
            else if (order1 > order2) {
                return 1;
            }
            return 0;
        });
        this.dt.data.headings[column].sorted = dir;
        this.dt.update(!init);
        if (!init) {
            this.dt.columnSettings.sort = { column,
                dir };
            this.dt.emit("datatable.sort", column, dir);
        }
    }
}

/**
 * Default configuration
 */
const defaultConfig$1 = {
    sortable: true,
    searchable: true,
    destroyable: true,
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
    rowRender: false,
    // Customise the display text
    labels: {
        placeholder: "Search...",
        perPage: "{select} entries per page",
        noRows: "No entries found",
        noResults: "No results match your search query",
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
        this.dom = typeof table === "string" ? document.querySelector(table) : table;
        // user options
        this.options = Object.assign(Object.assign(Object.assign({}, defaultConfig$1), options), { layout: Object.assign(Object.assign({}, defaultConfig$1.layout), options.layout), labels: Object.assign(Object.assign({}, defaultConfig$1.labels), options.labels) });
        this.initialInnerHTML = this.options.destroyable ? this.dom.innerHTML : ""; // preserve in case of later destruction
        if (this.options.tabIndex) {
            this.dom.tabIndex = this.options.tabIndex;
        }
        else if (this.options.rowNavigation && this.dom.tabIndex === -1) {
            this.dom.tabIndex = 0;
        }
        this.listeners = {
            // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
            onResize: (event) => this.onResize(event)
        };
        this.dd = new DiffDOM();
        // Initialize other variables
        this.initialized = false;
        this.events = {};
        this.data = false;
        this.virtualDOM = false;
        this.virtualHeaderDOM = false;
        this.headerDOM = false;
        this.currentPage = 0;
        this.onFirstPage = true;
        this.hasHeadings = false;
        this.hasRows = false;
        this.columnWidths = [];
        this.columnSettings = false;
        this.filterStates = [];
        this.init();
    }
    /**
     * Initialize the instance
     */
    init() {
        if (this.initialized || this.dom.classList.contains("datatable-table")) {
            return false;
        }
        this.rows = new Rows(this);
        this.columns = new Columns(this);
        this.columnSettings = readColumnSettings(this.options.columns);
        this.data = readTableData(this.options.data, this.dom, this.columnSettings);
        this.hasRows = Boolean(this.data.data.length);
        this.hasHeadings = Boolean(this.data.headings.length);
        this.virtualDOM = nodeToObj(this.dom);
        this.render();
        setTimeout(() => {
            this.emit("datatable.init");
            this.initialized = true;
        }, 10);
    }
    /**
     * Render the instance
     */
    render() {
        // Build
        this.wrapper = createElement("div", {
            class: "datatable-wrapper datatable-loading"
        });
        // Template for custom layouts
        let template = "";
        template += "<div class='datatable-top'>";
        template += this.options.layout.top;
        template += "</div>";
        if (this.options.scrollY.length) {
            template += `<div class='datatable-container' style='height: ${this.options.scrollY}; overflow-Y: auto;'></div>`;
        }
        else {
            template += "<div class='datatable-container'></div>";
        }
        template += "<div class='datatable-bottom'>";
        template += this.options.layout.bottom;
        template += "</div>";
        // Info placement
        template = template.replace("{info}", this.options.paging ? "<div class='datatable-info'></div>" : "");
        // Per Page Select
        if (this.options.paging && this.options.perPageSelect) {
            let wrap = "<div class='datatable-dropdown'><label>";
            wrap += this.options.labels.perPage;
            wrap += "</label></div>";
            // Create the select
            const select = createElement("select", {
                class: "datatable-selector"
            });
            // Create the options
            this.options.perPageSelect.forEach((val) => {
                const selected = val === this.options.perPage;
                const option = new Option(val, val, selected, selected);
                select.appendChild(option);
            });
            // Custom label
            wrap = wrap.replace("{select}", select.outerHTML);
            // Selector placement
            template = template.replace("{select}", wrap);
        }
        else {
            template = template.replace("{select}", "");
        }
        // Searchable
        if (this.options.searchable) {
            const form = `<div class='datatable-search'><input class='datatable-input' placeholder='${this.options.labels.placeholder}' type='text'></div>`;
            // Search input placement
            template = template.replace("{search}", form);
        }
        else {
            template = template.replace("{search}", "");
        }
        // Paginator
        const paginatorWrapper = createElement("nav", {
            class: "datatable-pagination"
        });
        const paginator = createElement("ul", {
            class: "datatable-pagination-list"
        });
        paginatorWrapper.appendChild(paginator);
        // Pager(s) placement
        template = template.replace(/\{pager\}/g, paginatorWrapper.outerHTML);
        this.wrapper.innerHTML = template;
        this.container = this.wrapper.querySelector(".datatable-container");
        this.pagers = this.wrapper.querySelectorAll(".datatable-pagination-list");
        this.label = this.wrapper.querySelector(".datatable-info");
        // Insert in to DOM tree
        this.dom.parentNode.replaceChild(this.wrapper, this.dom);
        this.container.appendChild(this.dom);
        // Store the table dimensions
        this.rect = this.dom.getBoundingClientRect();
        // // Update
        this.update(false);
        //
        // // Fix height
        this.fixHeight();
        //
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
        if (this.columnSettings.sort) {
            this.columns.sort(this.columnSettings.sort.column, this.columnSettings.sort.dir, true);
        }
        // // Fix columns
        this.fixColumns();
    }
    renderTable(renderOptions = {}) {
        const newVirtualDOM = dataToVirtualDOM(this.data.headings, 
        // @ts-expect-error TS(2339): Property 'noPaging' does not exist on type '{}'.
        this.options.paging && this.currentPage && !renderOptions.noPaging ?
            this.pages[this.currentPage - 1] :
            this.data.data.map((row, index) => ({
                row,
                index
            })), this.columnSettings, this.columnWidths, this.rows.cursor, this.options, renderOptions);
        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM);
        this.dd.apply(this.dom, diff);
        this.virtualDOM = newVirtualDOM;
    }
    /**
     * Render the page
     * @return {Void}
     */
    renderPage(renderTable = true, lastRowCursor = false) {
        if (this.hasRows && this.totalPages) {
            if (this.currentPage > this.totalPages) {
                this.currentPage = 1;
            }
            // Use a fragment to limit touching the DOM
            if (renderTable) {
                this.renderTable();
            }
            this.onFirstPage = this.currentPage === 1;
            this.onLastPage = this.currentPage === this.lastPage;
        }
        else {
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
            items = this.searching ? this.searchData.length : this.data.data.length;
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
            if (!this.rows.cursor || !this.pages[this.currentPage - 1].find((page) => page.index === this.rows.cursor)) {
                const rows = this.pages[this.currentPage - 1];
                if (lastRowCursor) {
                    this.rows.setCursor(rows[rows.length - 1].index);
                }
                else {
                    this.rows.setCursor(rows[0].index);
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
                pager = truncate(this.links, this.currentPage, this.pages.length, this.options.pagerDelta, this.options.ellipsisText);
            }
            // active page link
            this.links[this.currentPage - 1].classList.add("active");
            // append the links
            pager.forEach((p) => {
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
            this.pagers.forEach((pager) => {
                pager.appendChild(frag.cloneNode(true));
            });
        }
    }
    /**
     * Bind event listeners
     * @return {[type]} [description]
     */
    bindEvents() {
        // Per page selector
        if (this.options.perPageSelect) {
            const selector = this.wrapper.querySelector(".datatable-selector");
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
            this.input = this.wrapper.querySelector(".datatable-input");
            if (this.input) {
                this.input.addEventListener("keyup", () => this.search(this.input.value), false);
            }
        }
        // Pager(s) / sorting
        this.wrapper.addEventListener("click", (e) => {
            const t = e.target.closest("a");
            if (t && (t.nodeName.toLowerCase() === "a")) {
                if (t.hasAttribute("data-page")) {
                    this.page(t.getAttribute("data-page"));
                    e.preventDefault();
                }
                else if (this.options.sortable &&
                    t.classList.contains("datatable-sorter") &&
                    t.parentNode.getAttribute("data-sortable") != "false") {
                    this.columns.sort(Array.from(t.parentNode.parentNode.children).indexOf(t.parentNode));
                    e.preventDefault();
                }
            }
        }, false);
        if (this.options.rowNavigation) {
            this.dom.addEventListener("keydown", (event) => {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    event.stopPropagation();
                    let lastRow;
                    this.pages[this.currentPage - 1].find((row) => {
                        if (row.index === this.rows.cursor) {
                            return true;
                        }
                        lastRow = row;
                        return false;
                    });
                    if (lastRow) {
                        this.rows.setCursor(lastRow.index);
                    }
                    else if (!this.onFirstPage) {
                        // @ts-expect-error TS(2345): Argument of type '{ lastRowCursor: boolean; }' is ... Remove this comment to see the full error message
                        this.page(this.currentPage - 1, { lastRowCursor: true });
                    }
                }
                else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    event.stopPropagation();
                    let foundRow;
                    const nextRow = this.pages[this.currentPage - 1].find((row) => {
                        if (foundRow) {
                            return true;
                        }
                        if (row.index === this.rows.cursor) {
                            foundRow = true;
                        }
                        return false;
                    });
                    if (nextRow) {
                        this.rows.setCursor(nextRow.index);
                    }
                    else if (!this.onLastPage) {
                        this.page(this.currentPage + 1);
                    }
                }
                else if (["Enter", " "].includes(event.key)) {
                    this.emit("datatable.selectrow", this.rows.cursor, event);
                }
            });
            this.dom.addEventListener("mousedown", (event) => {
                if (this.dom.matches(":focus")) {
                    // @ts-expect-error TS(2571): Object is of type 'unknown'.
                    const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(event.target));
                    // @ts-expect-error TS(2554): Expected 1 arguments, but got 3.
                    this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event);
                }
            });
        }
        else {
            this.dom.addEventListener("mousedown", (event) => {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                const row = Array.from(this.dom.querySelectorAll("body tr")).find(row => row.contains(event.target));
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 3.
                this.emit("datatable.selectrow", parseInt(row.dataset.index, 10), event);
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
            return;
        }
        this.fixColumns();
    }
    /**
     * Destroy the instance
     * @return {void}
     */
    destroy() {
        if (!this.options.destroyable) {
            return;
        }
        this.dom.innerHTML = this.initialInnerHTML;
        // Remove the className
        this.dom.classList.remove("datatable-table");
        // Remove the containers
        this.wrapper.parentNode.replaceChild(this.dom, this.wrapper);
        this.initialized = false;
        window.removeEventListener("resize", this.listeners.onResize);
    }
    /**
     * Update the instance
     * @return {Void}
     */
    update(renderTable = true) {
        this.wrapper.classList.remove("datatable-empty");
        this.paginate();
        this.renderPage(renderTable);
        this.links = [];
        let i = this.pages.length;
        while (i--) {
            const num = i + 1;
            this.links[i] = button(i === 0 ? "active" : "", num, num);
        }
        this.renderPager();
        this.emit("datatable.update");
    }
    paginate() {
        let rows = this.data.data.map((row, index) => ({
            row,
            index
        }));
        if (this.searching) {
            rows = [];
            this.searchData.forEach((index) => rows.push({ index,
                row: this.data.data[index] }));
        }
        if (this.filterStates.length) {
            this.filterStates.forEach((filterState) => {
                rows = rows.filter((row) => typeof filterState.state === "function" ? filterState.state(row.row[filterState.column].data) : row.row[filterState.column].data === filterState.state);
            });
        }
        if (this.options.paging) {
            // Check for hidden columns
            this.pages = rows
                .map((row, i) => i % this.options.perPage === 0 ? rows.slice(i, i + this.options.perPage) : null)
                .filter((page) => page);
        }
        else {
            this.pages = [rows];
        }
        this.totalPages = this.lastPage = this.pages.length;
        this.currentPage = 1;
        return this.totalPages;
    }
    /**
     * Fix column widths
     */
    fixColumns() {
        var _a, _b, _c, _d;
        const activeHeadings = this.data.headings.filter((heading, index) => { var _a; return !((_a = this.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); });
        if ((this.options.scrollY.length || this.options.fixedColumns) && (activeHeadings === null || activeHeadings === void 0 ? void 0 : activeHeadings.length)) {
            this.columnWidths = [];
            const renderOptions = {
                noPaging: true
            };
            // If we have headings we need only set the widths on them
            // otherwise we need a temp header and the widths need applying to all cells
            if (this.options.header || this.options.footer) {
                if (this.options.scrollY.length) {
                    // @ts-expect-error TS(2339): Property 'unhideHeader' does not exist on type '{ ... Remove this comment to see the full error message
                    renderOptions.unhideHeader = true;
                }
                if (this.headerDOM) {
                    // Remove headerDOM for accurate measurements
                    this.headerDOM.parentElement.removeChild(this.headerDOM);
                }
                // Reset widths
                // @ts-expect-error TS(2339): Property 'noColumnWidths' does not exist on type '... Remove this comment to see the full error message
                renderOptions.noColumnWidths = true;
                this.renderTable(renderOptions);
                const activeDOMHeadings = Array.from(((_b = (_a = this.dom.querySelector("thead, tfoot")) === null || _a === void 0 ? void 0 : _a.firstElementChild) === null || _b === void 0 ? void 0 : _b.children) || []);
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                const absoluteColumnWidths = activeDOMHeadings.map(cell => cell.offsetWidth);
                const totalOffsetWidth = absoluteColumnWidths.reduce((total, cellWidth) => total + cellWidth, 0);
                this.columnWidths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100);
                if (this.options.scrollY.length) {
                    const container = this.dom.parentElement;
                    if (!this.headerDOM) {
                        this.headerDOM = document.createElement("div");
                        this.virtualHeaderDOM = {
                            nodeName: "DIV"
                        };
                    }
                    container.parentElement.insertBefore(this.headerDOM, container);
                    const newVirtualHeaderDOM = {
                        nodeName: "DIV",
                        attributes: {
                            class: "datatable-headercontainer"
                        },
                        childNodes: [
                            {
                                nodeName: "TABLE",
                                attributes: {
                                    class: "datatable-table"
                                },
                                childNodes: [
                                    {
                                        nodeName: "THEAD",
                                        childNodes: [
                                            headingsToVirtualHeaderRowDOM(this.data.headings, this.columnSettings, this.columnWidths, this.options, { unhideHeader: true })
                                        ]
                                    }
                                ]
                            }
                        ]
                    };
                    const diff = this.dd.diff(this.virtualHeaderDOM, newVirtualHeaderDOM);
                    this.dd.apply(this.headerDOM, diff);
                    this.virtualHeaderDOM = newVirtualHeaderDOM;
                    // Compensate for scrollbars
                    const paddingRight = this.headerDOM.firstElementChild.clientWidth - this.dom.clientWidth;
                    if (paddingRight) {
                        const paddedVirtualHeaderDOM = structuredClone(this.virtualHeaderDOM);
                        paddedVirtualHeaderDOM.attributes.style = `padding-right: ${paddingRight}px;`;
                        const diff = this.dd.diff(this.virtualHeaderDOM, paddedVirtualHeaderDOM);
                        this.dd.apply(this.headerDOM, diff);
                        this.virtualHeaderDOM = paddedVirtualHeaderDOM;
                    }
                    if (container.scrollHeight > container.clientHeight) {
                        // scrollbars on one page means scrollbars on all pages.
                        container.style.overflowY = "scroll";
                    }
                }
            }
            else {
                // @ts-expect-error TS(2339): Property 'renderHeader' does not exist on type '{ ... Remove this comment to see the full error message
                renderOptions.renderHeader = true;
                this.renderTable(renderOptions);
                const activeDOMHeadings = Array.from(((_d = (_c = this.dom.querySelector("thead, tfoot")) === null || _c === void 0 ? void 0 : _c.firstElementChild) === null || _d === void 0 ? void 0 : _d.children) || []);
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
                const absoluteColumnWidths = activeDOMHeadings.map(cell => cell.offsetWidth);
                const totalOffsetWidth = absoluteColumnWidths.reduce((total, cellWidth) => total + cellWidth, 0);
                this.columnWidths = absoluteColumnWidths.map(cellWidth => cellWidth / totalOffsetWidth * 100);
            }
            // render table without options for measurements
            this.renderTable();
        }
    }
    /**
     * Fix the container height
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
     */
    search(query) {
        if (!this.hasRows)
            return false;
        query = query.toLowerCase();
        this.currentPage = 1;
        this.searching = true;
        this.searchData = [];
        if (!query.length) {
            this.searching = false;
            this.update();
            this.emit("datatable.search", query, this.searchData);
            this.wrapper.classList.remove("search-results");
            return false;
        }
        this.data.data.forEach((row, idx) => {
            const inArray = this.searchData.includes(row);
            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            const doesQueryMatch = query.split(" ").reduce((bool, word) => {
                let includes = false;
                let cell = null;
                let content = null;
                for (let x = 0; x < row.length; x++) {
                    cell = row[x];
                    content = cell.text || String(cell.data);
                    if (this.columns.visible(x) && content.toLowerCase().includes(word)) {
                        includes = true;
                        break;
                    }
                }
                return bool && includes;
            }, true);
            if (doesQueryMatch && !inArray) {
                this.searchData.push(idx);
            }
        });
        this.wrapper.classList.add("search-results");
        if (!this.searchData.length) {
            this.wrapper.classList.remove("search-results");
            this.setMessage(this.options.labels.noResults);
        }
        else {
            this.update();
        }
        this.emit("datatable.search", query, this.searchData);
    }
    /**
     * Change page
     */
    page(page, lastRowCursor = false) {
        // We don't want to load the current page again.
        if (page === this.currentPage) {
            return false;
        }
        if (!isNaN(page)) {
            this.currentPage = parseInt(page, 10);
        }
        if (page > this.pages.length || page < 0) {
            return false;
        }
        this.renderPage(undefined, lastRowCursor);
        this.renderPager();
        this.emit("datatable.page", page);
    }
    /**
     * Add new row data
     */
    insert(data) {
        let rows = [];
        if (isObject(data)) {
            if (data.headings) {
                if (!this.hasHeadings && !this.hasRows) {
                    this.data = readTableData(data, undefined, this.columnSettings);
                    this.hasRows = Boolean(this.data.data.length);
                    this.hasHeadings = Boolean(this.data.headings.length);
                }
            }
            if (data.data && Array.isArray(data.data)) {
                rows = data.data;
            }
        }
        else if (Array.isArray(data)) {
            const headings = this.data.headings.map((heading) => heading.data);
            data.forEach(row => {
                const r = [];
                Object.entries(row).forEach(([heading, cell]) => {
                    const index = headings.indexOf(heading);
                    if (index > -1) {
                        r[index] = cell;
                    }
                });
                rows.push(r);
            });
        }
        if (rows.length) {
            rows.forEach((row) => this.data.data.push(row.map((cell, index) => {
                const cellOut = readDataCell(cell, this.columnSettings.columns[index]);
                return cellOut;
            })));
            this.hasRows = true;
        }
        if (this.columnSettings.sort) {
            this.columns.sort(this.columnSettings.sort.column, this.columnSettings.sort.dir, true);
        }
        else {
            this.update(false);
        }
        this.fixColumns();
    }
    /**
     * Refresh the instance
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
     * Print the table
     */
    print() {
        // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
        const tableDOM = createElement("table");
        const tableVirtualDOM = { nodeName: "TABLE" };
        const newTableVirtualDOM = dataToVirtualDOM(this.data.headings, this.data.data.map((row, index) => ({
            row,
            index
        })), this.columnSettings, this.columnWidths, false, // No row cursor
        this.options, {
            noColumnWidths: true,
            unhideHeader: true
        });
        const diff = this.dd.diff(tableVirtualDOM, newTableVirtualDOM);
        this.dd.apply(tableDOM, diff);
        // Open new window
        const w = window.open();
        // Append the table to the body
        w.document.body.appendChild(tableDOM);
        // Print
        w.print();
    }
    /**
     * Show a message in the table
     */
    setMessage(message) {
        const activeHeadings = this.data.headings.filter((heading, index) => { var _a; return !((_a = this.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); });
        const colspan = activeHeadings.length || 1;
        this.wrapper.classList.add("datatable-empty");
        if (this.label) {
            this.label.innerHTML = "";
        }
        this.totalPages = 0;
        this.renderPager();
        const newVirtualDOM = structuredClone(this.virtualDOM);
        const tbody = newVirtualDOM.childNodes.find((node) => node.nodeName === "TBODY");
        tbody.childNodes = [
            {
                nodeName: "TR",
                childNodes: [
                    {
                        nodeName: "TD",
                        attributes: {
                            class: "dataTables-empty",
                            colspan
                        },
                        childNodes: [
                            {
                                nodeName: "#text",
                                data: message
                            }
                        ]
                    }
                ]
            }
        ];
        const diff = this.dd.diff(this.virtualDOM, newVirtualDOM);
        this.dd.apply(this.dom, diff);
        this.virtualDOM = newVirtualDOM;
    }
    /**
     * Add custom event listener
     */
    on(event, callback) {
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }
    /**
     * Remove custom event listener
     */
    off(event, callback) {
        if (event in this.events === false)
            return;
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    }
    /**
     * Fire custom event
     */
    emit(event, ...args) {
        if (event in this.events === false)
            return;
        for (let i = 0; i < this.events[event].length; i++) {
            this.events[event][i](...args);
        }
    }
}

/**
 * Convert CSV data to fit the format used in the table.
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
const convertCSV = function (userOptions = {}) {
    let obj = false;
    const defaults = {
        lineDelimiter: "\n",
        columnDelimiter: ",",
        removeDoubleQuotes: false
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = Object.assign(Object.assign({}, defaults), userOptions);
    // @ts-expect-error TS(2339): Property 'data' does not exist on type '{ lineDeli... Remove this comment to see the full error message
    if (options.data.length || isObject(options.data)) {
        // Import CSV
        // @ts-expect-error TS(2322): Type '{ data: never[]; }' is not assignable to typ... Remove this comment to see the full error message
        obj = {
            data: []
        };
        // Split the string into rows
        // @ts-expect-error TS(2339): Property 'data' does not exist on type '{ lineDeli... Remove this comment to see the full error message
        const rows = options.data.split(options.lineDelimiter);
        if (rows.length) {
            // @ts-expect-error TS(2339): Property 'headings' does not exist on type '{ line... Remove this comment to see the full error message
            if (options.headings) {
                // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                obj.headings = rows[0].split(options.columnDelimiter);
                if (options.removeDoubleQuotes) {
                    // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                    obj.headings = obj.headings.map((e) => e.trim().replace(/(^"|"$)/g, ""));
                }
                rows.shift();
            }
            rows.forEach((row, i) => {
                // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                obj.data[i] = [];
                // Split the rows into values
                const values = row.split(options.columnDelimiter);
                if (values.length) {
                    values.forEach((value) => {
                        if (options.removeDoubleQuotes) {
                            value = value.trim().replace(/(^"|"$)/g, "");
                        }
                        // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                        obj.data[i].push({ data: value });
                    });
                }
            });
        }
        if (obj) {
            return obj;
        }
    }
    return false;
};

/**
 * Convert JSON data to fit the format used in the table.
 * @param  {Object} userOptions User options
 * @return {Boolean}
 */
const convertJSON = function (userOptions = {}) {
    let obj = false;
    const defaults = {
        data: ''
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = Object.assign(Object.assign({}, defaults), userOptions);
    if (options.data.length || isObject(options.data)) {
        // Import CSV
        const json = isJson(options.data);
        // Valid JSON string
        if (json) {
            // @ts-expect-error TS(2322): Type '{ headings: never[]; data: never[]; }' is no... Remove this comment to see the full error message
            obj = {
                headings: [],
                data: []
            };
            // @ts-expect-error TS(2339): Property 'forEach' does not exist on type 'true'.
            json.forEach((data, i) => {
                // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                obj.data[i] = [];
                Object.entries(data).forEach(([column, value]) => {
                    // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                    if (!obj.headings.includes(column)) {
                        // @ts-expect-error TS(2339): Property 'headings' does not exist on type 'boolea... Remove this comment to see the full error message
                        obj.headings.push(column);
                    }
                    if ((value === null || value === void 0 ? void 0 : value.constructor) == Object) {
                        // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                        obj.data[i].push(value);
                    }
                    else {
                        // @ts-expect-error TS(2339): Property 'data' does not exist on type 'boolean'.
                        obj.data[i].push({ data: value });
                    }
                });
            });
        }
        else {
            console.warn("That's not valid JSON!");
        }
        if (obj) {
            return obj;
        }
    }
    return false;
};

/**
 * Export table to CSV
 */
const exportCSV = function (dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = Object.assign(Object.assign({}, defaults), userOptions);
    const columnShown = (index) => { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    let rows = [];
    const headers = dataTable.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.data);
    // Include headings
    rows[0] = headers;
    // Selection or whole table
    // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
    if (options.selection) {
        // Page number
        // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        if (!isNaN(options.selection)) {
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            rows = rows.concat(dataTable.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text || cell.data)));
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        }
        else if (Array.isArray(options.selection)) {
            // Array of page numbers
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            for (let i = 0; i < options.selection.length; i++) {
                // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text || cell.data)));
            }
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.text || cell.data)));
    }
    // Only proceed if we have data
    if (rows.length) {
        let str = "";
        rows.forEach(row => {
            row.forEach((cell) => {
                if (typeof cell === "string") {
                    cell = cell.trim();
                    cell = cell.replace(/\s{2,}/g, " ");
                    cell = cell.replace(/\n/g, "  ");
                    cell = cell.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23");
                    if (cell.includes(",")) {
                        cell = `"${cell}"`;
                    }
                }
                str += cell + options.columnDelimiter;
            });
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);
            // Apply line delimiter
            str += options.lineDelimiter;
        });
        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a");
            link.href = encodeURI(`data:text/csv;charset=utf-8,${str}`);
            // @ts-expect-error TS(2339): Property 'filename' does not exist on type '{ down... Remove this comment to see the full error message
            link.download = `${options.filename || "datatable_export"}.csv`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str;
    }
    return false;
};

/**
 * Export table to JSON
 */
const exportJSON = function (dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        replacer: null,
        space: 4
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = Object.assign(Object.assign({}, defaults), userOptions);
    const columnShown = (index) => { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    let rows = [];
    // Selection or whole table
    // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
    if (options.selection) {
        // Page number
        // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        if (!isNaN(options.selection)) {
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            rows = rows.concat(dataTable.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.type === "node" ? cell : cell.data)));
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        }
        else if (Array.isArray(options.selection)) {
            // Array of page numbers
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            for (let i = 0; i < options.selection.length; i++) {
                // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.type === "node" ? cell : cell.data)));
            }
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.type === "node" ? cell : cell.data)));
    }
    const headers = dataTable.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.data);
    // Only proceed if we have data
    if (rows.length) {
        const arr = [];
        rows.forEach((row, x) => {
            arr[x] = arr[x] || {};
            row.forEach((cell, i) => {
                arr[x][headers[i]] = cell;
            });
        });
        // Convert the array of objects to JSON string
        const str = JSON.stringify(arr, options.replacer, options.space);
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const blob = new Blob([str], {
                type: "data:application/json;charset=utf-8"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            // @ts-expect-error TS(2339): Property 'filename' does not exist on type '{ down... Remove this comment to see the full error message
            link.download = `${options.filename || "datatable_export"}.json`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        return str;
    }
    return false;
};

/**
 * Export table to SQL
 */
const exportSQL = function (dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        tableName: "myTable"
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = Object.assign(Object.assign({}, defaults), userOptions);
    const columnShown = (index) => { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    let rows = [];
    // Selection or whole table
    // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
    if (options.selection) {
        // Page number
        // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        if (!isNaN(options.selection)) {
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            rows = rows.concat(dataTable.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        }
        else if (Array.isArray(options.selection)) {
            // Array of page numbers
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            for (let i = 0; i < options.selection.length; i++) {
                // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
            }
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
    }
    const headers = dataTable.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.data);
    // Only proceed if we have data
    if (rows.length) {
        // Begin INSERT statement
        let str = `INSERT INTO \`${options.tableName}\` (`;
        // Convert table headings to column names
        headers.forEach((header) => {
            str += `\`${header}\`,`;
        });
        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);
        // Begin VALUES
        str += ") VALUES ";
        // Iterate rows and convert cell data to column values
        rows.forEach((row) => {
            str += "(";
            row.forEach((cell) => {
                if (typeof cell === "string") {
                    str += `"${cell}",`;
                }
                else {
                    str += `${cell},`;
                }
            });
            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1);
            // end VALUES
            str += "),";
        });
        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);
        // Add trailing colon
        str += ";";
        if (options.download) {
            str = `data:application/sql;charset=utf-8,${str}`;
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a");
            link.href = encodeURI(str);
            // @ts-expect-error TS(2339): Property 'filename' does not exist on type '{ down... Remove this comment to see the full error message
            link.download = `${options.filename || "datatable_export"}.sql`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str;
    }
    return false;
};

/**
 * Export table to TXT
 */
const exportTXT = function (dataTable, userOptions = {}) {
    if (!dataTable.hasHeadings && !dataTable.hasRows)
        return false;
    const defaults = {
        download: true,
        skipColumn: [],
        lineDelimiter: "\n",
        columnDelimiter: ","
    };
    // Check for the options object
    if (!isObject(userOptions)) {
        return false;
    }
    const options = Object.assign(Object.assign({}, defaults), userOptions);
    const columnShown = (index) => { var _a; return !options.skipColumn.includes(index) && !((_a = dataTable.columnSettings.columns[index]) === null || _a === void 0 ? void 0 : _a.hidden); };
    let rows = [];
    const headers = dataTable.data.headings.filter((_heading, index) => columnShown(index)).map((header) => header.data);
    // Include headings
    rows[0] = headers;
    // Selection or whole table
    // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
    if (options.selection) {
        // Page number
        // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        if (!isNaN(options.selection)) {
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            rows = rows.concat(dataTable.pages[options.selection - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
        }
        else if (Array.isArray(options.selection)) {
            // Array of page numbers
            // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
            for (let i = 0; i < options.selection.length; i++) {
                // @ts-expect-error TS(2339): Property 'selection' does not exist on type '{ dow... Remove this comment to see the full error message
                rows = rows.concat(dataTable.pages[options.selection[i] - 1].map((row) => row.row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
            }
        }
    }
    else {
        rows = rows.concat(dataTable.data.data.map((row) => row.filter((_cell, index) => columnShown(index)).map((cell) => cell.data)));
    }
    // Only proceed if we have data
    if (rows.length) {
        let str = "";
        rows.forEach(row => {
            row.forEach((cell) => {
                if (typeof cell === "string") {
                    cell = cell.trim();
                    cell = cell.replace(/\s{2,}/g, " ");
                    cell = cell.replace(/\n/g, "  ");
                    cell = cell.replace(/"/g, "\"\"");
                    //have to manually encode "#" as encodeURI leaves it as is.
                    cell = cell.replace(/#/g, "%23");
                    if (cell.includes(",")) {
                        cell = `"${cell}"`;
                    }
                }
                str += cell + options.columnDelimiter;
            });
            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);
            // Apply line delimiter
            str += options.lineDelimiter;
        });
        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);
        if (options.download) {
            str = `data:text/csv;charset=utf-8,${str}`;
        }
        // Download
        if (options.download) {
            // Create a link to trigger the download
            const link = document.createElement("a");
            link.href = encodeURI(str);
            // @ts-expect-error TS(2339): Property 'filename' does not exist on type '{ down... Remove this comment to see the full error message
            link.download = `${options.filename || "datatable_export"}.txt`;
            // Append the link
            document.body.appendChild(link);
            // Trigger the download
            link.click();
            // Remove the link
            document.body.removeChild(link);
        }
        return str;
    }
    return false;
};

/**
* Default config
* @type {Object}
*/
const defaultConfig = {
    classes: {
        row: "datatable-editor-row",
        form: "datatable-editor-form",
        item: "datatable-editor-item",
        menu: "datatable-editor-menu",
        save: "datatable-editor-save",
        block: "datatable-editor-block",
        close: "datatable-editor-close",
        inner: "datatable-editor-inner",
        input: "datatable-editor-input",
        label: "datatable-editor-label",
        modal: "datatable-editor-modal",
        action: "datatable-editor-action",
        header: "datatable-editor-header",
        wrapper: "datatable-editor-wrapper",
        editable: "datatable-editor-editable",
        container: "datatable-editor-container",
        separator: "datatable-editor-separator"
    },
    labels: {
        editCell: "Edit Cell",
        editRow: "Edit Row",
        removeRow: "Remove Row",
        reallyRemove: "Are you sure?"
    },
    // include hidden columns in the editor
    hiddenColumns: false,
    // enable the context menu
    contextMenu: true,
    // event to start editing
    clickEvent: "dblclick",
    // indexes of columns not to be edited
    excludeColumns: [],
    // set the context menu items
    menuItems: [
        {
            text: (editor) => editor.options.labels.editCell,
            action: (editor, _event) => {
                const cell = editor.event.target.closest("td");
                return editor.editCell(cell);
            }
        },
        {
            text: (editor) => editor.options.labels.editRow,
            action: (editor, _event) => {
                const row = editor.event.target.closest("tr");
                return editor.editRow(row);
            }
        },
        {
            separator: true
        },
        {
            text: (editor) => editor.options.labels.removeRow,
            action: (editor, _event) => {
                if (confirm(editor.options.labels.reallyRemove)) {
                    const row = editor.event.target.closest("tr");
                    editor.removeRow(row);
                }
            }
        }
    ]
};

// Source: https://www.freecodecamp.org/news/javascript-debounce-example/
const debounce = function (func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
};

/**
 * Main lib
 * @param {Object} dataTable Target dataTable
 * @param {Object} options User config
 */
class Editor {
    constructor(dataTable, options = {}) {
        this.dt = dataTable;
        this.options = Object.assign(Object.assign({}, defaultConfig), options);
    }
    /**
     * Init instance
     * @return {Void}
     */
    init() {
        if (this.initialized) {
            return;
        }
        this.dt.wrapper.classList.add(this.options.classes.editable);
        if (this.options.contextMenu) {
            this.container = createElement("div", {
                id: this.options.classes.container
            });
            this.wrapper = createElement("div", {
                class: this.options.classes.wrapper
            });
            this.menu = createElement("ul", {
                class: this.options.classes.menu
            });
            if (this.options.menuItems && this.options.menuItems.length) {
                this.options.menuItems.forEach((item) => {
                    const li = createElement("li", {
                        class: item.separator ? this.options.classes.separator : this.options.classes.item
                    });
                    if (!item.separator) {
                        const a = createElement("a", {
                            class: this.options.classes.action,
                            href: item.url || "#",
                            html: typeof item.text === "function" ? item.text(this) : item.text
                        });
                        li.appendChild(a);
                        if (item.action && typeof item.action === "function") {
                            a.addEventListener("click", (event) => {
                                event.preventDefault();
                                item.action(this, event);
                            });
                        }
                    }
                    this.menu.appendChild(li);
                });
            }
            this.wrapper.appendChild(this.menu);
            this.container.appendChild(this.wrapper);
            this.update();
        }
        this.data = {};
        this.closed = true;
        this.editing = false;
        this.editingRow = false;
        this.editingCell = false;
        this.bindEvents();
        setTimeout(() => {
            this.initialized = true;
            this.dt.emit("editable.init");
        }, 10);
    }
    /**
     * Bind events to DOM
     * @return {Void}
     */
    bindEvents() {
        this.events = {
            context: this.context.bind(this),
            update: this.update.bind(this),
            dismiss: this.dismiss.bind(this),
            keydown: this.keydown.bind(this),
            click: this.click.bind(this)
        };
        // listen for click / double-click
        this.dt.dom.addEventListener(this.options.clickEvent, this.events.click);
        // listen for click anywhere but the menu
        document.addEventListener("click", this.events.dismiss);
        // listen for right-click
        document.addEventListener("keydown", this.events.keydown);
        if (this.options.contextMenu) {
            // listen for right-click
            this.dt.dom.addEventListener("contextmenu", this.events.context);
            // reset
            this.events.reset = debounce(this.events.update, 50);
            window.addEventListener("resize", this.events.reset);
            window.addEventListener("scroll", this.events.reset);
        }
    }
    /**
     * contextmenu listener
     * @param  {Object} event Event
     * @return {Void}
     */
    context(event) {
        this.event = event;
        const cell = event.target.closest("tbody td");
        if (this.options.contextMenu && !this.disabled && cell) {
            event.preventDefault();
            // get the mouse position
            let x = event.pageX;
            let y = event.pageY;
            // check if we're near the right edge of window
            if (x > this.limits.x) {
                x -= this.rect.width;
            }
            // check if we're near the bottom edge of window
            if (y > this.limits.y) {
                y -= this.rect.height;
            }
            this.wrapper.style.top = `${y}px`;
            this.wrapper.style.left = `${x}px`;
            this.openMenu();
            this.update();
        }
    }
    /**
     * dblclick listener
     * @param  {Object} event Event
     * @return {Void}
     */
    click(event) {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell(this.data.input.value);
        }
        else if (!this.editing) {
            const cell = event.target.closest("tbody td");
            if (cell) {
                this.editCell(cell);
                event.preventDefault();
            }
        }
    }
    /**
     * keydown listener
     * @param  {Object} event Event
     * @return {Void}
     */
    keydown(event) {
        if (this.modal) {
            if (event.key === "Escape") { // close button
                this.closeModal();
            }
            else if (event.key === "Enter") { // save button
                // Save
                this.saveRow(this.data.inputs.map((input) => input.value.trim()), this.data.row);
            }
        }
        else if (this.editing && this.data) {
            if (event.key === "Enter") {
                // Enter key saves
                if (this.editingCell) {
                    this.saveCell(this.data.input.value);
                }
                else if (this.editingRow) {
                    this.saveRow(this.data.inputs.map((input) => input.value.trim()), this.data.row);
                }
            }
            else if (event.key === "Escape") {
                // Escape key reverts
                this.saveCell(this.data.content);
            }
        }
    }
    /**
     * Edit cell
     * @param  {Object} td    The HTMLTableCellElement
     * @return {Void}
     */
    editCell(td) {
        let columnIndex = 0;
        let cellIndex = 0;
        while (cellIndex < td.cellIndex) {
            const columnSettings = this.dt.columnSettings.columns[columnIndex] || {};
            if (!columnSettings.hidden) {
                cellIndex += 1;
            }
            columnIndex += 1;
        }
        if (this.options.excludeColumns.includes(columnIndex)) {
            this.closeMenu();
            return;
        }
        const rowIndex = parseInt(td.parentNode.dataset.index, 10);
        const row = this.dt.data.data[rowIndex];
        const cell = row[columnIndex];
        this.data = {
            cell,
            rowIndex,
            columnIndex,
            content: cell.text || String(cell.data)
        };
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            "<h4>Editing cell</h4>",
            `<button class='${this.options.classes.close}' type='button' data-editor-close>×</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<label class='${this.options.classes.label}'>${escapeText(this.dt.data.headings[columnIndex].data)}</label>`,
            `<input class='${this.options.classes.input}' value='${escapeText(cell.text || String(cell.data) || "")}' type='text'>`,
            "</div>",
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>Save</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        const modal = createElement("div", {
            class: this.options.classes.modal,
            html: template
        });
        this.modal = modal;
        this.openModal();
        this.editing = true;
        this.editingCell = true;
        this.data.input = modal.querySelector("input[type=text]");
        this.data.input.focus();
        this.data.input.selectionStart = this.data.input.selectionEnd = this.data.input.value.length;
        // Close / save
        modal.addEventListener("click", (event) => {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                this.closeModal();
            }
            else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveCell(this.data.input.value);
            }
        });
        this.closeMenu();
    }
    /**
     * Save edited cell
     * @param  {Object} row    The HTMLTableCellElement
     * @param  {String} value   Cell content
     * @return {Void}
     */
    saveCell(value) {
        const oldData = this.data.content;
        // Set the cell content
        this.dt.data.data[this.data.rowIndex][this.data.columnIndex] = { data: value.trim() };
        this.closeModal();
        this.dt.fixColumns();
        this.dt.emit("editable.save.cell", value, oldData, this.data.rowIndex, this.data.columnIndex);
        this.data = {};
    }
    /**
     * Edit row
     * @param  {Object} row    The HTMLTableRowElement
     * @return {Void}
     */
    editRow(tr) {
        var _a;
        if (!tr || tr.nodeName !== "TR" || this.editing)
            return;
        const dataIndex = parseInt(tr.dataset.index, 10);
        const row = this.dt.data.data[dataIndex];
        const template = [
            `<div class='${this.options.classes.inner}'>`,
            `<div class='${this.options.classes.header}'>`,
            "<h4>Editing row</h4>",
            `<button class='${this.options.classes.close}' type='button' data-editor-close>×</button>`,
            " </div>",
            `<div class='${this.options.classes.block}'>`,
            `<form class='${this.options.classes.form}'>`,
            `<div class='${this.options.classes.row}'>`,
            `<button class='${this.options.classes.save}' type='button' data-editor-save>Save</button>`,
            "</div>",
            "</form>",
            "</div>",
            "</div>"
        ].join("");
        const modal = createElement("div", {
            class: this.options.classes.modal,
            html: template
        });
        const inner = modal.firstElementChild;
        if (!inner) {
            return;
        }
        const form = (_a = inner.lastElementChild) === null || _a === void 0 ? void 0 : _a.firstElementChild;
        if (!form) {
            return;
        }
        // Add the inputs for each cell
        row.forEach((cell, i) => {
            const columnSettings = this.dt.columnSettings.columns[i] || {};
            if ((!columnSettings.hidden || (columnSettings.hidden && this.options.hiddenColumns)) && !this.options.excludeColumns.includes(i)) {
                form.insertBefore(createElement("div", {
                    class: this.options.classes.row,
                    html: [
                        `<div class='${this.options.classes.row}'>`,
                        `<label class='${this.options.classes.label}'>${escapeText(this.dt.data.headings[i].data)}</label>`,
                        `<input class='${this.options.classes.input}' value='${escapeText(cell.text || String(cell.data) || "")}' type='text'>`,
                        "</div>"
                    ].join("")
                }), form.lastElementChild);
            }
        });
        this.modal = modal;
        this.openModal();
        // Grab the inputs
        const inputs = Array.from(form.querySelectorAll('input[type=text]'));
        // Remove save button
        inputs.pop();
        this.data = {
            row,
            inputs,
            dataIndex
        };
        this.editing = true;
        this.editingRow = true;
        // Close / save
        modal.addEventListener("click", (event) => {
            if (event.target.hasAttribute("data-editor-close")) { // close button
                this.closeModal();
            }
            else if (event.target.hasAttribute("data-editor-save")) { // save button
                // Save
                this.saveRow(this.data.inputs.map((input) => input.value.trim()), this.data.row);
            }
        });
        this.closeMenu();
    }
    /**
     * Save edited row
     * @param  {Object} row    The HTMLTableRowElement
     * @param  {Array} data   Cell data
     * @return {Void}
     */
    saveRow(data, row) {
        // Store the old data for the emitter
        const oldData = row.map((cell) => cell.text || String(cell.data));
        this.dt.rows.updateRow(this.data.dataIndex, data);
        this.data = {};
        this.closeModal();
        this.dt.emit("editable.save.row", data, oldData, row);
    }
    /**
     * Open the row editor modal
     * @return {Void}
     */
    openModal() {
        if (!this.editing && this.modal) {
            document.body.appendChild(this.modal);
        }
    }
    /**
     * Close the row editor modal
     * @return {Void}
     */
    closeModal() {
        if (this.editing && this.modal) {
            document.body.removeChild(this.modal);
            this.modal = this.editing = this.editingRow = this.editingCell = false;
        }
    }
    /**
     * Remove a row
     * @param  {Object} tr The HTMLTableRowElement
     * @return {Void}
     */
    removeRow(tr) {
        if (!tr || tr.nodeName !== "TR" || this.editing)
            return;
        const index = parseInt(tr.dataset.index, 10);
        this.dt.rows.remove(index);
        this.closeMenu();
    }
    /**
     * Update context menu position
     * @return {Void}
     */
    update() {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        this.rect = this.wrapper.getBoundingClientRect();
        this.limits = {
            x: window.innerWidth + scrollX - this.rect.width,
            y: window.innerHeight + scrollY - this.rect.height
        };
    }
    /**
     * Dismiss the context menu
     * @param  {Object} event Event
     * @return {Void}
     */
    dismiss(event) {
        let valid = true;
        if (this.options.contextMenu) {
            valid = !this.wrapper.contains(event.target);
            if (this.editing) {
                valid = !this.wrapper.contains(event.target) && event.target !== this.data.input;
            }
        }
        if (valid) {
            if (this.editingCell) {
                // Revert
                this.saveCell(this.data.content);
            }
            this.closeMenu();
        }
    }
    /**
     * Open the context menu
     * @return {Void}
     */
    openMenu() {
        if (this.editing && this.data && this.editingCell) {
            this.saveCell(this.data.input.value);
        }
        if (this.options.contextMenu) {
            document.body.appendChild(this.container);
            this.closed = false;
            this.dt.emit("editable.context.open");
        }
    }
    /**
     * Close the context menu
     * @return {Void}
     */
    closeMenu() {
        if (this.options.contextMenu && !this.closed) {
            this.closed = true;
            document.body.removeChild(this.container);
            this.dt.emit("editable.context.close");
        }
    }
    /**
     * Destroy the instance
     * @return {Void}
     */
    destroy() {
        this.dt.dom.removeEventListener(this.options.clickEvent, this.events.click);
        this.dt.dom.removeEventListener("contextmenu", this.events.context);
        document.removeEventListener("click", this.events.dismiss);
        document.removeEventListener("keydown", this.events.keydown);
        window.removeEventListener("resize", this.events.reset);
        window.removeEventListener("scroll", this.events.reset);
        if (document.body.contains(this.container)) {
            document.body.removeChild(this.container);
        }
        this.initialized = false;
    }
}
const makeEditable = function (dataTable, options = {}) {
    const editor = new Editor(dataTable, options);
    if (dataTable.initialized) {
        editor.init();
    }
    else {
        dataTable.on("datatable.init", () => editor.init());
    }
    return editor;
};

export { DataTable, convertCSV, convertJSON, createElement, exportCSV, exportJSON, exportSQL, exportTXT, isJson, isObject, makeEditable };
//# sourceMappingURL=module.js.map
