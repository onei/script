// __NOWYSIWYG__ <syntaxhighlight lang="javascript">
/**
 * LESS GUI for Wikia installations of MediaWiki.
 *
 * LESS is a dynamic stylesheet language that compiles to CSS.
 * @link <https://github.com/less/less.js> less.js source
 * @link <http://lesscss.org/> less.js documentation
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 1.0.3
 * @license GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
 * @link <http://dev.wikia.com/wiki/Less> Documentation
 *
 * @todo Add support for @import
 */

/*jshint
    bitwise:true, camelcase:true, curly:true, eqeqeq:true, es3:false,
    forin:true, immed:true, indent:4, latedef:true, newcap:true,
    noarg:true, noempty:true, nonew:true, plusplus:true, quotmark:single,
    undef:true, unused:true, strict:true, trailing:true,
    browser:true, devel:false, jquery:true,
    onevar:true
*/

// don't add less into the closure or it causes errors
/*global less:true */

// disable indent warning
/*jshint -W015 */
;( function ( window, $, mw ) {
/*jshint +W015 */

	'use strict';

	/*
	// example config
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
	*/

	if ( window.dev && window.dev.less ) {
		return;
	}

		/**
		 * i18n messages
		 */
	var	i18n = {
			en: {
				// ui messages
				'update': 'Update CSS',
				'less-interface': 'LESS Interface',
				'close': 'Close',
				
				// status messages
				'get-num-files': 'Getting number of files',
				'files-found': '$1 files found',
				'getting-file': 'Getting $1 ($2/$3)',
				'compiling-less': 'Compiling LESS to CSS',
				'format-css': 'Formatting CSS',
				'get-header': 'Getting CSS header file',
				'attempt-edit': 'Attempting to update CSS',
				'success-edit': 'CSS has successfully been updated',
				
				// edit summary
				'edit-summary': 'Updating from [[$1]]',
				
				// error messages
				'page-not-found': 'Page not found - please check your configuration',
				'file-not-found': 'File not found. Please check [[$1]]',
				'less-parse-error': 'Parse error on line $1 in [[$2]]',
				'api-edit-error': 'If you think you might have found a bug, please report it [[$1|here]]',
				'api-unknown-error': 'An unknown error occurred',
				'api-error-persist': 'If this error persists, please report it [[$1|here]]'
				
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
		 * Public functions
		 */
		global = {
			/**
			 * Loading function
			 */
			init: function ( debug ) {

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
				
				if ( debug === true ) {
					// force loading button
					options = opts;
					local.loadButton();
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
		 * Private functions
		 */
		local = {
			/**
			 * Gets translation of the requested message with substituted parameters
			 *
			 * @returns {string} Translated message or english message if translation does not exist
			 */
			msg: function () {

				var	message,
					args = arguments,
					i;
				
				// check i18n[lang] exists first to stop undefined error
				if ( i18n[config.wgUserLanguage] ) {
					message = i18n[config.wgUserLanguage][arguments[0]] || i18n.en[arguments[0]];
				} else {
					message = i18n.en[arguments[0]];
				}
					
				for ( i = 1; i < args.length; i += 1 ) {
					message = message.replace( '$' + i, args[i] );
				}
				
				return message;
				
			},

			/**
			 * Load update button
			 */
			loadButton: function () {

				var	text = local.msg( 'update' ),
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
					// unsupported skin
					// wowwiki, uncyclopedia, wikia
					return;
				}

				$parent.append( $link, config.skin === 'oasis' ? '&nbsp;': '' );

			},

			/**
			 * Create interface modal
			 */
			buildModal: function () {

				// something like an irc interface
				if ( !$( '#less-overlay' ).length ) {
					var modal = '<div id="less-overlay"><div id="less-modal">' +
						'<div id="less-header"><span class="title">' + local.msg( 'less-interface' ) + '</span><span title="' + local.msg( 'close' ) + '" id="less-header-close"></span></div>' +
						'<div id="less-content"></div>' +
						'</div></div>';
					
					// add CSS
					mw.util.addCSS(
						'#less-overlay{position:fixed;height:1000px;background-color:rgba(255,255,255,0.6);width:100%;top:0;left:0;z-index:20000002;}' +
						'#less-modal{position:relative;background-color:#87ceeb;height:400px;width:60%;margin:auto;border:5px solid #87ceeb;border-radius:15px;overflow:hidden;}' +
						'#less-header{height:50px;width:100%;position:relative;}' +
						'#less-header>.title{font-size:25px;font-family:"Lucida Console",monospace;font-weight:bold;line-height:53px;padding-left:10px;}' +
						'#less-header-close{background:url("/resources/wikia/ui_components/modal/images/close-dark.svg");height:25px;width:25px;display:block;top:10px;right:10px;position:absolute;cursor:pointer;}' +
						'#less-content{padding:10px;overflow-y:auto;background-color:#fff;color:#3a3a3a;height:330px;font-size:14px;}' +
						'#less-content>p{font-family:monospace;margin:0}' +
						'#less-content>.error {color:red;font-size:initial;}' +
						'#less-content>.error>a{color:red;text-decoration:underline;}'
					);
					
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
				
				// set height dynamically
				$( '#less-modal' ).css( 'margin-top', ( ( $( window ).height() - 400 ) / 3 ) );

				local.getSource();

			},

			/**
			 * Appends content to the interface
			 *
			 * @param {string} text String to output to interface
			 * @param {boolean} error If true, adds the 'error' class to the output text
			 */
			addLine: function ( text, error ) {
				
				var	$content = $( '#less-content' ),
					$p = $( '<p>' );

				if (  error ) {
					$p.attr( 'class', 'error' );
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
			 * For wikitext link 'parsing'
			 *
			 * @param {string} wikitext Wikitext links to parse
			 * @returns {string} Parsed wikitext
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
					if ( replace.indexOf( '|' ) > -1 ) {
						replace = replace.split( '|' );
						text = text.replace(
							match[i],
							'<a href="/wiki/' + replace[0].replace( / /g, '_' ) + '" title="' + replace[0] + '">' + replace[1] + '</a>'
						);
					} else {
						text = text.replace(
							match[i],
							'<a href="/wiki/' + replace.replace( / /g, '_' ) + '" title="' + replace + '" target="_blank">' + replace + '</a>'
						);
					}
				}

				return text;
			},

			/**
			 * Closes the interface
			 */
			closeModal: function () {
				$( '#less-overlay' ).hide();
				return false;
			},

			/**
			 * Gets a list of LESS files to compile
			 */
			getSource: function () {

				var	params = {
						action: 'raw',
						maxage: '0',
						smaxage: '0',
						title: ''
					};

				local.addLine( local.msg( 'get-num-files' ) );

				$.ajaxSetup( {
					dataType: 'text',
					error: function ( xhr, error, status ) {
						if ( status === 'Not Found' ) {
							local.addLine( local.msg( 'page-not-found' ), true );
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
					// require is defined as part of wikia's js
					// which throws an error when less.js does something (not sure what)
					// this shows up on some log wikia keeps
					// but as this is only loaded as required, it shouldn't be too noticeable
					//
					// ideally we'd suppress the error, but various attempts were unsuccessful
					// - try catch statement didn't work
					// - temporarily overriding window.onerror didn't work
					//   - mapped onerror to _onerror and back again
					mw.loader.implement(
						'less',
						[ 'http://camtest.wikia.com/index.php?title=MediaWiki:Less.js&action=raw&ctype=text/javascript' ],
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

							local.addLine( local.msg( 'files-found', pages.length ) );
							
							// stop if no pages found
							if ( pages.length ) {
								local.getLess( pages );
							}
						}
					} );

				} );

				return false;

			},

			/**
			 * Gets content of LESS files
			 *
			 * @param {array} pages List of LESS file to get the content of
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
						local.addLine( local.msg( 'getting-file', pages[i], ( i + 1 ), pages.length ) );

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
									local.addLine( local.msg( 'file-not-found', options.source ), true );
								} else {
									mw.log( error, status );
								}
							}
						} );

					};

				getContent();

			},

			/**
			 * Compiles LESS files
			 *
			 * @param {string} res Content of LESS files joined together
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
						local.addLine( local.msg( 'compiling-less' ) );
						var css = root.toCSS();
						local.formatResult( css );
					} );
				} catch ( e ) {
					// @todo handle errors with @import file.less
					//       check e.name (TypeError)
					//
					// not sure what e.name is for the parse errors
					console.log( e );
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
					local.addLine( local.msg( 'less-parse-error', errPage ), true );
					// e.extract is always a 3 item array
					local.addLine( e.extract[1].trim(), true );
					local.addLine( e.message, true );
				}

			},

			/**
			 * Formats CSS
			 *
			 * @param {string} css CSS to format
			 * @todo Add support for formatting at-rules
			 *       <https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule>
			 */
			formatResult: function ( css ) {

				local.addLine( local.msg( 'format-css' ) );

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
			 * Adds a comment header to the CSS
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

				local.addLine( local.msg( 'get-header' ) );

				$.ajax( {
					data: params,
					success: function ( res ) {
						local.postResult( res + '\n' + css );
					}
				} );

			},

			/**
			 * Posts CSS to the target page
			 *
			 * @param {string} text Content to submit to target page
			 */
			postResult: function ( text ) {
			
				console.log( text );
				
				var	params = {
						action: 'edit',
						title: options.target,
						summary: local.msg( 'edit-summary', options.source ),
						token: mw.user.tokens.get( 'editToken' ),
						format: 'json',
						text: text
					};

				local.addLine( local.msg( 'attempt-edit' ) );

				// note for debugging:
				// mediawiki.api isn't available when logged out
				new mw.Api().post( params )
					.done( function ( res ) {
						console.log( params, res );

						if ( res.error ) {
							local.addLine( res.error.code, true );
							local.addLine( res.error.info, true );
							local.addLine( local.msg( 'api-edit-error', 'w:c:dev:Talk:Less' ), true );
						} else if ( res.edit && res.edit.result === 'Success' ) {
							local.addLine( local.msg( 'success-edit' ) );
						} else {
							local.addLine( local.msg( 'api-unknown-error' ), true );
							local.addLine( local.msg( 'api-error-persist', 'w:c:dev:Talk:Less' ), true );
						}

					} );

			}
			
		};

	// run script
	$( global.init );

	// export to global scope
	window.dev = window.dev || {};
	window.dev.less = global;

}( this, this.jQuery, this.mediaWiki ) );

// </syntaxhighlight>