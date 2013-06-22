/** <pre>
 * MediaWiki:Common.js
 * JavaScript here will load on both skins for every user
 */

/*global importArticles:true, jQuery:true, mediaWiki:true */
/*jshint curly: true, devel: false */

/**
 * @todo
 *  Remove deprecated addonloadhook
 *  Move wgVariable to mw.config.get('wgVariable')
 */

/**
 * Sets the cookie
 * @param c_name string Name of the cookie
 * @param value string 'on' or 'off'
 * @param expiredays integer Expiry time of the cookie in days
 * @param path
 */
function setCookie(c_name, value, expiredays, path) {

    'use strict';

    var options = {};

    if (expiredays) {
        options.expires = expiredays;
    }

    if (path) {
        options.path = path;
    }

    jQuery.cookie(c_name, value, options);

}

/**
 * Gets the cookie
 * @param c_name string Cookie name
 * @return The cookie name or empty string
 */
function getCookie(c_name) {

    'use strict';

    var cookie = jQuery.cookie(c_name);

    if (cookie === null) {
        cookie = '';
    }

    return cookie;

}

/**
 * Calls wiki API and returns the response in the callback
 * @param data named array List of parameters to send along with the request. {'format':'json'} is set automatically.
 * @param method string Either POST or GET.
 * @param callback function Thing to run when request is complete
 * @param addurl string (optional) Anything you may want to add to the request url, in case you need it.
 */
