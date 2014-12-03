String.prototype.formatForEditing = function () {
	if (this == '')
		return this;
	var text = this.replace(/[\{\}]/g,'');
	if (text.charAt(text.length - 1) !== ';')
		text += ';';
	text = text.replace(/;\s*/g, ';\n');
	return text;
};
String.prototype.formatForSaving  = function () {
	return this.replace(/\s+/g, ' ').trim();
};

function LinkSpan(link) {
	var ls = document.createElement('span');
	ls.innerHTML = link;
	if (/[>~+, ]/.test(link)) {
		ls.className = 'sc';
	} else {
		ls.className = 'sa';
		ls.onmouseover = function (e) {
			e.target.className += ' highlight';
			highlightMatchesOnPage(selectorBar.stringValue(e.target));
		};
		ls.onmouseout  = function (e) {
			e.target.className = e.target.className.replace(' highlight','');
			removeHighlightsOnPage();
		};
	}
	return ls;
}
function Rule(selector, declarations, s0, d0, dirty, isNew) {
	this.s  = selector;
	this.d  = declarations;
	this.s0 = s0 || undefined;
	this.d0 = d0 || undefined;
	this.dirty = dirty || false;
	this.isNew = isNew || false;
}
function RuleSet(rules) {
	rules = rules || [];
	var makeRuleObjFromRule = function (rule) {
		return new Rule(rule.s, rule.d);
	};
	var rs = rules.map(makeRuleObjFromRule);
	rs.addNewRule = function (selector, declarations, atIndex) {
		if (atIndex == null || atIndex > this.length)
			atIndex = this.length;
		var newRule = new Rule(selector, declarations, selector, declarations, true, true);
		this.splice(atIndex, 0, newRule);
	};
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
		return (this[index].s0 == undefined && this[index].d0 == undefined);
	};
	return rs;
}

