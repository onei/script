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
 * @version 0.0.6.1
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * Jshint warning messages: <https://github.com/jshint/jshint/blob/master/src/messages.js>
 * 
 * @todo Use Colors library to style options to fit into each wiki
 *       <http://dev.wikia.com/wiki/Colors>
 *       or use wgSassParams when I get time
 * 
 * Imports for testing:
 * - importScriptURI( 'https://raw.github.com/onei/script/master/wikiScripts/miniComplete.js' );
 * - mw.loader.load( 'https://raw.github.com/onei/script/master/wikiScripts/miniComplete.js' );
 */

/*global
    mediaWiki:true, dev:true
*/

/*jshint
    bitwise:true, camelcase:true, curly:true, eqeqeq:true, es3:false,
    forin:true, immed:true, indent:4, latedef:true, newcap:true,
    noarg:true, noempty:true, nonew:true, plusplus:true, quotmark:single,
    undef:true, unused:true, strict:true, trailing:true,
    
    browser:true, jquery:true,
     
    onevar:true
*/

// create globals
this.dev = this.dev || {};

// disable indent warning
/*jshint -W015 */
;( function ( document, $, mw, module ) {
/*jshint +W015 */

    'use strict';
    
    // implement colors module
    mw.loader.implement( 'dev.colors', [ 'http://dev.wikia.com/wiki/Colors/code.js?action=raw&ctype=javascript' ], {}, {} );

    module = {

        /**
         * Loading function
         */
        init: function () {
            
            console.log( 'init loaded');

            var selector = false,
                config = mw.config.get( [
                    'wgCanonicalSpecialPageName',
                    'wgNamespaceNumber'
                ] );
                
            if ( $( '#minicomplete-options' ).length ) {
                return;
            }

            // disable !! warnings (convert to boolean)
            // because this is a bit prettier than a staggered if statement
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

            module.insertCSS();
            module.insertMenu();
            
            // if pressing escape key hide options menu
            $( document ).on( 'keydown', function ( e ) {
                if ( e.keyCode === 27 ) {
                    console.lof( 'esc key pressed' );
                    $( '#minicomplete-wrapper' ).hide();
                }
            } );

            $( selector ).on( 'input', function () {
                // hide minicomplete-options
                $( '#minicomplete-wrapper' ).hide();
                
                // run api query
                module.findTerm( this );
            } );

        },

        /**
         * Gets caret position for detecting search term and inserting autocomplete term.
         * @source <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
         * 
         * @param elem {node} Textarea to get caret position of.
         * @return {number} Caret position in string.
         *                  If browser does not support caret position methods
         *                  returns 0 to prevent syntax errors
         */
        getCaretPos: function ( elem ) {

            var caretPos = 0,
                sel;

            // IE9 support
            // may need to exclude IE10 from this
            // Earlier versions of IE aren't supported so don't worry about them
            if ( document.selection ) {
                elem.focus();
                sel = document.selection.createRange();
                sel.moveStart( 'character', -elem.value.length );
                caretPos = sel.text.length;

            // Normal browsers
            } else if ( elem.selectionStart || elem.selectionStart === '0' ) {
                caretPos = elem.selectionStart;
            }

            return ( caretPos );

        },
        
        /**
         * Get x and y coordinates of caret
         * 
         * @source <http://stackoverflow.com/questions/16212871/get-the-offset-position-of-the-caret-in-a-textarea-in-pixels>
         */
        caretXYPos: function () {
          
            // do stuff
            
        },
        
        /**
         * Insert stylesheet using colours set by ThemeDesigner
         * 
         * @todo Allow custom colours for when there's non-themedesigner colours
         *       or custom monobook theme
         */
        insertCSS: function () {
            
            /*
            // example mcCols object
            window.mcCols = {
                border: '#000',
                text: '#000',
                background: '#fff',
                hoverText: '#000',
                hoverBackground: '#aaa'
            }
            */

            var pagebground = dev.colors.parse( dev.colors.wikia.page ),
                buttons = dev.colors.parse( dev.colors.wikia.menu ),
                mix = pagebground.mix( buttons, 20 ),
                css;
                
            if ( !pagebground.isBright() ){
                mix = mix.lighten( 8 );
            }
            
            css = [
                '#minicomplete-wrapper{border:2px solid #000;background-color:$page;color:$text;position:absolute;z-index:5;display:none;}',
                '#minicomplete-list{margin:0;}'
                '.minicomplete-option{border-top:1px solid $border;padding:5px 10px;list-style:none;margin:0;}',
                '.minicomplete-option:first-child{border-top:none;}',
                '.minicomplete-option:hover{background-color:$mix;}'
            ];
            
            // FIXME: $mix does not work
            dev.colors.css( css.join( '' ), {
                $mix: mix
            } );

        },
        
        /**
         * 
         */
        insertMenu: function () {
          
            var container = document.createElement( 'div' ),
                list = document.createElement( 'ul' );
            
            container.id = 'minicomplete-wrapper';
            list.id = 'minicomplete-list';
            
            container.appendChild( list );
            
            document.getElementsByTagName( 'body' )[0].appendChild( container );
            
        },

        /**
         * Counts back from caret position looking for unclosed {{ or [[
         *
         * @param elem {jquery object} Element to look for search term within
         * @todo Pass what kind of bracket is being used on
         *       [ or { for use in insertTerm
         */
        findTerm: function ( elem ) {

                // text to search for
            var searchText = $( elem ).val().substring( 0, module.getCaretPos( elem ) ),
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
                    
                    // fix for when the namespace is preceeded by a :
                    if ( term.indexOf( ':' ) === 0 ) {
                        term = term.substring( 1 );
                    }

                    // prevent searches for empty strings
                    if ( !term.length ) {
                        return;
                    }

                    console.log( term );
                    module.getSuggestions( term, 0 );

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
                    
                    // fix for when the namespace is preceeded by a :
                    if ( term.indexOf( ':' ) === 0 ) {
                        term = term.substring( 1 );
                    }

                    // prevent searches for empty strings
                    if ( !term.length ) {
                        return;
                    }

                    console.log( term );
                    module.getSuggestions( term, 10 );

                }

            }

        },

        /**
         * Queries mw api for possible suggestions
         *
         * @link <https://www.mediawiki.org/wiki/API:Allpages> Allpages API docs
         * @param term {string} Page title to search for
         * @param ns {integer} Namespace to search in
         */
        getSuggestions: function ( term, ns ) {

            var query = {
                    action: 'query',
                    list: 'allpages',
                    aplimit: '5',
                    apfilterredir: 'nonredirects',
                    apnamespace: ns,
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

            ( new mw.Api() ).get( query )
                            .done( function ( data ) {

                                // no suggestions
                                if ( !data.query.allpages.length ) {
                                    return;
                                }

                                module.showSuggestions( data.query.allpages );

                            } )
                            .error( function ( error ) {
                                console.log( 'API error: (', error );
                            } );

        },

        /**
         * Inserts list of options to select from
         * 
         * @param result {array} Result from API
         * @link <http://jsfiddle.net/5KqmF/112/> Example
         */
        showSuggestions: function ( result ) {

            var i,
                options = [];

            for ( i = 0; i < result.length; i += 1 ) {
                options.push( '<li class="minicomplete-option">' + result[i].title + '</li>' );
            }

            console.log( result, options );

            // append options to container
            $( '#minicomplete-list' ).html(
                options.join( '' )
            );
            
            // show option list
            $( '#minicomplete-wrapper' ).show();
            // temp css until we can use dependent
            $( '#minicomplete-wrapper' ).css( {
                position: 'fixed',
                top: '0'
            } );
            
            // position option list
            // check if too close to top/bottom/sides of the screen
            
            // add onclick handler for inserting the option
            $( '.minicomplete-option' ).on( 'click', function () {
                // module.insertComplete( this );
                console.log( $( this ).text() );
            } );
        
        },

        /**
         * Inserts selected suggestion
         * 
         * @param complete {string}
         * @param type {string} 'template' or 'link'
         */
        insertComplete: function ( complete, type ) {
            
            var insertAfter = type === 'link' ? '[[' : '{{';
            
            console.log( complete );
            
            // strip template namespace if applicable
            
            // count back from caret position to {{ or [[
            
            // reselect term
            // replace term with suggestion
            // add closing }} or ]] to suggestion
            
            // hide options menu

        }

    };

    // lazy load dependencies and run module.init as a callback
    // $( function ) is not used as it's very unlikely this will run before .ready()
    // due to creating dev.colors module
    mw.loader.using( [ 'dev.colors' ], module.init );

}( document, jQuery, mediaWiki, dev.miniEditor ) );
