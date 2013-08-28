/** <nowiki>
 * Replaces Wikia's template preloads with a customisable dropdown list.
 * Appends dropdown list to Monobook's edit summary area.
 * Also adds an input for a custom template preload.
 *
 * List of templates set by [[Template:Stdpreloads]].
 * To add categories or doc templates to this page start the line with a # or //.
 * @example # {{/doc}}
 * @example // [[Category:Templates]]
 *
 * Categorise preload pages using {{preloadpage}} on main template page.
 * {{preloadpage}} should be transcluded with the template, not within noinclude tags.
 * @example On [[Template:Infobox NPC]] add {{preloadpage}}, not on [[Template:Infobox NPC/preload]].
 *
 * @author Sikon (Wookieepedia)
 * @author Grunny (Wookieepedia)
 * @author A proofreader
 * @author Ryan PM
 * @author Cqm
 */

// define global objects if not already existing
this.rswiki = this.rswiki || {};
this.rswiki.gadgets = this.rswiki.gadgets || {};
// used to track what scripts are loading and where
this.rswiki.scripts = this.rswiki.scripts || [];

(function (document, $, mw, RTE, CKEDITOR, WikiaEditor, GlobalTriggers, rswiki) {

    'use strict';
    
    console.log(document.readyState);

    rswiki.gadgets.preloads = {

        /**
         * Loads the script conditionally
         */
        init: function () {

            if ($('#temp-preload').length) {
                return;
            }

            if (mw.config.get('wgAction') === 'edit' || mw.config.get('wgAction') === 'submit') {
                rswiki.scripts.push('rswiki.gadgets.preloads');
                if (mw.config.get('skin') === 'oasis') {
                    rswiki.gadgets.preloads.editor();
                } else if (mw.config.get('skin') === 'monobook') {
                    rswiki.gadgets.preloads.loadPreloads();
                }
            }

        },
        /**
         * Oasis editor detection
         *
         * If the RTE is disabled, the editor can be interacted with on load
         * If it is enabled, the elements this script interacts with are not available on load
         * which requires us to wait until it is ready.
         *
         * @source <http://kangaroopower.wikia.com/wiki/MediaWiki:Scope.js>
         */
        editor: function () {

            if (CKEDITOR) {

                CKEDITOR.on('instanceReady', function() {
                
                    console.log(CKEDITOR.status);
                    console.log('editor instance ready');

		            RTE.getInstance().on('wysiwygModeReady', rswiki.gadgets.preloads.loadPreloads);
		            RTE.getInstance().on('sourceModeReady', rswiki.gadgets.preloads.loadPreloads);

                });

            } else if (WikiaEditor) {

                console.log('visual disabled');
                if (WikiaEditor.getInstance && WikiaEditor.getInstance()) {
                    console.log('wikiaeditor instance');
                    rswiki.gadgets.preloads.loadPreloads();
                } else if (GlobalTriggers) {
                    console.log('globaltriggers');
                    GlobalTriggers.on('WikiaEditorReady', rswiki.gadgets.preloads.loadPreloads);
                } else {
                   console.log('Cannot detect editor, WikiaEditor');
                }

            } else {
                console.log('Cannot detect editor, null');
            }

        },

        /**
         * Gets list of preload templates from Template:Stdpreloads
         */
        loadPreloads: function () {
        
            // this is called repeatedly when switching between source and visual
            if ($('#temp-preload').length) {
                return;
            }

            $.get(mw.config.get('wgScript'), {title: 'Template:Stdpreloads', action: 'raw', ctype: 'text/plain'}, function (data) {

                var templates = data.split('\n'),
                    i,
                    value,
                    options = '<option>(Browse template preloads)</option>';

                for (i = 1; i < templates.length; i += 1) {

                    switch (0) {
                    case templates[i].indexOf('--'):
                        value = templates[i].substring(2)
                                            .trim();
                        options += '<option value="Template:' + value.replace(/ /g, '_') + '/preload">&nbsp;&nbsp;' + value + '</option>';
                        break;
                    // ignore lines starting with # or // so we can use comments
                    case templates[i].indexOf('#'):
                    case templates[i].indexOf('//'):
                    // ignore empty lines
                    case templates[i].length:
                        break;
                    default:
                        value = templates[i].trim();
                        options += '<option value="" disabled="disabled">' + value + '</option>';
                        break;
                    }

                }

                rswiki.gadgets.preloads.insertModule(options);

            });

        },

        /**
         * Inserts the template module
         */
        insertModule: function (list) {
        
            var br = '',
                module;

            if (mw.config.get('skin') === 'oasis') {
                br = function () {
                    return $('<br>');
                };
            }

            module = $('<div>').attr({
                'id': 'temp-preload'
            }).append(
                $('<div>').attr({
                    'id': 'std-preload'
                }).append(
                    'Standard preloads:',
                    br(),
                    $('<select>').attr({
                        'id': 'std-preload-list'
                    }).html(list).change(function () {

                        var page = $(this).val();

                        if (page === '(Browse template preloads)') {
                            return;
                        }

                        rswiki.gadgets.preloads.insertPreload(page);

                    })
                ),
                $('<div>').attr({
                    'id': 'cust-preload'
                }).append(
                    'Custom preload pagename:',
                    br(),
                    $('<input>').attr({
                        'id': 'cust-preload-input',
                        'type': 'text'
                    }),
                    $('<input>').attr({
                        'type': 'button',
                        'id': 'cust-preload-button',
                        'value': 'Insert'
                    }).click(function () {
                        var input = $('#cust-preload-input').val()
                                                            .trim()
                                                            .replace(/ /g, '_');
                        rswiki.gadgets.preloads.insertPreload(input);
                    })
                )
            );

            if (mw.config.get('skin') === 'oasis') {
                console.log('inserting module');
                $('.module_templates > .module_content > .cke_toolbar_templates').prepend(module);
            }

            if (mw.config.get('skin') === 'monobook') {
                $('.mw-editTools').prepend(module);
            }

        },

        /**
         * Loads page and inserts the preload into the edit area
         */
        insertPreload: function (page) {
            $.get(mw.config.get('wgScript'), {title: page, action: 'raw', ctype: 'text/plain'}, function (data) {

                /**
                 * Insert at cursor position modified from
                 * <http://stackoverflow.com/a/11077016/1942596>
                 */
                var textarea = document.getElementById('wpTextbox1'),
                    sel,
                    startPos,
                    endPos;

                // IE support
                if (document.selection) {
                    textarea.focus();
                    sel = document.selection.createRange();
                    sel.text = data;

                // MOZILLA/NETSCAPE support
                } else if (textarea.selectionStart || textarea.selectionStart === '0') {
                    startPos = textarea.selectionStart;
                    endPos = textarea.selectionEnd;
                    textarea.value = textarea.value.substring(0, startPos) +
                                     data +
                                     textarea.value.substring(endPos, textarea.value.length);

                // default to appending to textarea
                } else {
                    textarea.value += data;
                }

            });

        },

    };

    $(rswiki.gadgets.preloads.init);

}(this.document, this.jQuery, this.mediaWiki, this.RTE, this.CKEDITOR, this.WikiaEditor, this.GlobalTriggers, this.rswiki));

/* </nowiki> */