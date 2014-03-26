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
							.on( 'click', local.getSource );
					
					} else if ( config.skin === 'monobook' ) {
					
						$parent = $( '#p-tb > .pBody > ul' );
								
						$link = $( '<li>' )
							.attr( 'id', 't-compile-less' )
							.append(
								$( '<a>' )
									.attr( 'title', text )
									.text( text )
									.css( 'cursor', 'pointer' )
									.on( 'click', local.getSource )
							);
					
					} else {
						// error message
						return;
					}

					$parent.append( $link );
					
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
						
					// disable the compile button
					
					$.ajaxSetup( {
						async: 'false',
						dataType: 'text',
						error: function ( xhr, error, status ) {
							local.err = true;
							mw.log( status, error );
						},
						type: 'GET',
						url: config.wgScriptPath + config.wgScript,
					} );
					
					params.title = options.target.replace( / /g, '_' );
					
					console.log( 'test1' );
					
					// load less.js src
					if ( !mw.loader.getState( 'less' ) ) {
						mw.loader.implement(
							'less',
							// @todo move to wikia url
							[ 'https://raw.github.com/less/less.js/master/dist/less-1.7.0.min.js' ],
							{}, {}
						);
					}
					
					console.log( 'test2' );
					
					mw.loader.using( 'less', function () {
					
						$.ajax( {
							data: params,
							success: function ( res ) {

								var 	lines = res.split( '\n' ),
									pages = [],
									page,
									i;
								
								console.log( 'test3' );
								console.log( lines );
								
								
								for ( i = 0; i < lines; i += 1 ) {
									page = lines[i].trim();
									console.log( page );
									
									// skip comments
									if ( page.indexOf( '//' ) === 0 ) {
										continue
									}
									
									// skip empty lines
									if ( !page.length ) {
										continue;
									}
									
									pages.push( page );
								}
								
								console.log( pages );
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
						i;
					
					for ( i = 0; i < pages.length; i += 1 ) {
					
						params.title = pages[i];
					
						$.ajax( {
							data: params,
							success: function ( res ) {
								css.push( local.compileLess( res, params.title ) );
							}
						} );
						
						if ( local.err ) {
							break;
						}
						
					}
					
					if ( local.err ) {
						return;
					}
					
					console.log( css.join() );
				
				},
				
				/**
				 *
				 *
				 * @param {string} res
				 * @returns {object}
				 */
				compileLess: function ( res, page ) {
					// attempt to compile less
					var parser = new less.Parser( {} );
					parser.parse( res, function ( error, root ) {

						// error is null if no errors
						if ( !error ) {
							var css = root.toCSS();
							return css;
						}

						// @todo find docs on error object
						//       and show result to user if error comes up
						mw.log( error );
						
						local.err = true;
						
						// do something with error to get a useful description message
						
						local.displayError( page, res, error );
						return '';

					} );

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
						
					local.addHeader( css );
					
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