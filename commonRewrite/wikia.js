// <nowiki>

/**
 * MediaWiki:Wikia.js, loads for every user for the oasis/wikia skin
 */

(function (window, $, mw, mwConfig, rswiki) {

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

            // add contribs and watchlist link to accout nav dropdown
            // or contribute button for anons
            rswiki.oasis.addContribs();

            if (mwConfig.wgAction === 'view') {

                // add custom links to on the wiki tab
                rswiki.oasis.addTabLinks();

                if (mwConfig.wgNamespaceNumer === 2 || mwConfig.wgNamespaceNumber === 3) {

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
         * Add contribs and watchlist links to account navigation dropdown.
         * Add contribs link to contribute button dropdown for anons.
         *
         * Original author unknown
         *
         * @author Ryan PM
         * @author Cqm
         */      
        addContribs: function () {
        
            rswiki.oasis.scripts.push('addContribs');
        
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
        
            rswiki.scripts.push('addTabLinks');
        
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
        
        },

        /**
         * Rewrites pagetitle on profile masthead.
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
        
        }
    };

    $(rswiki.oasis.init());

}(this, this.jQuery, this.mediaWiki, this.mwConfig = this.mwConfig || this.mediaWiki.config.values, this.rswiki = this.rswiki || {}));