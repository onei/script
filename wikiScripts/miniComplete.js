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
 * The development version of this script is kept on github.
 * @link <https://github.com/onei/script/wikiScripts/miniComplete.js>
 * It may contain new features that will be moved to the stable version of the script at a later date.
 * This version is not guaranteed to work and may be untested.
 *
 * The stable version of this script is kept on Dev Wiki.
 * @link <http://dev.wikia.com/wiki/MiniComplete/code.js>
 * This version has been tested and should be bug free.
 *
 * @author Cqm <cqm.fwd@gmail.com>
 * @version 1.3.0
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
 * @todo Find a way to implement case insensitive searching
 *       The current standard search suggestions has this, but it could be
 *       phased out at some point which would ultimately break this.
 *       @example /index.php?action=ajax&rs=getLinkSuggest&format=json&query=foo
 *                @notes Bug with redirects appearing in suggestions
 *                       due to incorrect redirects object in returned JSON object
 *                       <https://github.com/Wikia/app/blob/dev/extensions/wikia/LinkSuggest/LinkSuggest.class.php>
 *                       Fix submitted via S:C, awaiting response from search team/Sean
 *       @example /api/v1/Search/List/?query=foo&limit=5
 *                @link <http://api.wikia.com> Documentation
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
;( function ( window, document, setTimeout, $, mw, dev, undefined ) {
/*jshint +W015 */

	'use strict';

	// prevent loading twice
	if ( dev.minicomplete !== undefined ) {
		mw.log( 'Error: dev.minicomplete already loaded. Aborting...' );
		return;
	}

	dev.minicomplete = ( function () {

		/**
		 * These are the functions that make up the dev.minicomplete object
		 * which need to be accessed for use in other scripts
		 */
		var global = {

			/**
			 * @desc Main loading function
			 * @param selector {string} Selector to bind events in textarea to
			 */
			load: function ( selector ) {

				// type check for when this is used in other scripts
				if ( typeof selector !== 'string' ) {
					mw.log( 'Error: Incorrect type passed to dev.minicomplete.load');
					return;
				}

				// if the selector being used doesn't match anything
				// it'll silently fail before being passed to the next function
				// this is just to help with debugging
				if ( !$( selector ).length ) {
					mw.log( 'Error: No match for selector found' );
					return;
				}

				// only do this once
				// problems caused by re-adding event listeners to
				// textareas with editing comments/posts
				if ( !document.getElementById( 'minicomplete-list' ) ) {
					// load css
					local.insertCSS();

					// create wrapper
					var ul = document.createElement( 'ul' );
					ul.setAttribute( 'id', 'minicomplete-list' );
					document.getElementsByTagName( 'body' )[0].appendChild( ul );

					// attach required event listeners to document
					// don't attach listeners to options until it's populated
					local.bindEvents();
				// make sure the options are removed when moving between textareas
				} else {
					$( '#minicomplete-list' ).hide().empty();
				}

				// remove any existing event listeners
				// caused by running this function when new .wikiaEditor textareas are added
				$( selector ).off( 'input' ).on( 'input', function () {
					// hide and empty menu
					$( '#minicomplete-list' ).hide().empty();

					// store node for later use
					local.elem = this;
					mw.log( this );

					// run api query
					local.findTerm( this );
				} );

			}

		},

		/**
		 * These are local functions that should not be interacted with directly
		 * so are kept private to prevent that happening
		 */
		local = {

			/**
			* @desc Checks for correct environment and implements custom ResourceLoader module.
			*/
			init: function () {

				var	config = mw.config.get( ['wgCanonicalSpecialPageName', 'wgNamespaceNumber'] ),
					special = ['Upload', 'MultipleUpload'],
					namespace = {
						// message wall
						'1200': '#WallMessageBody',
						// Special:Forum (Thread)
						'1201': '.replyBody',
						// Special:Forum (Board)
						'2000': '.body'
					},
					selector;

				// Special:Upload and Special:MultipleUpload
				if ( special.indexOf( config.wgCanonicalSpecialPageName ) > -1 ) {
					selector = '#wpUploadDescription';
				}

				// Message Wall and Special:Forum
				// will not work for Special:Forum replies
				// or editing existing posts on either
				if ( namespace[config.wgNamespaceNumber] ) {
					selector = namespace[config.wgNamespaceNumber];
				}

				// Article and Blog comments
				if ( $( '#WikiaArticleComments' ).length ) {
					// create custom ResourceLoader module
					mw.loader.implement( 'minicomplete.dependencies',
						['/load.php?debug=false&lang=en&mode=articles&skin=oasis&missingCallback=importArticleMissing&articles=u%3Acamtest%3AMediaWiki%3ATextareaHelper.js%7Cu%3Adev%3AColors%2Fcode.js&only=scripts'],
							// don't load css here as there's no way to differentiate between a module being loaded with css or without
							// and it would get confusing when this script is used as a module
							{}, {} );

					mw.loader.using( 'minicomplete.dependencies', local.commentsLoaded );
				}

				// fix when editing special:forum posts and message wall comments
				// don't run on special:forum (board)
				if ( [1200, 1201].indexOf( config.wgNamespaceNumber ) > -1 ) {
					$( '.edit-message' ).on( 'click', function () {
						mw.log( 'editing forum post' );
						local.editorInserted( $( '.body' ).length, '.body' );
					} );
				}

				// selector should be defined by this point if we are to continue
				// if it's not, we either used a different method to continue
				// or we're in the wrong environment
				// there's no need to continue past this point in either case
				if ( !selector ) {
					return;
				}

				// create custom ResourceLoader module
				mw.loader.implement( 'minicomplete.dependencies',
					['/load.php?debug=false&lang=en&mode=articles&skin=oasis&missingCallback=importArticleMissing&articles=u%3Acamtest%3AMediaWiki%3ATextareaHelper.js%7Cu%3Adev%3AColors%2Fcode.js&only=scripts'],
					{}, {} );

				// we need custom module after this point
				// so declare our dependencies and run the rest of the script
				// in the callback
				mw.loader.using( ['mediawiki.api', 'minicomplete.dependencies'], function () {
					global.load( selector );
				} );

			},

			/**
			 * @desc Checks if Article comments are loaded and run autocomplete when done
			 */
			commentsLoaded: function () {

				if ( window.ArticleComments.initCompleted ) {

					mw.log( 'Article comments loaded' );
					local.load( '#article-comm' );

					// this is where we detect replies being added
					// as the textareas used aren't inserted when the comments are loaded
					// but when someone actually wants to reply
					// @todo Why am I passing a jQuery object to jQuery?
					$( $( '.article-comm-reply' ) ).on( 'click', function () {

						mw.log( 'reply detected' );

						// don't continue if there is already an editor present
						// which is leftover from making a reply previously
						if ( $( this ).parent().parent().next().find( '.wikiaEditor' ).length ) {
							return;
						}

						local.editorInserted( $( '.wikiaEditor' ).length, '.wikiaEditor' );

					} );

				} else {
					setTimeout( local.commentsLoaded, 500 );
				}
			},

			/**
			 * @desc Looks for new textareas to run script on
			 * @param editors {number} Number of editor at start of check
			 * @param selector {string} Selector of editor to track
			 */
			editorInserted: function ( editors, selector ) {

				if ( $( selector ).length !== editors ) {
					mw.log( 'new editor inserted' );
					local.load( selector );
				} else {
					setTimeout( function () {
						local.editorInserted( editors, selector );
					}, 500 );
				}

			},

			/**
			 * @desc Insert stylesheet using colours set by ThemeDesigner
			 * @todo Allow custom colours for when there's non-themedesigner colours or custom monobook theme
			 */
			insertCSS: function () {

				var	page = dev.colors.parse( dev.colors.wikia.page ),
					buttons = dev.colors.parse( dev.colors.wikia.menu ),
					mix = buttons.mix( page, 20 ),
					shadow = page.lighten( -8 ),
					css;

				if ( !page.isBright() ){
					mix = mix.lighten( 8 );
				}

				css =
					// constant css for container
					'#minicomplete-list{position:absolute;z-index:5;display:none;font-size:12px;cursor:pointer;width:245px;margin:0;}' +
					// variable css for container
					'#minicomplete-list{border:1px solid $border;background-color:$page;color:$link;-webkit-box-shadow:3px 3px 6px 0 $shadow;box-shadow:3px 3px 6px 0 $shadow;}' +
					// constant css for options
					'.minicomplete-option{padding:4px 9px;list-style:none;margin:0;line-height:25px;}' +
					// variable css for options
					'.minicomplete-option:hover,.minicomplete-option.selected{background-color:$mix;}';

				dev.colors.css( css, {
					mix: mix,
					shadow: shadow
				} );

			},

			/**
			 * @desc Binds events related to navigating through menu with up/down keys
			 *       and what to do when pressing esc or left/right keys.
			 */
			bindEvents: function () {

				$( document ).on( 'keydown', function ( e ) {

					var	$option = $( '.minicomplete-option' ),
						$select = $( '.minicomplete-option.selected' ),
						i;

					// stop if the list is empty
					if ( !$option.length ) {
						return;
					}

					switch ( e.keyCode ) {
					// hide options on esc keydown
					case 27:
					// hide options on left/right keydown
					// as it suggests the user is moving through to edit the text
					case 37:
					case 39:
						$( '#minicomplete-list' ).hide().empty();
						break;

					// navigate through menu using up keydown
					case 38:
						if ( !$option.length ) {
							return;
						}

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
						break;

					// navigate through menu using down keydown
					case 40:
						if ( !$option.length ) {
							return;
						}

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
						break;

					// insert selected option on enter keydown
					case 13:
						if ( !$select.length ) {
							return;
						}

						e.preventDefault();
						local.insertComplete( $select.text() );
						break;
					}

				} );

			},

			/**
			 * @desc Counts back from caret position looking for unclosed {{ or [[
			 * @param elem {node} Element to look for search term within
			 */
			findTerm: function ( elem ) {

				// compare against undefined
				// to stop empty strings triggering this too
				// stops errors when input event in bound to the wrong element
				if ( elem.value === undefined ) {
					mw.log( 'Error: Element does not support value attribute' );
					return;
				}

					// text to search for
				var	searchText = elem.value.substring( 0, local.getCaretPos() ),
					// for separating search term
					linkCheck = searchText.lastIndexOf( '[['),
					templateCheck = searchText.lastIndexOf( '{{' ),
					// disallows certain characters in search terms
					// based on $wgLegalTitleChars <http://www.mediawiki.org/wiki/Manual:$wgLegalTitleChars>
					// and to prevent searches for terms that don't need it
					// such as those with pipes as they signal template params or
					// link display changes or if the user is closing the link/template themselves
					illegalChars = /[\{\}\[\]\|#<>%\+\?\\]/,
					term, ns;

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
						local.type = '[[';
						local.getSuggestions( term, 0 );

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
						local.type = '{{';
						local.getSuggestions( term, ns );

					}

				}

			},

			/**
			 * @desc Gets caret position for detecting search term and inserting autocomplete
			 *       term.
			 * @source <http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/>
			 * @return {number} Caret position in string.
			 *                  If browser does not support caret position methods returns 0
			 *                  to prevent syntax errors
			 */
			getCaretPos: function () {

				var	elem = local.elem,
					caretPos = 0,
					sel;

				// support for older versions of IE
				// IE7-8? IE9 apparently supports selectionStart
				if ( document.selection ) {
					elem.focus();
					sel = document.selection.createRange();
					sel.moveStart( 'character', -elem.value.length );
					caretPos = sel.text.length;

				// modern browsers
				} else if ( elem.selectionStart || elem.selectionStart === '0' ) {
					caretPos = elem.selectionStart;
				}

				return ( caretPos );

			},

			/**
			 * @desc Queries mw api for possible suggestions
			 * @link <https://www.mediawiki.org/wiki/API:Allpages> Allpages API docs
			 * @param term {string} Page title to search for
			 * @param ns {integer} Namespace to search in
			 * @todo Test alternative api queries, see main code docs for details
			 */
			getSuggestions: function ( term, ns ) {

				var	query = {
						action: 'query',
						list: 'allpages',
						aplimit: '5',
						apfilterredir: 'nonredirects',
						apnamespace: ns,
						apprefix: term,
						format: 'json'
					},
					config = mw.config.get( ['wgScriptPath', 'wgServer'] ),
					termSplit, namespaceId, title;
                
				mw.log( term );

				// handles namespaces in search query
				// if the namespace exists, this alters the query to affect that
				// otherwise the original search term will be used
				if ( term.indexOf( ':' ) > -1 ) {

					termSplit = term.split( ':' );
					title = termSplit[1];

					// make sure there's only the namespace and the page title
					if ( termSplit.length > 2 ) {
						return;
					}

					namespaceId = mw.config.get( 'wgNamespaceIds' )[
						// wgNamespaceIds uses underscores and lower case
						termSplit[0]
							.replace( / /g, '_' )
							.toLowerCase()
					];

					if ( namespaceId ) {
						query.apnamespace = namespaceId;
						query.apprefix = title;
					}

				}

				$.ajax( {
					url: config.wgServer + config.wgScriptPath + '/api.php',
					data: query,
					dataType: 'json',
					success: function ( data ) {
						// error handling
						if ( data.error ) {
							mw.log( 'API error: ', data.error.code, data.error.info );
							return;
						}

						// no suggestions
						if ( !data.query.allpages.length ) {
							return;
						}

						local.showSuggestions( data.query.allpages );
					},
					error: function ( xhr, error, desc ) {
						mw.log( 'AJAX error: ', error, ' - ', desc );
					}
				} );

			},

			/**
			 * @desc Inserts list of options to select from
			 * @param result {array} Result from API
			 */
			showSuggestions: function ( result ) {

				var	options = '',
					$body = $( 'body' ).width(),
					i, coords, offset,
					$list, leftpos, $options;

				mw.log( result );

				for ( i = 0; i < result.length; i += 1 ) {
					options += '<li class="minicomplete-option">' + result[ i ].title + '</li>';
				}

				// append options to container
				$( '#minicomplete-list' ).html( options );

				// cache list
				// do this after it's been populated to stop errors
				$list = $( '#minicomplete-list' );

				// show option list
				$list.show();

				// position option list
				coords = $( local.elem ).textareaHelper( 'caretPos' );
				offset = $( local.elem ).offset();

				leftpos = offset.left + coords.left;

				// realign against right side of page if overflowing
				// monobook issue on Special:Upload
				// this won't work if someone's extended the body past the limits of the window
				if ( leftpos + $list.width() > $body ) {
					leftpos = $body - $list.width();
				}

				// no fix has been added for if the menu is outside the vertical
				// limits of the window as if it moved down it would obscure text
				// and if it moved up chances are the user can't see the textarea in the first place

				$list.css( {
					top: offset.top + coords.top - $list.height(),
					left: leftpos
				} );

				// add event handlers for .minicomplete-option here
				// as they won't fire if they aren't created when you try to bind events to them

				// cache options
				$options = $( '.minicomplete-option' );

				// add onclick handler for inserting the option
				$options.on( 'click', function () {
					local.insertComplete( $( this ).text() );
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
			 * @desc Inserts selected suggestion
			 * @param complete {string} Search suggestion to insert
			 */
			insertComplete: function ( complete ) {

				var	caret = local.getCaretPos(),
					val = local.elem.value,
					text = val.substring( 0, caret ),
					open = local.type,
					close = open === '[[' ? ']]' : '}}',
					before = text.substring( 0, text.lastIndexOf( open ) );

				// strip template namespace for template transclusion
				if ( open === '{{' && complete.split( ':' )[ 0 ] === 'Template' ) {
					complete = complete.split( ':' )[ 1 ];
				}

				// check if a colon is after the opening brackets
				if ( text[text.lastIndexOf( open ) + 2] === ':' ) {
					open += ':';
				}

				// insert search term
				local.elem.value = before + open + complete + close + val.substring( caret );

				// hide and empty options
				$( '#minicomplete-list' ).hide().empty();

			}

		};

		local.init();

		return global;

	} () );

}( this, this.document, this.setTimeout, this.jQuery, this.mediaWiki, this.dev = this.dev || {} ) );

// </syntaxhighlight> __NOWYSIWYG__
