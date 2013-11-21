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
 * Can also be used in other scripts that require an autocomplete
 * See documentation page for details
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 1.2.6
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * @link <http://dev.wikia.com/wiki/MiniComplete> Documentation
 * @link <https://github.com/jshint/jshint/blob/master/src/messages.js> Jshint warning messages
 * @link <http://dev.wikia.com/wiki/Colors> Colors documentation
 * @link <https://github.com/Codecademy/textarea-helper> Textarea-helper documentation
 * 
 * @notes There are various calls to mw.log() to help with debugging if you are
 *        using this within another script. To see these append ?debug=true to
 *        your url.
 *
 * @todo Add some kind of opt out setting for sitewide installations
 * @todo Add support for custom CSS styling of the autocomplete menu
 * @todo Add support for Special pages
 */

/*jshint
    bitwise:true, camelcase:true, curly:true, eqeqeq:true, es3:false,
    forin:true, immed:true, indent:4, latedef:true, newcap:true,
    noarg:true, noempty:true, nonew:true, plusplus:true, quotmark:single,
    undef:true, unused:true, strict:true, trailing:true,
    browser:true, devel:false, jquery:true,
    onevar:true
*/

// disable indent warning
/*jshint -W015 */
;( function ( document, $, mw, dev, undefined ) {
/*jshint +W015 */

    'use strict';

    dev.minicomplete = function () {

        // properties that set throughout the script for later use
        // list them here to keep track easier
        var type = false;

        /**
         * @desc Checks if Article comments are loaded and run autocomplete when done
         */
        function commentsLoaded() {
            if ( window.ArticleComments.initCompleted ) {
                mw.log( 'Article comments loaded' );
                dev.minicomplete.load( '#article-comm' );
                
                // this is where we detect replies being added
                // as the textareas used aren't inserted when the comments are loaded
                // but when someone actually wants to reply
                $( $( '.article-comm-reply' ) ).on( 'click', function () {
                    
                    mw.log( 'reply detected' );
                    
                    // don't continue if there is already an editor present
                    // which is leftover from making a reply previously
                    if ( $( this ).parent().parent().next().find( '.wikiaEditor' ).length ) {
                        return;
                    }
                        
                    // use this value for reference
                    var miniEditors =  $( '.wikiaEditor' ).length;

                    editorInserted( miniEditors, '.wikiaEditor' );
                    
                } );
            } else {
                setTimeout( commentsLoaded, 500 );
            }
        }
        
        /**
         * @desc Looks for new textareas to run script on
         * @param {number} editors Number of editor at start of check
         * @param {string} selector Selector of editor to track
         */
        function editorInserted( editors, selector ) {
            
            // if there's no editor yet stop and repeat again
            if ( $( selector ).length === editors ) {
                setTimeout( function () {
                    editorInserted( editors, selector );
                }, 500 );
                return;
            }
            
            mw.log( 'new editor inserted' );
            dev.minicomplete.load( selector );
            
        }

        /**
         * @desc Insert stylesheet using colours set by ThemeDesigner
         * @todo Allow custom colours for when there's non-themedesigner colours
         *       or custom monobook theme
         */
        function insertCSS() {

            var page = dev.colors.parse( dev.colors.wikia.page ),
                buttons = dev.colors.parse( dev.colors.wikia.menu ),
                mix = buttons.mix( page, 20 ),
                shadow = page.lighten( -8 ),
                css;

            if ( !page.isBright() ){
                mix = mix.lighten( 8 );
            }

            css = [
                // constant css for container
                '#minicomplete-list{position:absolute;z-index:5;display:none;font-size:12px;cursor:pointer;width:245px;margin:0;}',
                // variable css for container
                '#minicomplete-list{border:1px solid $border;background-color:$page;color:$link;-webkit-box-shadow:3px 3px 6px 0 $shadow;box-shadow:3px 3px 6px 0 $shadow;}',
                // constant css for options
                '.minicomplete-option{padding:4px 9px;list-style:none;margin:0;line-height:25px;}',
                // variable css for options
                '.minicomplete-option:hover,.minicomplete-option.selected{background-color:$mix;}'
            ];

            dev.colors.css( css.join( '' ), {
                mix: mix,
                shadow: shadow
            } );

        }

        /**
         * @desc Binds events related to navigating through menu with up/down keys
         *       and what to do when pressing esc or left/right keys
         */
        function bindEvents() {
            
            var i,
                $option = [],
                $select = [],
                e,
                keycode = {
                    // Esc key - hide options
                    '27': function () {
                        $( '#minicomplete-list' ).hide().empty();
                    },
                    // left arrow key - hide options
                    '37': function () {
                        $( '#minicomplete-list' ).hide().empty();
                    },
                    // right arrow key - hide options
                    '39': function () {
                        $( '#minicomplete-list' ).hide().empty();
                    },
                    // up arrow key - navigate upwards through menu
                    '38': function () {
                        if ( !$option.length ) {
                            return;
                        }
                    
                        // stop caret moving
                        e.preventDefault();

                        if ( !$select.length ) {
                            $( $option[ $option.length - 1 ] ).addClass( 'selected' );
                        } else {
                            for ( i = 0; i < $option.length; i += 1 ) {
                                if ( $( $option[ i ] ).hasClass( 'selected' ) ) {
                                    // remove class
                                    $( $option[ i ] ).removeClass( 'selected' );
                                    // if at top of list jump to bottom
                                    if ( i === 0 ) {
                                        $( $option[ $option.length - 1 ] ).addClass( 'selected' );
                                    // else move up list
                                    } else {
                                        $( $option[ i - 1 ] ).addClass( 'selected' );
                                    }
                                    return;
                                }
                            }
                        }
                    },
                    // down arrow key - navigate downwards through menu
                    '40': function () {
                        if ( !$option.length ) {
                            return;
                        }

                        // stop caret moving
                        e.preventDefault();

                        if ( !$select.length ) {
                            $( $option[0] ).addClass( 'selected' );
                        } else {
                            for ( i = 0; i < $option.length; i += 1 ) {
                                if ( $( $option[ i ] ).hasClass( 'selected' ) ) {
                                    // remove selected class
                                    $( $option[ i ] ).removeClass( 'selected' );
                                    // if at bottom of list jump to top
                                    if ( i === ( $option.length - 1 ) ) {
                                        $( $option[ 0 ] ).addClass( 'selected' );
                                    // else move down list
                                    } else {
                                        $( $option[ i + 1 ] ).addClass( 'selected' );
                                    }

                                    return;
                                }
                            }
                        }
                    },
                    // return key - insert selected option
                    '13': function () {
                        if ( !$select.length ) {
                            return;
                        }
                    
                        e.preventDefault();
                        insertComplete( $select.text() );
                    }
                };

            $( document ).on( 'keydown', function ( e ) {

                $option = $( '.minicomplete-option' );
                $select = $( '.minicomplete-option.selected' );
                    
                if ( keycode[ e.keyCode ] !== undefined ) {
                    keycode[ e.keyCode ]();
                }

            } );

        }

        /**
         * @desc Counts back from caret position looking for unclosed {{ or [[
         * @param {node} elem Element to look for search term within
         */
        function findTerm( elem ) {
            
            // compare against undefined
            // to stop empty strings triggering this too
            // stops errors when input event in bound to the wrong element
            if ( elem.value === undefined ) {
                mw.log( 'element does not support value attribute' );
                return;
            }

                // text to search for
            var searchText = elem.value.substring( 0, dev.minicomplete.getCaretPos() ),
                // for separating search term
                linkCheck = searchText.lastIndexOf( '[['),
                templateCheck = searchText.lastIndexOf( '{{' ),
                // disallows certain characters in search terms
                // based on $wgLegalTitleChars <http://www.mediawiki.org/wiki/Manual:$wgLegalTitleChars>
                // and to prevent searches for terms that don't need it
                // such as those with pipes as they signal template params or
                // link display changes
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
                    type = '[[';
                    getSuggestions( term, 0 );

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
                    type = '{{';
                    getSuggestions( term, ns );

                }

            }

        }

        /**
         * @desc Gets caret position for detecting search term and inserting
         *       autocomplete term.
         * @source <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
         * @returns {number} Caret position in string.
         *                   If browser does not support caret position methods
         *                   returns 0 to prevent syntax errors
         */
        function getCaretPos() {

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

        }

        /**
         * @desc Queries mw api for possible suggestions
         * @link <https://www.mediawiki.org/wiki/API:Allpages> Allpages API docs
         * @param term {string} Page title to search for
         * @param ns {integer} Namespace to search in
         */
        function getSuggestions( term, ns ) {

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
                
            mw.log( term );

            if ( term.indexOf( ':' ) > -1 ) {

                termSplit = term.split( ':' );
                title = termSplit[ 1 ];

                // make sure there's only the namespace and the page title
                if ( termSplit.length > 2 ) {
                    return;
                }

                namespaceId = mw.config.get( 'wgNamespaceIds' )[
                    // wgNamespaceIds uses underscores and lower case
                    termSplit[ 0 ].replace( / /g, '_' )
                                  .toLowerCase()
                ];

                if ( namespaceId ) {
                    query.apnamespace = namespaceId;
                    query.apprefix = title;
                }
                
                if ( termSplit[ 0 ].toLowerCase() === 'special' ) {
                    // load a predefined list of special pages here
                    // load from API during init perhaps?
                    // pass the options directly to showSuggestions
                    // @todo find a way of getting a list of these
                    // monobook's search clearly supports it
                    return;
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

                                showSuggestions( data.query.allpages );

                            } )
                            .error( function ( error ) {
                                mw.log( 'API error: (', error );
                            } );

        }

        /**
         * @desc Inserts list of options to select from
         * @param {array} result Result from API
         */
        function showSuggestions( result ) {

            var i,
                options = [],
                coords,
                offset,
                $list,
                $body = $( 'body' ).width(),
                leftpos,
                $options = '';
                
            mw.log( result );

            for ( i = 0; i < result.length; i += 1 ) {
                options += '<li class="minicomplete-option">' + result[i].title + '</li>';
            }

            // insert options into container
            $( '#minicomplete-list' ).html( options );

            // cache list
            // do this after it's been populated to stop errors
            $list = $( '#minicomplete-list' );

            // show option list
            $list.show();

            // position option list
            coords = $( dev.minicomplete.elem ).textareaHelper( 'caretPos' );
            offset = $( dev.minicomplete.elem ).offset();
            
            leftpos = offset.left + coords.left;
            
            // realign against right side of page if overflowing
            // monobook issue on Special:Upload
            // this won't work if someone's extended the body past the limits of the window
            if ( leftpos + $list.width() > $body ) {
                leftpos = $body - $list.width();
            }

            // No fix has been added for if the menu is outside the vertical
            // limits of the window as if it moved down it would obscure text
            // and if it moved up chances are the user can't see the textarea in the first place

            $list.css( {
                top: offset.top + coords.top - $list.height(),
                left: leftpos
            } );

            // add event handlers for .minicomplete-option here
            // as they won't fire if they aren't created when you try to bind
            // events to them

            // cache options
            $options = $( '.minicomplete-option' );

            // add onclick handler for inserting the option
            $options.on( 'click', function () {
                insertComplete( $( this ).text() );
            } );

            // clear .selected class on hover
            // css :hover pseudo-class does hover colour change instead
            $options.on( 'mouseover', function () {
                if ( $( '.minicomplete-option.selected' ).length ) {
                    // don't use this here as it refers to the hovered element
                    // we want to strip the selected class as soon as we enter
                    // the menu
                    $options.removeClass( 'selected' );
                }
            } );

        }

        /**
         * @desc Inserts selected suggestion
         * @param {string} complete Search suggestion to insert
         */
        function insertComplete( complete ) {

            var caret = getCaretPos(),
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
        
            // hide and empty options
            $( '#minicomplete-list' ).hide().empty();

        }
        
        return {
            /**
             * 
             */
            loaded: false,
            elem: false,

            /**
             * 
             */
            load: function ( selector ) {
                // only do this once
                // problems caused by readding event listeners to
                // textareas with editing comments/posts
                if ( !document.getElementById( 'minicomplete-list' ) ) {
                    // load css
                    insertCSS();
            
                    // create wrapper
                    var ul = document.createElement( 'ul' );
                    ul.setAttribute( 'id', 'minicomplete-list' );
                    document.getElementsByTagName( 'body' )[0].appendChild( ul );
            
                    // bind required event listeners to document
                    bindEvents();
                // make sure the options are removed when moving between textareas
                } else {
                    $( '#minicomplete-list' ).hide().empty();
                }

                $( selector ).off( 'input' );
                $( selector ).on( 'input', function () {
                    // hide and empty menu
                    $( '#minicomplete-list' ).hide().empty();

                    // store node for later use
                    dev.minicomplete.elem = this;
                    mw.log( this );

                    // run api query
                    findTerm( this );
                } );
            },

            /**
             * 
             */
            init: function () {
                
                var selector = false,
                    config = mw.config.get( [
                        'wgCanonicalSpecialPageName',
                        'wgNamespaceNumber'
                    ] ),
                    special = {
                        Upload: 1,
                        MultipleUpload: 1
                    },
                    namespace = {
                        // message wall
                        '1200': '#WallMessageBody',
                        // Special:Forum (Thread)
                        '1201': '.replyBody',
                        // Special:Forum (Board)
                        '2000': '.body'
                    };

                // prevent loading twice
                if ( dev.minicomplete.loaded ) {
                    return;
                }

                dev.minicomplete.loaded = true;

                // Special:Upload and Special:MultipleUpload
                if ( special[ config.wgCanonicalSpecialPageName ] === 1 ) {
                    selector = '#wpUploadDescription';
                }

                // Message Wall and Special:Forum
                // will not work for Special:Forum replies
                // or editing existing posts on either
                if (namespace[ config.wgNamespaceNumber ] !== undefined ) {
                    selector = namespace[ config.wgNamespaceNumber ];
                }

                // Article and Blog comments
                if ( $( '#WikiaArticleComments' ).length ) {

                    // create custom ResourceLoader module
                    mw.loader.implement( 'minicomplete.dependencies',
                        [ '/load.php?debug=false&lang=en&mode=articles&skin=oasis&missingCallback=importArticleMissing&articles=u%3Acamtest%3AMediaWiki%3ATextareaHelper.js%7Cu%3Adev%3AColors%2Fcode.js&only=scripts' ],
                            {},
                                {} );

                    mw.loader.using( 'minicomplete.dependencies', commentsLoaded );
                  
                }
              
                // fix when editing special:forum posts and message wall comments
                // don't run on special:forum (board)
                if ( config.wgNamespaceNumber === 1200 || config.wgNamespaceNumber === 1202 ) {
                    $( '.edit-message' ).on( 'click', function () {
                    
                        mw.log( 'editing forum post' );
                    
                        // look for new instances of .body
                        var editors = $( '.body' ).length;
                    
                        editorInserted( editors, '.body' );
                    
                    } );
                }

                if ( !selector ) {
                    return;
                }

                // create custom ResourceLoader module
                mw.loader.implement( 'minicomplete.dependencies',
                   [ '/load.php?debug=false&lang=en&mode=articles&skin=oasis&missingCallback=importArticleMissing&articles=u%3Acamtest%3AMediaWiki%3ATextareaHelper.js%7Cu%3Adev%3AColors%2Fcode.js&only=scripts' ],
                       {},
                           {} );

                // we need custom module after this point
                // so declare our dependencies and run the rest of the script
                // in the callback
                mw.loader.using( [ 'mediawiki.api', 'minicomplete.dependencies' ], function () {
                    dev.minicomplete.load( selector );
                } );
            }
        };
    };

    $( dev.minicomplete.init );

}( this.document, this.jQuery, this.mediaWiki, this.dev = this.dev || {} ) );

// </syntaxhighlight> __NOWYSIWYG__
