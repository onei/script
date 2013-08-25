/**
 * Added sitenotice functionality
 * Only applies to oasis, see [[MediaWiki:Monobook.js]] for monobook version
 *
 * Description:
 * Adds dismiss link to the sitenotice
 * Undismissed every time [[MediaWiki:Sitenotice id]] is updated
 */

(function (window, $, mw) {

    'use strict';
    
    var setSnCookie;
    
    function getSnCookie() {
    
        var cookie;
        
        cookie = $.cookie('dismissSiteNotice');

        if (cookie === null) {
            cookie = '000';
        } else {
            cookie = cookie.split('.')[1];
        }

        return cookie;
    
    }
    
    // @param string, notice id as defined by [[MediaWiki:Sitenotice id]]
    setSnCookie = window.setSnCookie = function (id) {
    
        $.cookie('dismissSiteNotice', '1.' + id, {
            path: '/',
            expires: 90
        }
    
    }
    
    // define ajaxCallback if not already defined
    window.ajaxCallback = window.ajaxCallback || [];
    
    dismissNotice = window.dismissNotice = function () {

        // do something
        // copy from monobook maybe?

    }
    
    function addDismiss() {
    
        if (currentSnId === cookieSnId && snDismiss === true) {
            return;
        }

        $('.localNotice th').append(
            $('<span/>', {
                'class': 'sitenotice-dismiss'
            }).append(
                '[',
                $('<a/>', {
                    'class': 'sitenotice-dismiss-link',
                    'click': dismissNotice
                }),
                ']'
            )
        );
    
    }


}(this, this.jQuery, this.mediaWiki));