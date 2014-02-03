/** <nowiki>
 * Less Compiler designed for Wikia
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 0.1
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * @todo Figure out how to use @import for mixin stuff
 *       Doesn't seem to like it for some reason
 * @todo Add a custom modal to use for formatting configuration and error/success messages
 */

// don't add less into the closure or it causes errors
/*global less:true */

;( function ( document, $, mw, dev ) {

    'use strict';

    dev.less = {

        /**
         * Config options, are filled out at a later stage
         * @todo Allow options to be configurable
         */
        options: [ {
            // pages to load compile button on
            pages: [
                'MediaWiki:Common.css',
                'MediaWiki:Common.css/less'
            ],
            // page to edit with compiled less
            target: 'MediaWiki:Common.css',
            // page to get header comment from
            header: 'MediaWiki:Css-header',
            // page to get raw less from (optional to define)
            source: 'MediaWiki:Common.css/less'
        } ],
        target: '',
        header: '',
        source: '',
        useTabs: false,

        /**
         * Compiling interface
         */
        modal: function () {

            if ( $( '#less-modal-overlay' ).length ) {
                $( '#less-modal-overlay' ).show();
            } else {
            
                // load css
                // do the rest of this in a callback
                // css currently located at <http://camtest.wikia.com/wiki/MediaWiki:Wikia.css>

                // create nodes
                var modal = $( '<div>' )
                    .attr( 'id', 'less-modal-overlay' )
                    /*
                    .click( function ( e ) {
                        e.stopPropagation();
                        dev.less.closeModal();
                        return false;
                    } )
                    */
                    .append(
                        $( '<div>' )
                            .attr( 'id', 'less-modal' )
                            .append(
                                $( '<div>' )
                                    .attr( 'id', 'less-modal-header' )
                                    .append(
                                        $( '<span>' )
                                            .attr( 'id', 'less-modal-title' )
                                            .text( 'LESS Compiler Interface' ),
                                        
                                        $( '<span>' )
                                            .attr( 'id', 'less-modal-close' )
                                            .click( function ( e ) {
                                                e.stopPropagation();
                                                dev.less.closeModal();
                                                return false;
                                            } )
                                    ),
                                    
                                $( '<div>' )
                                    .attr( 'id', 'less-modal-content' )
                                    .append(),
                                    
                                $( '<div>' )
                                    .attr( 'id', 'less-modal-footer' )
                                    .append(
                                        $( '<div>' )
                                            .attr( 'id', 'less-modal-buttons' )
                                            .append(
                                                $( '<button>' )
                                                    .attr( {
                                                        'id': 'less-button-close',
                                                        // wikia class
                                                        'class': 'secondary'
                                                    } )
                                                    .text( 'Close' )
                                                    .click( function ( e ) {
                                                        e.stopPropagation();
                                                        dev.less.closeModal();
                                                        return false;
                                                    } ),
                                                    
                                                $( '<button>' )
                                                    .attr( 'id', 'less-button-compile' )
                                                    .text( 'Compile' )
                                                    .click( dev.less.getStylesheet )
                                            )
                                    )
                            )
                    );
                    
                console.log( modal )

                // append to body
                $( 'body' ).append( modal );
            }

        },
        
        /**
         * Close modal
         */
        closeModal: function () {
            $( '#less-modal-overlay' ).hide();
        },

        /**
         * Checks for correct environment and loads the rest of the functions
         */
        init: function () {

            var config = mw.config.get( [
                    'wgAction',
                    'wgPageName',
                    'wgUserLanguage',
                    'wgUserGroups'
                ] ),
                i,
                arr = dev.less.options,
                i18n = dev.less.i18n[ config.wgUserLanguage ] || dev.less.i18n.en,
                $update = function () {
                    return $( '<button>' )
                               .attr( 'id', 'mw-update-less' )
                               .text( i18n.recompile )
                               .click( dev.less.modal );
                };

            // stop if not viewing the page
            if ( config.wgAction !== 'view' ) {
                return;
            }

            // stop if not sysop (can't edit the page if not)
            if ( config.wgUserGroups.indexOf( 'sysop' ) === -1 ) {
                return;
            }

            for ( i = 0; i < arr.length; i += 1 ) {
                if ( arr[ i ].pages.indexOf( config.wgPageName ) > -1 ) {

                    // set target page and header
                    dev.less.target = arr[ i ].target;
                    dev.less.header = arr[ i ].header;

                    // check if source has been set, default to target/less
                    dev.less.source = !!arr[ i ].source ?
                        arr[ i ].source : dev.less.target + '/less';

                    // @todo monobook support
                    $( '#WikiaPageHeader' ).append( $update() );

                    return;
                }
            }

            return;

        },

        /**
         * i18n messages
         */
        i18n: {
            en: {
                recompile: 'Recompile LESS',
                done: 'Done message',
                fail: 'Fail message'
            }
        },

        /**
         * Queries mw API for uncompiled LESS
         */
        getStylesheet: function () {

            var sheet = dev.less.source,
                config = mw.config.get( [
                    'wgServer',
                    'wgScript'
                ] );

            // configure $.ajax for later on
            $.ajaxSetup( {
                url: config.wgServer + config.wgScript,
                dataType: 'text',
                type: 'GET',
                error: function ( xhr, status, error ) {
                    mw.log( 'AJAX error:', xhr.responseText, status, error );
                }
            } );

            $.ajax( {
                data: {
                    title: sheet,
                    action: 'raw',
                    templates: 'expand',
                    maxage: '0',
                    smaxage: '0'
                },
                success: function ( response ) {
                    dev.less.compile( response );
                }
            } );

        },

        /**
         * Compiles LESS into CSS
         * @param toCompile {string} String of uncompiled LESS
         */
        compile: function ( toCompile ) {

            // define custom less module if not already defined
            // this throws an error in the console due to something in wikia's code
            // @todo find out if said error is bad before releasing this
            // error thrown due to require function definition
            // less.js thinks this is part of node.js (server side js) and overrides it for client side use
            // except it is defined on wikia
            // Grunny says should be fine as this is only loaded as required
            if ( !mw.loader.getState( 'less' ) ) {
                mw.loader.implement( 'less',
                    [ 'https://raw.github.com/less/less.js/master/dist/less-1.6.0.js' ],
                        {}, {} );
            }

            mw.loader.using( [ 'less' ], function () {

                // parse less
                var parser = new less.Parser( {} );
                parser.parse( toCompile, function ( error, root ) {
                    // error is null if no errors
                    if ( !error ) {
                        var css = root.toCSS();
                        dev.less.format( css );
                    } else {
                        // @todo find docs on error object
                        //       and show result to user if error comes up
                        mw.log( error );
                    }
                } );
            } );

        },

        /**
         * @desc Optionally formats resulting CSS
         * @param css {string} CSS resulting from compiling LESS
         * @todo Make this optional/configurable
         * @todo format this a bit better
         *       4 space/tab indents
         *       remove empty lines
         *       add one line between end of rule and next selector
         */
        format: function ( css ) {

                            // strip comments
                            // @source <http://stackoverflow.com/a/2458830/1942596>
            var result = css.replace( /\/\*([\s\S]*?)\*\//g, '' )
                            // strip extra newlines
                            .replace( /\n\s*\n/g, '\n' )
                            // it's bad practice having more than one id in a selector
                            // this strips the selector down to the last id in the selector
                            .replace( /\n(?:[\.\w\-# ]+)(#.+?)(,|{)/g, '\n$1 $2' )
                            // add an extra newline between rules
                            .replace( /(\})\n(.)/g, '$1\n\n$2' );
                
            // indent by 4 spaces or tabs depending on config
            if ( dev.less.useTabs ) {
                // indent with tabs
                result.replace( /\n {2}(.)/g, '\n\t$1' );
            } else {
                // indent with 4 spaces
                result = result.replace( /\n {2}(.)/g, '\n    $1' );
            }

            dev.less.addHeader( result );

        },

        /**
         * @desc Adds a comment header containing instructions and documentation
         * @param css {string} CSS after comments have been stripped
         */
        addHeader: function ( css ) {

            $.ajax( {
                data: {
                    title: dev.less.header,
                    action: 'raw'
                },
                success: function ( response ) {
                    var result = response + '\n' + css;
                    dev.less.submit( result );
                }
            } );

        },

        /**
         * @desc Submit changes to the target page
         * @param content {string}
         */
        submit: function ( content ) {

            // redefine $.ajax for API queries
            $.ajaxSetup( {
                url: mw.config.get( 'wgServer' ) + '/api.php',
                dataType: 'json'
            } );

            $.ajax( {
                data: {
                    action: 'query',
                    prop: 'info',
                    intoken: 'edit',
                    titles: dev.less.target,
                    format: 'json'
                },
                success: function ( response ) {
                    var page = response.query.pages,
                        prop,
                        token;

                    // extract token
                    for ( prop in page ) {
                        if ( page.hasOwnProperty( prop ) ) {
                            token = page[ prop ].edittoken;
                            // should only be one page in result
                            // but break just in case
                            break;
                        }
                    }

                    $.ajax( {
                        data: {
                            action: 'edit',
                            title: dev.less.target,
                            text: content,
                            summary: 'Updating CSS from [[' + dev.less.source + ']]',
                            format: 'json',
                            token: token
                        },
                        type: 'POST',
                        success: function ( response ) {
                            // @todo tell user edit has succeeded and reload page
                            mw.log( response );
                            // @todo find error response for this
                            if ( response.edit && response.edit.result === 'Success' ) {
                                alert( 'Success' );
                                // refresh if on the target page
                                if ( mw.config.get( 'wgPageName' ) === dev.less.target ) {
                                    document.location.reload();
                                }
                            }
                        }
                    } );

                }
            } );
        }

    };

    $( dev.less.init );

}( this.document, this.jQuery, this.mediaWiki, this.dev = this.dev || {} ) );
