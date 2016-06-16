HTMLElement.prototype.getAtomicSelector = function (preferId) {
  var string = this.nodeName; //.toLowerCase();
  if (this.className) {
    if (preferId && this.id) {
      string += '#' + this.id;
    } else {
      string += '.' + this.className.trim().replace(/ +/g,'.');
    }
  } else
  if (this.id) {
    string += '#' + this.id;
  }
  return string;
}
HTMLElement.prototype.getCompoundSelector = function (preferId) {
  var thisNode = this;
  var selector = '';
  var done = false;
  if (thisNode == document.documentElement) {
    return 'HTML';
  }
  if (thisNode == document.body) {
    return 'BODY';
  }
  while (!done) {
    var prefix = thisNode.nodeName;
    if (prefix === 'HTML') {
      selector = prefix + selector;
      done = true;
    } else
    if (thisNode.className) {
      if (preferId && thisNode.id) {
        prefix += '#' + thisNode.id;
        selector = prefix + selector;
        done = true;
      } else {
        var classNames = thisNode.className.split(/ +/);
        for (var classString = '', i = 0; i < classNames.length; i++)
          classString += '.' + classNames[i];
        prefix += classString;
        selector = prefix + selector;
        done = true;
      }
    } else
    if (thisNode.id) {
      prefix += '#' + thisNode.id;
      selector = prefix + selector;
      done = true;
    } else {
      selector = ' > ' + prefix + selector;
      thisNode = thisNode.parentNode;
    }
  }
  return selector;
}
HTMLElement.prototype.getLineage = function () {
  var thisNode = this;
  var lineage = {
    array : [thisNode],
    si    : 0
  };
  var done = (thisNode.nodeName == 'HTML');
  while (!done) {
    thisNode = thisNode.parentNode;
    lineage.array.unshift(thisNode);
    lineage.si = lineage.array.length - 1;
    done = (thisNode.nodeName == 'HTML');
  }
  lineage.toString = function (toEnd) {
    var atoms = [];
    if (toEnd)
      endIndex = this.array.length - 1;
    else
      endIndex = this.si;
    for (var i=0; i <= endIndex; i++)
      atoms.push(this.array[i].getAtomicSelector(qs.preferId));
    return atoms.join(' > ');
  };
  return lineage;
}
HTMLElement.prototype.getNewSize = function (method, increment) {
  var ecs = document.defaultView.getComputedStyle(this, null);
  if (method === 'zoom') {
    var oldZoom = ecs.zoom * 1;
    var newZoom = Math.round(oldZoom*100 + increment*10) / 100;
    return newZoom;
  } else {
    var oldFontSize = ecs.fontSize.split('px')[0] * 1;
    var newFontSize = oldFontSize + increment;
    var oldLineHeight = ecs.lineHeight.split('px')[0] * 1;
    if (isNaN(oldLineHeight)) {
      var newLineHeight = null;
    } else {
      var newLineHeight = Math.ceil(newFontSize/oldFontSize * oldLineHeight);
    }
    return {fs: newFontSize, lh: newLineHeight};
  }
}
HTMLElement.prototype.getPageOffset = function () {
  var element = this;
  var x = 0, y = 0;
  while (element) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return { x:x, y:y };
}
HTMLElement.prototype.highlight = function () {
  this.style.outline = hlOutlineStyle;
  this.style.background = hlBackgroundStyle;
}
HTMLElement.prototype.unHighlight = function () {
  this.style.outline = '';
  this.style.background = '';
}

