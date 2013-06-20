/** <pre>
 * MediaWiki:Common.js
 * JavaScript here will load on both skins for every user
 */

/*global importArticles:true, importScript:true, importStylesheet:true, importScriptURI:true */

/**
 * @todo
 *  Remove deprecated addonloadhook
 *  Move wgVariable to mw.config.get('wgVariable')
 *  Remove deprecated importScriptURI
 *  Move conditional imports into importArticles()? (see below)
 */

/**
 * General reusable functions
 * Cookie functions should use $.cookie maybe?
 */

/**
 * Sets the cookie
 * @param c_name string Name of the cookie
 * @param value string 'on' or 'off'
 * @param expiredays integer Expiry time of the cookie in days
 */
function setCookie(c_name, value, expiredays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie = c_name + "=" + escape(value) + ";path=/" + ((expiredays === null)?"":";expires=" + exdate.toGMTString());
}
 
/**
 * Gets the cookie
 * @param c_name string Cookie name
 * @return The cookie name or empty string
 */
function getCookie(c_name) {
    if (document.cookie.length) {
        var c_start = document.cookie.indexOf(c_name + "=");
        if (c_start !== -1) {
            c_start = c_start + c_name.length + 1; 
            var c_end = document.cookie.indexOf(";", c_start);
            if (c_end === -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        } 
    }
    return "";
}
 
/**
 * Calls wiki API and returns the response in the callback
 * @param data named array List of parameters to send along with the request. {'format':'json'} is set automatically.
 * @param method string Either POST or GET.
 * @param callback function Thing to run when request is complete
 * @param addurl string (optional) Anything you may want to add to the request url, in case you need it.
 */
 
function callAPI(data, method, callback, addurl) {
    data['format'] = 'json';
    $.ajax({
        data: data,
        dataType: 'json',
        url: '/api.php' + (addurl?addurl:''),
        type: method,
        cache: false,
        success: function (response) {
            if (response.error) {
                mw.log('API error: ' + response.error.info);
            } else {
                callback(response);
            }
        },
        error: function (xhr, error) {
            mw.log('AJAX error: ' + error);
        }
    });
}
 
// http://www.mredkj.com/javascript/numberFormat.html#addcommas
function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.'),
        x1 = x[0],
        x2 = x.length > 1 ? '.' + x[1] : '',
        rgx = /(\d+)(\d{3})/;

    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/**
 * Matthew's Tundra library
 * Making stuff easier for MediaWiki things like editing pages, etc.
 * For documentation see https://github.com/Matthew2602/tundra/wiki
 */
// ResourceLoader throws an exception if you try and registered a module that is already registered
if (mw.loader.getModuleNames().indexOf("tundra") < 0) {
    mw.loader.implement("tundra", ["http://matthew2602.github.io/tundra/tundra.min.js"], {}, {});
}

/* ----------------------------------------------------------------------- */

/**
 * Variables for imported scripts
 * and importArticles()
 * These need to be global variables for the scripts to work
 */

// Variables for Dynamic Navigation Bars
var autoCollapse = 2,
    collapseCaption = "hide",
    expandCaption = "show",
    maxHeight = 300,
 
// Variables for Ajax Auto-Refresh
    ajaxPages = [
        "Special:RecentChanges",
        "Special:Watchlist",
        "Special:Log",
        "Special:Contributions",
        "Forum:Yew_Grove",
        "RuneScape:Active_discussions",
        "Special:AbuseLog",
        "Special:NewFiles",
        "Category:Speedy_deletion_candidates",
        "Category:Speedy_move_candidates",
        "Special:Statistics",
        "Special:NewPages",
        "Special:ListFiles",
        "Special:Log/move"
    ],
    AjaxRCRefreshText = 'Auto-refresh';

(function (window, $, mw) {

    'use strict';

    var scripts = [],
        styles = [],
        // cache mw.config variables to make conditionals a bit faster
        skin = mw.config.get('skin'),
        wgPageName = mw.config.get('wgPageName'),
        wgAction = mw.config.get('wgAction'),
        wgUserName = mw.config.get('wgUserName'),
        wgUserGroups = mw.config.get('wgUserGroups'),
        wgCanonicalNamespace = mw.config.get('wgCanonicalNamespace'),
        wgCanonicalSpecialPageName = mw.config.get('wgCanonicalSpecialPageName'),
        wgNamespaceNumber = mw.config.get('wgNamespaceNumber'),
        // for use with GED errors
        manualExchange;

    /**
     * Imports
     * 
     * Scripts to be imported using importArticles() added to scripts array
     * Stylesheets to be imported using importArticles() added to styles array
     */

    /**
     * Konami code
     */
    scripts.push('MediaWiki:Common.js/Konami.js');

    /**
     * UTC clock with purge link
     */
    scripts.push('MediaWiki:Common.js/displayTimer.js');

    /**
     * Histats
     */
    script.push('MediaWiki:Common.js/histats.js');

    if (wgAction === 'edit') {

        // tag: small script
        scripts.push('MediaWiki:Common.js/CEB.js'); // custom edit buttons
        // tag: small script
        scripts.push('MediaWiki:Common.js/tagswitch.js'); // youtube tags to {{youtube}}
        
        /**
         * Standard edit summaries
         */
        scripts.push('MediaWiki:Common.js/standardeditsummaries.js');

        if (wgCanonicalNamespace === 'Update') {

            /**
             * Notice when editing update pages
             */
            scripts.push('MediaWiki:Common.js/updateintro.js');

        }
    
        if (wgCanonicalNamespace === 'Exchange' && wgPageName.split('/')[1] === 'Data') {

            /**
             * Notice when editing Exchange /Data subpages
             */
            scripts.push('MediaWiki:Common.js/exchangeintro.js');
        }
    }
    
    // merge into main js
    if (wgAction === 'edit' || wgAction === 'submit') {
        if (wgPageName.match(/^[^:]*talk:/i) || wgPageName.match(/^Forum:/)) {
            // tag: small script
            scripts.push('User:Tyilo/signature.js'); // sig reminder
        }
    }

    if (wgAction === 'view') {

        /**
         * Embed IRC
         */
        if (wgPageName === 'RuneScape:Off-site/IRC') {
            scripts.push('MediaWiki:Common.js/embedirc.js'); // embed irc
        }

        /**
         * Check old page revisions for vandalism
         */
        if (wgPageName === 'RuneScape:RC_Patrol') {
            scripts.push('User:Suppa_chuppa/rcpatrol.js');
            styles.push('User:Suppa_chuppa/rcp.css');
        }
    
        /**
         *
         */
        if (wgPageName === 'MediaWiki:Namespace_numbers') {
            scripts.push('MediaWiki:Common.js/namespaceNumbersList.js');
        }
        
        /**
         * Form for reporting users on [[RS:CVU]]
         */
        if (wgPageName === 'RuneScape:Counter-Vandalism_Unit') {
            scripts.push('User:Suppa_chuppa/cvu.js');
        }
    
        /**
         * Add edit links to [[Special:WhatLinksHere]]
         */
        if (wgCanonicalSpecialPageName === 'Whatlinkshere') {
            scripts.push('MediaWiki:Common.js/WLH_edit.js');
        }

        /**
         * Add custom price input for Exchange pages
         * To be used when GED is not working correctly
         * Remember to update [[MediaWiki:Group-autoconfirmed.js]]
         * If GED stops working completely add Quarenon's script to importArticles() statement above
         * See [[RuneScape:Exchange namespace]] for more details
         */
        manualExchange = [
            // add pages here
        ];
        
        if ($.inArray(wgPageName), manualExchange) > -1) {
            scripts.push('User:Quarenon/gemwupdate.js');
        }

        /**
         * Ajax refresh for various pages
         */
        if ($.inArray(wgPageName), ajPages) > -1) {
            scripts.push('u:dev:AjaxRC/code.js');
        }
        
        /**
         * Peng hunting highlight table
         */
        if (wgPageName === 'Distractions_and_Diversions_Locations' || wgPageName === 'Distractions_and_Diversions_Locations/Penguin_Hide_and_Seek') {
            scripts.push('MediaWiki:Common.js/pengLocations.js');
        }

        /**
         * Some survey thing on [[RuneScape:Survey]]
         * Doesn't seem to work anymore
         */
        if (wgPageName === 'RuneScape:Survey') {
            scripts.push('User:Quarenon/survey.js');
        }        

    }
    
    /**
     * Hide Auto-uploads
     */
    if (wgPageName === 'Special:Log') {
        scripts.push('User:AzBot/HideBotUploads.js');
    }

    /**
     * Countdown timer
     */
    if ($('.countdown').length) {
        scripts.push('MediaWiki:Common.js/countdowntimer.js'); // count-down timer
    }

    /**
     * Youtube embedding
     */
    if ($('.youtube').length) {
        scripts.push('MediaWiki:Common.js/youtube.js'); // youtube embed
    }

    /**
     * Collapsible tables
     * Should really be replaced by native mw- class
     */
    if ($('.collapsible').length) {
        scripts.push('MediaWiki:Common.js/collapsibletables.js');
    }
    
    /**
     * Embed audio
     */
    if ($('.embedMe').length) {
        scripts.push('MediaWiki:Common.js/embedding.js');
    }
    
    /**
     * Highlight tables
     */
    if ($('.lighttable').length) {
        scripts.push('MediaWiki:Common.js/highlightTable.js'); // highlight tables
    }
    
    /**
     * Rewrite page titles
     */
    if ($('#title-meta').length) {
        scripts.push('MediaWiki:Common.js/pagetitle.js');
    }
    
    /**
     * Calculator script
     * [[Forum:New javascript calculators]]
     */
    if ($('.jcInput').length || $('[class*="jcPane"]').length) {
        scripts.push('User:Stewbasic/calc.js');
    }

    /**
     * GE Charts
     */
    if ($('.GEdatachart').length) {
        // replace these with mw.loader things
        importScriptURI('http://code.highcharts.com/stock/highstock.js').onload = function() {
            scripts.push('MediaWiki:Common.js/GECharts.js');
        };

        if ($.browser.msie && parseFloat($.browser.version) < 9) {
            scripts.push('MediaWiki:Common.js/GECharts.js');
        }
    }

    /**
     * Item Compare Overlays
     */
    if ($('#mw-content-text .cioCompareLink').length) {
        scripts.push('MediaWiki:Common.js/compare.js');
        styles.push('MediaWiki:Common.css/compare.css');
    }

    /**
     * Dynamic Templates
     */
    if ($('#mw-content-text .jcConfig').length) {
        scripts.push('MediaWiki:Common.js/calc.js');
        styles.push('MediaWiki:Common.css/calc.css');
    }

    /**
     * Special page report
     */
    if ($('.specialMaintenance').length) || wgCanonicalSpecialPageName === 'Specialpages') {
        scripts.push('MediaWiki:Common.js/spreport.js');
    }

    /**
     * Autosort tables
     * tag: small script
     */
    if ($('.sortable').length) {
        scripts.push('User:Tyilo/autosort.js');
    }

    /**
     * Add to charm logs
     * @todo get conditional for this off joey
     */
    if () {
    scripts.push('User:Joeytje50/Dropadd.js')
    }

    /**
     * Switch infobox
     */
    if ($('.switch-infobox').length) {
        scripts.push('User:Matthew2602/SwitchInfobox.js');
    }

    /**
     * Adds calcs to infoboxes
     * @todo get conditional for this off joey
     */
    if () {
    scripts.push('User:Joeytje50/monstercalc.js');
    }

    if (skin === 'monobook') {

        /**
         * Added sitenotice functionality
         */
        scripts.push('MediaWiki:Common.js/sitenotice.js');

        /**
         * Template preloads for monobook
         */
        if (wgAction === 'edit') {
            scripts.push('MediaWiki:Common.js/preload.js');
        }

    }

    if (skin === 'oasis') {
        // oasis specific js here
    }
  
    // ?debug=true to see these
    mw.log(scripts);
    mw.log(styles);

