/** <nowiki>
 * MediaWiki:Wikia.js.
 * Loads for every user using the Oasis skin.
 *
 * For scripts that load in all skins, see [[MediaWiki:Common.js]].
 * For scripts that load in the monobook skin, see [[MediaWiki:Monobook.js]].
 *
 * Every function is available through the rswiki global object.
 * Use the mwConfig global object for wg* variable checks
 * @example if (mwConfig.wgPageName === 'MediaWiki:Wikia.js') {...}
 */

// define globals if not already defined
this.rswiki = this.rswiki || {};
this.mwConfig = this.mwConfig || this.mediaWiki.config.values;

(function (window, $, mw, mwConfig, rswiki, getCookie, setCookie) {

    'use strict';

    rswiki.oasis = {

        /**
         * For easy checking of what scripts are running
         * Each function adds a string of the function name to this array
         */
        scripts: [],

        /**
         * Invokes functions conditionally
         */
        init: function () {

            /*
            // for easier debugging/testing
            // keep commented out unless it's being used
            // access the rswiki object from your console to run scripts as needed
            var noLoad = [
                    // username, remember to replace spaces with underscores
                    'Cqm'
                ],
                i;

            if (mwConfig.wgUserName !== null) {
                for (i = 0; i < noLoad.length; i += 1) {
                    if (mwConfig.wgUserName === noLoad[i]) {
                        return;
                    }
                }
            }
            */

            if (mwConfig.wgAction === 'view') {

                // add custom links to on the wiki tab
                rswiki.oasis.addTabLinks();

                if (mwConfig.wgUserName === null) {

                    // add contribs link to contribute button for anons
                    rswiki.oasis.addContribs();

                }

                if (mwConfig.wgNamespaceNumber === 2 || mwConfig.wgNamespaceNumber === 3) {

                    // add custom boxes to profile masthead
                    rswiki.oasis.mastheadBoxes();

                    // rewrite the page title on profile masthead
                    rswiki.oasis.pageTitle();

                }

            }

            if (mwConfig.wgCanonicalSpecialPageName === 'Recentchanges') {

                // add dismiss function to sitenotice on [[Special:RecentChanges]]
                rswiki.oasis.sitenoticeDismiss();

            }

        },

        /**
         * Add contribs link to contribute button dropdown for anons.
         * Version for logged in users can be found at [[Mediawiki:Gadget-AddContribs.js]]
         * which is enabled by default.
         *
         * Original author unknown
         *
         * @author Ryan PM
         * @author Cqm
         */
        addContribs: function () {

            rswiki.oasis.scripts.push('addContribs');

            $('.contribute ul li:first-child').before(
                $('<li/>').attr({
                    'id': 'AnonContribs'
                }).append(
                    $('<a/>').attr({
                        'href': '/wiki/Special:MyContributions'
                    }).text('My contributions')
                )
            );

        },

        /**
         * Add extra links to the on wiki tab tab on wiki navigation.
         * Per <http://rs.wikia.com/?diff=4890582>
         *
         * @author Ryan PM
         * @author Suppa chuppa
         * @author Sactage
         * @author Cqm
         */
        addTabLinks: function () {

            rswiki.oasis.scripts.push('addTabLinks');

            $('.WikiHeader nav ul li.marked ul').append(
                $('<li/>').attr({
                    'class': 'subnav-2-item'
                }).append(
                    $('<a/>').attr({
                        'class': 'subnav-2a',
                        'href': '/wiki/RuneScape:About'
                    }).text('About us')
                ),

                $('<li/>').attr({
                    'class': 'subnav-2-item'
                }).append(
                    $('<a/>').attr({
                        'class': 'subnav-2a',
                        'href': '/wiki/RuneScape:General_disclaimer'
                    }).text('Disclaimer')
                )
            );

        },

        /**
         * Add custom masthead boxes to profile masthead
         *
         * @author Rappy 4187 (Aion Wiki)
         * @author Amaurice
         * @author Cqm
         */
        mastheadBoxes: function () {

            // add function name to array
            rswiki.oasis.scripts.push('mastheadBoxes');

            var title = mwConfig.wgTitle,
                rights = {
                    // awb
                    'Bot50':        'AWB',
                    'Cåmdroid':     'AWB',
                    'CookBot':      'AWB',
                    'ɘ':            'AWB',
                    'MuudyBot':     'AWB',

                    // bot
                    'A proofbot' :  'BOT',
                    'AmauriceBot':  'BOT',
                    'AzBot':        'BOT',
                    'Cblair91Bot':  'BOT',
                    'HairyBot':     'BOT',
                    'RSChatBot':    'BOT',
                    'TyBot':        'BOT',

                    // bureaucrat
                    'Azaz129':      'BUREAUCRAT',
                    'Calebchiam':   'BUREAUCRAT',
                    'Dtm142':       'BUREAUCRAT',
                    'Eucarya':      'BUREAUCRAT',
                    'Hyenaste':     'BUREAUCRAT',
                    'Karlis':       'BUREAUCRAT',
                    'Laser Dragon': 'BUREAUCRAT',
                    'Merovingian':  'BUREAUCRAT',
                    'Oddlyoko':     'BUREAUCRAT',
                    'Sacre Fi':     'BUREAUCRAT',
                    'Skill':        'BUREAUCRAT',
                    'Vimescarrot':  'BUREAUCRAT',
                    'Whiplash':     'BUREAUCRAT'
                };

            // fix for [[Special:Contibutions/username]]
            if (mwConfig.wgCanonicalSpecialPageName === 'Contributions') {
                title = title.split('/')[1];
            }

            if (rights[title] !== undefined) {
                // remove old rights
                $('.UserProfileMasthead .masthead-info .tag').remove();

                // add new rights
                $('.masthead-info hgroup').append(
                    $('<span/>').attr({
                        'class': 'tag'
                    }).text(rights[title])
                );
            }

        },

        /**
         * Rewrites pagetitle for profile masthead.
         * Uses {{DISPLAYTITLE:title}} magic word on other pages.
         * Used by [[Template:Title]].
         *
         * @author Sikon (Wookieepeedia)
         * @author Cook Me Plox
         * @author Cblair91
         * @author Cqm
         */
        pageTitle: function () {

            // add function name to array
            rswiki.oasis.scripts.push('pageTitle');

            var newTitle = $('#title-meta');

            if (newTitle.length === 0) {
                return;
            }

            newTitle = newTitle.text();
            $('.masthead-info > hgroup > h1').text(newTitle);

        },

        /**
         * Add dismiss function to sitenotice on [[Special:RecentChanges]].
         * Dimiss link is always found on [[MediaWiki:Recentchangestext]] to make
         * it easier to add the function as it is included in the area refreshed
         * by AjaxRC.
         *
         * Original author unknown
         *
         * @author Quarenon
         * @author Cqm
         */
        sitenoticeDismiss: function () {

            // add function name to array
            rswiki.oasis.scripts.push('sitenoticeDimiss');

            // use the same cookie as monobook's sitenotice dismiss
            var cookie = getCookie('dismissSiteNotice'),
                dismiss;

            if (cookie === ('1.' + $('#rcsitenotice-id').text())) {
                return;
            }

            // the sitenotice is within the area refreshed by AjaxRC
            // so add the css to the head as inline css will just be removed with each refresh
            mw.util.addCSS('#rcSitenotice {display: block;}');

            dismiss = function () {
                // dismiss link coded into [[MediaWiki:Recentchangestext]]
                // to stop it disappearing with AjaxRC refreshes
                $('.rcsitenotice-dismiss-link').click(function () {
                    mw.util.addCSS('#rcSitenotice {display: none;}');
                    setCookie('dismissSiteNotice', '1.' + $('#rcsitenotice-id').text(), 90, '/');
                });
            };

            dismiss();

            // add to ajaxCallAgain function array
            if (window.ajaxCallAgain === undefined) {
                window.ajaxCallAgain = [];
            }
            window.ajaxCallAgain.push(dismiss);

        }
    };

    $(rswiki.oasis.init());

}(this, this.jQuery, this.mediaWiki, this.mwConfig, this.rswiki, this.getCookie, this.setCookie));

/* </nowiki> */