function MessageBox(dType, id) {
  var mb = document.createElement('div');
  mb.id = id || 'ckRsMsgBox';
  mb.insert = function () {
    document.documentElement.appendChild(this);
  };
  mb.show = function () {
    this.style.display = 'block';
  };
  mb.hide = function () {
    this.style.display = 'none';
  };
  mb.say = function (msg) {
    this.innerHTML = msg;
  };
  mb.remove = function () {
    document.documentElement.removeChild(this);
    msgbox = null;
  };
  mb.removeAfter = function (timeout) {
    mbRemovalTimer = window.setTimeout(function () {
      if (document.getElementById('ckRsMsgBox')) {
        document.getElementById('ckRsMsgBox').remove();
      }
      mbRemovalTimer = null;
    }, timeout);
  };
  mb.style.display = dType;
  mb.style.position = 'fixed';
  mb.style.bottom = '0';
  mb.style.left = '0';
  mb.style.zIndex = '2147483647';
  mb.style.width = 'auto';
  mb.style.height = 'auto';
  mb.style.margin = 0;
  mb.style.padding = '1px 5px 3px 5px';
  mb.style.borderWidth = '1px';
  mb.style.borderColor = '#bbb';
  mb.style.borderStyle = 'solid solid none none';
  mb.style.borderTopRightRadius = '4px';
  mb.style.backgroundColor = '#eee';
  mb.style.color = 'black';
  mb.style.font = 'normal normal normal 11px/normal Lucida Grande,sans-serif';
  return mb;
}
function NoticeBox() {
  var nb = document.createElement('div');
  nb.id = 'cks_NoticeBox';
  nb.setAttribute('style', '\
    display: block !important;\
    position: fixed !important;\
    left: 32px !important; top: 32px !important;\
    width: auto !important; height: auto !important;\
    z-index: 2147483647 !important;\
    box-shadow: rgba(0, 0, 0, 0.75) 0 5px 20px 0 !important;\
    border: 1px solid white !important;\
    border-radius: 7px !important;\
    margin: 0 !important;\
    padding: 12px 18px !important;\
    background: -webkit-gradient(linear, 0% 0%, 0% 100%, from(#666), to(#000)) !important;\
    text-align: center !important;\
    color: white !important;\
    font: 16px Helvetica, Arial, sans-serif !important;\
  ');
  nb.say = function (text, timeout) {
    this.innerHTML = text;
    document.documentElement.appendChild(this);
    setTimeout(document.getElementById('cks_NoticeBox').fadeAway, timeout);
  };
  nb.fadeAway = function () {
    var me = document.getElementById('cks_NoticeBox');
    var o = 10;
    var fader = setInterval(function () {
      o -= 2;
      me.style.opacity = o/10 + '';
      if (o <= 0) {
        clearInterval(fader);
        document.documentElement.removeChild(document.getElementById('cks_NoticeBox'));
      }
    }, 50);
  };
  return nb;
}
function Rule(selector, declarations) {
  this.s = selector;
  this.d = declarations;
}
function RuleSet(ruleArray) {
  var rs = ruleArray || [];
  rs.copy = function () {
    var twin = new RuleSet();
    this.forEach(function (rule) {
      twin.push(new Rule(rule.s, rule.d));
    });
    return twin;
  };
  rs.replace = function (rulesToAdd) {
    rulesToAdd.forEach(function (rule) {
      rs.setRule(rule.s, rule.d, false);
    });
  };
  rs.getRuleIndex = function (selector) {
    for (var i = 0; i < this.length; i++)
      if (this[i].s === selector) return i;
    return -1;
  };
  rs.setRule = function (selector, declarations, merging) {
    var ri = this.getRuleIndex(selector);
    if (ri > -1) {
      if (merging) this[ri].mergeDeclarations(declarations);
      else this[ri].d = declarations;
    } else this.push(new Rule(selector, declarations));
    return this[ri];
  }
  rs.deleteRule = function (selector) {
    this.forEach(function (rule, index) {
      if (rule.s === selector) {
        rs.splice(index, 1);
      }
    });
  }
  return rs;
}
function StyleBox(id) {
  var sb = document.createElement('div');
  sb.id = id || 'cks_StyleBox';
  sb.name = 'cks_StyleFrame';
  sb.bw = 2;
  sb.style.position = 'fixed';
  sb.style.zIndex = '2147483647';
  sb.style.webkitBoxShadow = '#666 0px 4px 12px';
  sb.style.border = sb.bw + 'px solid #888';
  sb.style.borderRadius = '6px';
  sb.style.padding = '0';
  sb.style.backgroundColor = '#F0F0F0';
  sb.style.opacity = '1';
  sb.scrolling = 'no';
  sb.seFrame = function () {
    var sf = document.createElement('iframe');
    sf.src = safari.extension.baseURI + 'style_manager.html';
    sf.style.position = 'absolute';
    sf.style.border = '1px solid silver';
    sf.style.margin = '0';
    return sf;
  }();
  sb.selectButton = function () {
    var lb = document.createElement('span');
    lb.textContent = '⦿';
    lb.title = 'Initiate Selector Helper';
    lb.style.position = 'absolute';
    lb.style.left = '1px';
    lb.style.top = '-7px';
    lb.style.font = 'normal 24px Lucida Grande';
    lb.style.cursor = 'pointer';
    lb.onclick = initiateQs;
    return lb;
  }();
  sb.closeButton = function () {
    var cb = document.createElement('span');
    cb.textContent = '×';
    cb.title = 'Close Style Editor';
    cb.style.position = 'absolute';
    cb.style.right = '3px';
    cb.style.top = '-1px';
    cb.style.font = 'normal 16px Lucida Grande';
    cb.style.cursor = 'pointer';
    cb.onclick = removeStyleBox;
    return cb;
  }();
  sb.resizeHandle = function () {
    sb.rhs = 11;
    var rh = document.createElement('img');
    rh.src = safari.extension.baseURI + 'resizeHandle.png';
    rh.style.position = 'absolute';
    rh.style.right = '5px';
    rh.style.bottom = '5px';
    rh.onmousedown = function (e) {
      if (e.button === 0) {
        e.stopPropagation();
        sb.rox = e.offsetX;
        sb.roy = e.offsetY;
        document.addEventListener('mousemove', sb.resize, false);
        document.addEventListener('mouseup', sb.stopResize, false);
        return false;
      }
    };
    return rh;
  }();
  sb.insert = function () {
    document.documentElement.appendChild(this);
  };
  sb.remove = function () {
    document.documentElement.removeChild(this);
  };
  sb.move = function (e) {
    sb.style.left = (e.clientX - sb.clickX) + 'px';
    sb.style.top  = (e.clientY - sb.clickY) + 'px';
  };
  sb.onmousedown = function(e) {
    if (e.button === 0) {
      sb.clickX = e.offsetX;
      sb.clickY = e.offsetY;
      document.addEventListener('mousemove', sb.move, false);
      document.addEventListener('mouseup', sb.stopMove, false);
      return false;
    }
  };
  sb.stopMove = function(e) {
    if (e.button === 0) {
      settings.styleBoxStats.left = sb.offsetLeft / window.innerWidth;
      settings.styleBoxStats.top = sb.offsetTop / window.innerHeight;
      console.log('settings.styleBoxStats', settings.styleBoxStats);
      var message = { left: settings.styleBoxStats.left, top: settings.styleBoxStats.top };
      safari.self.tab.dispatchMessage('SaveStyleBoxPosition', message);
      document.removeEventListener('mousemove', sb.move, false);
      document.removeEventListener('mouseup', sb.stopMove, false);
    }
  };
  sb.resize = function (e) {
    var newWidth = e.x + sb.rhs - sb.rox - sb.offsetLeft + sb.bw * 2;
    var newHeight = e.y + sb.rhs - sb.roy - sb.offsetTop + sb.bw * 2;
    if (newWidth >= 512) {
      sb.style.width = newWidth + 'px';
      sb.seFrame.style.width = newWidth - (sb.pw * 2) - (sb.bw * 1) + 'px';
    }
    if (newHeight >= 160) {
      sb.style.height = newHeight + 'px';
      sb.seFrame.style.height = newHeight - (sb.pw * 2) - (sb.bw * 1) + 'px';
    }
    if (newWidth >= 400 || newHeight >= 160) {
      safari.self.tab.dispatchMessage('ResizeStyleEditor');
    }
  };
  sb.stopResize = function(e){
    if (e.button === 0) {
      settings.styleBoxStats.width = sb.offsetWidth - (sb.bw * 2);
      settings.styleBoxStats.height = sb.offsetHeight - (sb.bw * 2);
      var message = { width: sb.offsetWidth, height: sb.offsetHeight };
      safari.self.tab.dispatchMessage('SaveStyleBoxSize', message);
      document.removeEventListener('mousemove', sb.resize, false);
      document.removeEventListener('mouseup', sb.stopResize, false);
    }
  };
  sb.adjustPosition = function () {
    if (styleBox.offsetLeft + styleBox.offsetWidth > window.innerWidth)
      styleBox.style.left = (window.innerWidth - styleBox.offsetWidth - 16) + 'px';
    if (styleBox.offsetTop + styleBox.offsetHeight > window.innerHeight)
      styleBox.style.top = (window.innerHeight - styleBox.offsetHeight - 16) + 'px';
  };
  sb.initPnS = function () {
    var ss = settings.styleBoxStats;
    sb.pw = 16;
    sb.w = ss.width;
    sb.h = ss.height;
    sb.x = (ss.left !== undefined)
      ? (parseInt(ss.left) === ss.left ? ss.left : window.innerWidth * ss.left)
      : (window.innerWidth / 2 - sb.w / 2);
    sb.y = (ss.top !== undefined)
      ? (parseInt(ss.top) === ss.top ? ss.top : window.innerHeight * ss.top)
      : (window.innerHeight - sb.h - 24);
    sb.style.left = sb.x + 'px';
    sb.style.top = sb.y + 'px';
    sb.style.width = sb.w + 'px';
    sb.style.height = sb.h + 'px';
    sb.seFrame.style.left = sb.pw + 'px';
    sb.seFrame.style.top = sb.pw + 'px';
    sb.seFrame.style.width = sb.w - sb.bw - (sb.pw * 2) + 'px';
    sb.seFrame.style.height = sb.h - sb.bw - (sb.pw * 2) + 'px';
  };
  sb.appendChild(sb.seFrame);
  sb.appendChild(sb.selectButton);
  sb.appendChild(sb.closeButton);
  sb.appendChild(sb.resizeHandle);
  // sb.initPnS();
  return sb;
}

