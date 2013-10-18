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
 * @version 0.0.3.2
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
        
            // this is kinda complicated, so it might be easier to check the selector from $( this ).attr( 'id' )
            // and compare to a predefined list of selectors it should match under certain circumstances
            // such as namespace id or specialpagename
            // but it does appear that all of these have ids to use document.getElementByID in getCaretPos
            var selector = false;
            
            if ( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Upload' ) {
                selector = '#wpUploadDescription';
            }
            
            // Message wall comments
            // #WikiaEditor-X.wikiaEditor.focused
            // X is a number
            // extract selector from $( this ).attr( 'id' )?
            
            // Blog comments
            // #article-comm for new comments
            // #article-comm-... for replies
            // which would also apply to article comnments
            
            // Special:Forum posts
            // same as message wall comments
            // else return false
            
            if ( !selector ) {
                return;
            }
            
            $( selector ).on( 'input', function () {
                // selector is used for caret pos
                miniComplete.findTerm( this );
            } );
        
        },
        
        /**
         * Gets caret position for detecting search term and inserting autocomplete term.
         * @link <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
         * 
         * @param elem {jquery object} Textarea element to get carert position of.
         * @return {number} Caret position in string.
         *         false {boolean} if browser does not support caret position methods
         *                         as this is likely to be of little help.
         */
        getCaretPos: function ( selector ) {
            
            console.log( selector );
            
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
                // so add 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( $val.length - ( linkCheck + 2 ) ) >= 0 ) {

                    term = $val.substring( linkCheck + 2 );

                    if ( term.match( illegalChars ) ) {
                        return;
                    }
                    
                    if ( !term.length ) {
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
                // so add 2 to check the term length
                // to make sure we're just selecting the search term
                if ( ( $val.length - ( templateCheck + 2 ) ) > 0 ) {

                    term = $val.substring( templateCheck + 2 );

                    if ( term.match( illegalChars ) ) {
                        return;
                    }
                    
                    if ( !term.length ) {
                        return
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


}( jQuery, mediaWiki ) );
