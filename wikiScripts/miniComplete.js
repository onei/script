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
 * @version 0.0.3
 */

/*global
    jQuery:true, mediaWiki:true
*/

;( function ( $, mw ) {

    'use strict';
    
    var miniComplete = {
        /**
         * Loading function
         */
        init: function () {
        
            var selector;
            
            if ( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Upload' ) {
                selector = '#wpUploadDescription';
            }
            
            $( selector ).on( 'input', function () {
                miniComplete.findTerm( this );
            } );
        
        },

        /**
         * Counts back from caret position looking for unclosed {{ or [[
         *
         * @param elem {jquery object} Element to look for search term within
         */
        findTerm: function ( elem ) {

            // @todo work from caret position
            var $val = $( elem ).val(),
                linkCheck = $val.lastIndexOf( '[['),
                templateCheck = $val.lastIndexOf( '{{' ),
                term;
            
            // @todo add some sort of check to prevent conflicting checks
            //       in case someone decides to subst a magic word or something
            // @example [[{{subst:PAGENAME}} detailed]]

            if ( linkCheck > -1 ) {
                if ( linkCheck < $val.lastIndexOf( ']]' ) ) {
                    return;
                }
                
                // lastIndexOf measures from just before it starts
                // so subtract 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( $val.length - linkCheck - 2 ) >= 0 ) {

                    term = $val.substring( linkCheck + 2 );

                    // if we find a ], assume the user is closing the link themselves
                    if ( term.indexOf( ']' ) > -1 ) {
                        return;
                    }

                    // if a template is nested within cancel the checks
                    // as it's passed to the template check
                    if ( term.indexOf( '{' ) == -1 ) {
                        console.log( term );
                    }
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

                    // if we find a }, assume the user is closing the template themselves
                    if ( term.indexOf( '}' ) > -1 ) {
                        return;
                    }

                    // if a link is nested within the template cancel the check
                    // as it's passed to the link check
                    if ( term.indexOf( '[' ) === -1 ) {
                        console.log( term );
                    }
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
