// <syntaxhighlight lang="javascript">
/**
 * Minieditor Autocomplete (MiniComplete)
 *
 * Adds autocomplete to certain form elements.
 * - Special:Upload description
 * - Special:MultipleUpload description
 * - Message Wall comments
 * - Article comments
 * - Blog comments
 * - Special:Forum posts
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 1.1
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * @link <http://dev.wikia.com/wiki/MiniComplete> Documentation
 * @link <https://github.com/jshint/jshint/blob/master/src/messages.js> Jshint warning messages
 * @link <http://dev.wikia.com/wiki/Colors> Color library documentation
 * @link <https://github.com/Codecademy/textarea-helper> Textarea-helper documentation
 * 
 * @todo Add some kind of opt out setting for sitewide installations
 * @todo Add support for custom CSS styling of the autocomplete menu
 * @todo Check shorthand namespaces in redirects work
 * @todo Make sure this can be used in other scripts and add docs
 * @todo Add demo on doc page
 */

/*global
    mediaWiki:true, dev:true
*/

/*jshint
    bitwise:true, camelcase:true, curly:true, eqeqeq:true, es3:false,
    forin:true, immed:true, indent:4, latedef:true, newcap:true,
    noarg:true, noempty:true, nonew:true, plusplus:true, quotmark:single,
    undef:true, unused:true, strict:true, trailing:true,
    browser:true, devel:false, jquery:true,
    onevar:true
*/

// create globals
this.dev = this.dev || {};
this.dev.miniComplete = this.dev.miniComplete || {};

