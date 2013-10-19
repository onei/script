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
 * @version 0.0.5.0
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * Jshint warning messages: <https://github.com/jshint/jshint/blob/master/src/messages.js>
 *
 * For documentation and licensing of jQuery textareahelper plugin
 * see <https://github.com/Codecademy/textarea-helper>
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

/**
 * Textareahelper jQuery plugin
 * @source <https://github.com/Codecademy/textarea-helper/blob/master/textarea-helper.js>
 */

// disable warning about ;(
/*jshint -W015 */
;( function ( $ ) {
/*jshint +W015 */
 
    'use strict';

    var caretClass = 'textarea-helper-caret',
        dataKey = 'textarea-helper',
        // Styles that could influence size of the mirrored element
        mirrorStyles = [
            // Box Styles
            'box-sizing', 'height', 'width', 'padding-bottom',
            'padding-left', 'padding-right', 'padding-top',
  
            // Font stuff
            'font-family', 'font-size', 'font-style',
            'font-variant', 'font-weight',
  
            // Spacing etc.
            'word-spacing', 'letter-spacing', 'line-height',
            'text-decoration', 'text-indent', 'text-transform',
                     
            // Direction
            'direction'
        ],
        TextareaHelper = function ( elem ) {

            if ( elem.nodeName.toLowerCase() !== 'textarea' ) {
                return;
            }

            this.$text = $( elem );
            this.$mirror = $( '<div>' )
                           /*jshint -W015 */
                           .css( {
                               'position': 'absolute',
                               'overflow': 'auto',
                               'white-space': 'pre-wrap',
                               'word-wrap': 'break-word',
                               'top': 0,
                               'left': -9999
                               
                           } )
                           /*jshint +W015 */
                           .insertAfter( this.$text );

        };

    ( function () {
        this.update = function () {

            // Copy styles.
            var styles = {},
                i,
                caretPos,
                str,
                pre,
                post,
                $car;

            for ( i = 0; i < mirrorStyles.length; i += 1 ) {
                styles[ mirrorStyles[i] ] = this.$text.css( mirrorStyles[i] );
            }

            this.$mirror.css( styles ).empty();
      
            // Update content and insert caret.
            caretPos = this.getOriginalCaretPos();
            str = this.$text.val();
            pre = document.createTextNode( str.substring( 0, caretPos ) );
            post = document.createTextNode( str.substring( caretPos ) );
            $car = $( '<span>' ).addClass( caretClass )
                                .css( 'position', 'absolute' )
                                .html( '&nbsp;' );
            this.$mirror.append( pre, $car, post )
                        .scrollTop( this.$text.scrollTop() );
        };

        this.destroy = function () {
            this.$mirror.remove();
            this.$text.removeData( dataKey );
            return null;
        };

        this.caretPos = function () {
            this.update();
            var $caret = this.$mirror.find( '.' + caretClass ),
                pos = $caret.position();

            if ( this.$text.css( 'direction' ) === 'rtl' ) {
                pos.right = this.$mirror.innerWidth() - pos.left - $caret.width();
                pos.left = 'auto';
            }

            return pos;
        };

        this.height = function () {
            this.update();
            this.$mirror.css( 'height', '' );
            return this.$mirror.height();
        };

        // XBrowser caret position
        // Adapted from http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
        this.getOriginalCaretPos = function () {
            var text = this.$text[0],
                r,
                re,
                rc;

            if (text.selectionStart) {
                return text.selectionStart;
            } else if (document.selection) {

                text.focus();
                r = document.selection.createRange();
                if ( !r ) {
                    return 0;
                }
                re = text.createTextRange();
                rc = re.duplicate();

                re.moveToBookmark(r.getBookmark());
                rc.setEndPoint('EndToStart', re);
                return rc.text.length;
            }

            return 0;
        };

    } ).call( TextareaHelper.prototype );
  
    $.fn.textareaHelper = function ( method ) {

        this.each( function () {
            var $this = $( this ),
                instance = $this.data( dataKey );

            if ( !instance ) {
                instance = new TextareaHelper( this );
                $this.data( dataKey, instance );
            }
        } );

        if ( method ) {
            var instance = this.first().data( dataKey );
            return instance[ method ]();
        } else {
            return this;
        }

    };

}( jQuery ) );

/**
 *
 *
 */
( function ( document, $, mw ) {

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
         *                  if browser does not support caret position methods
         *                  returns 0 to prevent errors
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
                sel.moveStart( 'character', -elem.value.length );
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
                    miniComplete.getSuggestions( term, 0 );

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
                    miniComplete.getSuggestions( term, 10 );

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

            // fix for when the namespace is preceeded by a :
            // in a template transclusion
            if ( term.indexOf( ':' ) === 0 && ns === 10 ) {
                term = term.substring( 1 );
            }
            
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

                                miniComplete.showSuggestions( data.query.allpages );

                            } )
                            .error( function ( error ) {
                                console.log( 'API error: (', error );
                            } );

        },

        /**
         * Inserts list of options to select from
         * 
         * @param result {array} Result from API
         * @todo Hide options if Esc key is pressed
         */
        showSuggestions: function ( result ) {

            var i,
                options = [],
                css;

            if ( !$( '#minicomplete-options' ).length ) {

                $( 'body' ).append(
                    $( '<div>' )
                    .attr( {
                        id: 'minicomplete-options'
                    } )
                );

                css = [
                    // rule1
                    // rule2
                    // rule3
                    // etc.
                ];

                mw.util.appendCSS(
                    css.join()
                );

            }

            for ( i = 0; i < result.length; i += 1 ) {
                options.push( result[i].title );
            }
            
            console.log( options );
        
        },

        /**
         * Inserts selected suggestion
         */
        insertComplete: function () {
        
        }

    };

    $( miniComplete.init );

}( document, jQuery, mediaWiki ) );
