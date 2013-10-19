/**
 * Minieditor Autocomplete (MiniComplete)
 *
 * Adds autocomplete to certain form elements.
 * - Special:Upload description
 * - Message Wall comments
 * - Blog comments
 * - Special:Forum posts
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 0.0.4.0
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * Jshint warning messages: <https://github.com/jshint/jshint/blob/master/src/messages.js>
 */

/*global
    mediaWiki:true
*/

/*jshint
    bitwise:true, camelcase:true, curly:true, eqeqeq:true, es3:false,
    forin:true, immed:true, indent:4, latedef:true, newcap:true,
    noarg:true, noempty:true, nonew:true, plusplus:true, quotmark:single,
    undef:true, unused:true, strict:true, trailing:true,
    
    browser:true, jquery:true,
     
    onevar:true
*/

// disable indent warning
/*jshint -W015 */
;( function ( document, $, mw ) {
/*jshint +W015 */

    'use strict';

    var miniComplete = {

        /**
         * Loading function
         */
        init: function () {

            var selector = false,
                config = mw.config.get( [
                    'wgCanonicalSpecialPageName',
                    'wgNamespaceNumber'
                ] );

            // disable !! warnings
            /*jshint -W018 */
            switch ( true ) {
            // Special:Upload
            case !!( config.wgCanonicalSpecialPageName === 'Upload' ):
                selector = '#wpUploadDescription';
                break;
            // Article and Blog comments
            case !!( $( '#WikiaArticleComments' ).length ):
            // Message wall comments
            case !!( config.wgNamespaceNumber === 1200 ):
            // Special:Forum posts (Thread namespace)
            case !!( config.wgNamespaceNumber === 1201 ):
            // Special:Forum posts (Board namespace)
            case !!( config.wgNamespaceNumber === 2000 ):
                selector = '.wikiaEditor';
                break;
            }
            /*jshint +W018 */

            if ( !selector ) {
                return;
            }

            $( selector ).on( 'input', function () {
                miniComplete.findTerm( this );
            } );

        },

        /**
         * Gets caret position for detecting search term and inserting autocomplete term.
         * @source <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
         * 
         * @param elem {string} Id of textarea to get caret position of.
         * @return {number} Caret position in string.
         *         false {boolean} if browser does not support caret position methods
         *                         as this is likely to be of little help.
         */
        getCaretPos: function ( selector ) {

            var elem = document.getElementById( selector ),
                caretPos = 0,
                sel;

            // IE9 support
            // may need to exclude IE10 from this
            // Earlier versions of IE aren't supported so don't worry about them
            if ( document.selection ) {
                elem.focus ();
                sel = document.selection.createRange();
                sel.moveStart('character', -elem.value.length);
                caretPos = sel.text.length;

            // Normal browsers
            } else if ( elem.selectionStart || elem.selectionStart === '0' ) {
                caretPos = elem.selectionStart;
            }

            return ( caretPos );

        },

        /**
         * Counts back from caret position looking for unclosed {{ or [[
         *
         * @param elem {jquery object} Element to look for search term within
         */
        findTerm: function ( elem ) {

                // for use in getCaretPos
            var textarea = $( elem ).attr( 'id' ),
                // text to search for
                searchText = $( elem ).val().substring( 0, miniComplete.getCaretPos( textarea ) ),
                // for separating search term
                linkCheck = searchText.lastIndexOf( '[['),
                templateCheck = searchText.lastIndexOf( '{{' ),
                // disallows certain characters in serach terms
                // based on $wgLegalTitleChars <http://www.mediawiki.org/wiki/Manual:$wgLegalTitleChars>
                // and to prevent searches for terms that don't need it
                // such as those with pipes as they signal template params or link display changes
                // or if the user is closing the link/template themselves
                illegalChars = /[\{\}\[\]\|#<>%\+\?\\]/,
                term;

            // searchText will be empty if the browser does not support getCaretPos
            // which will probably cause errors/confusion
            // so stop here if that's the case
            if ( !searchText.length ) {
                return;
            }

            if ( linkCheck > -1 ) {

                if ( linkCheck < searchText.lastIndexOf( ']]' ) ) {
                    return;
                }

                // lastIndexOf measures from just before it starts
                // so add 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( searchText.length - ( linkCheck + 2 ) ) >= 0 ) {

                    term = searchText.substring( linkCheck + 2 );

                    if ( term.match( illegalChars ) ) {
                        return;
                    }

                    // prevent searches for empty strings
                    if ( !term.length ) {
                        return;
                    }

                    console.log( term );

                }

            }

            if ( templateCheck > -1 ) {

                if ( templateCheck < searchText.lastIndexOf( '}}' ) ) {
                    return;
                }

                // lastIndexOf measures from just before it starts
                // so add 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( searchText.length - ( templateCheck + 2 ) ) > 0 ) {

                    term = searchText.substring( templateCheck + 2 );

                    if ( term.match( illegalChars ) ) {
                        return;
                    }

                    // prevent searches for empty strings
                    if ( !term.length ) {
                        return;
                    }

                    console.log( term );

                }

            }

        },

        /**
         * Queries mw api for possible suggestions
         *
         * For API docs, see <https://www.mediawiki.org/wiki/API:Allpages>
         *
         * @param term {string} Page title to search for
         */
        getSuggestions: function ( term ) {

            var query = {
                    action: 'query',
                    list: 'allpages',
                    aplimit: '5',
                    apnamespace: '0',
                    apprefix: term
                },
                termSplit,
                namespaceId,
                title;

            if ( term.indexOf( ':' ) > -1 ) {

                termSplit = term.split( ':' );
                title = termSplit[1];

                // make sure there's only the namespace and the page title
                if ( termSplit.length > 2 ) {
                    console.log( 'Namespace error detected. Aborting suggestion search.' );
                    return;
                }

                namespaceId = mw.config.get( 'wgNamespaceIds' )[
                    // wgNamespaceIds uses underscores and lower case
                    termSplit[0].replace( / /g, '_' )
                                .toLowerCase()
                ];

                if ( namespaceId ) {
                    query.apnamespace = namespaceId;
                    query.apprefix = title;
                }

            }

            ( new mw.API() ).get( query )
                            .done( function ( data ) {
                                console.log( data );
                            } )
                            .error( function ( error ) {
                                console.log( 'API error: (', error );
                            } );

        },

        /**
         * Inserts list of options to select from
         */
        showSuggestions: function () {
        
        },

        /**
         * Inserts selected suggestion
         * 
         * It is virtually impossible to get caret coordinates straight from the textarea
         * so convert a jQuery plugin for our needs <https://github.com/Codecademy/textarea-helper>
         */
        insertComplete: function () {
        
        }

    };

    $( miniComplete.init );

}( document, jQuery, mediaWiki ) );
