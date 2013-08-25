// <syntaxhighlight lang="javascript">
/**
 * HeaderLinks
 *
 * This adds an icon to header tags which alters the url
 * to target that header which can be copied and pasted
 * into chat or discussions for easier linking without
 * having to dig it out of the ToC.
 *
 * @author  Cqm
 * @link    <http://dev.wikia.com/wiki/HeaderLinks>
 * @version 1.1
 * @comment Does not work on file pages, due to different header tag structure
 */

/*jshint
    browser:true, camelcase:true, curly:true, eqeqeq:true, forin:true,
    immed:true, indent:4, latedef:true, onevar:true, plusplus:true,
    quotmark:single, strict:true, trailing:true, undef:true, unused:true
*/

;(function ($, mw, mwConfig) {

    'use strict';

    var headerLinks = {
        init: function () {

            // abort if no headers exist
            if (!$('.mw-headline').length) {
                return;
            }

            // don't load twice
            if ($('.mw-header-link').length) {
                return;
            }

            // append css to head
            // easier that importing such a small amount of code
            mw.util.addCSS(
                '.mw-header-link{float:right;opacity:0;transition:opacity 0.5s linear;}' +
                'h1:hover .mw-header-link,h2:hover .mw-header-link,h3:hover .mw-header-link,h4:hover .mw-header-link,h5:hover .mw-header-link,h6:hover .mw-header-link{opacity:0.5;}' +
                '.mw-headline .mw-header-link:hover{opacity:1;}'
            );

            headerLinks.addLinks();

        },
        addLinks: function () {
            $('.mw-headline').each(function () {

                var link = $('<span/>').attr({
                        'class': 'mw-header-link',
                        'title': headerLinks.i18n
                    }).append(
                        $('<a/>').attr({
                            'href': '#' + $(this).attr('id')
                        }).append(
                            $('<img>').attr({
                                'width': '20',
                                'alt': 'Ambox padlock gray',
                                'src': '//upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Ambox_padlock_gray.svg/20px-Ambox_padlock_gray.svg.png'
                            })
                        )
                    );

                $(this).append(link);

            });
        },
        i18n: function () {

            var translations = {
                    en: 'Link to this header',
                    pl: 'Link do nagłówka'
                },
                lang;

            lang = translations[mwConfig.wgUserLanguage] || translations.en;
            return lang;

        }
    };

    $(headerLinks.init);

}(this.jQuery, this.mediaWiki, this.mediaWiki.config.values));

// </syntaxhighlight>