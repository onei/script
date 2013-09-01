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
 * @link    <http://dev.wikia.com/wiki/HeaderLinks> Documentation
 * @version 1.1.2
 * @comment Does not work on file pages, due to different header tag structure
 */

/*jshint
    browser:true, camelcase:true, curly:true, eqeqeq:true, forin:true,
    immed:true, indent:4, latedef:true, newcap:true, noarg:true,
    noempty:true, nonew:true, onevar:true, plusplus:true, quotmark:single,
    strict:true, trailing:true, undef:true, unused:true
*/

;( function ( $, mw ) {

    'use strict';

    var translations = {
        de: 'Link auf diesen Titel',
        en: 'Link to this header',
        nl: 'Link op deze titel',
        pl: 'Link do nagłówka'
    },
    
    headerLinks = {
        init: function () {
            
            var headers = $( '.mw-headline' );
            
            // abort if no headers exist
            if ( !headers.length ) {
                return;
            }
            
            // don't load twice
            if ( $( '.mw-header-link' ).length ) {
                return;
            }
            
            headerLinks.addLinks( headers );
            
        },
        addLinks: function (headers) {
            
            // append css to head
            // easier than importing such a small amount of code
            mw.util.addCSS(
                '.mw-header-link{float:right;opacity:0;transition:opacity 0.3s linear;}' +
                'h1:hover .mw-header-link,h2:hover .mw-header-link,h3:hover .mw-header-link,h4:hover .mw-header-link,h5:hover .mw-header-link,h6:hover .mw-header-link{opacity:0.5;}' +
                '.mw-headline .mw-header-link:hover{opacity:1;}'
            );
            
            headers.each( function () {
                
                var $a = $( '<a/>' )
                .attr( 'title',
                    translations[ mw.config.get( 'wgUserLanguage' ) ] || translations.en
                )
                .append(
                    $( '<img>' )
                    .attr( {
                        width: '20',
                        alt: 'Ambox padlock gray',
                        src: '//upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Ambox_padlock_gray.svg/20px-Ambox_padlock_gray.svg.png'
                    } )
                ),
                
                $span =  $( '<span/>' )
                .attr( 'class', 'mw-header-link' )
                .append( $a );
                
                return function () {
                    var $h = $( this );
                    $a.attr( 'href', '#' + $h.attr( 'id' ) );
                    $h.append( $span.clone() );
                };
                
            } () );
            
        }
    };

    $( headerLinks.init );
    
}( this.jQuery, this.mediaWiki ) );

// </syntaxhighlight> __NOWYSIWYG__