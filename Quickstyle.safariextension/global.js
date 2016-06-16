function addRule(hostname, selector, declarations, index) {
  if (localStorage[hostname]) {
    var rules = JSON.parse(localStorage[hostname]);
    var newRule = {
      s : selector,
      d : declarations
    };
    rules.splice(index, 0, newRule);
  } else {
    rules = [{
      s : selector,
      d : declarations
    }];
  }
  localStorage[hostname] = JSON.stringify(rules);
}
function deleteRule(hostname, selector) {
  var rules = JSON.parse(localStorage[hostname]);
  rules.forEach(function (rule, index) {
    if (rule.s == selector) {
      var deleted = rules.splice(index, 1);
      console.log('Deleted: ' + deleted.s + ' {' + deleted.d + '}');
      return;
    }
  });
  if (rules.length === 0) {
    delete localStorage[hostname];
  } else {
    localStorage[hostname] = JSON.stringify(rules);
  }
}
function getHostnameFromUrl(url) {
  se.tempAnchor = se.tempAnchor || document.createElement('a');
  se.tempAnchor.href = url;
  return se.tempAnchor.hostname;
}
function handleContextMenu(event) {
  if (se.settings.hideCMItems) return;
  if (!event.userInfo) return;
  var userInfo = JSON.parse(event.userInfo);
  if (userInfo.elementName == 'A') return;

  if (userInfo.elementId == 'cks_StyleBox') {
    event.contextMenu.appendContextMenuItem(
      'ResetStyleBoxStats', 'Reset Size and Position'
    );
  } else {
    event.contextMenu.appendContextMenuItem(
      'InitiateSLS', 'Activate Quickstyle Selector Helper'
    );
    event.contextMenu.appendContextMenuItem(
      'OpenStyleEditorLocal', 'Edit Quickstyles for ' + userInfo.hostname
    );
    event.contextMenu.appendContextMenuItem(
      'OpenStyleEditorGlobal', 'Edit Quickstyles for All Sites'
    );
  }
}
function handleCommand(event) {
  switch (event.command) {
    case 'InitiateSLS':
      var targetTab = sa.activeBrowserWindow.activeTab;
      targetTab.page.dispatchMessage('InitiateSLS');
      break;
    case 'OpenStyleEditorLocal':
      var userInfo = event.userInfo ? JSON.parse(event.userInfo) : null;
      var activeTab = sa.activeBrowserWindow.activeTab;
      if (se.toolbarItems.length && se.popovers && se.settings.usePopover) {
        var hostname = userInfo ? userInfo.hostname : getHostnameFromUrl(activeTab.url);
        var data = {
          hostname: hostname,
          rules: retrieveRules(hostname, false),
          selector: null,
          stats: se.settings.styleBoxStats
        };
        showPopover(data);
      } else
        activeTab.page.dispatchMessage('OpenStyleEditor', false);
      break;
    case 'OpenStyleEditorGlobal':
      var activeTab = sa.activeBrowserWindow.activeTab;
      if (se.toolbarItems.length && se.popovers && se.settings.usePopover) {
        var hostname = '*';
        var data = {
          hostname: hostname,
          rules: retrieveRules(hostname, false),
          selector: null,
          stats: se.settings.styleBoxStats
        };
        showPopover(data);
      } else
        activeTab.page.dispatchMessage('OpenStyleEditor', true);
      break;
    case 'ResetStyleBoxStats':
      if (se.toolbarItems.length && se.popovers && se.settings.usePopover) {
        po.height = se.settings.popoverHeight = defaults.styleBoxStats.height;
      } else {
        var targetTab = sa.activeBrowserWindow.activeTab;
        se.settings.styleBoxStats = defaults.styleBoxStats;
        targetTab.page.dispatchMessage('ReInitializePnS', se.settings.styleBoxStats);
      }
      break;
    default: ;
  }
}
function handleMessage(event) {
  switch (event.name) {
    case 'EnableToolbarButton':
      se.toolbarItems.forEach(function(ti) {
        if (ti.browserWindow && ti.browserWindow.activeTab == event.target) {
          ti.enabled = true;
        }
      });
      break;
    case 'PassSettings':
      var settings = {};
      for (var key in se.settings) {
        if (key == 'shHotkey') settings[key] = se.settings[key].charCodeAt(0);
        else settings[key] = se.settings[key];
      }
      event.target.page.dispatchMessage('ReceiveSettings', JSON.stringify(settings));
      break;
    case 'PassStyles':
      var message = {
        url: event.message.url,
        hostname: event.message.hostname,
        rules: retrieveRules(event.message.hostname, true)
      };
      if (message.rules.length)
        event.target.page.dispatchMessage('ReceiveStyles', JSON.stringify(message));
      break;
    case 'SaveRules':
      var message = JSON.parse(event.message);
      saveRules(message.hostname, message.rules);
      break;
    case 'SaveRulesAndSendToPage':
      var message = JSON.parse(event.message);
      saveRules(message.hostname, message.rules);
      passRulesToTarget(event.target, message.hostname);
      break;
    case 'SaveStyleBoxData':
      console.log('SaveStyleBoxData', event.message);
      styleBoxData = event.message;
      styleBoxData.rules = retrieveRules(styleBoxData.hostname, false);
      styleBoxData.stats = se.settings.styleBoxStats;
      if (se.toolbarItems.length && se.popovers && se.settings.usePopover)
        showPopover(styleBoxData);
      break;
    case 'PassStyleBoxData':
      event.target.page.dispatchMessage('ReceiveStyleBoxData', styleBoxData);
      break;
    case 'HighlightSelectorMatches':
      event.target.page.dispatchMessage('HighlightSelectorMatches', event.message);
      break;
    case 'ClearAllHighlights':
      event.target.page.dispatchMessage('ClearAllHighlights');
      break;
    case 'DeleteRules':
      event.message.selectors.forEach(function(selector) {
        deleteRule(event.message.hostname, selector);
      });
      passRulesToTarget(event.target, event.message.hostname);
      break;
    case 'PreviewRule':
      event.target.page.dispatchMessage('AddTempRule', event.message);
      break;
    case 'CancelRulePreview':
      event.target.page.dispatchMessage('RestoreSavedRules');
      break;
    case 'SaveLeftDivWidth':
      var sbs = se.settings.styleBoxStats;
      sbs.ldw = event.message;
      se.settings.styleBoxStats = sbs;
      break;
    case 'ResizeStyleEditor':
      event.target.page.dispatchMessage('ResizeYourself');
      break;
    case 'RemoveStyleBox':
      event.target.page.dispatchMessage('RemoveStyleBox');
      break;
    case 'SaveStyleBoxPosition':
      var sbs = se.settings.styleBoxStats;
      sbs.left = event.message.left;
      sbs.top = event.message.top;
      se.settings.styleBoxStats = sbs;
      break;
    case 'SaveStyleBoxSize':
      var sbs = se.settings.styleBoxStats;
      sbs.width = event.message.width;
      sbs.height = event.message.height;
      se.settings.styleBoxStats = sbs;
      break;
    default: ;
  }
}
function handleSettingChange(event) {
  console.log('new value for', event.key, ':', event.newValue);
  if (event.newValue !== event.oldValue) {
    switch (event.key) {
      case 'shHotkey':
        if (event.newValue.length > 1) {
          se.settings.shHotkey = event.newValue.charAt(0);
          break;
        }
        if (event.newValue.toUpperCase() !== event.newValue) {
          se.settings.shHotkey = event.newValue.toUpperCase();
          break;
        }
      case 'useClickKeys':
      case 'handleZoomKeys':
      case 'useZoom':
      case 'preferWoB':
      case 'autoSaveStyles':
        passSettingsToAllPages([event.key]);
        break;
      case 'defaultZoom':
        if (!parseFloat(event.newValue)) {
          se.settings.defaultZoom = event.oldValue;
          alert('Please enter a number like 1.2.');
        } else {
          if (event.newValue * 1 < 0) {
            se.settings.defaultZoom = event.oldValue;
            alert('Please enter a number greater than 0.');
          } else
          if (/% *$/.test(event.newValue)) {
            se.settings.defaultZoom = (parseFloat(event.newValue) / 100) + '';
          } else {
            passSettingsToAllPages([event.key]);
          }
        }
        break;
      case 'faveFontString':
        if (event.newValue == '') {
          se.settings.faveFontString = defaults.faveFont.font;
          se.settings.faveFont = defaults.faveFont;
        } else {
          var re = /^\S+\/\S+ \S+/;
          if (re.test(event.newValue)) {
            se.settings.faveFont = parseFontString(event.newValue, false);
            passSettingsToAllPages(['faveFont']);
          } else {
            alert(ffAlert);
            se.settings.faveFontString = event.oldValue;
          }
        }
        break;
      case 'faveFont2String':
        if (event.newValue == '') {
          se.settings.faveFont2String = defaults.faveFont2.font;
          se.settings.faveFont2 = defaults.faveFont2;
        } else {
          var re = /^\S+\/\S+ \S+/;
          if (re.test(event.newValue)) {
            se.settings.faveFont2 = parseFontString(event.newValue, true);
            passSettingsToAllPages(['faveFont2']);
          } else {
            alert(ffAlert);
            se.settings.faveFont2String = event.oldValue;
          }
        }
        break;
      case 'openHelp':
        sa.activeBrowserWindow.openTab().url = 'http://canisbos.com/quickstyle#howtouse';
        break;
      default:
        ;
    }
  }
}
function handleValidate(event) {
  if (event.target instanceof SafariExtensionToolbarItem) {
  var thisTab = event.target.browserWindow.activeTab;
  event.target.disabled = !thisTab.url;
  }
}
function initialize() {
  initializeGlobals();
  initializeSettings();
  resetToolbarItems();
  po.width  = defaults.styleBoxStats.width;
  po.height = se.settings.popoverHeight;

  for (var k in localStorage) {
    if (localStorage[k] == '[]') delete localStorage[k];
  }

  sa.addEventListener('validate', handleValidate, true);
  sa.addEventListener('contextmenu', handleContextMenu, true);
  sa.addEventListener('command', handleCommand, true);
  sa.addEventListener('message', handleMessage, true);
  se.settings.addEventListener('change', handleSettingChange, false);
  pw.addEventListener('blur', resetToolbarItems, false);

  return true;
}
function initializeGlobals() {
  sa = safari.application;
  se = safari.extension;
  po = se.popovers ? se.popovers[0] : null;
  pw = po ? po.contentWindow : null;
  styleBoxData = {};
  ffAlert = 'Please specify both a font size and a line height, separated with a slash.\n\n'
      + 'Examples:\n\n'
      + '   14px/22px Helvetica\n'
      + '   12pt/1.5 Segoe UI\n'
      + '   larger/normal Courier New\n\n'
      + 'To restore the default setting, clear the box and then close the Extensions window.'
  defaults = {
    faveFont   : {
      font   : '15px/20px Helvetica',
      family : 'Helvetica !important /*fff*/',
      size   : '15px !important /*ffs*/',
      lh     : '20px !important /*ffh*/'
    },
    faveFont2  : {
      font   : '16px/1.5 Georgia',
      family : 'Georgia !important /*ff2f*/',
      size   : '16px !important /*ff2s*/',
      lh     : '1.5 !important /*ff2h*/'
    },
    styleBoxStats : {
      left   : undefined,
      top    : undefined,
      width  : 800,
      height : 200,
      ldw    : 280
    },
    faveFontString  : '15px/20px Helvetica',
    faveFont2String : '16px/1.5 Georgia',
    handleZoomKeys  : true,
    useZoom         : false,
    preferWoB       : false,
    autoSaveStyles  : true,
    shHotkey        : 'Y',
    useClickKeys    : true,
    hideCMItems     : false,
    usePopover      : !!(se.popovers),
    popoverHeight   : 200,
    defaultZoom     : '1.0'
  };
}
function initializeSettings() {
  var lastVersion = se.settings.lastVersion;
  for (var key in defaults) {
    if (se.settings[key] === undefined) {
      se.settings[key] = defaults[key];
    }
  }
  if (lastVersion < 1000) {
    reformSiteRules();
  }
  se.settings.lastVersion = 1203;
}
function listHosts(hostname) {
  hostname = hostname || '';
  var matchingHostnames = [];
  for (var hn in localStorage) {
    if (hn.match(hostname)) {
      matchingHostnames.push(hn);
    }
  }
  matchingHostnames.sort();
  console.log(matchingHostnames);
}
function listRules(hostname) {
  if (hostname === '*') {
    var rules = JSON.parse(localStorage['*']);
    rules.forEach(function (rule) {
      console.log(' ' + rule.s + ' {' + rule.d + '}');
    });
  } else {
    hostname = hostname || '';
    for (var hn in localStorage) {
      if (hn.match(hostname)) {
        console.log(hn);
        var rules = JSON.parse(localStorage[hn]);
        rules.forEach(function (rule) {
          console.log(' ' + rule.s + ' {' + rule.d + '}');
        });
      }
    }
  }
}
function parseFontString(fs, alt) {
  return {
    font   : fs,
    family : fs.slice(fs.indexOf(' ') + 1)  + ' !important /*ff' + (alt ? '2' : '') + 'f*/',
    size   : fs.split('/')[0]               + ' !important /*ff' + (alt ? '2' : '') + 's*/',
    lh     : fs.split('/')[1].split(' ')[0] + ' !important /*ff' + (alt ? '2' : '') + 'h*/'
  };
}
function passRulesToTarget(target, hostname) {
  var thisWindow = {};
  var thisTab = {};
  for (var i = 0; i < sa.browserWindows.length; i++) {
    thisWindow = sa.browserWindows[i];
    for (var j = 0; j < thisWindow.tabs.length; j++) {
      thisTab = thisWindow.tabs[j];
      if (thisTab.page !== undefined) {
        var tabHostname = getHostnameFromUrl(thisTab.url);
        if (hostname === '*' || hostname === tabHostname) {
          var rules = retrieveRules(tabHostname, true);
          console.log('Passing styles to page at ' + thisTab.url, rules);
          var message = {
            url      : thisTab.url,
            hostname : tabHostname,
            rules  : rules
          };
          thisTab.page.dispatchMessage('ReceiveStyles', JSON.stringify(message));
        }
      }
    }
  }
}
function passSettingsToAllPages(keys) {
  var message = {};
  keys.forEach(function (key) {
    if (key == 'shHotkey') {
      message[key] = se.settings[key].charCodeAt(0);
    } else {
      message[key] = se.settings[key];
    }
    console.log('Passing ' + key + ':', message[key]);
  });
  var thisWindow = {};
  var thisTab = {};
  for (var j = 0; j < sa.browserWindows.length; j++) {
    thisWindow = sa.browserWindows[j];
    for (var k = 0; k < thisWindow.tabs.length; k++) {
      thisTab = thisWindow.tabs[k];
      if (thisTab.page !== undefined) {
        console.log('Sending message to: ' + thisTab.title);
        thisTab.page.dispatchMessage('ReceiveSettings', JSON.stringify(message));
      }
    }
  }
}
function reformSiteRules() {
  for (var hostname in localStorage) {
    var rulesObject = JSON.parse(localStorage[hostname]);
    var rulesArray = [];
    for (var selector in rulesObject) {
      rulesArray.push({
        s : selector,
        d : rulesObject[selector].replace(/[{}]/g, '')
      });
    }
    localStorage[hostname] = JSON.stringify(rulesArray);
  }
}
function resetToolbarItems() {
  se.toolbarItems.forEach(function (tbi) {
    tbi.popover = null;
    tbi.menu = se.menus[0];
  });
}
function retrieveRules(hostname, withGlobal) {
  function replaceMarkers(rule) {
    rule.d = rule.d
      .replace('$fff', se.settings.faveFont.family)
      .replace('$ffs', se.settings.faveFont.size)
      .replace('$ffh', se.settings.faveFont.lh)
      .replace('$ff2f', se.settings.faveFont2.family)
      .replace('$ff2s', se.settings.faveFont2.size)
      .replace('$ff2h', se.settings.faveFont2.lh);
    return { s: rule.s, d: rule.d };
  }
  function addGlobalComment(rule) {
    return { s: rule.s, d: rule.d + ' /*global*/' };
  }
  function retrieveGlobalRules() {
    if (localStorage['*']) {
      var globalRules = JSON.parse(localStorage['*']).map(replaceMarkers);
      if (hostname !== '*')
        globalRules = globalRules.map(addGlobalComment);
      return globalRules;
    }
    else return [];
  }
  function retrieveLocalRules() {
    if (localStorage[hostname])
      return JSON.parse(localStorage[hostname]).map(replaceMarkers);
    else return [];
  }
  if (hostname === '*' || (!localStorage[hostname] && withGlobal)) {
    return retrieveGlobalRules();
  } else {
    return (withGlobal) ? retrieveGlobalRules().concat(retrieveLocalRules()) : retrieveLocalRules();
  }
}
function saveRules(hostname, rules) {
  if (rules.length === 0) {
    delete localStorage[hostname];
    return;
  }
  console.log(rules[0].d);
  var mr = rules.map(function (rule) {
    console.log('rule:', rule);
    var declarations = rule.d.split('; ').map(function (dec) {
      return (
        dec.match(/\*fff\*/)  ? 'font-family: $fff'  :
        dec.match(/\*ffs\*/)  ? 'font-size: $ffs'    :
        dec.match(/\*ffh\*/)  ? 'line-height: $ffh'  :
        dec.match(/\*ff2f\*/) ? 'font-family: $ff2f' :
        dec.match(/\*ff2s\*/) ? 'font-size: $ff2s'   :
        dec.match(/\*ff2h\*/) ? 'line-height: $ff2h' :
        dec
      );
    });
    console.log('declarations:', declarations);
    return { s : rule.s, d : declarations.join('; ') };
  });
  console.log(mr[0].d);
  localStorage[hostname] = JSON.stringify(mr);
  listRules(hostname);
}
function showPopover(data) {
  // data : {hostname, rules, selector, stats}
  pw.finishInit(data);
  se.toolbarItems.forEach(function (tbi) {
    if (tbi.browserWindow == sa.activeBrowserWindow) {
      tbi.popover = po;
      tbi.showPopover();
    }
  });
}

initialize();
