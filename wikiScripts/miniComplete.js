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
 * @version 0.0.7.3
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * Jshint warning messages: <https://github.com/jshint/jshint/blob/master/src/messages.js>
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
this.dev.miniComplete = this.dev.miniComplete || {};

// disable indent warning
/*jshint -W015 */
;( function ( document, $, mw, module ) {
/*jshint +W015 */

    'use strict';

    /**
     * Checks for correct environment
     */
    module.init =  function () {

        var selector = false,
            config = mw.config.get( [
                'wgCanonicalSpecialPageName',
                'wgNamespaceNumber'
            ] );

        if ( $( '#minicomplete-options' ).length ) {
            return;
        }

        // disable !! warnings (convert to boolean)
        // because this is a bit prettier than a staggered if statement/ternary
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

        // by this point we know this can run
        // so implement colors module
        mw.loader.implement( 'dev.colors', [ 'http://dev.wikia.com/wiki/Colors/code.js?action=raw&ctype=javascript' ], {}, {} );

        // we need Colors after this point
        // so declare our dependencies and run the rest of the script
        // in the callback
        mw.loader.using( [ 'dev.colors', 'mediawiki.api' ], function () {
            module.load( selector );
        } );

    };

    /**
     * Loads the rest of the functions and adds event listeners
     * 
     * @param selector {string} Selector to bind events in textarea to
     */
    module.load = function ( selector ) {

        module.insertCSS();
        module.insertMenu();

        // hide options menu on esc keydown
        $( document ).on( 'keydown', function ( e ) {
            
            var $option = $( '.minicomplete-option' ),
                $select = $( '.minicomplete-option.selected' ),
                i;
            
            if ( e.keyCode === 27 ) {
                console.log( 'esc key pressed' );
                $( '#minicomplete-wrapper' ).hide();
                $( '#minicomplete-list' ).empty();
            }
            
            if ( e.keyCode === 38 ) {
                console.log( 'up key pressed' );
                
                if ( $option.length ) {
                    // stop caret moving
                    e.preventDefault();
                
                    if ( !$select.length ) {
                        $( $option[$option.length - 1] ).addClass( 'selected' );
                    } else {
                        for ( i = 0; i < $option.length; i += 1 ) {
                            if ( $( $option[i] ).hasClass( 'selected' ) ) {
                                
                                // remove class
                                $( $option[i] ).removeClass( 'selected' );
                                
                                // if at top of list jump to bottom
                                if ( i === 0 ) {
                                    $( $option[$option.length - 1] ).addClass( 'selected' );
                                // else move up list
                                } else {
                                    $( $option[i - 1] ).addClass( 'selected' );
                                }
                                
                                return;
                            }
                        }
                    }
                }
            }
            
            if ( e.keyCode === 40 ) {
                console.log( 'down key pressed' );
                
                if ( $option.length ) {
                    // stop caret moving
                    e.preventDefault();
                
                    if ( !$select.length ) {
                        $( $option[0] ).addClass( 'selected' );
                    } else {
                        for ( i = 0; i < $option.length; i += 1 ) {
                            if ( $( $option[i] ).hasClass( 'selected' ) ) {
                                // remove selected class
                                $( $option[i] ).removeClass( 'selected' );
                        
                                // if at bottom of list jump to top
                                console.log( i, i + 1, $option.length, $option.length - 1 );
                                if ( i === ( $option.length - 1 ) ) {
                                    console.log( 'bottom of list' );
                                    $( $option[0] ).addClass( 'selected' );
                                // else move down list
                                } else {
                                    console.log( 'moving down list' );
                                    $( $option[i + 1] ).addClass( 'selected' );
                                }
                            
                                return;
                            }
                        }
                    }
                }
            }
            
            if ( e.keyCode === 13 ) {
                console.log( 'enter key pressed' );
                if ( $select.length ) {
                    e.preventDefault();
                    console.log( $select.text() );
                }
            }
        } );

        $( selector ).on( 'input', function () {
            // hide menu
            $( '#minicomplete-wrapper' ).hide();
            $( '#minicomplete-lest' ).empty();
            
            // store node for later use
            module.elem = this;
            
            // run api query
            module.findTerm( module.elem );
        } );

    };

    /**
     * Gets caret position for detecting search term and inserting autocomplete term.
     * @source <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
     * 
     * @return {number} Caret position in string.
     *                  If browser does not support caret position methods
     *                  returns 0 to prevent syntax errors
     */
    module.getCaretPos = function () {

        var elem = module.elem,
            caretPos = 0,
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

    };

    /**
     * Get x and y coordinates of caret
     * 
     * @source <http://stackoverflow.com/questions/16212871/get-the-offset-position-of-the-caret-in-a-textarea-in-pixels>
     */
    module.caretXYPos = function () {

        // do stuff

    };

    /**
     * Insert stylesheet using colours set by ThemeDesigner
     * 
     * For documentation on Colors library, see <http://dev.wikia.com/wiki/Colors>
     * 
     * @todo Allow custom colours for when there's non-themedesigner colours
     *       or custom monobook theme
     */
    module.insertCSS = function () {

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
            mix = buttons.mix( pagebground, 20 ),
            shadow = pagebground.lighten( -8 ),
            css;

        if ( !pagebground.isBright() ){
            mix = mix.lighten( 8 );
        }

        css = [
            '#minicomplete-wrapper{border:1px solid $border;background-color:$page;color:$text;position:absolute;z-index:5;display:none;font-size:12px;cursor:pointer;width:245px;-webkit-box-shadow:3px 3px 6px 0 $shadow;box-shadow:3px 3px 6px 0 $shadow;}',
            '#minicomplete-list{margin:0;}',
            '.minicomplete-option{padding:4px 9px;list-style:none;margin:0;line-height:25px;}',
            '.minicomplete-option:hover,.minicomplete-option.selected{background-color:$mix;}'
        ];

        dev.colors.css( css.join( '' ), {
            mix: mix,
            shadow: shadow
        } );

    };
        
    /**
     * Inserts options div container and ul
     * So it's ready for populating with li elements when required
     */
    module.insertMenu = function () {
          
        var container = document.createElement( 'div' ),
            list = document.createElement( 'ul' );
            
        container.id = 'minicomplete-wrapper';
        list.id = 'minicomplete-list';
            
        container.appendChild( list );
            
        document.getElementsByTagName( 'body' )[0].appendChild( container );
            
    };

    /**
     * Counts back from caret position looking for unclosed {{ or [[
     *
     * @param elem {node} Element to look for search term within
     */
    module.findTerm = function ( elem ) {

            // text to search for
        var searchText = $( elem ).val().substring( 0, module.getCaretPos() ),
            // for separating search term
            linkCheck = searchText.lastIndexOf( '[['),
            templateCheck = searchText.lastIndexOf( '{{' ),
            // disallows certain characters in search terms
            // based on $wgLegalTitleChars <http://www.mediawiki.org/wiki/Manual:$wgLegalTitleChars>
            // and to prevent searches for terms that don't need it
            // such as those with pipes as they signal template params or link display changes
            // or if the user is closing the link/template themselves
            illegalChars = /[\{\}\[\]\|#<>%\+\?\\]/,
            term,
            ns;

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

                // set type here as it's easier than
                // passing it through all the functions
                module.type = '[[';
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
                    // use mainspace queries if using a :
                    // as it signifies a page transclusion
                    // rather than a template
                    ns = 0;
                } else {
                    ns = 10;
                }

                // prevent searches for empty strings
                if ( !term.length ) {
                    return;
                }

                console.log( term );

                // set type here as it's easier than
                // passing it through all the functions
                module.type = '{{';
                module.getSuggestions( term, ns );

            }

        }

    };

    /**
     * Queries mw api for possible suggestions
     *
     * @link <https://www.mediawiki.org/wiki/API:Allpages> Allpages API docs
     * @param term {string} Page title to search for
     * @param ns {integer} Namespace to search in
     */
    module.getSuggestions = function ( term, ns ) {

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

                            // error handling
                            if ( data.error ) {
                                console.log( data.error.code, data.error.info );
                                return;
                            }

                            // no suggestions
                            if ( !data.query.allpages.length ) {
                                return;
                            }

                            module.showSuggestions( data.query.allpages );

                        } )
                        .error( function ( error ) {
                            console.log( 'API error: (', error );
                        } );

    };

    /**
     * Inserts list of options to select from
     * 
     * @param result {array} Result from API
     * @link <http://jsfiddle.net/5KqmF/112/> Example
     */
    module.showSuggestions = function ( result ) {

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
        
        // temp css until we can use xy pos
        // @todo finish module.caretXYPos
        $( '#minicomplete-wrapper' ).css( {
            position: 'fixed',
            top: '0'
        } );

        // position option list
        // check if too close to top/bottom/sides of the screen

        // add onclick handler for inserting the option
        $( '.minicomplete-option' ).on( 'click', function () {
            module.insertComplete( $( this ).text() );
        } );

        /*
        // clear .selected class on hover
        // css :hover pseudo-class does hover colour change instead
        $( '.minicomplete-option' ).on( 'hover', function () {
            $( '.minicomplete-option' ).removeClass( 'selected' );
        } );
        */

    };

    /**
     * Inserts selected suggestion
     * 
     * @param complete {string} Search suggestion to insert
     * @todo Allow user to navigate through suggestions with up/down keys
     */
    module.insertComplete = function ( complete ) {

        console.log( complete, module.type );

        var caret = module.getCaretPos(),
            val = $( module.elem ).val(),
            text = val.substring( 0, caret ),
            open = module.type,
            close = open === '[[' ? ']]' : '}}',
            before = text.substring( 0, text.lastIndexOf( open ) );
        
        // strip template namespace for template transclusion
        if ( module.type === '{{' && complete.split(':')[0] === 'Template' ) {
            complete = complete.split(':')[1];
        }
        
        // check if a colon is after the opening brackets
        if ( text[ text.lastIndexOf( open ) + 2 ] === ':' ) {
            open += ':';
        }

        // insert search term
        $( module.elem ).val(
            before + open + complete + close + val.substring( caret )
        );
        
        // hide options
        $( '#minicomplete-wrapper' ).hide();
        $( '#minicomplete-list' ).empty();

        console.log( 'boom' );

    };

    $( module.init );

}( document, jQuery, mediaWiki, dev.miniComplete ) );
