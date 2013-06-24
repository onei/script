// <syntaxhighlight lang="javascript">
/**
 * HeaderLinks
 *
 * This adds an icon to header tags which alters the url
 * to target that header which can be copied and pasted
 * into chat or discussions for easier linking without
 * having to dig it out of the ToC.
 *
 * @author Cåm
 * Thanks to Matthew2602 for tips and improvements.
 *
 * For documentation see http://dev.wikia.com/wiki/HeaderLinks
 */

/**
 * Notes
 *
 * Does not work on file pages, due to different header tag structure - 2013-06-01.
 * Opacity not supported by ie8.
 * Transition not supported by ie9.
 */

/*jshint
    browser:true, camelcase:true, curly:true, eqeqeq:true, forin:true,
    immed:true, indent:4, latedef:true, onevar:true, plusplus:true,
    quotmark:single, strict:true, trailing:true, undef:true, unused:true
*/

(function ($, mw, document) {

    'use strict';

    $(function () {
    
        var translations,
            i18n;

        if ($('mw-headline').length && $('.mw-header-link').length === 0) {
            return;
        }

        mw.util.addCSS(
            '.mw-header-link {' +
                'float: right;' +
                'opacity: 0;' +
            '}' +
            
            '.mw-headline:hover .mw-header-link {' +
                'opacity: 0.5;' +
            '}' +
            
            '.mw-headline:hover .mw-header-link:hover {' +
                'opacity: 1;' +
            '}'
        );

        // internationalization
        translations = {
            en: 'Link to this header',
            pl: 'Link do nagłówka'
        };

        i18n = translations[mw.config.get('wgUserLanguage')] || translations.en;

        $('.mw-headline').each(function (index, header) {

            var id,
                link;

            id = $(header).attr('id');

            link = $('<span/>', {
                'class': 'mw-header-link'
                'title': i18n
            }).append(
                $('<a/>', {
                    'href': id
                }).append(
                    $('<img>', {
                        'width': '20',
                        'alt': 'Ambox padlock gray'.
                        'src': '//upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Ambox_padlock_gray.svg/20px-Ambox_padlock_gray.svg.png';
                    })
                )
            );

            $(header).append(link);

        });

    });


}(this.jQuery, this.mediaWiki, this.document));
// </syntaxhighlight>
