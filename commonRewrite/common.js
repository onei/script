/** <pre>
 * MediaWiki:Common.js
 * JavaScript here will load on both skins for every user
 */

/*jshint
    bitwise: true, curly: true, devel: false, eqeqeq: true, es3: false,  forin: true,
    immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: false,
    quotmark: single, undef: true, unused: true, strict: true, trailing: true
 */
/*jslint todo: true, indent: 4 */

/**
 * @todo
 *  Remove deprecated addonloadhook
 *  Move wgVariable to mw.config.get('wgVariable')
 */

(function (window, $, mw) {

    'use strict';

    var scripts = [],
        styles = [],
        // Shortcut to accessing configuration properties eg. mwConfig.wgPageName
        // verses mw.config.get("wgPageName")
        mwConfig = mw.config.values,
        // for use with GED errors - See [[RuneScape:Exchange namespace]] for usage
        manualExchange = [],
        // Pages to run AJAX refresh script on
        ajaxPages = window.ajaxPages = [
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
        setCookie,
        getCookie,
        callAPI,
        addCommas;

    // Text to display next to checkmark that enables/disables AJAX refresh script
    window.AjaxRCRefreshText = 'Auto-refresh';

    /**
     * Sets the cookie
     * @param c_name string Name of the cookie
     * @param value string 'on' or 'off'
     * @param expiredays integer Expiry time of the cookie in days
     * @param path
     */
    setCookie = window.setCookie = function(c_name, value, expiredays, path) {

        var options = {};

        if (expiredays) {
            options.expires = expiredays;
        }

        if (path) {
            options.path = path;
        }

        $.cookie(c_name, value, options);

    };

    /**
     * Gets the cookie
     * @param c_name string Cookie name
     * @return The cookie name or empty string
     */
    getCookie = window.getCookie = function(c_name) {

        var cookie = $.cookie(c_name);

        if (cookie === null) {
            cookie = '';
        }

        return cookie;

    };

    /**
     * Calls wiki API and returns the response in the callback
     * @param data named array List of parameters to send along with the request. {'format':'json'} is set automatically.
     * @param method string Either POST or GET.
     * @param callback function Thing to run when request is complete
     * @param addurl string (optional) Anything you may want to add to the request url, in case you need it.
     */
    callAPI = window.callAPI = function(data, method, callback, addurl) {

        data.format = 'json';

        $.ajax({
            data: data,
            dataType: 'json',
            url: '/api.php' + (addurl || ''),
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
                // ?debug=true to see these
                mw.log('AJAX response: ' + xhr.responseText);
                mw.log('AJAX error: ' + error);
            }
        });

    };

    // http://www.mredkj.com/javascript/numberFormat.html#addcommas
    addCommas = window.addCommas = function(nStr) {

        nStr += '';

        var x = nStr.split('.'),
            x1 = x[0],
            x2 = x.length > 1 ? '.' + x[1] : '',
            rgx = /(\d+)(\d{3})/;

        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }

        return x1 + x2;

    };

    /**
     * Matthew's Tundra library
     * Making stuff easier for MediaWiki things like editing pages, etc.
     * For documentation see https://github.com/Matthew2602/tundra/wiki
     */
    // ResourceLoader throws an exception if you try and registered a module that is already registered
    if (mw.loader.getModuleNames().indexOf('tundra') < 0) {
        mw.loader.implement('tundra', ['http://matthew2602.github.io/tundra/tundra.min.js'], {}, {});
    }

    /**
     * Change <youtube>video</youtube> to {{youtube|video}}
     * Runs when save button is clicked
     */
    function tagSwitch() {

        var wikitext = $('#wpTextbox1').html(),
            modifiedWikitext = wikitext.replace(/&lt;youtube&gt;/g, '{{youtube|')
                                       .replace(/&lt;\/youtube&gt;/g, '}}');

        $('#wpTextbox1').html(modifiedWikitext);

    }

    /**
     * Custom edit buttons
     * Deprecated - http://www.mediawiki.org/wiki/ResourceLoader/JavaScript_Deprecations#edit.js
     */
    function customEditButtons() {

        window.mwCustomEditButtons.push(
            // Redirect
            {
                imageFile: 'http://images.wikia.com/central/images/c/c8/Button_redirect.png',
                speedTip: 'Redirect',
                tagOpen: '#REDIRECT [[',
                tagClose: ']]',
                sampleText: 'Insert text'
            },
            // Wikitable
            {
                imageFile: 'http://images3.wikia.nocookie.net/central/images/4/4a/Button_table.png',
                speedTip: 'Insert a table',
                tagOpen: '{| class="wikitable"\n|-\n',
                tagClose: '\n|}',
                sampleText: '! header 1\n! header 2\n! header 3\n|-\n| row 1, cell 1\n| row 1, cell 2\n| row 1, cell 3\n|-\n| row 2, cell 1\n| row 2, cell 2\n| row 2, cell 3'
            },
            // Line break
            {
                imageFile: 'http://images2.wikia.nocookie.net/central/images/1/13/Button_enter.png',
                speedTip: 'Line break',
                tagOpen: '<br />',
                tagClose: '',
                sampleText: ''
            },
            // Gallery
            {
                imageFile: 'http://images2.wikia.nocookie.net/central/images/1/12/Button_gallery.png',
                speedTip: 'Insert a picture gallery',
                tagOpen: '\n<div style="text-align:center"><gallery>\n',
                tagClose: '\n</gallery></div>',
                sampleText: 'File:Example.jpg|Caption1\nFile:Example.jpg|Caption2'
            }
        );

    }

    /**
     * Redirects from /User:UserName/skin.js or .css to the user's actual skin page
     */
    function skinRedirect() {

        var urlUsername = mwConfig.wgUserName.replace(/ /g, '_'),
            replaceSkin = mwConfig.skin.replace('oasis', 'wikia'),
            baseSkinFilePageName = 'User:' + urlUsername + '/skin';

        // Using location.replace doesn't add the skin.js/skin.css page to the
        // user's history. See <http://stackoverflow.com/q/1865837/2017220>
        if (mwConfig.wgPageName === baseSkinFilePageName + '.js') {
            // skin.js
            window.location.replace(window.location.href.replace(/\/skin\.js/i, '/' + replaceSkin + '.js'));
            return;
        }

        if (mwConfig.wgPageName === baseSkinFilePageName + '.css') {
            // skin.css
            window.location.replace(window.location.href.replace(/\/skin\.css/i, '/' + replaceSkin + '.css'));
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
            if (!$(elem).hasClass('mw-collapsible')) {
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
    function sigReminder(event) {

        var text = $('#wpTextbox1').val(),
            reminderPromptMessage = 'It looks like you forgot to sign your comment. You can sign by placing 4 tildes (~~~~) to the end of your message. \nAre you sure you want to post it?';

        // don't trigger on minor edits
        if ($('#wpMinoredit').is(':checked')) {
            return;
        }

        // check for sig
        if (text.replace(/(<nowiki>.*?<\/nowiki>)/g, '').match('~~~')) {
            return;
        }

        // check for &undo= or ?undo= in url as summary can be altered
        if (window.location.search.match(/[\?&]undo=/)) {
            return;
        }

        if (!confirm(reminderPromptMessage)) {
            event.preventDefault();
        }
    }

    /**
     * Autosort sortable tables
     * default plugin: https://github.com/Wikia/app/blob/dev/resources/jquery/jquery.tablesorter.js
     * Next to no docs on this on mediawiki.org
     * @todo usage instructions
     */
    function autosort() {
        $('table.sortable[class*="autosort="]').each(function() {
            var $this = $(this),
                matched = /(?:^| )autosort=([0-9]+),(a|d)(?: |$)/.exec($this.attr('class'));

            $this.tablesorter({
                sortList: [[matched[1] - 1, ((matched[2] === 'd') ? 1 : 0)]]
            });
        });
    }

    $(function () {

        var editingPage = mwConfig.wgAction === 'edit' || mwConfig.wgAction === 'submit';

        /**
         * Imports
         *
         * Description:
         * Add scripts to an array if it passes a conditional, and then use importArticles() on that array
         * This is hopefully faster than loading every script and then using a conditional
         * 
         * Instructions:
         * Scripts to be imported using importArticles() added to scripts array
         * Stylesheets to be imported using importArticles() added to styles array
         *
         * Stylesheets should be imported with js if they're specific to certain pages
         * and would bloat Common.css if included by default
         */

        scripts.push('MediaWiki:Common.js/Konami.js');       // Konami code
        scripts.push('MediaWiki:Common.js/displayTimer.js'); // UTC clock with purge link
        scripts.push('MediaWiki:Common.js/histats.js');      // Histats

        if (editingPage) {
            scripts.push('MediaWiki:Common.js/standardeditsummaries.js'); // Standard edit summaries

            if (mwConfig.wgNamespaceNumber === 100) {
                scripts.push('MediaWiki:Common.js/updateintro.js'); // Notice when editing update pages
            } else if (mwConfig.wgNamespaceNumber === 112 && mwConfig.wgPageName.split('/')[1] === 'Data') {
                scripts.push('MediaWiki:Common.js/exchangeintro.js'); // Notice when editing Exchange /Data subpages        
            }
        }

        if (mwConfig.wgAction === 'view') {

            if (mwConfig.wgPageName === 'RuneScape:Off-site/IRC') {
                scripts.push('MediaWiki:Common.js/embedirc.js'); // Embed IRC
            } else if (mwConfig.wgPageName === 'RuneScape:RC_Patrol') {
                scripts.push('User:Suppa_chuppa/rcpatrol.js'); // Check old page revisions for vandalism
                styles.push('User:Suppa_chuppa/rcp.css');
            } else if (mwConfig.wgPageName === 'MediaWiki:Namespace_numbers') {
                scripts.push('MediaWiki:Common.js/namespaceNumbersList.js'); // Lists namespace number for easy reference
            } else if (mwConfig.wgPageName === 'RuneScape:Counter-Vandalism_Unit') {
                scripts.push('User:Suppa_chuppa/cvu.js'); // Form for reporting users on [[RS:CVU]]
            } else if (mwConfig.wgCanonicalSpecialPageName === 'Whatlinkshere') {
                scripts.push('MediaWiki:Common.js/WLH_edit.js'); // Add edit links to [[Special:WhatLinksHere]]
            } else if (mwConfig.wgCanonicalSpecialPageName === 'Log') {
                scripts.push('User:AzBot/HideBotUploads.js'); // Hide Auto-uploads
            } else if (mwConfig.wgPageName === 'Distractions_and_Diversions_Locations' || mwConfig.wgPageName === 'Distractions_and_Diversions_Locations/Penguin_Hide_and_Seek') {
                scripts.push('MediaWiki:Common.js/pengLocations.js'); // Peng hunting highlight table
            }

            if (manualExchange.indexOf(mwConfig.wgPageName) > -1) {
                scripts.push('User:Quarenon/gemwupdate.js'); // Add custom price input for exchange pages
            } else if (mwConfig.wgUserGroups.indexOf('autoconfirmed') > -1) {
                scripts.push('MediaWiki:Common.js/gemwupdate.js'); // Semi-automated price updates for exchange pages
            }

            if (ajaxPages.indexOf(mwConfig.wgPageName) > -1) {
                scripts.push('u:dev:AjaxRC/code.js'); // Ajax refresh for various pages
            }

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

        if ($('.specialMaintenance').length || mwConfig.wgCanonicalSpecialPageName === 'Specialpages') {
            scripts.push('MediaWiki:Common.js/spreport.js'); // Special page report on [[RS:MAINTENANCE]] and [[Special:SpecialPages]]
        }

        if ((mwConfig.wgPageName.match('/Charm_log') && $('#charmguide').length) || (!mwConfig.wgPageName.match('/Charm_log') && $('.charmtable').length)) {
            scripts.push('User:Joeytje50/Dropadd.js'); // Add to charm logs
        }

        if ($('.switch-infobox').length) {
            scripts.push('User:Matthew2602/SwitchInfobox.js'); // Switch infobox
        }

        if ($('#XPEach').length || $('#GEPrice').length || $('#killXP').length) {
            scripts.push('User:Joeytje50/monstercalc.js'); // Adds calcs to infoboxes
        }

        if (mwConfig.skin === 'monobook') {
            scripts.push('MediaWiki:Common.js/sitenotice.js'); // Extra sitenotice functionality

            if (editingPage) {
                scripts.push('MediaWiki:Common.js/preload.js'); // Template preloads for monobook
            }
        }

        if (mwConfig.skin === 'oasis') {

            if (editingPage) {
                scripts.push('MediaWiki:Wikia.js/preload.js'); // Template preloads for Oasis
            }
        }

        // ?debug=true to see these
        mw.log(scripts, styles);

        // Large script imports
        window.importArticles({
            type: 'script',
            articles: scripts
        }, {
            type: 'style',
            articles: styles
        });

        /**
         * Function invocations
         * Run conditionals before invoking functions to improve pageload
         */
        if (mwConfig.wgUserName !== null && mwConfig.wgNamespaceNumber === 2) {
            skinRedirect(); // redirects skin.js to monobook/wikia.js
        }

        // @todo see if tagSwitch and sigReminder work together
        if (editingPage) {
            $('#wpSave').click(tagSwitch); // swaps youtube tags to {{youtube}}

            if (window.mwCustomEditButtons.length) {
                customEditButtons(); // custom edit buttons
            }

            if (mwConfig.wgNamespaceNumber % 2 === 1 || mwConfig.wgNamespaceNumber === 110) {
                $('#wpSave').click(sigReminder); // sig reminder
            }
        }

        if (mwConfig.wgNamespaceNumber === 0 && $('.navbox').length) {
            navbox(); // collapses navboxes under certain conditions
        }

        if ($('.sortable').length) {
            autosort(); // autosort tables
        }

        /**
         * Code snippets
         */

        // Hide semi automatic exchange update button for anons
        if (mwConfig.wgUserName === null) {
            $('.anonmessage').css({
                'display': 'inline'
            });
        }

        // Insert username
        if (mwConfig.wgAction === 'view' && mwConfig.wgUserName !== null) {
            $('.insertusername').text(mwConfig.wgUserName);
        }

    });

}(this, this.jQuery, this.mediaWiki));

/* </pre> */
