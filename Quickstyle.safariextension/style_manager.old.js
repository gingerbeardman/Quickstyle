String.prototype.formatForEditing = function () {
	var text = this;
	if (text == '') return text;
	text = text.replace(/[{}]/g,'');
	if (text.charAt(text.length - 1) !== ';') text += ';';
	text = text.replace(/;\s*/g, ';\n');
	return text;
};
String.prototype.formatForSaving  = function () {
	var text = this;
	text = text.replace(/\s+/g, ' ');
	if (text.charAt(text.length-1) === ' ') text = text.slice(0, text.length-1);
	return text;
};

function RuleSet(ruleArray) {
	var rs = ruleArray || [];
	rs.getRuleIndex = function (selector) {
		for (var i = 0; i < this.length; i++)
			if (this[i].s == selector) return i;
		return -1;
	};
	rs.getRule = function (selector) {
		return this.filter(function (rule) {
			return rule.s == selector;
		})[0];
	};
	rs.getDeclarations = function (selector) {
		var mr = this.filter(function (rule) {
			return rule.s == selector;
		})[0];
		return mr ? mr.d : '';
	};
	rs.setRule = function (selector, declarations) {
		var ri = this.getRuleIndex(selector);
		if (ri > -1) {
			this[ri].d = declarations;
		} else {
			this.push({s:selector, d:declarations});
		}
		return this[ri];
	}
	rs.moveRule = function (index, dir) {
		var movee = this.splice(index, 1)[0];
		this.splice(index + dir, 0, movee);
	};
	rs.deleteRule = function (index) {
		this.splice(index, 1);
	}
	rs.replaceSelector = function (oldS, newS) {
		var ri = this.getRuleIndex(oldS);
		this[ri].s0 = this[ri].s;
		this[ri].s = newS;
	};
	rs.ruleIsClean = function (index) {
		return (this[index].s0 === undefined && this[index].d0 === undefined);
	};
	return rs;
}

