function sRow() {
	var row = document.createElement('div');
	row.className = 'selectorRow';
	row.onmouseover = function () {
		if (event.target.className == 'selectorRow')
			event.target.className += ' highlighted';
		csb.populate(selectorToArray(event.target.title));
	};
	row.onmouseout = function () {
		event.target.className = event.target.className.replace(' highlighted','');
	};
	row.onclick = function () {
		asb.select(event.target);
	};
	return row;
}
function defineAsb() {
	function sRow() {
		var row = document.createElement('div');
		row.className = 'selectorRow';
		row.onmouseover = function () {
			if (event.target.className == 'selectorRow')
				event.target.className += ' highlighted';
			csb.populate(selectorToArray(event.target.title));
		};
		row.onmouseout = function () {
			event.target.className = event.target.className.replace(' highlighted','');
		};
		row.onclick = function () {
			asb.select(event.target);
		};
		return row;
	}
	var asb = document.getElementById('selectorsBox');
	asb.populate = function (rules) {
		for (var sel in rules) {
			console.log(sel);
			var row = new sRow();
			row.innerHTML = sel;
			row.title = sel;
			asb.appendChild(row);
		}
		return asb;
	}
	asb.select = function (row) {
		var rows = this.getElementsByClassName('selectorRow');
		for (var i = 0; i < rows.length; i++) {
			if (rows[i] == row) {
				rows[i].className = 'selectorRow selected';
			} else {
				rows[i].className = 'selectorRow';
			}
		};
	};
	return asb;
}

case 9: {
	e.preventDefault();
	var curPos = this.selectionStart;
	var frontText = this.value.substring(0, curPos);
	var backText  = this.value.substring(curPos, this.value.length);
	this.value = frontText + '\t' + backText;
	this.selectionStart = curPos + 1;
	this.selectionEnd = curPos + 1;
	break;
}

var iSpan;
for (var i = 0; i < chain.length; i++) {
	iSpan = document.createElement('span');
	this.appendChild(iSpan);
	iSpan.innerHTML = chain[i];
	if (combinators.test(chain[i])) {
		iSpan.className = 'combi';
	} else {
		iSpan.className = 'sss';
		iSpan.onmouseover = function (e) {
			e.target.className += ' highlight';
			highlightMatchesOnPage(si.stringValue(e.target));
		};
		iSpan.onmouseout  = function (e) {
			e.target.className = e.target.className.replace(' highlight','');
			removeHighlightsOnPage();
		};
		iSpan.onclick = si.onclick;
	}
}

for (var i = 0; i < chain.length; i++) {
	this.appendChild(new LinkSpan(chain[i]));
}

var csi = function () {
	for (var i = 0; i < si.childNodes.length; i++) {
		if (si.childNodes[i] == currentSpan) return i;
	}
	return -1;
}();

if (selectedCount == 1) {
	var so = this.options[this.selectedIndex];
	var newIndex = so.index - 1;
	if (newIndex >= 0) {
		this.addOption(so.text, true, false, this.options[newIndex]);
		this.remove(so.index);
	}
}

sb.onmouseup = function (e) {
	this.cp = window.getSelection().getRangeAt(0).startOffset;
	console.log('startOffset:', this.cp);
	var words = this.textContent.split(/ +/);
	console.log(words);
	var textnodes = words.map(function (word) {
		return document.createTextNode(word);
	});
	this.innerHTML = '';
	textnodes.forEach(function (node, index, array) {
		if (index == array.length - 1) {
			this.appendChild(node);
		} else {
			this.appendChild(node);
			this.appendChild(document.createTextNode(' '));
		}
	}, this);
	window.getSelection().removeAllRanges();
	var nr = document.createRange();
	nr.setStart(this, this.cp);
	window.getSelection().addRange(nr);
};

sb.onfocus = function (e) {
	e.target.scrollLeftBtn.style.display = 'none';
	e.target.scrollRightBtn.style.display = 'none';
	e.target.className = 'editable';
	window.getSelection().removeAllRanges();
	var r = document.createRange();
	r.setStartBefore(e.target.firstChild);
	r.setEndAfter(e.target.lastChild);
	window.getSelection().addRange(r);
};

sb.rejigger = function (c) {
	c = (c === ' ') ? c : ' ' + c + ' ';
	console.log('c:', c);
	var r = window.getSelection().getRangeAt(0);
	var ro = r.startOffset;
	var currentSpan = r.startContainer.parentElement;
	var ctc = currentSpan.textContent;
	if (ctc.length === ro) {
		var lastAtom = sb.insertBefore(new LinkSpan('?'), currentSpan.nextSibling);
		sb.insertBefore(new LinkSpan(c), currentSpan.nextSibling);
		lastAtom.title = 'Replace this with a new subselector.';
	} else {
		var pieceArray = [ctc.slice(0, ro), ctc.slice(ro)];
		var lastAtom = sb.insertBefore(new LinkSpan(pieceArray[1]), currentSpan.nextSibling);
		sb.insertBefore(new LinkSpan(c), currentSpan.nextSibling);
		sb.replaceChild(new LinkSpan(pieceArray[0]), currentSpan);
	}
	window.getSelection().removeAllRanges();
	var nr = document.createRange();
	if (lastAtom.title) {
		nr.selectNode(lastAtom.childNodes[0]);
	} else {
		nr.setStart(lastAtom.childNodes[0], 0);
	}
	window.getSelection().addRange(nr);
};

