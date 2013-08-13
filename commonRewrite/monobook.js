/* Any JavaScript here will be loaded for Monobook users on every page load. */
/* <pre> */
 
(function (window, $, mw, mwConfig, importArticles) {
 
    // @todo make sure collapsible portlets works with this
    // 'use strict';
 
    // move dismiss sitenotice link to within the table
    function moveDismiss() {
        $('#localNotice th').append(
            $('<span/>').attr({
                'class': 'sn-dismiss'
            }).append(
                '[',
                $('<a/>').attr({
                    'href': 'javascript:dismissNotice();'
                }).text('dismiss'),
                ']'
            )
        );
    }
 
    // Changes 'article' to 'main page'
    function articleToMain() {
        $('#ca-nstab-main a').text('Main page');
    }
 
    // Redirect non-wikia skin users to the correct link for Special:Chat
    function chatRedirect() {
        window.location.search += (window.location.search ? '&' : '?') + 'useskin=oasis';
    }
 
    $(function () {
 
        var scripts;
 
        moveDismiss();
 
        if ((mwConfig.wgPageName === 'RuneScape_Wiki' || mwConfig.wgPageName === 'Talk:RuneScape_Wiki') && mwConfig.wgUserLanguage === 'en') {
            articleToMain();
        }
 
        if (mwConfig.wgCanonicalSpecialPageName === 'Chat') {
            chatRedirect();
        }
 
        // imports
        scripts = [
            // Collapsible sidebar portlets
            'MediaWiki:Common.js/collapsiblesidebarportlets.js'
        ];
 
        if (mwConfig.wgNamespaceNumber === 2 || mwConfig.wgNamespaceNumber === 3) {
            // Replicates user masthead in oasis
            scripts.push('User:Hairr/userinfo.js');
        }
 
        mw.log(scripts);
 
        importArticles({
            type: 'script',
            articles: scripts
        });
 
    });
 
}(this, this.jQuery, this.mediaWiki, this.mediaWiki.config.values, this.importArticles));
 
/* </pre> */