// disable indent warning
/*jshint -W015 */
;( function ( document, $, mw, dev ) {
/*jshint +W015 */

    'use strict';

    dev.minicomplete = {

        /**
         * Checks for correct environment and implements custom ResourceLoader modules
         */
        init: function () {

            var selector = false,
                config = mw.config.get( [
                    'wgCanonicalSpecialPageName',
                    'wgNamespaceNumber'
                ] );

            if ( $( '#minicomplete-options' ).length ) {
                return;
            }

            // prevent loading twice
            if ( dev.minicomplete.loaded ) {
                return;
            }

            dev.minicomplete.loaded = true;

            // disable !! warnings (convert to boolean)
            // because this is a bit prettier than a staggered if statement/ternary
            /*jshint -W018 */
            switch ( true ) {
            // Special:Upload
            case !!( config.wgCanonicalSpecialPageName === 'Upload' ):
            // Special:MultipleUpload (is there a right associated with using this?)
            case !!( config.wgCanonicalSpecialPageName === 'MultipleUpload' ):
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
            // so create our custom resourceloader modules
            // combined into a single http request and minified
            // courtesy of ResourceLoader
            mw.loader.implement( 'minicomplete.dependencies', [ '/load.php?debug=false&lang=en&mode=articles&skin=oasis&missingCallback=importArticleMissing&articles=u%3Acamtest%3AMediaWiki%3ATextareaHelper.js%7Cu%3Adev%3AColors%2Fcode.js&only=scripts' ], {}, {} );

            // we need custom module after this point
            // so declare our dependencies and run the rest of the script
            // in the callback
            mw.loader.using( [ 'minicomplete.dependencies', 'mediawiki.api' ], function () {
                dev.minicomplete.load( selector );
            } );

        },

        /**
         * Loads the rest of the functions
         *
         * @param selector {string} Selector to bind events in textarea to
         */
        load: function ( selector ) {

            dev.minicomplete.insertCSS();
            dev.minicomplete.insertMenu();
            dev.minicomplete.bindEvents();

            $( selector ).on( 'input', function () {
                // hide menu
                $( '#minicomplete-wrapper' ).hide();
                $( '#minicomplete-list' ).empty();

                // store node for later use
                dev.minicomplete.elem = this;

                // run api query
                dev.minicomplete.findTerm( dev.minicomplete.elem );
            } );

        },

        /**
         * Binds events related to navigating through menu with up/down keys
         */
        bindEvents: function () {

            $( document ).on( 'keydown', function ( e ) {

                var $option = $( '.minicomplete-option' ),
                    $select = $( '.minicomplete-option.selected' ),
                    i;

                // hide options menu on esc keydown
                if ( e.keyCode === 27 ) {
                    $( '#minicomplete-wrapper' ).hide();
                    $( '#minicomplete-list' ).empty();
                }

                // select option using up key
                if ( e.keyCode === 38 ) {

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

                // select option using down key
                if ( e.keyCode === 40 ) {

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
                                    if ( i === ( $option.length - 1 ) ) {
                                        $( $option[0] ).addClass( 'selected' );
                                    // else move down list
                                    } else {
                                        $( $option[i + 1] ).addClass( 'selected' );
                                    }

                                    return;
                                }
                            }
                        }
                    }
                }

                // insert selected option using enter key
                if ( e.keyCode === 13 ) {
                    if ( $select.length ) {
                        e.preventDefault();
                        dev.minicomplete.insertComplete( $select.text() );
                    }
                }
            } );

        },

        /**
         * Gets caret position for detecting search term and inserting autocomplete term.
         * @source <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
        *
        * @return {number} Caret position in string.
        *                  If browser does not support caret position methods
        *                  returns 0 to prevent syntax errors
        */
        getCaretPos: function () {

            var elem = dev.minicomplete.elem,
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

        },

        /**
         * Insert stylesheet using colours set by ThemeDesigner
         *
         * For documentation on Colors library, see <http://dev.wikia.com/wiki/Colors>
         *
        * @todo Allow custom colours for when there's non-themedesigner colours
        *       or custom monobook theme
        */
        insertCSS: function () {

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

        },

        /**
         * Inserts options div container and ul
         * So it's ready for populating with li elements when required
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
         * @param elem {node} Element to look for search term within
        */
        findTerm: function ( elem ) {

                // text to search for
            var searchText = elem.value.substring( 0, dev.minicomplete.getCaretPos() ),
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

                    // set type here as it's easier than
                    // passing it through all the functions
                    dev.minicomplete.type = '[[';
                    dev.minicomplete.getSuggestions( term, 0 );

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

                    // set type here as it's easier than
                    // passing it through all the functions
                    dev.minicomplete.type = '{{';
                    dev.minicomplete.getSuggestions( term, ns );

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

                                // error handling
                                if ( data.error ) {
                                    mw.log( data.error.code, data.error.info );
                                    return;
                                }

                                // no suggestions
                                if ( !data.query.allpages.length ) {
                                    return;
                                }

                                dev.minicomplete.showSuggestions( data.query.allpages );

                            } )
                            .error( function ( error ) {
                                mw.log( 'API error: (', error );
                            } );

        },

        /**
         * Inserts list of options to select from
         *
         * @param result {array} Result from API
        */
        showSuggestions: function ( result ) {

            var i,
                options = [],
                coords,
                offset,
                $options;

            for ( i = 0; i < result.length; i += 1 ) {
                options.push( '<li class="minicomplete-option">' + result[i].title + '</li>' );
            }

            // append options to container
            $( '#minicomplete-list' ).html(
                options.join( '' )
            );

            // show option list
            $( '#minicomplete-wrapper' ).show();

            // position option list
            coords = $( dev.minicomplete.elem ).textareaHelper( 'caretPos' );
            offset = $( dev.minicomplete.elem ).offset();

            $( '#minicomplete-wrapper' ).css( {
                top: offset.top + coords.top - $( '#minicomplete-wrapper').height(),
                left: offset.left + coords.left
            } );

            // I haven't added any behaviour for if the menu is outside of the window
            // as if I moved it down it would obscure text
            // and if I moved it up chances are the user can't see the textarea in the first place

            // may possibly need right/left repositioning for monobook
            // see what feedback says

            // add event handlers for .minicomplete-option here
            // as the won't fire if they aren't created when you try to bind
            // events to them

            // cache options
            $options = $( '.minicomplete-option' );

            // add onclick handler for inserting the option
            $options.on( 'click', function () {
                dev.minicomplete.insertComplete( $( this ).text() );
            } );

            // clear .selected class on hover
            // css :hover pseudo-class does hover colour change instead
            $options.on( 'mouseover', function () {
                if ( $( '.minicomplete-option.selected' ).length ) {
                    // don't use this here as it refers to the hovered element
                    // we want to strip the selected class as soon as we enter the menu
                    $options.removeClass( 'selected' );
                }
            } );

        },

        /**
         * Inserts selected suggestion
         *
         * @param complete {string} Search suggestion to insert
         */
        insertComplete: function ( complete ) {

            var caret = dev.minicomplete.getCaretPos(),
                val = dev.minicomplete.elem.value,
                text = val.substring( 0, caret ),
                open = dev.minicomplete.type,
                close = open === '[[' ? ']]' : '}}',
                before = text.substring( 0, text.lastIndexOf( open ) );

            // strip template namespace for template transclusion
            if ( open === '{{' && complete.split( ':' )[0] === 'Template' ) {
                complete = complete.split( ':' )[1];
            }

            // check if a colon is after the opening brackets
            if ( text[text.lastIndexOf( open ) + 2] === ':' ) {
                open += ':';
            }

            // insert search term
            dev.minicomplete.elem.value = before + open + complete + close + val.substring( caret );
        
            // hide options
            $( '#minicomplete-wrapper' ).hide();
            $( '#minicomplete-list' ).empty();

        }
    };

    $( dev.minicomplete.init );

}( document, jQuery, mediaWiki, dev ) );

// </syntaxhighlight> __NOWYSIWYG__