/*      tag: small script, merge with below
        "MediaWiki:Common.js/navigationbars.js",        // Dynamic Nav Bars
        "MediaWiki:Common.js/navigationbars2.js",       // Dynamic Nav (2)
*/

    /**
     * Custom edit buttons
     */
    function customEditButtons() {

		// Redirect
		mwCustomEditButtons[mwCustomEditButtons.length] = {
			"imageFile": "http://images.wikia.com/central/images/c/c8/Button_redirect.png",
			"speedTip": "Redirect",
			"tagOpen": "#REDIRECT [[",
			"tagClose": "]]",
			"sampleText": "Insert text"
		};
 
		// Wikitable
		mwCustomEditButtons[mwCustomEditButtons.length] = {
			"imageFile": "http://images3.wikia.nocookie.net/central/images/4/4a/Button_table.png",
			"speedTip": "Insert a table",
			"tagOpen": '{| class="wikitable"\n|-\n',
			"tagClose": "\n|}",
			"sampleText": "! header 1\n! header 2\n! header 3\n|-\n| row 1, cell 1\n| row 1, cell 2\n| row 1, cell 3\n|-\n| row 2, cell 1\n| row 2, cell 2\n| row 2, cell 3"
		};
 
		// Line break
		mwCustomEditButtons[mwCustomEditButtons.length] = {
			"imageFile": "http://images2.wikia.nocookie.net/central/images/1/13/Button_enter.png",
			"speedTip": "Line break",
			"tagOpen": "<br>",
			"tagClose": "",
			"sampleText": ""
		};
 
		// Gallery
		mwCustomEditButtons[mwCustomEditButtons.length] = {
			"imageFile": "http://images2.wikia.nocookie.net/central/images/1/12/Button_gallery.png",
			"speedTip": "Insert a picture gallery",
			"tagOpen": '\n<div style="text-align:center"><gallery>\n',
			"tagClose": "\n</gallery></div>",
			"sampleText": "File:Example.jpg|Caption1\nFile:Example.jpg|Caption2"
		};
 
	}

    /**
     * Redirects from /User:UserName/skin.js or .css to the user's actual skin page
     */
    function skinRedirect() {

        var urlUsername = wgUserName.replace(/ /g, '_'),
            replaceSkin = skin.replace('oasis', 'wikia');

        // skin.css
        if (wgPageName === 'User:' + urlUsername + '/skin.css') {
            window.location.href = window.location.href.replace(/\/skin.css/i, '/' + replaceSkin + '.css');
        }

        // skin.js
        if (wgPageName === 'User:' + urlUsername + '/skin.js') {
            window.location.href = window.location.href.replace(/\/skin.js/i, '/' + replaceSkin + '.js');
        }
    }

    $(function () {

        /**
         * Large script imports
         */
        importArticles({
            type: 'script',
            articles: scripts
        }, {
            type: 'style',
            articles: styles
        });
        
        /**
         * Function invocations
         */
        
        // redirects skin.js to monobook/wikia.js
        if (wgUserName !== null && wgCanonicalNamespace === 'User') {
            skinRedirect();
        }

        // custom edit buttons
        if (wgAction === 'submit' || wgAction === 'edit') {
            if (mwCustomEditButtons.length) {
                customEditButtons();
            }
        }

        
        /**
         * Code snippets
         */         
        // Hide edit button on exchange pages for anons
        if (wgUserName === null) {
            $('.anonmessage').css('display', 'inline');
        }

        // Podomatic, hosts of Jagex podcasts, is blocked by Wikia spam filters
        // This adds some text below the spam block notice directing them to the template to be used instead
        if ($('#spamprotected').text().search('podomatic') > -1) {
            $('#spamprotected').append('<hr><p>To add links to Jagex podcasts please use <a href="/wiki/Template:Atl_podcast">Template:Atl podcast</a>. If the podcast you would like to link to is not found in the template, please leave a message <a href="/wiki/RuneScape:Administrator_requests">here</a>.</p>');
        }

        /**
         * Insert username
         */
        if (wgAction === 'view' && wgUserName !== null) {
            $('.insertusername').text(wgUserName);
        }
        
    });

}(this, this.jQuery, this.mediaWiki));

/* </pre> */