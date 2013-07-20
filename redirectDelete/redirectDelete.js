/**
 * redirectDelete.js
 *
 * Description:
 * Alters delete link on [[Special:BrokenRedirects]] to ajax delete
 * with the reason "Broken redirect"
 */

(function ($, mw) {

    'use strict';
    
    function redirectDelete() {
    
    
    }

    $(function () {
        if (mw.config.get('wgCanonicalSpecialPagename') !== 'BrokenRedirects') {
            return;
        }
    
        redirectDelete();
    });

}(this.jQuery, this.mediaWiki));