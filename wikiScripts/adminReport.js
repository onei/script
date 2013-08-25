/**
 * Admin report
 *
 * @description
 * Returns last time an administrative request page was edited
 * Returns number of members in a administrative category
 * Returns number of pages on certain special maintenance pages
 *
 * @author Cåm
 */

/*jshint asi: false, bitwise: true, boss: false, camelcase: true, curly: true, eqeqeq: true, es3: false, evil: false, expr: false, forin: true, funcscope: false, globalstrict: false, immed: true, lastsemic: false, latedef: true, laxbreak: false, laxcomma: false, loopfunc: false, multistr: false, noarg: true, noempty: true, onevar: true, plusplus: true, quotmark: single, undef: true, unused: true, scripturl: false, smarttabs: false, shadow: false, strict: true, sub: false, trailing: true, white: true */

;(function (document, $, mw) {

    'use strict';

    // @todo add some kind of customisation for this?
    var reportPages = [
            'RuneScape:Active_discussions',
            'Special:RecentChanges',
            'User:Cåm/Scrapbook_7'
        ],
        reportIds,
        timeFactors,
        i,
        categoryArr,
        specialArr;

    if ($.inArray(mw.config.get('wgPageName'), reportPages) === -1) {
        return;
    }

    if (mw.config.get('wgAction') !== 'view') {
        return;
    }

    if (mw.config.get('wgAction') !== 'submit') {
        return;
    }

    /**
     * Insert html into the page
     *
     * Ids prefixed with ar- to imitate mediawiki css coding conventions
     * Allows me to differentiate between my own code and others
     * And removes possibility of conflicting ids from wikitext generated headers
     * Ids spaced with dashes and all lowercase per mediawiki convention
     */
    reportIds = [
        // timestamps
        'ar-permissions',
        'ar-awb-requests',
        'ar-admin-requests',
        'ar-user-help',
        'ar-cvu',

        // categories
        'ar-speedy-move',
        'ar-speedy-del',
        'ar-closure',

        // special pages
        'ar-broken-redirects',
        'ar-double-redirects',
        'ar-unused-categories',
        'ar-unused-images',
        'ar-wanted-categories',
        'ar-wanted-files',
        'ar-wanted-pages',
        'ar-wanted-templates'
    ];

    function insertHtml() {

        // AjaxRC refreshes what's contained within #mw-content-text
        // Use $('#mw-content-text').before(html) to prevent AjaxRC removing it
        $('#mw-content-text').before(
            $('<div/>', {
                'id': 'ar-container'
            }).css({
                'border': '1px solid #808080',
                'padding': '10px',
                'text-align': 'center',
                'font-weight': 'bold',
                'font-size': '85%'
            }).append(
                $('<div/>', {
                    'id': 'ar-report-loading'
                }).append(
                    $('<img>', {
                        'src': 'http://images2.wikia.nocookie.net/dev/images/8/82/Facebook_throbber.gif'
                    })
                ),

                $('<div/>', {
                    'id': 'ar-report-inner'
                }).css({
                    'display': 'none' // leave this here
                }).append(
                    $('<div/>', {
                        'id': 'ar-timestamps'
                    }).append(
                        $('<a/>', {
                            'href': '//wiki/RuneScape:Requests_for_permissions',
                            'title': '',
                            'target': '_blank'
                        }).append(
                            'Permissions (',

                            $('<span/>', {
                                'id': reportIds[0]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/RuneScape:AutoWikiBrowser/Requests',
                            'title': 'RuneScape:AutoWikiBrowser/Requests',
                            'target': '_blank'
                        }).append(
                            'AWB (',

                            $('<span/>', {
                                'id': reportIds[1]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/RuneScape:Administrator_requests',
                            'title': 'RuneScape:Administrator requests',
                            'target': '_blank'
                        }).append(
                            'Admin requests (',

                            $('<span/>', {
                                'id': reportIds[2]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/RuneScape:User_help',
                            'title': 'RuneScape:User help',
                            'target': '_blank'
                        }).append(
                            'User help (',

                            $('<span/>', {
                                'id': reportIds[3]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/RuneScape:Counter-Vandalism_Unit',
                            'title': 'RuneScape:Counter-Vandalism Unit',
                            'target': '_blank'
                        }).append(
                            'CVU (',

                            $('<span/>', {
                                'id': reportIds[4]
                            }),

                            ')'
                        )
                    ),

                    $('<div/>', {
                        'id': 'ar-cat-members'
                    }).append(
                        $('<a/>', {
                            'href': '/wiki/Category:Speedy_move_candidates',
                            'title': 'Category:Speedy move candidates',
                            'target': '_blank'
                        }).append(
                            'Speedy move (',

                            $('<span/>', {
                                'id': reportIds[5]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Category:Speedy_deletion_candidates',
                            'title': 'Category:Speedy deletion candidates',
                            'target': '_blank'
                        }).append(
                            'Speedy del (',

                            $('<span/>', {
                                'id': reportIds[6]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Category:Requests_for_closure',
                            'title': 'Category:Requests for closure',
                            'target': '_blank'
                        }).append(
                            'Closure (',

                            $('<span/>', {
                                'id': reportIds[7]
                            }),

                            ')'
                        ) //,
/*
                        ' &bull ',

                        // @todo block reviews
                        $('<a/>', {
                            'href': '/wiki/',
                            'title': '',
                            'target': '_blank'
                        }).append(
                            'Block reviews (',

                            $('<span/>', {
                                'id': '' // @todo query for this
                            }),

                            ')'
                        )
*/
                    ),

                    $('<div/>', {
                        'id': 'ar-special-report-1'
                    }).append(
                        $('<a/>', {
                            'href': '/wiki/Special:BrokenRedirects',
                            'title': 'Special:BrokenRedirects',
                            'target': '_blank'
                        }).append(
                            'Broken redirects (',

                            $('<span/>', {
                                'id': reportIds[8]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Special:DoubleRedirects',
                            'title': 'Special:DoubleRedirects',
                            'target': '_blank'
                        }).append(
                            'Double redirects (',

                            $('<span/>', {
                                'id': reportIds[9]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Special:Unusedcategories',
                            'title': 'Special:Unusedcategories',
                            'target': '_blank'
                        }).append(
                            'Unused categories (',

                            $('<span/>', {
                                'id': reportIds[10]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Special:UnusedFiles',
                            'title': 'Special:UnusedFiles',
                            'target': '_blank'
                        }).append(
                            'Unused files (',

                            $('<span/>', {
                                'id': reportIds[11]
                            }),

                            ')'
                        )
                    ),

                    $('<div/>', {
                        'id': 'ar-special-report-2'
                    }).append(
                        $('<a/>', {
                            'href': '/wiki/Special:Wantedcategories',
                            'title': 'Special:Wantedcategories',
                            'target': '_blank'
                        }).append(
                            'Wanted categories (',

                            $('<span/>', {
                                'id': reportIds[12]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Special:Wantedfiles',
                            'title': 'Special:Wantedfiles',
                            'target': '_blank'
                        }).append(
                            'Wanted files (',

                            $('<span/>', {
                                'id': reportIds[13]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Special:Wantedpages',
                            'title': 'Special:Wantedpages',
                            'target': '_blank'
                        }).append(
                            'Wanted pages (',

                            $('<span/>', {
                                'id': reportIds[14]
                            }),

                            ')'
                        ),

                        ' &bull; ',

                        $('<a/>', {
                            'href': '/wiki/Special:Wantedtemplates',
                            'title': 'Special:Wantedtemplates',
                            'target': '_blank'
                        }).append(
                            'Wanted templates (',

                            $('<span/>', {
                                'id': reportIds[15]
                            }),

                            ')'
                        )
                    )
                )
            )
        );
    }

    /**
     * Time function
     * Returns difference between current time and timestamp returned by MediaWiki
     *
     * Null edits will alter the edit date but aren't shown in ?action=history
     * Given the nature of the pages in the report, null edits aren't going to be much of a problem
     * 
     * http://codereview.stackexchange.com/questions/25807/cleaning-up-an-if-else-statement
     */

    timeFactors = [
        [' Second', 60],
        [' Minute', 60],
        [' Hour', 24],
        [' Day', 365],
        [' Year', 100]
    ];

    function time(timestamp) {

        // Difference in milliseconds
        var n = new Date() - new Date(timestamp),
            x,
            factor;

        // MediaWiki timestamps return a minimum difference of seconds
        // So convert it into seconds straight away as it's never going to match on milliseconds
        n = n / 1000;

        for (x = 0; x < timeFactors.length; x += 1) {
            factor = timeFactors[x][1];
            if (n < factor) {
                n = Math.floor(n);

                if (n === 1) {
                    return n + timeFactors[x][0];
                }

                return n + timeFactors[x][0] + 's';
            }
            n = n / factor;
        }
    }

    /**
     * Generic Call API function
     */
    function callAPI(data, method, callback) {
        data.format = 'json';
        $.ajax({
            data: data,
            url: '/api.php',
            type: method,
            cache: false,
            success: function(response) {
                if (response.error) {
                    mw.log('API error: ' + response.error.info);
                } else {
                    callback(response);
                }
            },
            error: function(xhr, error) {
                mw.log('AJAX response: ' + xhr.responseText);
                mw.log('AJAX error: ' + error);
            }
        });
    }

    /**
     * Reports the date the page was last edited
     * Requires individual page ids to access timestamp
     */
    function timeDiff() {

        callAPI(
            {
                'action': 'query',
                'prop': 'info',
                'titles':
                    'RuneScape:Requests_for_permissions|' +
                    'RuneScape:AutoWikiBrowser/Requests|' +
                    'RuneScape:Administrator_requests|' +
                    'RuneScape:User_help|' +
                    'RuneScape:Counter-Vandalism_Unit',
                'format': 'json'
            },
            'GET',
            function(response) {
                var pageIds = [
                    '239188',
                    '211974',
                    '197645',
                    '92936',
                    '3558'
                ];

                for (i = 0; i < pageIds.length; i += 1) {
                    $('#' + reportIds[i]).html(time(response.query.pages[pageIds[i]].touched));
                }

            }
        );
    }

    /**
     * Reports the number of pages in a category
     * Adjusted to account for [[RuneScape:Placeholder]]
     */

    categoryArr = [
        'Category:Speedy_move_candidates',
        'Category:Speedy_deletion_candidates',
        'Category:Requests_for_closure'
    ];

    function categoryMembers(i) {
        callAPI(
            {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': categoryArr[i],
                'format': 'json'
            },
            'GET',
            function(response) {
                $('#' + reportIds[i + 5]).html(response.query.categorymembers.length - 1);
            }
        );
    }

    /**
     * Special page report
     * Adapted from [[MediaWiki:Common.js/spreport.js]]
     * Returns a maximum of 100 results
     */

    specialArr = [
        'BrokenRedirects',
        'DoubleRedirects',
        'Unusedcategories',
        'Unusedimages',
        'Wantedcategories',
        'Wantedfiles',
        'Wantedpages',
        'Wantedtemplates'
    ];

    function specialRequest(i) {
        callAPI(
            {
                'action': 'query',
                'list': 'querypage',
                'qppage': specialArr[i],
                'qplimit': '100',
                'format': 'json'
            },
            'GET',
            function (response) {
                $('#' + reportIds[i + 8]).html(response.query.querypage.results.length);
            }
        );
    }

    $(function () {
        insertHtml();

        // Show facebook throbber until loaded
        // Nothing is bound to ajaxStart, but this doesn't work without it being there
        $(document).ajaxStart().ajaxStop(function () {
            $('#ar-report-loading').hide();
            $('#ar-report-inner').css({
                'display': 'block'
            });
        });

        timeDiff();

        for (i = 0; i < categoryArr.length; i += 1) {
            categoryMembers(i);
        }

        for (i = 0; i < specialArr.length; i += 1) {
            specialRequest(i);
        }
    });

}(this.document, this.jQuery, this.mediaWiki));
