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
		 * Storage for number of lines in a file
		 */
		lines = {},

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
				if ( !$( '#less-overlay' ).length ) {
					var modal = '<div id="less-overlay"><div id="less-modal">' +
						'<div id="less-header"><span class="title">Title</span><span id="less-header-close"></span></div>' +
						'<div id="less-content"></div>' +
						'</div></div>';

					$( 'body' ).append( modal );
					$( '#less-header-close, #less-overlay' ).on( 'click', local.closeModal );
					// stop events anywhere in the modal triggering click events on the overlay
					$( '#less-modal' ).on( 'click', function () {
						return false;
					} );
				} else {
					$( '#less-content' ).empty();
					$( '#less-overlay' ).show();
				}

				local.getSource();

			},

			/**
			 *
			 *
			 * @param {string} text
			 */
			addLine: function ( text ) {
				
				var	$content = $( '#less-content' ),
					$p = $( '<p>' );

				if ( text.indexOf( 'Error' ) === 0 ) {
					$p.attr( 'class', 'error' );
					text = text.replace( 'Error:', '' ).trim();
				}

				$p.html( '&gt; ' + local.parseLink( text ) );

				// insert text
				$content.append( $p );
				// scroll to the bottom of the modal if there's an overflow
				if ( $content.prop( 'scrollHeight' ) > $content.prop( 'clientHeight' ) ) {
					$content.scrollTop( $content.prop( 'scrollHeight' ) );
				}

			},

			/**
			 *
			 */
			parseLink: function ( wikitext ) {

				var	text = mw.html.escape( wikitext ),
					match = text.match( /\[\[[\s\S]*?\]\]/g ),
					replace,
					i;

				if ( match === null ) {
					return text;
				}

				for ( i = 0; i < match.length; i += 1 ) {
					replace = match[i].replace( /(\[\[|\]\])/g, '' );
					text = text.replace(
						match[i],
						'<a href="/wiki/' + replace.replace( / /g, '_' ) +
						'" title="' + replace + '" target="_blank">' +
						replace + '</a>'
					);
				}

				return text;
			},

			/**
			 *
			 */
			closeModal: function () {
				$( '#less-overlay' ).hide();
				return false;
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

				$.ajaxSetup( {
					dataType: 'text',
					error: function ( xhr, error, status ) {
						if ( status === 'Not Found' ) {
							local.addLine( 'Error: Page not found - please check your configuration' );
						} else {
							mw.log( error, status );
						}
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

							local.addLine( pages.length + ' files found' );
							local.getLess( pages );
						}
					} );

				} );

				return false;

			},

			/**
			 *
			 *
			 * @param {array} pages
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

						params.title = pages[i].replace( / /g, '_' );
						local.addLine( 'Getting ' + pages[i] + ' (' + ( i + 1 ) + '/' + pages.length + ')' );

						$.ajax( {
							data: params,
							success: function ( res ) {
								css.push( res );
								lines[pages[i]] = res.split( '\n' ).length;
								i += 1;
								if ( i < pages.length ) {
									getContent();
								} else {
									local.compileLess( css.join( '\n' ) );
								}
							},
							error: function ( xhr, error, status ) {
								if ( status === 'Not Found' ) {
									local.addLine( 'Error: File not found. Please check [[' + options.source + ']]' );
								} else {
									mw.log( error, status );
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
			 */
			compileLess: function ( res ) {
				// attempt to compile less
				var	parser = new less.Parser( {} ),
					page,
					errLine,
					errPage;
					
				try {
					parser.parse( res, function ( error, root ) {
						// error isn't actually used here
						// due to when errors actually occur
						// this function throws them, instead of storing them
						// in a helpful object for us to check
						// hence this try catch block
						// #helpful
						local.addLine( 'Compiling LESS to CSS.' );
						var css = root.toCSS();
						local.formatResult( css );
					} );
				} catch ( e ) {
					errLine = e.line;
					for ( page in lines ) {
						if ( lines.hasOwnProperty( page ) ) {
							if ( errLine > lines[page] ) {
								errLine = errLine - lines[page];
							} else {
								errPage = page;
								break;
							}

						}
					}
					local.addLine( 'Error: Parse error on line ' + errLine + ' in [[' + errPage + ']]' );
					// e.extract is always a 3 item array
					local.addLine( 'Error: ' + e.extract[1].trim() );
					local.addLine( 'Error: ' + e.message );
				}

			},

			/**
			 *
			 *
			 * @param {string} css CSS to format
			 */
			formatResult: function ( css ) {

				local.addLine( 'Formatting CSS.' );

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

				local.addLine( 'Getting CSS header file.' );

				$.ajax( {
					data: params,
					success: function ( res ) {
						local.addLine( 'Complete.' );
						local.postResult( res + '\n' + css );
					}
				} );

			},

			/**
			 *
			 *
			 * @param {string} text Content to submit to target page
			 */
			postResult: function ( text ) {
				console.log( text );
				
				var	params = {
						action: 'edit',
						title: options.target,
						summary: 'summary',
						token: mw.user.tokens.get( 'editToken' ),
						format: 'json'
					};

				new mw.Api().post( params )
					.done( function ( res ) {
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

				} );

			}
			
		};

	// run script
	$( global.init );

	// export to global scope
	window.dev = window.dev || {};
	window.dev.less = global;

}( this, this.document, this.jQuery, this.mediaWiki ) );

/* </nowiki> */