function createNewRule(selector, declarations) {
	myRules.push({
		s  : selector, d  : declarations,
		s0 : selector, d0 : declarations,
		dirty: true, neu: true
	});
}
function defineBlockArea() {
	var ba = document.getElementById('blockBox');
	ba.addEventListener('focus', handleControlFocus, false);
	ba.addEventListener('blur', handleControlBlur, false);
	ba.addEventListener('focus', function (e) {
		this.rule = myRules[selectorMenu.selectedIndex] || {};
		this.selectionStart = this.rule.bacp || this.value.length;
		this.oldValue = this.value;
	}, false);
	ba.addEventListener('blur', function (e) {
		if (myRules[selectorMenu.selectedIndex] === undefined)
			return;
		myRules[selectorMenu.selectedIndex].bacp = e.target.selectionStart;
		if (this.value !== this.oldValue) {
			if (this.rule.d0 === undefined) this.rule.d0 = this.rule.d;
			this.rule.d = this.value;
			markRuleDirty();
		}
	}, false);
	ba.onkeydown = function (e) {
		switch (e.which) {
			case 8: case 127: {		// backspace, delete
				e.stopPropagation();
				saveButton.disabled = false;
				revertButton.disabled = false;
				break;
			}
			case 9: {	// tab
				e.preventDefault();
				selectorMenu.focus();
				break;
			}
			case 13: {	// return
				if (e.metaKey || e.altKey) {
					saveButton.click();
					selectorMenu.focus();
				} break;
			}
			case 18: {	// alt
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					ba.onkeyup = function () {
						messageGlobalWindow('CancelRulePreview');
						ba.onkeyup = null;
					};
					previewCurrentRule();
				} break;
			}
			case 27: {	// escape
				e.stopPropagation();
				e.preventDefault();
				e.target.blur();
				break;
			}
		}
	};
	ba.onkeypress = function (e) {
		if (e.which === 99 && e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey)		// Cmd-C
			return;
		if (e.which === 115 && e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey) {	// Cmd-S
			saveCurrentRule();
			return false;
		}
		if (!this.rule.neu) {
			saveButton.disabled = false;
			revertButton.disabled = false;
		}
	};
	ba.populate = function (text) {
		this.value = text;
		this.oldValue = text;
		this.rule = myRules[selectorMenu.selectedIndex];
		saveButton.disabled = (this.rule) ? !this.rule.neu : true;
		revertButton.disabled = true;
	}
	ba.selectAll = function () {
		window.getSelection().removeAllRanges();
		this.selectionStart = 0;
		this.selectionEnd = this.value.length;
	};
	return ba;
}
function defineLeftDiv() {
	var ld = document.getElementById('leftDiv');
	ld.setWidth = function (width) {
		this.style.width = width + 'px';
	};
	return ld;
}
function defineLrDivider() {
	var lrd = document.getElementById('lrDivider');
	lrd.swipe = function (e) {
		if (e.x >= 128 && e.x < document.body.offsetWidth - 128) {
			leftDiv.setWidth(e.x - 6);
			rightDiv.setWidth();
		}
	};
	lrd.stopSwipe = function(e){
		messageGlobalWindow('SaveLeftDivWidth', leftDiv.offsetWidth);
		document.removeEventListener('mousemove', lrd.swipe, false);
		document.removeEventListener('mouseup', lrd.stopSwipe, false);
	};
	lrd.onmousedown = function(e){
		document.addEventListener('mousemove', lrd.swipe, false);
		document.addEventListener('mouseup', lrd.stopSwipe, false);
		return false;
	};
	return lrd;
}
function defineRightDiv() {
	var rd = document.getElementById('rightDiv');
	rd.setWidth = function () {
		this.style.width = document.body.offsetWidth - leftDiv.offsetWidth - 6 + 'px';
		blockArea.style.width = this.offsetWidth - 4 + 'px';
	};
	return rd;
}
function defineSelectorBar() {
	function LinkSpan(chainlink) {
		var ls = document.createElement('span');
		ls.innerHTML = chainlink;
		if (/[> ~]/.test(chainlink)) {
			ls.className = 'sc';
		} else {
			ls.className = 'sa';
			ls.onmouseover = function (e) {
				e.target.className += ' highlight';
				highlightMatchesOnPage(sb.stringValue(e.target));
			};
			ls.onmouseout  = function (e) {
				e.target.className = e.target.className.replace(' highlight','');
				removeHighlightsOnPage();
			};
		}
		return ls;
	}
	function onFocus(e) {
		e.target.scrollLeftBtn.style.display = 'none';
		e.target.scrollRightBtn.style.display = 'none';
		e.target.className = 'editable';
		e.target.innerHTML = e.target.textContent;
		window.getSelection().removeAllRanges();
		var r = document.createRange();
		try {
			r.setStartBefore(e.target.firstChild);
			r.setEndAfter(e.target.lastChild);
		} catch(e) {}
		window.getSelection().addRange(r);
		// sb.onmousedown = null;
	}
	function onMouseUp(e) {
		var r = window.getSelection().getRangeAt(0);
		var rsp = r.startContainer.parentElement;
		var rso = r.startOffset;
		var offset = 0;
		for (var i = 0; i < sb.childNodes.length; i++) {
			var thisNode = sb.childNodes[i];
			if (thisNode == rsp) {
				offset += rso;
				break;
			} else {
				offset += thisNode.textContent.length;
			}
		}
		sb.innerHTML = sb.textContent;
		window.getSelection().removeAllRanges();
		var nr = document.createRange();
		nr.setStart(sb.childNodes[0], offset);
		window.getSelection().addRange(nr);
		sb.onfocus = onFocus;
		sb.onmouseup = null;
	};
	var sb = document.getElementById('selectorBar');
	sb.scrollLeftBtn = document.getElementById('sbScrollLeftBtn');
	sb.scrollRightBtn = document.getElementById('sbScrollRightBtn');
	sb.addEventListener('focus', handleControlFocus, false);
	sb.addEventListener('blur', handleControlBlur, false);
	sb.addEventListener('focus', onFocus, false);
	sb.addEventListener('blur', function (e) {
		e.target.className = '';
		var tc = e.target.textContent.replace(/\s+/g, ' ');
		e.target.populate(tc);
		e.target.scrollLeftBtn.className = 'sbScrollBtn';
		e.target.scrollLeftBtn.style.display = '';
		e.target.scrollRightBtn.style.display = '';
		if (selectorMenu.options.length === 0)
			return;
		var oldS = selectorMenu.getSelectedSelector();
		if (tc !== oldS) {
			var rule = myRules[selectorMenu.selectedIndex];
			if (!rule.s0) rule.s0 = rule.s;
			rule.s = tc;
			markRuleDirty();
		}
	}, false);
	sb.onkeydown = function (e) {
		switch (e.which) {
			case 8: case 127: {	// backspace, delete
				e.stopPropagation();
				saveButton.disabled = false;
				revertButton.disabled = false;
				break;
			}
			case 9: {	// tab
				e.preventDefault();
				blockArea.focus();
				break;
			}
			case 13: {	// enter
				e.preventDefault();
				var tc = e.target.textContent.replace(/\s+/g, ' ');
				function makeNewRule() {
					createNewRule(tc, blockArea.value);
					selectorMenu.populate(tc);
					blockArea.focus();
					blockArea.selectAll();
					saveButton.disabled = false;
					revertButton.disabled = true;
				}
				if (e.metaKey || e.altKey) {
					if (tc !== selectorMenu.getSelectedSelector()) {
						makeNewRule();
					} else blockArea.focus();
				}
				else {
					if (selectorMenu.options.length === 0)
						makeNewRule();
					else blockArea.focus();
				} break;
			}
			case 18: {	// alt
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					sb.onkeyup = function (e) {
						sb.onkeyup = null;
						messageGlobalWindow('CancelRulePreview');
					};
					previewCurrentRule();
				}
				break;
			}
			case 27: {	// escape
				e.stopPropagation();
				e.preventDefault();
				sb.blur();
				break;
			}
		}
	};
	sb.scrollLeftward = function (e) {
		if (sb.scrollLeft > 0) {
			sb.scrollLeftBtn.className = 'sbScrollBtn enabled';
			sb.scrollRightBtn.className = 'sbScrollBtn enabled';
			sb.scrollLeft = sb.scrollLeft - 5;
			sb.scrollLeftTimer = window.setTimeout(sb.scrollLeftward, 10);
		} else {
			sb.scrollLeftBtn.className = 'sbScrollBtn';
		}
	};
	sb.scrollRightward = function (e) {
		var scrollOffset = sb.scrollWidth - sb.offsetWidth;
		if (sb.scrollLeft < scrollOffset) {
			sb.scrollRightBtn.className = 'sbScrollBtn enabled';
			sb.scrollLeftBtn.className = 'sbScrollBtn enabled';
			sb.scrollLeft = sb.scrollLeft + 5;
			sb.scrollRightTimer = window.setTimeout(sb.scrollRightward, 10);
		} else {
			sb.scrollRightBtn.className = 'sbScrollBtn';
		}
	};
	sb.scrollStop = function (e) {
		try { window.clearTimeout(sb.scrollLeftTimer) }  catch(err) {};
		try { window.clearTimeout(sb.scrollRightTimer) } catch(err) {};
	};
	sb.stringToChain = function (selector) {
		var ts = selector;
		ts = ts.replace(/\s+/g,' ');
		ts = ts.replace(/\s*>\s*/g, '>');
		ts = ts.replace(/\s*~\s*/g, '~');
		ts = ts.replace(/\s*\+\s*/g, '+');
		ts = ts.replace(/\s*,\s*/g, ',');
		ts = ts.replace(/([> ~\+,])/g, '&$1&');
		ts = ts.replace(/([>~\+])/g, ' $1 ');
		ts = ts.replace(/,/g, ', ');
		return ts.split('&');
	};
	sb.stringValue = function (lastLink) {
		var string = '';
		var spans = this.getElementsByTagName('span');
		for (var i = 0; i < spans.length; i++) {
			string += spans[i].textContent;
			if (lastLink && spans[i] == lastLink) {
				break;
			}
		}
		string = string.replace(/\s+/g, ' ');
		return string;
	};
	sb.populate = function (selector) {
		var chain = this.stringToChain(selector);
		this.innerHTML = '';
		chain.forEach(function (link) {
			sb.appendChild(new LinkSpan(link));
		});
		if (this.scrollWidth > this.offsetWidth) {
			this.scrollLeftBtn.onmouseover = sb.scrollLeftward;
			this.scrollLeftBtn.onmouseout = sb.scrollStop;
			this.scrollRightBtn.onmouseover = sb.scrollRightward;
			this.scrollRightBtn.onmouseout = sb.scrollStop;
			this.scrollRightBtn.className = 'sbScrollBtn enabled';
		} else {
			this.scrollLeftBtn.onmouseover = null;
			this.scrollLeftBtn.onmouseout = null;
			this.scrollLeftBtn.className = 'sbScrollBtn';
			this.scrollRightBtn.onmouseover = null;
			this.scrollRightBtn.onmouseout = null;
			this.scrollRightBtn.className = 'sbScrollBtn';
		}
	};
	return sb;
}
function defineSelectorMenu() {
	var sm = document.getElementById('selectorMenu');
	sm.onfocus = handleControlFocus;
	sm.onblur = handleControlBlur;
	sm.onchange = function (e) {
		if (this.options.length > 0) {
			var selectedCount = 0;
			for (var i = 0; i < this.options.length; i++) {
				if (this.options[i].selected) selectedCount++;
			}
			if (selectedCount === 1) {
				var selector = this.options[this.selectedIndex].text;
				selectorBar.populate(selector);
				var ruleIsClean = !myRules[this.selectedIndex].dirty;
				var ruleIsNew = myRules[this.selectedIndex].neu;
				var declarations = myRules.getDeclarations(selector);
				if (ruleIsClean) declarations = declarations.formatForEditing();
				blockArea.populate(declarations);
				saveButton.disabled = ruleIsClean;
				revertButton.disabled = ruleIsClean || ruleIsNew;
			} else {
				selectorBar.populate('');
				blockArea.populate('');
			}
		}
	};
	sm.onkeydown = function (e) {
		switch (e.which) {
			case 8: case 127: {	// backspace, delete
				e.stopPropagation();
				e.preventDefault();
				var selectedIndexes = [];
				for (var i = 0; i < selectorMenu.options.length; i++) {
					if (selectorMenu.options[i].selected) {
						selectedIndexes.push(selectorMenu.options[i].index);
					}
				}
				sm.removeOptions(selectedIndexes);
				break;
			}
			case 18: {	// alt
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					sm.onkeyup = function (e) {
						sm.onkeyup = null;
						messageGlobalWindow('CancelRulePreview');
					};
					previewCurrentRule();
				}
				break;
			}
			case 27: {	// escape
				e.stopPropagation();
				e.preventDefault();
				e.target.blur();
				break;
			}
			case 38: {	// up
				if (e.altKey || e.metaKey) sm.moveOption(-1);
				break;
			}
			case 40: {	// down
				if (e.altKey || e.metaKey) sm.moveOption(1);
				break;
			}
		}
	};
	sm.addOption = function (selector, makeSelected, isDirty, beforeRow) {
		var row = new Option(selector);
		row.title = selector;
		row.selected = makeSelected;
		row.className += isDirty ? ' dirty' : '';
		row.onmouseover = function (e) {
			e.target.className += ' highlighted';
			highlightMatchesOnPage(e.target.text);
		};
		row.onmouseout = function (e) {
			e.target.className = e.target.className.replace(' highlighted','');
			removeHighlightsOnPage();
		};
		this.add(row, beforeRow || null);
	};
	sm.populate = function (initialSelector) {
		sm.innerHTML = '';
		myRules.forEach(function (rule, index) {
			sm.addOption(rule.s, function () {
				if (initialSelector)
					return rule.s == initialSelector;
				else return index == 0;
			}(), (rule.s0 !== undefined));
		});
	}
	sm.getSelectedSelector = function () {
		return (this.options[this.selectedIndex]) ? this.options[this.selectedIndex].text : '';
	};
	sm.selectOneOption = function (text) {
		for (var i = 0; i < this.options.length; i++) {
			this.options[i].selected = (this.options[i].text == text);
		};
	};
	sm.removeOptions = function (indexes) {
		var firstIndex = indexes[0];
		for (var i = indexes.length - 1; i >= 0; i--) {
			myRules.deleteRule(indexes[i]);
			this.remove(indexes[i]);
		};
		this.selectedIndex = (firstIndex == 0) ? 0 : firstIndex - 1;
		this.onchange();
		var message = { hostname: hostname, rules: myRules };
		messageGlobalWindow('SaveRulesAndSendToPage', message);
	};
	sm.moveOption = function (dir) {
		var selectedCount = 0;
		for (var i = 0; i < this.options.length; i++) {
			if (this.options[i].selected) selectedCount++;
		}
		if (selectedCount == 1) {
			var index = this.selectedIndex;
			var ss = this.getSelectedSelector();
			if (dir == -1 && index == 0) return false;
			if (dir ==  1 && index == this.options.length - 1) return false;
			myRules.moveRule(index, dir);
			saveNewRuleOrder();
			this.populate(ss);
		}
	};
	sm.markOptionDirty = function (index) {
		var oi = (index == undefined) ? this.selectedIndex : index;
		if (this.options[oi]) {
			this.options[oi].text = myRules[this.selectedIndex].s;
			this.options[oi].title = myRules[this.selectedIndex].s;
			this.options[oi].className += ' dirty';
		}
	};
	sm.markOptionClean = function (index) {
		var oi = (index == undefined) ? this.selectedIndex : index;
		this.options[oi].className = this.options[oi].className.replace(/ dirty/g,'');
	};
	return sm;
}
function finishInit(data) {
	// data : {hostname, rules, selector, stats}
	hostname = data.hostname;
	leftDiv.setWidth(data.stats.ldw);
	if (popover) {
		activeTab = safari.application.activeBrowserWindow.activeTab;
		setTimeout(resizeToFitFrame, 100);
	} else
		resizeToFitFrame();
	myRules = new RuleSet(data.rules);
	initialSelector = data.selector;
	if (initialSelector) {
		if (myRules.getRuleIndex(initialSelector) == -1)
			createNewRule(initialSelector,'');
	} else if (myRules.length == 0)
		createNewRule('','');
	initialSelector = data.selector || myRules[0].s;
	selectorMenu.populate(initialSelector);
	selectorBar.populate(initialSelector);
	blockArea.populate(myRules.getDeclarations(initialSelector).formatForEditing());
	if (data.selector) {
		blockArea.focus();
	} else {
		if (myRules[0].s == '') {
			selectorBar.focus();
		}
		else {
			selectorMenu.focus();
		}
	}
}
function handleControlBlur(e) {
	if (popover) {
		this.style.outline = '';
	}
}
function handleControlFocus(e) {
	if (popover) {
		this.style.outline = 'auto -webkit-focus-ring-color';
	}
}
function handleMessage(msg) {
	switch (msg.name) {
		case 'ReceiveStyleBoxData': {
			finishInit(msg.message);
			break;
		}
		case 'ResizeYourself': {
			resizeToFitFrame();
			break;
		}
	}
}
function handleResizeBarMouseDown(e) {
	if (e.button === 0) {
		e.stopPropagation();
		rbClickY = e.offsetY;
		event.target.style.height = '100%';
		document.addEventListener('mousemove', popoverFreeResize, false);
		document.addEventListener('mouseup', popoverStopResize, false);
		return false;
	}
}
function highlightMatchesOnPage(selector) {
	messageGlobalWindow('HighlightSelectorMatches', selector);
}
function initialize() {
	popover = !!(safari.self.identifier);
	iframed = !popover;
	hostname = '';
	myRules = new RuleSet();
	initialSelector = '';
	selectorMenu = defineSelectorMenu();
	selectorBar = defineSelectorBar();
	blockArea = defineBlockArea();
	leftDiv = defineLeftDiv();
	rightDiv = defineRightDiv();
	lrDivider = defineLrDivider();
	saveButton = document.getElementById('saveButton');
	revertButton = document.getElementById('revertButton');
	document.onkeydown = function (e) {
		if (e.target == document.body) {
			switch (e.which) {
				case 8: {	// backspace
					e.stopPropagation();
					e.preventDefault();
					break;
				}
				case 27: {	// escape
					document.onkeydown = null;
					if (iframed) {
						messageGlobalWindow('RemoveStyleBox');
					}
					break;
				}
			}
		}
	};
	if (popover) {
		gw = safari.extension.globalPage.contentWindow;
		console = gw.console;
		document.body.className = 'popover';
		resizeBar = document.getElementById('resizeBar');
		resizeBar.onmousedown = handleResizeBarMouseDown;
	} else {
		document.body.className = 'iframed';
		safari.self.addEventListener('message', handleMessage, false);
		safari.self.tab.dispatchMessage('PassStyleBoxData');
	}
}
function markRuleClean(index) {
	if (index == undefined) index = selectorMenu.selectedIndex;
	var rule = myRules[index];
	rule.dirty = false;
	delete rule.s0;
	delete rule.d0;
	selectorMenu.markOptionClean(index);
	blockArea.oldValue = blockArea.value;
	saveButton.disabled = true;
	revertButton.disabled = true;
}
function markRuleDirty(index) {
	if (index == undefined) index = selectorMenu.selectedIndex;
	if(!myRules[index].dirty) {
		console.log('Marking dirty:', selectorMenu.getSelectedSelector());
		myRules[index].dirty = true;
	}
	selectorMenu.markOptionDirty(index);
	saveButton.disabled = false;
	revertButton.disabled = false;
}
function messageGlobalWindow(name, message) {
	if (popover)
		gw.handleMessage({ name : name, message : message, target : activeTab });
	else
		safari.self.tab.dispatchMessage(name, message);
}
function popoverFreeResize(e) {
	var newHeight = e.y - rbClickY;
	if (newHeight >= 200) {
		safari.self.height = newHeight;
	}
}
function popoverStopResize(e) {
	if (e.button === 0) {
		event.target.style.height = '';
		resizeToFitFrame();
		safari.extension.settings.popoverHeight = safari.self.height;
		document.removeEventListener('mousemove', popoverFreeResize, false);
		document.removeEventListener('mouseup', popoverStopResize, false);
	}
}
function previewCurrentRule() {
	var rule = {
		s: selectorBar.textContent, 
		d: blockArea.value.formatForSaving()
	};
	messageGlobalWindow('PreviewRule', rule);
}
function removeHighlightsOnPage() {
	messageGlobalWindow('ClearAllHighlights');
}
function resizeToFitFrame() {
	document.body.style.width = window.innerWidth - 8 + 'px';
	document.body.style.height = window.innerHeight - 8 + 'px';
	rightDiv.setWidth();
	var mainHeight = document.body.offsetHeight;
	leftDiv.style.height = mainHeight + 'px';
	lrDivider.style.height = mainHeight + 'px';
	rightDiv.style.height = mainHeight + 'px';
	blockArea.style.height = mainHeight - 30 + 'px';
}
function revertCurrentRule() {
	var index = selectorMenu.selectedIndex;
	var rule = myRules[index];
	rule.s = rule.s0 || rule.s;
	rule.d = rule.d0 || rule.d;
	selectorBar.populate(rule.s);
	blockArea.populate(rule.d.formatForEditing());
	markRuleClean(index);
	selectorMenu.populate(rule.s);
	selectorMenu.onchange();
}
function saveCurrentRule() {
	var selector = selectorBar.textContent;
	myRules.setRule(selector, blockArea.value.formatForSaving());
	markRuleClean(selectorMenu.selectedIndex);
	var cleanRules = [];
	myRules.forEach(function (rule) {
		if (!(rule.neu && rule.dirty)) {
			cleanRules.push({
				s: (rule.dirty) ? rule.s0 : rule.s,
				d: (rule.dirty) ? rule.d0 : rule.d
			});
		}
	});
	var message = { hostname: hostname, rules: cleanRules };
	messageGlobalWindow('SaveRulesAndSendToPage', message);
	myRules[selectorMenu.selectedIndex].neu = false;
}
function saveNewRuleOrder() {
	var cleanOldRules = [];
	myRules.forEach(function (rule) {
		if (!rule.neu) {
			cleanOldRules.push({
				s: (rule.dirty) ? rule.s0 : rule.s,
				d: (rule.dirty) ? rule.d0 : rule.d
			});
		}
	});
	var message = { hostname: hostname, rules: cleanOldRules };
	messageGlobalWindow('SaveRulesAndSendToPage', message);
}

window.onload = initialize;