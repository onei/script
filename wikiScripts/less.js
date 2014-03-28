/** <nowiki>
 * Less Compiling Interface designed for Wikia wikis
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 0.1
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 *
 * @todo Figure out how to use @import for mixin stuff
 *       Doesn't seem to like it for some reason
 * @todo Add a custom modal to use for formatting configuration and error/success messages
 *       In progress....
 */

// don't add less into the closure or it causes errors
/*global less:true, console:true */

;( function ( window, document, $, mw, dev, undefined ) {

	'use strict';
	
	// temp hardcoded config
	window.lessOptions = [ {
		// target page for compiled LESS
		target: 'MediaWiki:Common.css',
		// the list of pages to compile from
		source: 'MediaWiki:Common.css/less',
		// pages to load the compile button on
		load: [
			'MediaWiki:Common.css',
			'MediaWiki:Common.css/less'
		],
		// page of comment(s) to add at the top of the compiled LESS
		// when posting to the page
		header: 'MediaWiki:Css-header'
	} ];

	var self = ( function () {

		var	i18n = {
				en: {
					compile: 'Compile LESS'
				}
			},
		
			/**
			 * Cache mw.config variables
			 */
			config = mw.config.get( [
				'skin',
				'wgAction',
				'wgPageName',
				'wgScript',
				'wgScriptPath',
				'wgUserGroups',
				'wgUserLanguage'
			] ),

			/**
			 * Cache script configuration
			 */
			options = window.lessOptions || [],

			/**
			 *
			 */
			global = {
		
				init: function () {

					var	profile = $.client.profile(),
						opts = false,
						i,
						elem;
						
					if ( config.wgAction !== 'view' ) {
						// only run on action=view (default action)
						return;
					}
					
					if ( profile.name === 'msie' && profile.versionNumber < 9 ) {
						// don't run on versions of IE older than IE9
						return;
					}

					if ( !Array.isArray( options ) ) {
						// script has incorrect configuration
						mw.log( 'dev.less error: Incorrect configuration.' );
						return;
					}

					if ( !options.length ) {
						// script is not configured 
						return;
					}

					for ( i = 0; i < options.length; i += 1 ) {
					
						elem = options[i];
						
						if ( elem.load.indexOf( config.wgPageName ) === -1 ) {
							continue;
						}
						
						opts = elem;
						delete opts.load;
						break;
					
					}

					if ( !opts ) {
						// not on a page to load the button on
						return;
					}
					
					if (
						opts.target.indexOf( 'MediaWiki:' ) === 0 &&
						config.wgUserGroups.indexOf( 'sysop' ) === -1
					) {
						// user cannot edit pages in mediawiki namespace
						// this doesn't account for staff, vstf or helpers
						// who really shouldn't be accessing the page like this anyway
						// might be an issue if I ever need to reproduce a bug on another wiki
						// but we'll cross that bridge when we come to it
						return;
					}
					
					options = opts;

					local.loadButton();

				}
			},
			
			/**
			 *
			 */
			local = {
			
				/**
				 *
				 */
				err: false,
			
				/**
				 *
				 *
				 * @param {string} msg Message to get translation for
				 * @returns {string} Translated message or english message if translation does not exist
				 */
				msg: function ( msg ) {
					return i18n[config.wgUserLanguage][msg] || i18n.en[msg];
				},

				/**
				 *
				 */
				loadButton: function () {
					
					var	text = local.msg( 'compile' ),
						$parent,
						$link;
					
					if ( config.skin === 'oasis' ) {
					
						$parent = $( '#WikiaPageHeader' );

						if ( !$parent.length ) {
							// special or user page
							return;
						}
						
						$link = $( '<button>' )
							.attr( {
								'id': 'dev-less-compile',
								'class': 'wikia-button'
							} )
							.text( text )
							.on( 'click', local.buildModal );
					
					} else if ( config.skin === 'monobook' ) {
					
						$parent = $( '#p-tb > .pBody > ul' );
								
						$link = $( '<li>' )
							.attr( 'id', 't-compile-less' )
							.append(
								$( '<a>' )
									.attr( 'title', text )
									.text( text )
									.css( 'cursor', 'pointer' )
									.on( 'click', local.buildModal )
							);
					
					} else {
						// error message
						return;
					}

					$parent.append( $link, config.skin === 'oasis' ? '&nbsp;': '' );
					
				},
				
				/**
				 *
				 */
				buildModal: function () {
				
					// something like an irc interface
				
					var modal = '<div id="less-overlay"><div id="less-modal">' +
						'<div id="less-header"><span class="title">Title</span><span id="less-header-close"></span></div>' +
						'<div id="less-content"></div>' +
						'</div></div>';
						
					$( 'body' ).append( modal );
					
					local.getSource();
				
				},
				
				/**
				 *
				 */
				addLine: function ( text ) {
				
					var $content = $( '#less-content' );
					
					// insert text
					$content.append( $( '<p>' ).text( text ) );
					// scroll to the bottom of the modal
					$content.scrollTop( $content.prop( 'scrollHeight' ) );
				
				},
				
				/**
				 *
				 */
				addPrompt: function () {
				
				},
				
				closeModal: function () {
					$( '#less-overlay' ).hide();
				},
				
				/**
				 *
				 */
				getSource: function () {
				
					var	params = {
							action: 'raw',
							maxage: '0',
							smaxage: '0',
							title: ''
						};
					
					local.addLine( 'Getting number of files.' );

					// set to false as you can run function multiple times
					local.err = false;
					// disable the compile button
					
					$.ajaxSetup( {
						dataType: 'text',
						error: function ( xhr, error, status ) {
							local.err = true;
							mw.log( status, error );
						},
						type: 'GET',
						url: config.wgScriptPath + config.wgScript,
					} );
					
					params.title = options.source.replace( / /g, '_' );

					// load less.js src
					if ( !mw.loader.getState( 'less' ) ) {
						mw.loader.implement(
							'less',
							// @todo move to wikia url
							[ 'https://raw.github.com/less/less.js/master/dist/less-1.7.0.min.js' ],
							{}, {}
						);
					}
					
					mw.loader.using( 'less', function () {
					
						$.ajax( {
							data: params,
							success: function ( res ) {

								var	lines = res.split( '\n' ),
									pages = [],
									page,
									i;

								for ( i = 0; i < lines.length; i += 1 ) {
									page = lines[i].trim();
									
									// skip comments
									if ( page.indexOf( '//' ) === 0 ) {
										continue;
									}
									
									// skip empty lines
									if ( !page.length ) {
										continue;
									}
									
									pages.push( page );
								}
								
								console.log( pages.length );
								local.addLine( pages.length + ' files found.' )
								// local.getLess( pages );
							}
						} );
						
					} );
					
					return false;

				},
				
				/**
				 *
				 *
				 * @param {array} pages
				 * @param {object} ajaxParams
				 */
				getLess: function ( pages ) {
				
					var	params = {
							action: 'raw',
							maxage: '0',
							smaxage: '0',
							title: ''
						},
						css = [],
						i = 0,
						getContent = function () {
						
							params.title = pages[i];
							console.log( i, pages.length, params );

							$.ajax( {
								data: params,
								success: function ( res ) {
									console.log( params.title, 'success' );
									css.push( res );
									i += 1;
									if ( i < pages.length ) {
										console.log( 'getting next file' );
										getContent();
									} else {
										local.compileLess( css.join( '\n' ) );
										console.log( 'complete' );
									}
								}
							} );
						
						};
					
					getContent();

				},
				
				/**
				 *
				 *
				 * @param {string} res
				 * @returns {object}
				 */
				compileLess: function ( res ) {
					// attempt to compile less
					var parser = new less.Parser( {} );
					
					try {
						parser.parse( res, function ( error, root ) {
							// error isn't actually used here
							// due to when errors actually occur
							// this function throws them, instead of storing them
							// in a helpful object for us to check
							// hence this try catch block
							// #yay #helpful
							var css = root.toCSS();
							local.formatResult( css );
						} );
					} catch ( e ) {
						console.log( e );
						local.err = true;
						/*
						// @todo remember to undo mixin removal on MediaWiki:Common.css/less
						
						e.line // line number
						
						// from the line number we need to extract the original page (not sure how to do that)
						// and adjust that number to match the line number in that file
						// from there, we pass the page, page content, adjusted line number, and error message
						// to our error handling function
						
						e.extract	// extract of code
								// is this always a 3 item array?
								// make it into our own 11 item array
								// +- 5 lines either side (where possible)
								// use this in testing for making sure we're on the same problem line
						e.message // error message
						*/
					}

				},
				
				/**
				 * Used for displaying any errors encountered
				 *
				 * @todo Display line number where error was found
				 *       and content of said line, +/- 5 lines either side for context
				 *
				 * @param {string} page Page that contains the error
				 * @param {string} text
				 * @param {number} line
				 * @param {string} error Error message to display
				 */
				displayError: function ( page, text, line, error ) {
					
					var modal;

					if ( !$( '#less-modal' ).length ) {
						modal = '<div id="dev-overlay"><div="less-modal">' +
							'<div id="less-header"><span class="title"></span><span class="close"></span></div>' +
							'<div id="less content"></div>' +
							'<div id="less-footer"></div></div>';
					}
					// create error modal
					
					// error on `page`
					
					// get text of lines +/-5
						// handle if there's less than 5 lines either side
					
					// highlight line with error in red
					// append error in line note below
					// lines should have numbers at the start
					
				},
				
				/**
				 *
				 *
				 * @param {string} css CSS to format
				 */
				formatResult: function ( css ) {
					
					css = css
						// strip comments
						// @source <http://stackoverflow.com/a/2458830/1942596>
						.replace( /\/\*([\s\S]*?)\*\//g, '' )
						
						// strip extra newlines
						.replace( /\n\s*\n/g, '\n' )
						
						// format with uniform newlines between rules
						.replace( /(\})\n(.)/g, '$1\n\n$2' )
						
						// indent with 4 spaces
						.replace( /\n {2}(.)/g, '\n    $1' )
						
						// it's bad practice having more than one id in a selector
						// this strips the selector down to the last id in the selector
						.replace( /\n(?:[\.\w\-# ]+)(#.+?)(,|{)/g, '\n$1 $2' );
					
					console.log( css );
					// local.addHeader( css );
					
				},

				/**
				 *
				 *
				 * @param {string} css CSS to add header to
				 */
				addHeader: function ( css ) {
					
					var	title = options.header.replace( / /g, '_' ),
						params = {
							action: 'raw',
							maxage: '0',
							smaxage: '0',
							title: title
						};
						
					$.ajax( {
						data: params,
						success: function ( res ) {
							local.postResult( res + '\n' + css );
						}
					} );
					
					if ( local.err ) {
						mw.log( 'Header page does not exist.' );
					}
					
				},

				/**
				 *
				 *
				 * @param {string} text Content to submit to target page
				 */
				postResult: function ( text ) {
					console.log( text );
					
					$.ajax( {
						data: {
							action: 'edit',
							title: options.target,
							summary: 'summary',
							token: mw.user.tokens.get( 'editToken' ),
							format: 'json'
						},
						dataType: 'POST',
						success: function ( res ) {
							console.log( res );

							// if success
								// alert the user of success
								// if we're on the target page
									// refresh (notify the user it's going to happen)
								// else
									// close the alert
									// and re-enable the compile button

							// else
								// show the error
								// probably a permissions error
								// with a link to w:c:dev:Talk:Less for bug reports if required
								// re-enable the compile button

						},
						type: 'POST'
					} );
					

				}
			
			};
			
		return global;
	
    
	} () );

	// run script
	$( self.init );

	// export to global scope
	window.dev = window.dev || {};
	window.dev.less = self.init;

}( this, this.document, this.jQuery, this.mediaWiki ) );

/* </nowiki> */