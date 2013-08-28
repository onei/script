// <syntaxhighlight lang="javascript"><nowiki>
/**
 * Replaces Wikia's template preloads with a customisable dropdown list.
 * Appends dropdown list to Monobook's edit summary area.
 * Also adds an input for a custom template preload.
 *
 * Modified from code used on RuneScape Wiki
 * <http://runescape.wikia.com/wiki/MediaWiki:Gadget-Preload.js>
 *
 * Requires some corresponding CSS, see
 * <http://dev.wikia.com/wiki/StandardPreloads/code.css>
 *
 * @author Sikon         <http://starwars.wikia.com/wiki/User:Sikon>
 * @author Grunny        <http://dev.wikia.com/wiki/User:Grunny>
 * @author A proofreader <http://runescape.wikia.com/wiki/User:A_proofreader>
 * @author Ryan PM       <http://runescape.wikia.com/wiki/User:Ryan_PM>
 * @author Cqm           <http://dev.wikia.com/wiki/User:Cqm>
 * @link   Documentation <http://dev.wikia.com/wiki/StandardPreloads>
 */

;(function (document, $, mw) {

    'use strict';

    var preloads = {

        /**
         * Loads the function conditionally
         */
        init: function () {

            if ($('#temp-preload').length) {
                return;
            }

            if (mw.config.get('wgAction') === 'edit' || mw.config.get('wgAction') === 'submit') {
                preloads.loadPreloads();
            }

        },

        /**
         * Gets list of preload templates from Template:Stdpreloads
         */
        loadPreloads: function () {

            /**
             * @param data - content of loaded page
             */
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

                preloads.insertModule(options);

            });

        },

        /**
         * Inserts the template module
         * @param list - html string of option tags
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

                        preloads.insertPreload(page);

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
                        preloads.insertPreload(input);
                    })
                )
            );

            if (mw.config.get('skin') === 'oasis') {
                $('.module_templates > .module_content > .cke_toolbar_templates').prepend(module);
            }

            if (mw.config.get('skin') === 'monobook') {
                $('.mw-editTools').prepend(module);
            }

        },

        /**
         * Loads page and inserts the preload into the edit area
         * @param page - preload page to load
         */
        insertPreload: function (page) {

            /**
             * @param data - content of loaded page
             * @todo ie10 support
             */
            $.get(mw.config.get('wgScript'), {title: page, action: 'raw', ctype: 'text/plain'}, function (data) {

                // Insert at cursor position modified from
                // <http://stackoverflow.com/a/11077016/1942596>
                var textarea = document.getElementById('wpTextbox1'),
                    sel,
                    startPos,
                    endPos;

                // ie9 support
                if (document.selection) {
                    textarea.focus();
                    sel = document.selection.createRange();
                    sel.text = data;

                // mozilla/netscape support
                } else if (textarea.selectionStart || textarea.selectionStart === '0') {
                    startPos = textarea.selectionStart;
                    endPos = textarea.selectionEnd;
                    textarea.value = textarea.value.substring(0, startPos) +
                                     data +
                                     textarea.value.substring(endPos, textarea.value.length);

                // default to appending to textarea
                // this will likely break before getting to here anyway
                } else {
                    textarea.value += data;
                }

            });

        }

    };

    $(preloads.init);

}(this.document, this.jQuery, this.mediaWiki));

// </nowiki>
// </syntaxhighlight>