function defineDeclarationBox() {
	var self = document.getElementById('blockBox');
	self.addEventListener('focus', handleControlFocus, false);
	self.addEventListener('blur', handleControlBlur, false);
	self.onfocus = function (e) {
		if (this.value == declarationBoxHint)
			this.value = '';
		this.rule = myRules[selectorMenu.selectedIndex] || {};
		this.selectionStart = this.rule.selectionStart || this.value.length;
		this.oldValue = this.value;
	};
	self.onblur = function (e) {
		if (myRules[selectorMenu.selectedIndex] == undefined)
			return;
		myRules[selectorMenu.selectedIndex].selectionStart = this.selectionStart;
		if (this.value !== this.oldValue) {
			if (this.rule.d0 == undefined) this.rule.d0 = this.rule.d;
			this.rule.d = this.value;
			markRuleDirty();
		}
		if (this.value.trim() == '') {
			this.value = declarationBoxHint;
		}
	};
	self.onkeydown = function (e) {
		switch (e.which) {
			case 9:		// tab
				e.preventDefault();
				selectorMenu.focus();
				return;
			case 13:	// return
				if (e.metaKey || e.altKey) {
					saveButton.click();
					selectorMenu.focus();
					return;
				} break;
			case 18:	// alt
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					self.addEventListener('keyup', function cancelPreview() {
						self.removeEventListener('keyup', cancelPreview, false);
						messageGlobalWindow('CancelRulePreview');
					}, false);
					previewCurrentRule();
				} break;
			case 27:	// escape
				e.stopPropagation();
				e.preventDefault();
				this.blur();
				return;
			default: break;
		}
	};
	self.onkeypress = function (e) {
		if (e.which == 115 && e.metaKey) {	// Cmd-S
			saveButton.click();
			self.ignoreNextKeyUp = true;
			return false;
		}
	};
	self.onkeyup = function (e) {
		if (e.which == 91) return;
	};
	self.populate = function (text) {
		this.value = text || declarationBoxHint;
		this.oldValue = text;
		this.rule = myRules[selectorMenu.selectedIndex];
	}
	self.selectAll = function () {
		window.getSelection().removeAllRanges();
		this.selectionStart = 0;
		this.selectionEnd = this.value.length;
	};
	return self;
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
		declarationBox.style.width = this.offsetWidth - 4 + 'px';
	};
	return rd;
}
function defineSelectorBar() {
	var self = document.getElementById('selectorBar');
	self.scrollLeftBtn = document.getElementById('sbScrollLeftBtn');
	self.scrollRightBtn = document.getElementById('sbScrollRightBtn');
	self.addEventListener('focus', handleControlFocus, false);
	self.addEventListener('blur', handleControlBlur, false);
	self.onfocus = function (e) {
		this.rule = myRules[selectorMenu.selectedIndex] || {};
		this.scrollLeftBtn.style.display = 'none';
		this.scrollRightBtn.style.display = 'none';
		this.className = 'editable';
		this.innerHTML = (!!this.querySelector('span')) ? this.textContent : '';
		window.getSelection().removeAllRanges();
		var r = document.createRange();
		try {
			r.setStartBefore(this.firstChild);
			r.setEndAfter(this.lastChild);
		} catch(e) {}
		window.getSelection().addRange(r);
		self.oldContentLength = self.textContent.length;
	};
	self.onblur = function (e) {
		this.className = '';
		var tc = this.textContent.replace(/\s+/g, ' ').trim();
		this.populate(tc);
		this.scrollLeftBtn.className = 'sbScrollBtn';
		this.scrollLeftBtn.style.display = '';
		this.scrollRightBtn.style.display = '';
		if (!selectorMenu.options.length || selectorMenu.selectedIndex < 0)
			return;
		if (tc !== selectorMenu.getSelectedSelector()) {
			var currentRule = myRules[selectorMenu.selectedIndex];
			if (!currentRule.s0)
				currentRule.s0 = currentRule.s;
			currentRule.s = tc;
			markRuleDirty();
		}
	};
	self.onkeydown = function (e) {
		switch (e.which) {
			case 9: case 13:   // tab, enter
				e.preventDefault();
				var tc = this.textContent.replace(/\s+/g, ' ').trim();
				if (!tc) {
					if (e.which == 9)
						selectorMenu.focus();
					return;
				}
				if (e.metaKey || e.altKey) {
					if (tc !== selectorMenu.getSelectedSelector())
						makeNewRule(tc);
					else {
						declarationBox.focus();
						return;
					}
				} else
				if (selectorMenu.noRuleSelected())
					makeNewRule(tc);
				else {
					declarationBox.focus();
					return;
				} break;
			case 18:   // alt
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					self.addEventListener('keyup', function cancelPreview() {
						self.removeEventListener('keyup', cancelPreview, false);
						messageGlobalWindow('CancelRulePreview');
					}, false);
					previewCurrentRule();
				} break;
			case 27:   // escape
				e.stopPropagation();
				e.preventDefault();
				self.blur();
				return;
			default: break;
		}
	};
	self.onkeypress = function (e) {
		if (e.which == 115 && e.metaKey) {	// Cmd-S
			selectorMenu.focus();
			saveButton.click();
			return false;
		}
	};
	self.onkeyup = function (e) {
		if (e.which == 91) return;
	};
	self.scrollLeftward = function (e) {
		if (self.scrollLeft > 0) {
			self.scrollLeftBtn.className = 'sbScrollBtn enabled';
			self.scrollRightBtn.className = 'sbScrollBtn enabled';
			self.scrollLeft = self.scrollLeft - 5;
			self.scrollLeftTimer = window.setTimeout(self.scrollLeftward, 10);
		} else {
			self.scrollLeftBtn.className = 'sbScrollBtn';
		}
	};
	self.scrollRightward = function (e) {
		var scrollOffset = self.scrollWidth - self.offsetWidth;
		if (self.scrollLeft < scrollOffset) {
			self.scrollRightBtn.className = 'sbScrollBtn enabled';
			self.scrollLeftBtn.className = 'sbScrollBtn enabled';
			self.scrollLeft = self.scrollLeft + 5;
			self.scrollRightTimer = window.setTimeout(self.scrollRightward, 10);
		} else {
			self.scrollRightBtn.className = 'sbScrollBtn';
		}
	};
	self.scrollStop = function (e) {
		try { window.clearTimeout(self.scrollLeftTimer) }  catch(err) {};
		try { window.clearTimeout(self.scrollRightTimer) } catch(err) {};
	};
	self.stringToChain = function (selector) {
		var ts = selector.replace(/\s+/g,' ').trim();
		return ts.match(/([^\>\~\+\, ]+)|([\>\~\+\, ]+)/g);
	};
	self.stringValue = function (lastLink) {
		var string = '';
		var spans = this.getElementsByTagName('span');
		for (var i = 0; i < spans.length; i++) {
			if (/,/.test(spans[i].textContent))
				string = '';
			else
				string += spans[i].textContent;
			if (lastLink && spans[i] == lastLink) {
				break;
			}
		}
		string = string.replace(/\s+/g, ' ').trim();
		return string;
	};
	self.populate = function (selector) {
		this.innerHTML = '';
		if (!selector) {
			this.textContent = '/* Enter a CSS selector here */';
			return;
		}
		var chain = this.stringToChain(selector);
		chain.forEach(function (link) {
			self.appendChild(new LinkSpan(link));
		});
		if (this.scrollWidth > this.offsetWidth) {
			this.scrollLeftBtn.onmouseover = self.scrollLeftward;
			this.scrollLeftBtn.onmouseout = self.scrollStop;
			this.scrollRightBtn.onmouseover = self.scrollRightward;
			this.scrollRightBtn.onmouseout = self.scrollStop;
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
	return self;
}
function defineSelectorMenu() {
	var self = document.getElementById('selectorMenu');
	self.onfocus = handleControlFocus;
	self.onblur = handleControlBlur;
	self.onchange = function (e) {
		if (this.options.length > 0) {
			var selectedCount = 0;
			for (var i = 0; i < this.options.length; i++) {
				if (this.options[i].selected) selectedCount++;
			}
			if (selectedCount === 1) {
				var selector = this.getSelectedSelector();
				selectorBar.populate(selector);
				var ruleIsClean = !myRules[this.selectedIndex].dirty;
				var ruleIsNew = myRules[this.selectedIndex].isNew;
				var declarations = myRules.getDeclarations(selector);
				if (ruleIsClean) declarations = declarations.formatForEditing();
				declarationBox.populate(declarations);
			} else {
				selectorBar.populate('');
				declarationBox.populate('');
			}
		}
	};
	self.onkeydown = function (e) {
		switch (e.which) {
			case 8: case 127:	// backspace, delete
				e.stopPropagation();
				e.preventDefault();
				var selectedIndexes = [];
				for (var i = 0; i < selectorMenu.options.length; i++) {
					if (selectorMenu.options[i].selected) {
						selectedIndexes.push(selectorMenu.options[i].index);
					}
				}
				deleteRules(selectedIndexes);
				this.selectedIndex = selectedIndexes[0]; // (firstIndex == 0) ? 0 : firstIndex - 1;
				this.onchange();
				break;
			case 18:	// alt
				if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
					self.onkeyup = function (e) {
						self.onkeyup = null;
						messageGlobalWindow('CancelRulePreview');
					};
					previewCurrentRule();
				}
				break;
			case 27:	// escape
				e.stopPropagation();
				e.preventDefault();
				this.blur();
				break;
			case 38:	// up
				if (e.altKey || e.metaKey) self.moveOption(-1);
				break;
			case 40:	// down
				if (e.altKey || e.metaKey) self.moveOption(1);
				break;
			default: break;
		}
	};
	self.addOption = function (selector, makeSelected, isDirty, beforeRow) {
		var row = new Option(selector);
		row.title = selector;
		row.selected = makeSelected;
		if (selector == '(new rule)')
			row.className += ' newrule';
		else if (isDirty)
			row.className += ' dirty';
		row.onmouseover = function (e) {
			if (e.target.text == '(new rule)') return;
			e.target.className += ' highlighted';
			highlightMatchesOnPage(e.target.text);
		};
		row.onmouseout = function (e) {
			if (e.target.text == '(new rule)') return;
			e.target.className = e.target.className.replace(' highlighted','');
			removeHighlightsOnPage();
		};
		this.add(row, beforeRow || null);
	};
	self.populate = function (initialSelector) {
		self.innerHTML = '';
		myRules.forEach(function (rule, index) {
			self.addOption(
				(rule.s || '(new rule)'), 
				(initialSelector ? rule.s == initialSelector : index == 0), 
				(rule.s0 != undefined)
			);
		});
	}
	self.getSelectedSelector = function () {
		if (this.options[this.selectedIndex]) {
			var s = this.options[this.selectedIndex].text;
			return (s == '(new rule)') ? '' : s;
		} else return '';
	};
	self.moveOption = function (dir) {
		var selectedCount = 0;
		for (var i = 0; i < this.options.length; i++) {
			if (this.options[i].selected) selectedCount++;
		}
		if (selectedCount == 1) {
			var index = this.selectedIndex;
			if (dir == -1 && index == 0) return false;
			if (dir ==  1 && index == this.options.length - 1) return false;
			myRules.moveRule(index, dir);
			saveNewRuleOrder();
			this.populate(this.getSelectedSelector());
		}
	};
	self.markOptionDirty = function (index) {
		var oi = (index == undefined) ? this.selectedIndex : index;
		if (this.options[oi]) {
			this.options[oi].text = myRules[this.selectedIndex].s || '(new rule)';
			this.options[oi].title = myRules[this.selectedIndex].s;
			this.options[oi].className += ' dirty';
		}
	};
	self.markOptionClean = function (index) {
		var oi = (index == undefined) ? this.selectedIndex : index;
		this.options[oi].className = this.options[oi].className.replace(/ dirty/g,'');
	};
	self.noRuleSelected = function () {
		return (!this.options.length) || this.options[this.selectedIndex].text == '(new rule)';
	};
	return self;
}
function deleteRules(indexes) {
	for (var i = indexes.length - 1; i >= 0; i--) {
		if (indexes[i] == selectorMenu.options.length - 1 && !myRules[indexes[i]].s) {
			return;
		} else {
			myRules.deleteRule(indexes[i]);
			selectorMenu.remove(indexes[i]);
		}
	};
	var cleanRules = [];
	var addToCleanRules = function (rule) {
		if (!(rule.isNew && rule.dirty)) {
			cleanRules.push({
				s: (rule.dirty) ? rule.s0 : rule.s,
				d: (rule.dirty) ? rule.d0 : rule.d
			});
		}
	};
	myRules.forEach(addToCleanRules);
	var message = { hostname: hostname, rules: cleanRules };
	messageGlobalWindow('SaveRulesAndSendToPage', JSON.stringify(message));
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
			myRules.addNewRule(initialSelector, '');
	}
	myRules.addNewRule('','');
	initialSelector = data.selector || myRules[0].s;
	selectorMenu.populate(initialSelector);
	selectorBar.populate(initialSelector);
	declarationBox.populate(myRules.getDeclarations(initialSelector).formatForEditing());
	if (data.selector) {
		declarationBox.focus();
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
	declarationBox = defineDeclarationBox();
	declarationBoxHint = '/* Enter style declarations here */';
	leftDiv = defineLeftDiv();
	rightDiv = defineRightDiv();
	lrDivider = defineLrDivider();
	saveButton = document.getElementById('saveButton');
	saveButton.onclick = saveCurrentRule;
	revertButton = document.getElementById('revertButton');
	revertButton.onclick = revertCurrentRule;
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
					if (iframed)
						messageGlobalWindow('RemoveStyleBox');
					break;
				}
			}
		}
	};
	if (popover) {
		gw = safari.extension.globalPage.contentWindow;
		console = gw.console;
		document.body.className = 'popover';
		document.getElementById('resizeBar').onmousedown = function (e) {
			if (e.button === 0) {
				e.stopPropagation();
				rbClickY = e.offsetY;
				event.target.style.height = '100%';
				document.addEventListener('mousemove', popoverFreeResize, false);
				document.addEventListener('mouseup', popoverStopResize, false);
				return false;
			}
		};
	} else {
		document.body.className = 'iframed';
		document.getElementById('resizeBar').style.display = 'none';
		safari.self.addEventListener('message', handleMessage, false);
		safari.self.tab.dispatchMessage('PassStyleBoxData');
	}
}
function makeNewRule(selector) {
	myRules.addNewRule(selector, declarationBox.value, myRules.length - 1);
	selectorMenu.populate(selector);
	declarationBox.focus();
	declarationBox.selectAll();
}
function markRuleClean(index) {
	if (index == undefined)
		index = selectorMenu.selectedIndex;
	var rule = myRules[index];
	rule.dirty = false;
	delete rule.s0;
	delete rule.d0;
	selectorMenu.markOptionClean(index);
	declarationBox.oldValue = declarationBox.value;
}
function markRuleDirty(index) {
	if (index == undefined)
		index = selectorMenu.selectedIndex;
	if (!myRules[index].dirty) {
		console.log('Marking dirty: "' + selectorMenu.getSelectedSelector() + '"');
		myRules[index].dirty = true;
	}
	selectorMenu.markOptionDirty(index);
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
		d: declarationBox.value.formatForSaving()
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
	declarationBox.style.height = mainHeight - 30 + 'px';
}
function revertCurrentRule() {
	var index = selectorMenu.selectedIndex;
	var rule = myRules[index];
	rule.s = rule.s0 || rule.s;
	rule.d = rule.d0 || rule.d;
	selectorBar.populate(rule.s);
	declarationBox.populate(rule.d.formatForEditing());
	markRuleClean(index);
	selectorMenu.populate(rule.s);
	selectorMenu.onchange();
}
function saveCurrentRule() {
	var selector = selectorBar.textContent;
	if (!selector || /^\//.test(selector)) return;
	myRules.setRule(selector, declarationBox.value.formatForSaving());
	markRuleClean(selectorMenu.selectedIndex);
	var cleanRules = [];
	var addToCleanRules = function (rule) {
		if (!(rule.isNew && rule.dirty)) {
			cleanRules.push({
				s: (rule.dirty) ? rule.s0 : rule.s,
				d: (rule.dirty) ? rule.d0 : rule.d
			});
		}
	};
	myRules.forEach(addToCleanRules);
	var message = { hostname: hostname, rules: cleanRules };
	messageGlobalWindow('SaveRulesAndSendToPage', JSON.stringify(message));
	myRules[selectorMenu.selectedIndex].isNew = false;
}
function saveNewRuleOrder() {
	var cleanOldRules = [];
	var addToCleanOldRules = function (rule) {
		if (!rule.isNew) {
			cleanOldRules.push({
				s: (rule.dirty) ? rule.s0 : rule.s,
				d: (rule.dirty) ? rule.d0 : rule.d
			});
		}
	};
	myRules.forEach(addToCleanOldRules);
	var message = { hostname: hostname, rules: cleanOldRules };
	messageGlobalWindow('SaveRulesAndSendToPage', JSON.stringify(message));
}
window.onload = initialize;
