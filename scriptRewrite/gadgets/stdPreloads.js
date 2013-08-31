// <syntaxhighlight lang="javascript">
/**
 * Replaces Wikia's template preloads with a customisable dropdown list.
 * Appends dropdown list to Monobook's edit summary area.
 * Also adds an input for a custom template preload.
 *
 * Documentation and configuration/setup instructions can be found at
 * <http://camtest.wikia.com/wiki/Project:Template_preloads>
 *
 * @author Sikon  <http://starwars.wikia.com/wiki/User:Sikon>
 * @author Grunny <http://starwars.wikia.com/wiki/User:Grunny>
 * @author Cqm    <http://runescape.wikia.com/wiki/User:Cqm>
 */
// </syntaxhighlight>

// <syntaxhighlight lang="javascript">

// </syntaxhighlight>

// <syntaxhighlight lang="javascript"><nowiki>
// define global objects if not already existing
( this.rswiki = this.rswiki || {} ).gadgets = this.rswiki.gadgets || {};

// used to track what scripts are loading and where
this.rswiki.scripts = this.rswiki.scripts || [];

( function ( document, $, mw, RTE, CKEDITOR, rswiki ) {

    'use strict';

    rswiki.gadgets.preloads = {

        /**
         * Generic load function
         */
        init: function () {

            if ( $ ( '#temp-preload' ).length ) {
                return;
            }

            if ( mw.config.get( 'wgAction' ) === 'edit' || mw.config.get( 'wgAction' ) === 'submit' ) {

                // for checking what scripts are loaded
                rswiki.scripts.push( 'rswiki.gadgets.preloads' );

                // RTE needs to load before it can be interacted with
                if ( mw.config.get( 'skin' ) === 'oasis' && $( 'body.rte' ).length ) {
                    rswiki.gadgets.preloads.editor();
                } else {
                    rswiki.gadgets.preloads.loadPreloads();
                }

            }

        },
        /**
         * RTE loading detection
         *
         * If the RTE is disabled, the editor can be interacted with on load
         * If it is enabled, the elements this script interacts with are not available on load
         * which requires us to wait until it is ready.
         *
         * FIXME: CKEDITOR is not defined after this runs
         *        find a way to add a dependency
         *        there's always setInterval() but even that could cause issues
         *        if the properties aren't defined
         */
        editor: function () {

            CKEDITOR.on( 'instanceReady', function () {

                // these are fired with every switch between source and visual mode with RTE enabled
                // stop it adding a new module each time
                RTE.getInstance().on( 'wysiwygModeReady', function () {
                    if ( !$( '#temp-preload' ).length ) {
                        rswiki.gadgets.preloads.loadPreloads();
                    }
                } );

                RTE.getInstance().on( 'sourceModeReady', function () {
                    if ( !$( '#temp-preload' ).length ) {
                        rswiki.gadgets.preloads.loadPreloads();
                    }
                } );

            } );

        },

        /**
         * Gets list of preload templates from Template:Stdpreloads
         */
        loadPreloads: function () {

            $.get( mw.config.get( 'wgScript' ), { title: 'Template:Stdpreloads', action: 'raw', ctype: 'text/plain' }, function ( data ) {

                var templates = data.split( '\n' ),
                    i,
                    value,
                    options = '<option>(Browse template preloads)</option>';

                for ( i = 1; i < templates.length; i += 1 ) {

                    switch ( 0 ) {
                    case templates[i].indexOf( '--' ):
                        value = templates[i].substring( 2 )
                                            .trim();
                        options += '<option value="Template:' + value.replace( / /g, '_' ) + '/preload">&nbsp;&nbsp;' + value + '</option>';
                        break;
                    // ignore lines starting with // so we can use comments
                    case templates[i].indexOf( '//' ):
                    // ignore empty lines
                    case templates[i].length:
                        break;
                    default:
                        value = templates[i].trim();
                        options += '<option value="" disabled="disabled">' + value + '</option>';
                        break;
                    }

                }

                rswiki.gadgets.preloads.insertModule( options );

            });

        },

        /**
         * Inserts the template module
         *
         * @param list - html string of option tags to be appended to dropdown
         */
        insertModule: function ( list ) {

            var br = '',
                module;

            if ( mw.config.get( 'skin' ) === 'oasis' ) {
                br = function () {
                    return $( '<br>' );
                };
            }

            module = $( '<div>' ).attr( {
                'id': 'temp-preload'
            } ).append(
                $( '<div>' ).attr( {
                    'id': 'std-preload'
                } ).append(
                    'Standard preloads:',
                    br(),
                    $( '<select>' ).attr( {
                        'id': 'std-preload-list'
                    } ).html( list )
                       .change( function () {

                        var page = $( this ).val();

                        if ( page === '(Browse template preloads)' ) {
                            return;
                        }

                        rswiki.gadgets.preloads.insertPreload( page );

                    } )
                ),
                $( '<div>' ).attr( {
                    'id': 'cust-preload'
                } ).append(
                    'Custom preload pagename:',
                    br(),
                    $( '<input>' ).attr( {
                        'id': 'cust-preload-input',
                        'type': 'text'
                    } ),
                    $( '<input>' ).attr( {
                        'type': 'button',
                        'id': 'cust-preload-button',
                        'value': 'Insert'
                    } ).click( function () {

                        var input = $( '#cust-preload-input' ).val()
                                                              .trim()
                                                              .replace( / /g, '_' );
                        rswiki.gadgets.preloads.insertPreload( input );

                    })
                )
            );

            if ( mw.config.get( 'skin' ) === 'oasis' ) {
                $( '.module_templates > .module_content > .cke_toolbar_templates' ).prepend( module );
            }

            if ( mw.config.get( 'skin' ) === 'monobook' ) {
                $( '.mw-editTools' ).prepend( module );
            }

        },

        /**
         * Loads page and inserts the preload into the edit area
         *
         * @param page - page to be loaded
         * @todo  check this works in ie10
         *
         * FIXME: make this work in source editing with RTE enabled
         *        RTE uses textarea.innerHTML rather than textarea.value
         *        Possible fix: <http://stackoverflow.com/a/15053756/1942596>
         *        textarea.value seems to have the same thing as textarea.innerHTML on load
         *        maybe just update them before and after inserting the template?
         */
        insertPreload: function ( page ) {
            $.get( mw.config.get( 'wgScript' ), { title: page, action: 'raw', ctype: 'text/plain' }, function ( data ) {

                /**
                 * Insert at cursor position modified from
                 * <http://stackoverflow.com/a/11077016/1942596>
                 */
                var textarea = document.getElementById( 'wpTextbox1' ),
                    sel,
                    startPos,
                    endPos;

                // IE support
                if ( document.selection ) {
                    textarea.focus();
                    sel = document.selection.createRange();
                    sel.text = data;

                // MOZILLA/NETSCAPE support
                } else if ( textarea.selectionStart || textarea.selectionStart === '0' ) {
                    startPos = textarea.selectionStart;
                    endPos = textarea.selectionEnd;
                    textarea.value = textarea.value.substring( 0, startPos ) +
                                     data +
                                     textarea.value.substring( endPos, textarea.value.length );

                // default to appending to textarea
                } else {
                    textarea.value += data;
                }

            });

        }

    };

    $( rswiki.gadgets.preloads.init );

}( this.document, this.jQuery, this.mediaWiki, this.RTE, this.CKEDITOR, this.rswiki ) );

// </nowiki></syntaxhighlight>