function callAPI(data, method, callback, addurl) {

    'use strict';

    data['format'] = 'json';
    jQuery.ajax({
        data: data,
        dataType: 'json',
        url: '/api.php' + (addurl ? addurl : ''),
        type: method,
        cache: false,
        success: function (response) {
            if (response.error) {
                mediaWiki.log('API error: ' + response.error.info);
            } else {
                callback(response);
            }
        },
        error: function (xhr, error) {
            mediaWiki.log('AJAX error: ' + error);
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
 * Vars for AjaxRC
 * Need to be global for the script to work
 */
var ajaxPages = [
        'Special:RecentChanges',
        'Special:Watchlist',
        'Special:Log',
        'Special:Contributions',
        'Forum:Yew_Grove',
        'RuneScape:Active_discussions',
        'Special:AbuseLog',
        'Special:NewFiles',
        'Category:Speedy_deletion_candidates',
        'Category:Speedy_move_candidates',
        'Special:Statistics',
        'Special:NewPages',
        'Special:ListFiles',
        'Special:Log/move'
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
        wgCanonicalSpecialPageName = mw.config.get('wgCanonicalSpecialPageName'),
        wgNamespaceNumber = mw.config.get('wgNamespaceNumber'), // use this for namespace checks
        // for use with GED errors
        manualExchange;

    /**
     * Change <youtube>video</youtube> to {{youtube|video}}
     * Runs when save button is clicked
     */     
    function tagSwitch() {

        'use strict';
 
        var wikitext = $('#wpTextbox1').html();
 
        wikitext = wikitext.replace(/&lt;youtube&gt;/g, '{{youtube|');
        wikitext = wikitext.replace(/&lt;\/youtube&gt;/g, '}}');
 
        $('#wpTextbox1').html(wikitext);
 
    }

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

    /**
     * Collapses navboxes under certain conditions
     */
    function navbox() {

        var expand = 'Expand', // defined by [[MediaWiki:Collapsible-expand]]
            navboxes = $('.navbox'),
            maxShow = 2,     // maximum number of navboxes before they all get collapsed
            maxHeight = 300, // maximum allowable height of navbox before it gets collapsed
            i;

        // @param elem - navbox to be collapsed
        function collapseNavbox(elem) {

            var rows,
                j,
                toggle;

            // temp check until cache is updated
            if ($(elem).hasClass('mw-collapsible') === false) {
                return;
            }

            if ($(elem).hasClass('mw-collapsed')) {
                return;
            }

            // add the collapsed class
            $(elem).addClass('mw-collapsed');

            // make sure we aren't selecting any nested navboxes
            rows = $(elem).children('tbody').children('tr');

            // rows[0] is the header
            for (j = 1; j < rows.length; j += 1) {
                $(rows[j]).css({
                    'display': 'none'
                });
            }

            // toggle is always in header
            toggle = $(rows[0]).find('.mw-collapsible-toggle');

            // this class is required to make expand work properly
            $(toggle).addClass('mw-collapsible-toggle-collapsed');
            $(toggle).children('a').text(expand);

        }

        // collapse if more than maxShow
        if (navboxes.length > (maxShow - 1)) {
            for (i = 0; i < navboxes.length; i += 1) {
                collapseNavbox(navboxes[i]);
            }
        }

        // collapse if taller than maxHeight
        for (i = 0; i < navboxes.length; i += 1) {
            if ($(navboxes[i]).height() > maxHeight) {
                collapseNavbox(navboxes[i]);
            }
        }

    }

    /**
     * Signature reminder on forum namespace and talk pages
     */
    sigReminder function (event) {
        if (typeof enforceSign === 'undefined') {
            enforceSign = true;
        }
    
        var text = $('#cke_wpTextbox1 iframe').contents().find('#bodyContent').text() || $('#wpTextbox1').val();
    
        if (
            enforceSign &&
            !$('#wpMinoredit').is(':checked') &&
            !text.replace(/(<nowiki>.*?<\/nowiki>)/g, '').match('~~~') &&
            !window.location.search.match(/(?:\?|&)undo=/)
        ) {
            if (!confirm('It looks like you forgot to sign your comment. You can sign by placing 4 tildes (~~~~) to the end of your message. \nAre you sure you want to post it?')) {
                event.preventDefault();
            }
        }
    });

    $(function () {
    
        /**
         * Imports
         * 
         * Scripts to be imported using importArticles() added to scripts array
         * Stylesheets to be imported using importArticles() added to styles array
         */

        scripts.push('MediaWiki:Common.js/Konami.js');       // Konami code
        scripts.push('MediaWiki:Common.js/displayTimer.js'); // UTC clock with purge link
        script.push('MediaWiki:Common.js/histats.js');       // Histats

        if (wgAction === 'edit') {

            scripts.push('MediaWiki:Common.js/standardeditsummaries.js'); // Standard edit summaries

            if (wgNamespaceNumber === 100) {
                scripts.push('MediaWiki:Common.js/updateintro.js'); // Notice when editing update pages
            }
            if (wgNamespaceNumber === 112 && wgPageName.split('/')[1] === 'Data') {
                scripts.push('MediaWiki:Common.js/exchangeintro.js'); // Notice when editing Exchange /Data subpages        
            }
        }

        if (wgAction === 'view') {

            if (wgPageName === 'RuneScape:Off-site/IRC') {
                scripts.push('MediaWiki:Common.js/embedirc.js'); // Embed IRC
            }
            if (wgPageName === 'RuneScape:RC_Patrol') {
                scripts.push('User:Suppa_chuppa/rcpatrol.js'); // Check old page revisions for vandalism
                styles.push('User:Suppa_chuppa/rcp.css');
            }
            if (wgPageName === 'MediaWiki:Namespace_numbers') {
                scripts.push('MediaWiki:Common.js/namespaceNumbersList.js'); // Lists namespace number for easy reference
            }
            if (wgPageName === 'RuneScape:Counter-Vandalism_Unit') {
                scripts.push('User:Suppa_chuppa/cvu.js'); // Form for reporting users on [[RS:CVU]]
            }
            if (wgCanonicalSpecialPageName === 'Whatlinkshere') {
                scripts.push('MediaWiki:Common.js/WLH_edit.js'); // Add edit links to [[Special:WhatLinksHere]]
            }

            // See [[RuneScape:Exchange namespace]] for usage
            manualExchange = [
                // add pages here
            ];
            if ($.inArray(wgPageName), manualExchange) > -1) {
                scripts.push('User:Quarenon/gemwupdate.js'); // Add custom price input for exchange pages
            } else {
                if ($(.inArray('autoconfirmed'), wgUserGroups > -1) {
                    scripts.push('MediaWiki:Common.js/gemwupdate.js'); // Semi-automated price updates for exchange pages
                }
            }
            if ($.inArray(wgPageName), ajPages) > -1) {
                scripts.push('u:dev:AjaxRC/code.js'); // Ajax refresh for various pages
            }
            if (wgPageName === 'Distractions_and_Diversions_Locations' || wgPageName === 'Distractions_and_Diversions_Locations/Penguin_Hide_and_Seek') {
                scripts.push('MediaWiki:Common.js/pengLocations.js'); // Peng hunting highlight table
            }

        }
    
        if (wgPageName === 'Special:Log') {
            scripts.push('User:AzBot/HideBotUploads.js'); // Hide Auto-uploads
        }

        if ($('.countdown').length) {
            scripts.push('MediaWiki:Common.js/countdowntimer.js'); // Countdown timer
        }


        if ($('.youtube').length) {
            scripts.push('MediaWiki:Common.js/youtube.js'); // Youtube embedding
        }

        if ($('.embedMe').length) {
            scripts.push('MediaWiki:Common.js/embedding.js'); // Embed audio
        }

        if ($('.lighttable').length) {
            scripts.push('MediaWiki:Common.js/highlightTable.js'); // Highlight tables
        }

        if ($('#title-meta').length) {
            scripts.push('MediaWiki:Common.js/pagetitle.js'); // Rewrite page titles
        }

        if ($('.jcInput').length || $('[class*="jcPane"]').length) {
            scripts.push('User:Stewbasic/calc.js'); // Calculators
        }


        if ($('.GEdatachart').length) {
            if (mw.loader.getModuleNames().indexOf('highcharts') < 0) {
                mw.loader.implement('highcharts', ['http://code.highcharts.com/stock/highstock.js'], {}, {});
            }
            
            mw.loader.using('highcharts', function () {
                scripts.push('MediaWiki:Common.js/GECharts.js'); // GE Charts
            });
        }

        if ($('#mw-content-text .cioCompareLink').length) {
            scripts.push('MediaWiki:Common.js/compare.js'); // Item Compare Overlays
            styles.push('MediaWiki:Common.css/compare.css');
        }

        if ($('#mw-content-text .jcConfig').length) {
            scripts.push('MediaWiki:Common.js/calc.js'); // Dynamic Templates
            styles.push('MediaWiki:Common.css/calc.css');
        }

        if ($('.specialMaintenance').length) || wgCanonicalSpecialPageName === 'Specialpages') {
            scripts.push('MediaWiki:Common.js/spreport.js'); // Special page report on [[RS:MAINTENANCE]] and [[Special:SpecialPages]]
        }

        // Autosort tables
        // tag: small script
        if ($('.sortable').length) {
            scripts.push('User:Tyilo/autosort.js');
        }

        // @todo get conditional for this off joey
        if () {
            scripts.push('User:Joeytje50/Dropadd.js'); // Add to charm logs
        }

        if ($('.switch-infobox').length) {
            scripts.push('User:Matthew2602/SwitchInfobox.js'); // Switch infobox
        }


        // @todo get conditional for this off joey
        if () {
            scripts.push('User:Joeytje50/monstercalc.js'); // Adds calcs to infoboxes
        }

        if (skin === 'monobook') {

            scripts.push('MediaWiki:Common.js/sitenotice.js'); // Extra sitenotice functionality

            if (wgAction === 'edit') {
                scripts.push('MediaWiki:Common.js/preload.js'); // Template preloads for monobook
            }

        }

        if (skin === 'oasis') {
            // oasis specific js here
        }
  
        // ?debug=true to see these
        mw.log(scripts);
        mw.log(styles);

        // Large script imports
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
        if (wgUserName !== null && wgNamespaceNumber === 2) {
            skinRedirect(); // redirects skin.js to monobook/wikia.js
        }

        if (wgAction === 'submit' || wgAction === 'edit') {
            if (mwCustomEditButtons.length) {
                customEditButtons(); // custom edit buttons
            }
            
            if (wgNamespaceNumber % 2 === 1 || wgNamespaceNumber === 110) {
                $('#wpSave').click(function (e) {
                    sigReminder(e); // sig reminder
                }
            }
        }

        if (wgAction === 'edit') {
            $('#wpSave').click(tagSwitch); // swaps youtube tags to {{youtube}}
        }

        if (wgNamespaceNumber === 0 && $('.navbox').length) {
            navbox(); // collapses navboxes under certain conditions
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

        // Insert username
        if (wgAction === 'view' && wgUserName !== null) {
            $('.insertusername').text(wgUserName);
        }
        
    });

}(this, this.jQuery, this.mediaWiki));

/* </pre> */