/** <pre>
 * pengLocations.js
 *
 * Description:
 * Implement row marking on the penguin locations table in the DnD Locations article.
 * Show/hide columns to fit a large table on a smaller display area.
 
 * Version 1.0: [[User:Quarenon]]
 * Version 2.0: [[User:Saftzie]]
 *
 * Thanks to [[User:Tyilo]] and [[User:Chrislee33]] for ideas
 */

;(function ($, mw) {

    'use strict';

    function pengLocations() {

        var pengTableID = 'pengLocations',
            pengCookieID = 'pengLocations',
            pengToggleClass = 'selected',
            wgPageName = mw.config.get('wgPageName'),
            pengCookie,
            pengRows,
            pengCookieLen,
            pengSelector,
            pengHeaders;

        // load the existing cookie, if any
        if ($.cookie(pengCookieID) !== null) {
            pengCookie = $.cookie(pengCookieID).split('');
        } else {
            pengCookie = ['0'];
        }

        // show or hide columns
        function pengVisibility(val) {
            // 1 = show, 0 = hide
            if (val === '1') {
                $('#' + pengTableID + ' .' + pengToggleClass).show();
            } else {
                $('#' + pengTableID + ' .' + pengToggleClass).hide();
            }
        }

        // save the cookie for page reloads
        function pengSave() {
            $.cookie(pengCookieID, pengCookie.join(''), {
                expires: 7
            });
        }

        if ($('#' + pengTableID).length) {

            pengRows = $('#' + pengTableID + ' tr:has(td)'); // data rows
            pengCookieLen = pengRows.length + 1; // 1 for hidden + 1 for each peng/bear

            pengSelector = ''; // propagate class from header row to data rows
            pengHeaders = $('#' + pengTableID + ' tr > th'); // save the headers to count them later

            pengHeaders.filter('.' + pengToggleClass).each(function () {

                // build a selector that mirrors the header row
                if (pengSelector.length > 0) {
                    pengSelector += ','; // Note: index() starts at 0, nth-child starts at 1
                }

                pengSelector += 'td:nth-child(' + ($(this).index() + 1) + ')';

            });

            // apply it to the data rows and add the class
            if (pengSelector.length > 0) {
                pengRows.children(pengSelector).addClass(pengToggleClass);
            }

            // initialize highlighting based on the cookie
            pengRows.each(function (index) {

                // pengCookie[0] is the hidden state
                if (pengCookie[index + 1] === 1) {
                    $(this).addClass('selected');
                }

                // set mouse events
                $(this).click(function (e) {

                    // don't highlight when clicking links
                    if (e.target.tagName === 'A') {
                        return;
                    }

                    // toggle highlight
                    pengCookie[index + 1] = 1 - pengCookie[index + 1];
                    if (pengCookie[iLoc + 1] === 1) {
                        $(this).addClass('selected');
                    } else {
                        $(this).removeClass('selected');
                    }
                    pengSave();
                });
            });

            // initialize cell visibility based on the cookie
            pengVisibility(pengCookie[0]);

            // add some buttons for reset and size
            $('#' + pengTableID).append(
                $('<tr/>').append(
                    $('<th/>', {
                        'colspan': pengHeaders.length
                    }).append(
                        $('<input>', {
                            'type': 'button',
                            'value': 'Clear marks',
                            'click': function () {
                                pengRows.each(function(iLoc) {
                                    pengCookie[iLoc + 1] = '0';
                                    pengHighlight(this, '0');
                                    pengSave();
                                });
                            }
                        }),

                        '&nbsp;',

                        $('<input>', {
                            'type': 'button',
                            'value': 'Toggle visibility',
                            'click': function () {
                                pengCookie[0] = 1 - pengCookie[0];
                                pengVisibility(pengCookie[0]);
                                pengSave();
                            }
                        })
                    )
                )
            );
        }

    }

    $(function () {
        mw.util.addCSS('#pengLocations tr:hover{background-color:#ccc;}#pengLocations .selected{background-color: #cfc;}');
        pengLocations();
    });

}(this.jQuery, this.mediaWiki));

/* </pre> */
