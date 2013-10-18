/**
 * Minieditor Autocomplete (MiniComplete)
 *
 * Adds autocomplete to certain form elements.
 * - Special:Upload description *
 * - Message Wall comments ^
 * - Blog comments ^
 * - Special:Forum posts ^
 *
 * * denotes a feature in in development
 * ^ denotes a feature has yet to start development
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 0.0.3.1
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
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

;( function ( $, mw ) {

    'use strict';
    
    var miniComplete = {
        /**
         * Loading function
         */
        init: function () {
        
            var selector = mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Upload' ? '#wpUploadDescription' :
                // @todo other textareas here
                false;
            
            if ( !selector ) {
                return;
            }
            
            $( selector ).on( 'input', function () {
                miniComplete.findTerm( this );
            } );
        
        },
        
        /**
         * Gets caret position for detecting search term and inserting autocomplete term.
         * 
         * @param elem {jquery object} Textarea element to get carert position of.
         * @return {number} Caret position in string.
         *         false {boolean} if browser does not support caret position methods
         *                         as this is likely to be of little help.
         */
        getCaretPos: function ( elem ) {
            
            console.log( elem );
            
        },

        /**
         * Counts back from caret position looking for unclosed {{ or [[
         * This will break if someone attempts to use [ within a template tranclusion
         * @example {{foo[bar
         * or a { within a wikitext link
         * @example [[foo{bar
         *
         * @param elem {jquery object} Element to look for search term within
         */
        findTerm: function ( elem ) {

            // @todo work from caret position
            var $val = $( elem ).val(),
                linkCheck = $val.lastIndexOf( '[['),
                templateCheck = $val.lastIndexOf( '{{' ),
                // disallows certain characters in serach terms
                // based on $wgLegalTitleChars <http://www.mediawiki.org/wiki/Manual:$wgLegalTitleChars>
                // and to prevent serahces for terms that don't need it
                // such as those with pipes as they signal template params or link display changes
                // or if the user is closing the link/template themselves
                illegalChars = /[\{\}\[\]\|#<>%\+\?\\]/,
                term;
            
            if ( linkCheck > -1 ) {
                if ( linkCheck < $val.lastIndexOf( ']]' ) ) {
                    return;
                }
                
                // lastIndexOf measures from just before it starts
                // so subtract 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( $val.length - linkCheck - 2 ) >= 0 ) {

                    term = $val.substring( linkCheck + 2 );

                    if ( term.match( illegalChars ) ) {
                        return;
                    }
                    
                    console.log( term );
                }

            }
            
            if ( templateCheck > -1 ) {
                if ( templateCheck < $val.lastIndexOf( '}}' ) ) {
                    return;
                }
                
                // lastIndexOf measures from just before it starts
                // so subtract 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( $val.length - templateCheck - 2 ) > 0 ) {

                    term = $val.substring( templateCheck + 2 );

                    if ( term.match( illegalChars ) ) {
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
         */
        insertComplete: function () {
        
        }
    };
    
    $( miniComplete.init );


}( jQuery, mediaWiki ) );
