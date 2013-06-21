/** <pre>
 * Collapses navboxes under certain conditions
 */

(function ($, mw) {

    'use strict';

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

            // first tr is header
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

        if (navboxes.length > (maxShow - 1)) {
            for (i = 0; i < navboxes.length; i += 1) {
                collapseNavbox(navboxes[i]);
            }
        }

        for (i = 0; i < navboxes.length; i += 1) {
            if ($(navboxes[i]).height() > maxHeight) {
                collapseNavbox(navboxes[i]);
            }
        }

    }

    $(function () {

        if (mw.config.get('wgCanonicalNamespace') !== '') {
            return;
        }

        if ($('.navbox').length === 0) {
            return;
        }

        navbox();

    });

}(this.jQuery, this.mediaWiki));

/* </pre> */