Rule.prototype.mergeDeclarations = function (declarations) {
  var oldDecArray = this.d.split('; ');
  var newDecArray = declarations.split('; ');
  newDecArray.forEach(function (declaration) {
    var property = declaration.split(':')[0];
    for (var i = 0; i <= oldDecArray.length; i++) {
      if (i === oldDecArray.length) {
        oldDecArray.push(declaration);
        break;
      } else if (oldDecArray[i].indexOf(property + ':') == 0) {
        oldDecArray[i] = declaration;
        break;
      }
    }
  });
  this.d = oldDecArray.join('; ');
}
Rule.prototype.setProperty = function (property, value) {
  var decArray = this.d.split('; ');
  for (var i = 0; i <= decArray.length; i++) {
    if (i === decArray.length) {
      decArray.push(property + ': ' + value);
      break;
    } else if (decArray[i].indexOf(property + ':') == 0) {
      decArray[i] = property + ': ' + value;
      break;
    }
  }
  this.d = decArray.join('; ');
}

function cancelCnK(e) {
  document.removeEventListener('dragstart', cancelCnK, false);
  document.removeEventListener('keypress', ignoreKeypress, true);
  document.removeEventListener('keyup', handleCnKeyup, false);
  document.removeEventListener('mouseup', cancelCnK, false);
}
function cancelQs(showNotice) {
  if (msgbox)
    msgbox.remove();
  if (document.getElementById('rsHrefBox'))
    document.getElementById('rsHrefBox').style.visibility = '';
  if (qs.currentElement) {
    qs.currentElement.style.outline = '';
    qs.currentElement.style.background = '';
  }
  document.removeEventListener('mouseover', handleQsMouseMove, false);
  document.removeEventListener('keydown', handleQsKeyDown, false);
  document.removeEventListener('mousedown', handleQsMouseDown, false);
  if (showNotice) new NoticeBox().say('Quickstyle Selector Helper exited.', 500);
  qs = null;
}
function clearAllHighlights() {
  if (affectedElements) {
    for (var i = 0; i < affectedElements.length; i++) {
      affectedElements[i].unHighlight();
    }
  }
}
function cnkApplyFaveFont(alternate) {
  var tgt = (cnk.targetPage || cnk.target === document.documentElement) ? document.body : cnk.target;
  var ff = (alternate) ? settings.faveFont2 : settings.faveFont;
  cnk.selector = tgt.getCompoundSelector(false);
  if (cnk.targetOnly) {
    if (tgt.getAttribute('oldstyle') === null) {
      tgt.setAttribute('oldstyle', tgt.getAttribute('style') || '');
    }
    tgt.style.fontFamily = ff.family.replace(/ !important \/\*\w+\w\*\//g, '');
    tgt.style.fontSize =   ff.size.replace(/ !important \/\*\w+\w\*\//g, '');
    tgt.style.lineHeight = ff.lh.replace(/ !important \/\*\w+\w\*\//g, '');
    showResultMsg('Applied your favorite font/size to the <b>' + tgt.tagName + '</b> element');
    tgt.highlight();
  } else {
    var declarations = '';
    declarations += 'font-family: ' + ff.family + '; ';
    declarations += 'font-size: '   + ff.size + '; ';
    declarations += 'line-height: ' + ff.lh;
    var r = myStyles.setRule(cnk.selector, declarations, true);
    var bs = declarations.replace(/ !important \/\*\w+\w\*\//g, '');
    showResultMsg('<b>' + cnk.selector + '</b> ' + bs);
    if (!cnk.targetPage) highlightSelectorMatches(cnk.selector);
    writeStyles(myStyles, tgt);
  }
}
function cnkResetStyle(byZoomKey) {
  var tgt = (cnk.targetPage || cnk.target === document.documentElement) ? document.body : cnk.target;
  if (cnk.targetOnly) {
    tgt.style.zoom = '';
    tgt.style.fontFamily = '';
    tgt.style.fontSize = '';
    tgt.style.lineHeight = '';
    tgt.setAttribute('style', tgt.getAttribute('oldstyle'));
    tgt.removeAttribute('oldstyle');
    showResultMsg('Restored the default style for the <b>' + tgt.tagName + '</b> element');
  } else {
    cnk.selector = tgt.getCompoundSelector(false);
    myStyles.deleteRule(cnk.selector);
    showResultMsg('Restored the default style for <b>' + cnk.selector + '</b>', byZoomKey*3000);
    if (!cnk.targetPage && !byZoomKey) tgt.highlight();
    writeStyles(myStyles, tgt);
  }
}
function cnkSetFontSize(increment, alt, byZoomKey) {
  var tgt = (cnk.targetPage || cnk.target === document.documentElement) ? document.body : cnk.target;
  // var tgtStyle = document.defaultView.getComputedStyle(tgt,null);
  var type = (function () {
    if (byZoomKey) {
      return (alt) ? 'font' : 'zoom';
    } else {
      return ((settings.useZoom ^ alt) || cnk.targetPage) ? 'zoom' : 'font';
    }
  })();
  var newSize = tgt.getNewSize(type, increment);
  var newSizeStr = (type === 'zoom') ? newSize + 'x.' : newSize.fs + 'px.';
  cnk.selector = tgt.getCompoundSelector(false);
  if (cnk.targetOnly) {
    if (tgt.getAttribute('oldstyle') === null) {
      tgt.setAttribute('oldstyle', tgt.getAttribute('style') || '');
    }
    if (settings.useZoom ^ alt) {
      tgt.style.zoom = newSize + '';
    } else {
      tgt.style.fontSize = newSize.fs + 'px';
      tgt.style.lineHeight = newSize.lh ? newSize.lh + 'px' : '';
    }
    showResultMsg('Set size of the <b>' + tgt.tagName + '</b> element to ' + newSizeStr);
    tgt.highlight();
  } else {  // targeting the matching set
    var declarations = '';
    if (type === 'zoom') {
      declarations += 'zoom: ' + newSize + ' !important';
    } else {
      declarations += 'font-size: ' + newSize.fs + 'px !important;';
      declarations += newSize.lh ? ' line-height: ' + newSize.lh + 'px !important' : '';
    }
    var r = myStyles.setRule(cnk.selector, declarations, true);
    showResultMsg('Set size of <b>' + cnk.selector + '</b> to ' + newSizeStr, byZoomKey*3000);
    if (!cnk.targetPage && !byZoomKey) highlightSelectorMatches(cnk.selector);
    writeStyles(myStyles, tgt);
  }
}
function cnkSetZoom(zoom) {
  var tgt = cnk.target;
  cnk.selector = tgt.getCompoundSelector(false);
  var declarations = 'zoom: ' + zoom + ' !important';
  var r = myStyles.setRule(cnk.selector, declarations, true);
  showResultMsg('Set size of <b>' + cnk.selector + '</b> to ' + zoom, 3000);
  writeStyles(myStyles, tgt);
}
function excludeGlobal(rule) {
  return !/\/\*global\*\//.test(rule.d);
}
function finishCnK(e) {
  e.preventDefault();
  // e.stopPropagation();
  if (cnk.targetOnly)
    cnk.target.unHighlight();
  if (cnk.selector)
    unHighlightSelectorMatches(cnk.selector);
  if (useStatusBar)
    window.status = '';
  else if (msgbox)
    msgbox.remove();
  if (settings.autoSaveStyles && !cnk.doNotSave)
    saveChanges();
  cnk = null;
  document.removeEventListener('mouseup', finishCnK, false);
}
function getTargetSafeTest() {
  if (/www\.codecademy\.com/.test(location.hostname)) {
    return function (target) {
      return !(/^ace_/.test(target.className));
    };
  } else
  return null;
}
function handleCnKeyup(e) {
  var c = String.fromCharCode(e.which);
  var modkeys  = e.shiftKey * 1;
    modkeys += e.ctrlKey  * 2;
    modkeys += e.altKey   * 4;
    modkeys += e.metaKey  * 8;
  switch (e.which) {
    case 65: case 187:            // a,=
      registerCnKeyUp();
      cnkSetFontSize(1, e.altKey);
      break;
    case 90: case 189:            // z,-
      registerCnKeyUp();
      cnkSetFontSize(-1, e.altKey || e.shiftKey);
      break;
    case 70: case 49: case 220:   // f,1,\
      registerCnKeyUp();
      cnkApplyFaveFont(false);
      break;
    case 71: case 50: case 191:   // g,2,/
      registerCnKeyUp();
      cnkApplyFaveFont(true);
      break;
    case 81: case 82: case 48:    // q,r,0
      registerCnKeyUp();
      cnkResetStyle();
      break;
    case 84:                      // t
      if (settings.autoSaveStyles) {
        registerCnKeyUp();
        cnk.doNotSave = !cnk.doNotSave;
        if (cnk.doNotSave) {
          showResultMsg('Changes will not be saved.');
        } else {
          showResultMsg('Changes will be saved.');
        }
      } break;
    case 88:                      // x
      registerCnKeyUp();
      cnk.targetOnly = !cnk.targetOnly;
      if (cnk.targetOnly) {
        showResultMsg('Targeting the indicated element only.');
      } else {
        showResultMsg('Targeting all similar elements.');
      } break;
    case 87:                      // w
      registerCnKeyUp();
      cnk.targetPage = true;
      showResultMsg('Targeting the whole page. Zoom will be used for size changes.');
      break;
    default: break;
  }
}
function handleContextMenu(e) {
  var userInfo = {
    elementId   : e.target.id,
    elementName : e.target.nodeName,
    hostname    : window.location.hostname,
    styles      : myStyles
  };
  safari.self.tab.setContextMenuEventUserInfo(event, JSON.stringify(userInfo));
}
function handleKeyDownZoom(e) {
  if (e.metaKey && !e.shiftKey) {
    if (e.altKey && e.which === settings.shHotkey) {
      e.preventDefault();
      if (window === window.top) {
        if (qs) cancelHelper(true);
        else initiateQs();
      }
    } else
    if (e.which === 187 || e.which === 189 || e.which === 48) {
      e.preventDefault();
      cnk.target = document.body;
      switch (e.which) {
        case 187: {  // =
          cnkSetFontSize(1, e.altKey, true);
          break;
        }
        case 189: {  // -
          cnkSetFontSize(-1, e.altKey, true);
          break;
        }
        case 48: {  // 0
          if (settings.defaultZoom * 1 == 1)
            cnkResetStyle(true);
          else
            cnkSetZoom(settings.defaultZoom);
          break;
        }
      }
      if (settings.autoSaveStyles) {
        saveChanges();
      }
    }
  }
}
function handleMessage(e) {
  switch (e.name) {
    case 'AddTempRule':
      var r = new Rule(e.message.s, e.message.d);
      writeTempRules([r]);
      break;
    case 'ClearAllHighlights':
      if (window === window.top)
        clearAllHighlights();
      break;
    case 'HighlightSelectorMatches':
      if (window === window.top)
        highlightSelectorMatches(e.message);
      break;
    case 'InitiateSLS':
      if (window == window.top) {
        if (qs) cancelQs(true);
        else initiateQs();
      } break;
    case 'OpenStyleEditor':
      if (window == window.top) {
        saveStyleBoxData(true, e.message, false);
        insertStyleBox();
      } break;
    case 'ReceiveSettings':
      var receivedSettings = JSON.parse(e.message);
      for (var key in receivedSettings) {
        settings[key] = receivedSettings[key];
      }
      if (settings.useClickKeys != undefined) {
        if (settings.useClickKeys) {
          document.addEventListener('mousedown', initiateCnK, true);
        } else {
          document.removeEventListener('mousedown', initiateCnK, true);
        }
      }
      if (settings.handleZoomKeys != undefined) {
        if (settings.handleZoomKeys) {
          document.addEventListener('keydown', handleKeyDownZoom, false);
        } else {
          document.removeEventListener('keydown', handleKeyDownZoom, false);
        }
      }
      if (settings.oldFF != null || settings.oldFF2 != null) {
        var ffChanged = (function () {
          for (var p in settings.faveFont) {
            if (settings.faveFont[p] != settings.oldFF[p]) {
              return true;
            }
          }
          for (var p in settings.faveFont2) {
            if (settings.faveFont2[p] != settings.oldFF2[p]) {
              return true;
            }
          }
          return false;
        })();
        if (ffChanged) {
          safari.self.tab.dispatchMessage('PassStyles', {
            url      : location.href,
            hostname : location.hostname
          });
        }
      }
      settings.oldFF = settings.faveFont;
      settings.oldFF2 = settings.faveFont2;
      break;
    case 'ReceiveStyles':
      var message = JSON.parse(e.message);
      if (message.url === window.location.href || message.hostname === '*') {
        if (message.rules.length) {
          myStyles = new RuleSet(message.rules.map(function (rule) {
            return new Rule(rule.s, rule.d);
          }));
          writeStyles(myStyles);
        } else {
          removeStyles();
        }
      }
      break;
    case 'ReInitializePnS':
      settings.styleBoxStats = e.message;
      if (styleBox) {
        styleBox.initPnS();
        safari.self.tab.dispatchMessage('ResizeStyleEditor');
      } break;
    case 'RemoveStyleBox':
      if (window === window.top) {
        removeStyleBox();
      } break;
    case 'RestoreSavedRules':
      tempRules = new RuleSet();
      writeStyles(myStyles);
      break;
    default: ;
  }
}
function handleQsKeyDown(e) {
  e.preventDefault();
  var modkeys  = e.shiftKey * 1;
    modkeys += e.ctrlKey  * 2;
    modkeys += e.altKey   * 4;
    modkeys += e.metaKey  * 8;
  if (modkeys > 1)
    return;
  switch (e.which) {
    case 9:             // tab
      qs.preferId = !qs.preferId;
      showResultMsg(qs.lineage.toString()); // + '&nbsp; (preferring ' + (qs.preferId ? 'ID' : 'classname') + ')');
      new NoticeBox().say(qs.preferId ? 'ID overrides class' : 'Class overrides ID', 500);
      break;
    case 13: case 32: // enter, space
      saveStyleBoxData(false, false, e.shiftKey);
      if (!settings.usePopover)
        insertStyleBox();
      cancelQs(false);
      break;
    case 27:      // escape
      cancelQs(true);
      break;
    case 37: case 38: // left, up
      if (qs.lineage.array[qs.lineage.si] == document.body) {
        // do nothing
      } else {
        if (qs.lineage.si > 0) {
          qs.lineage.si--;
          qsUpdateSelection(qs.lineage.si + 1);
        }
      } break;
    case 39: case 40: // right, down
      if (qs.lineage.si < qs.lineage.array.length - 1) {
        qs.lineage.si++;
        qsUpdateSelection(qs.lineage.si - 1);
      } break;
    case 67:      // c
      prompt('Press ⌘C to copy.', qs.lineage.toString());
      break;
    case 68:      // d
      qsHideElement(qs.lineage.array[qs.lineage.si], e.shiftKey);
      break;
    case 70: case 49: // f,1
      qsApplyFaveFont(qs.lineage.array[qs.lineage.si], e.shiftKey, false);
      break;
    case 71: case 50: // g,2
      qsApplyFaveFont(qs.lineage.array[qs.lineage.si], e.shiftKey, true);
      break;
    case 65: case 187:        // a,=
      qsSetFontSize(qs.lineage.array[qs.lineage.si], 1, e.shiftKey);
      break;
    case 90: case 189:        // z,-
      qsSetFontSize(qs.lineage.array[qs.lineage.si], -1, e.shiftKey);
      break;
    case 81: case 82: case 48:    // q,r,0
      qsResetStyle(qs.lineage.array[qs.lineage.si]);
      break;
    default: break;
  }
}
function handleQsMouseDown(e) {
  if (e.button === 0) {
    document.addEventListener('click', ignoreClick, false);
    saveStyleBoxData(false, false, e.shiftKey);
    if (!settings.usePopover)
       insertStyleBox();
    cancelQs(false);
  }
}
function handleQsMouseMove(e) {
  highlightElement(e.fromElement, e.toElement);
  qs.currentElement = e.toElement;
  qs.lineage = qs.currentElement.getLineage();
  showResultMsg(qs.lineage.toString());
}
function highlightElement(fromElement, toElement) {
  if (fromElement) fromElement.unHighlight();
  toElement.highlight();
}
function highlightSelectorMatches(selector) {
  try {
    affectedElements = (selector) ? document.querySelectorAll(selector) : [];
    for (var i = 0; i < affectedElements.length; i++) {
      affectedElements[i].highlight();
    }
  } catch(err) {
    console.log('Invalid selector.');
  }
}
function ignoreClick(e) {
  e.preventDefault();
  // e.stopPropagation();
  document.removeEventListener('click', ignoreClick, false);
}
function ignoreKeypress(e) {
  if (!e.metaKey) {
    e.preventDefault();
    // e.stopPropagation();
  }
}
function initiateCnK(e) {
  if (targetSafeTest && !targetSafeTest(e.target)) {
    console.log('Target not safe; returning.');
    return;
  }
  if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)
    return;
  document.addEventListener('dragstart', cancelCnK, false);
  document.addEventListener('keypress', ignoreKeypress, true);
  document.addEventListener('keyup', handleCnKeyup, false);
  document.addEventListener('mouseup', cancelCnK, false);
  var selection = window.getSelection();
  var target = e.target;
  if (selection != '') {
    target = selection.getRangeAt(0).commonAncestorContainer;
    if (target.nodeName === '#text') {
      target = target.parentNode;
    }
  }
  cnk = { target: target };
}
function initiateQs() {
  document.addEventListener('mouseover', handleQsMouseMove, false);
  document.addEventListener('keydown', handleQsKeyDown, false);
  document.addEventListener('mousedown', handleQsMouseDown, false);
  new NoticeBox().say('Quickstyle Selector Helper activated.', 1000);
  qs = {};
}
function insertStyleBox() {
  removeStyleBox();
  document.addEventListener('keypress', removeStyleBox);
  styleBox = new StyleBox('cks_StyleBox');
  styleBox.initPnS();
  styleBox.insert();
  styleBox.adjustPosition();
}
function registerCnKeyUp() {
  if (cnk.engaged) return;
  cnk.engaged = true;
  document.addEventListener('mouseup', finishCnK, false);
  document.addEventListener('click', ignoreClick, false);
}
function removeStyleBox(e) {
  if (e == undefined || e.keyCode === 27 || e.button === 0) {
    if (document.getElementById('cks_StyleBox')) {
      if (!e || e.target !== styleBox) {
        styleBox.remove();
        document.removeEventListener('keypress', removeStyleBox);
      }
    }
  }
}
function removeStyles() {
  var styleElement = document.getElementById('QuickstyleCSS');
  if (styleElement) {
    document.querySelector('head').removeChild(styleElement);
  }
}
function qsApplyFaveFont(element, temporary, alternate) {
  var rule = {};
  var selector = element.getCompoundSelector(qs.preferId);
  var declarations = '';
  var ff = (alternate) ? settings.faveFont2 : settings.faveFont;
  declarations += 'font-family: ' + ff.family + '; ';
  declarations += 'font-size: '   + ff.size + '; ';
  declarations += 'line-height: ' + ff.lh;
  // console.log(element.getPageOffset().y - document.body.scrollTop);
  if (temporary) {
    writeTempRules([{s: selector, d: declarations}], element);
  } else {
    var r = myStyles.setRule(selector, declarations, true);
    writeStyles(myStyles, element);
    saveChanges();
  }
}
function qsHideElement(element, temporary) {
  var rule = {};
  var selector = element.getCompoundSelector(qs.preferId);
  var declaration = 'display: none !important;';
  if (temporary) {
    writeTempRules([{s: selector, d: declaration}]);
  } else {
    var r = myStyles.setRule(selector, declaration, true);
    writeStyles(myStyles);
    saveChanges();
  }
}
function qsResetStyle(element) {
  var selector = element.getCompoundSelector(qs.preferId);
  myStyles.deleteRule(selector);
  writeStyles(myStyles, element);
  console.log('Deleted rules for ' + selector);
  showResultMsg('Restored the default style for ' + selector, 3000);
  saveChanges();
}
function qsSetFontSize(element, increment, temporary) {
  var rule = {};
  var selector = element.getCompoundSelector(qs.preferId);
  var type = settings.useZoom ? 'zoom' : 'font';
  var newSize = element.getNewSize(type, increment);
  var declarations = '';
  if (type == 'zoom') {
    declarations += 'zoom: ' + newSize + ' !important;';
  } else {
    declarations += 'font-size: ' + newSize.fs + 'px !important;';
    declarations += newSize.lh ? ' line-height: ' + newSize.lh + 'px !important;' : '';
  }
  // console.log(element.getPageOffset().y - document.body.scrollTop);
  if (temporary) {
    writeTempRules([{s: selector, d: declarations}], element);
  } else {
    var r = myStyles.setRule(selector, declarations, true);
    writeStyles(myStyles, element);
    saveChanges();
  }
}
function qsUpdateSelection(oldSi){
  var fromElement = qs.lineage.array[oldSi];
  var toElement = qs.lineage.array[qs.lineage.si];
  highlightElement(fromElement, toElement);
  showResultMsg(qs.lineage.toString());
  qs.currentElement = toElement;
}
function saveChanges() {
  var message = { hostname: window.location.hostname, rules: myStyles.filter(excludeGlobal) };
  safari.self.tab.dispatchMessage('SaveRules', JSON.stringify(message));
}
function saveStyleBoxData(noSelector, global, preferId) {
  var message = {
    hostname: global ? '*' : window.location.hostname,
    selector: noSelector ? '' : qs.lineage.array[qs.lineage.si].getCompoundSelector(preferId || qs.preferId)
  };
  safari.self.tab.dispatchMessage('SaveStyleBoxData', message);
}
function showResultMsg(msg, timeout) {
  if (useStatusBar) {
    window.status = msg;
  } else {
    if (mbRemovalTimer) {
      window.clearTimeout(mbRemovalTimer);
    }
    if (document.getElementById('rsHrefBox')) {
      document.getElementById('rsHrefBox').style.visibility = 'hidden';
    }
    if (!msgbox) {
      msgbox = new MessageBox();
      msgbox.insert();
    }
    msgbox.say(msg);
    document.documentElement.appendChild(msgbox);
    if (timeout) {
      msgbox.removeAfter(timeout);
    }
  }
}
function unHighlightSelectorMatches(selector) {
  try {
    affectedElements = document.querySelectorAll(selector);
    for (var i=0; i < affectedElements.length; i++) {
      affectedElements[i].unHighlight();
    }
  } catch(err) {
    console.log('Invalid selector.');
  }
}
function writeStyles(rules, target) {
  var cssText = '';
  rules.forEach(function (rule) {
    cssText += rule.s + ' {' + rule.d + '}\n'
  });
  if (target) {
    if (target === document.body) {
      var rx = document.body.scrollLeft / document.body.scrollWidth;
      var ry = document.body.scrollTop / document.body.scrollHeight;
    } else {
      var targetOffset = target.getPageOffset();
      var oldX = targetOffset.x - document.body.scrollLeft;
      var oldY = targetOffset.y - document.body.scrollTop;
    }
  }
  myStyleElement.innerHTML = cssText;
  if (!document.getElementById('QuickstyleCSS')) {
    document.querySelector('head').appendChild(myStyleElement);
  }
  if (target) {
    if (target === document.body) {
      document.body.scrollLeft = document.body.scrollWidth * rx;
      document.body.scrollTop  = document.body.scrollHeight * ry;
    } else {
      var targetOffset = target.getPageOffset();
      document.body.scrollLeft = targetOffset.x - oldX;
      document.body.scrollTop  = targetOffset.y - oldY;
    }
  }
}
function writeTempRules(rules, target) {
  tempRules = myStyles.copy();
  tempRules.replace(rules);
  writeStyles(tempRules, target);
}

if (/^http/.test(location.href) || location.href === 'about:blank') {
  var hlOutlineStyle = '1px solid magenta';
  var hlBackgroundStyle = 'rgba(255,0,255,0.1)';

  var qs, cnk, affectedElements, tempRules, msgbox, mbRemovalTimer, styleBox;
  var settings = { oldFF: null, oldFF2: null };
  var myStyles = new RuleSet();
  var myStyleElement = document.createElement('style');
  var targetSafeTest = getTargetSafeTest();
  var safariVersion = parseInt(/\bSafari\/(\d+)/.exec(navigator.appVersion)[1]);
  var useStatusBar = window.statusbar.visible && safariVersion < 601;

  myStyleElement.id = 'QuickstyleCSS';

  safari.self.addEventListener('message', handleMessage, false);
  safari.self.tab.dispatchMessage('PassSettings', window.location.hostname);
  safari.self.tab.dispatchMessage('PassStyles', { url: location.href, hostname: location.hostname });
  safari.self.tab.dispatchMessage('EnableToolbarButton');

  document.addEventListener('contextmenu', handleContextMenu, false);
}
