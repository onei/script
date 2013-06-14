// <syntaxhighlight lang="javascript">

/**
 * Reference tooltips
 *
 * Description:
 * Adds a tooltip to references when hovering over or clicking them
 *
 * Based on [[mw:Reference tooltips]]
 */

/**
 * Notes:
 * To access mw.log messages append ?debug=true to the url
 */

/*jshint
    asi:false, bitwise:true, boss:false, camelcase:true, curly:true,
    eqeqeq:true, es3:false, evil:false, expr:false, forin:true,
    funcscope:false, globalstrict:false, immed:true, indent:4, lastsemic:false,
    latedef:true, laxbreak:false, laxcomma:false, loopfunc:false, multistr:false,
    noarg:true, noempty:true, onevar:true, plusplus:true, quotmark:single,
    undef:true, unused:true, scripturl:false, smarttabs:false, shadow:false,
    strict:true, sub:false, trailing:true, white:false
*/

;(function (window, document, mw, $) {

    'use strict';

    function tooltips() {

        var i,
            cookie,
            tooltipsOn,
            tooltipsDelay,
            tooltipsAction,
            tooltipsHover,
            tooltipsClick;

        /**
         * Cookie functions
         */
        function createCookie() {

            $.cookie('ref-tooltips', 'on-200-hover', {
                path: '/',
                expires: 90
            });

            cookie = $.cookie('ref-tooltips');

        }

        function getCookie() {

            var settings;

            cookie = $.cookie('ref-tooltips');

            if (cookie === null) {
                cookie = createCookie();
            }

            settings = cookie.split('-');

            tooltipsOn = settings[0]; // 'on' or 'off'
            tooltipsDelay = settings[1]; // 0 - 1000 (in milliseconds)
            tooltipsAction = settings[2]; // 'hover' or 'click'

            if (tooltipsAction === 'hover') {
                tooltipsHover = true;
                tooltipsClick = false;
            }

            if (tooltipsAction === 'click') {
                tooltipsHover = false;
                tooltipsClick = true;
            }

        }

        function modifyCookie() {

            var inputs;

            inputs = document.getElementById('rsw-config-action').getElementsByTagName('input');

            for (i = 0; i < inputs.length; i += 1) {
                if (inputs[i].checked) {
                    tooltipsAction = inputs[i].value;
                }
            }

            tooltipsDelay = document.getElementById('rsw-config-delay').getElementsByTagName('input')[0].value;

            $.cookie('ref-tooltips', 'on' + '-' + tooltipsDelay + '-' + tooltipsAction, {
                path: '/',
                expires: 90
            });

            window.location.reload(false);

        }

        function disableTooltips() {

            // recreate with near defaults
            $.cookie('ref-tooltips', 'off-200-hover', {
                path: '/',
                expires: 90
            });

            window.location.reload(false);

        }

        /**
         * Create and remove functions
         */
        function removeConfig() {

            $('#rsw-config').remove();
            $('#rsw-config-background').remove();

        }

        function createConfig() {

            var body,
                form,
                formBackground,
                formLeft,
                formTop;

            // use this for formBackground height/width        
            body = document.body;

            // for config positioning
            formTop = ($(window).height() / 3) + 'px';
            formLeft = (($(window).width() - 510) / 2) + 'px';

            // create form container
            form = $('<div/>', {
                'id': 'rsw-config'
            }).css({
                // @todo set these with script
                'top': formTop,
                'left': formLeft
            }).append(
                $('<div/>', {
                    'id': 'rsw-config-header'
                }).append(
                    $('<span/>', {
                        'id': 'rsw-config-title',
                        'html': 'Reference Tooltip Settings'
                    }),

                    $('<span/>', {
                        'id': 'rsw-config-close',
                        'title': 'Close settings',
                        'click': function () {
                            removeConfig();
                        }
                    })
                ),

                $('<div/>', {
                    'id': 'rsw-config-body'
                }).append(
                    $('<form/>').append(
                        $('<input>', {
                            'id': 'rsw-config-disable',
                            'type': 'button',
                            'value': 'Disable reference tooltips',
                            'click': function () {
                                disableTooltips();
                            }
                        }),

                        $('<div/>', {
                            'id': 'rsw-config-note',
                            'html': 'Once disabled, reference tooltips can be re-enabled using the link at the bottom of the page.'
                        }),

                        $('<label/>', {
                            'id': 'rsw-config-delay',
                            'html': 'Delay before the tooltip appears (in milliseconds): '
                        }).append(
                            $('<input>', {
                                'type': 'number',
                                'step': '50',
                                'min': '0',
                                'max': '1000',
                                'value': tooltipsDelay
                            })
                        ),

                        $('<br>'),

                        $('<span/>', {
                            'id': 'rsw-config-action',
                            'html': 'Tooltip is activated by: '
                        }).append(
                            $('<label/>', {
                                'html': 'Hover'
                            }).prepend(
                                $('<input>', {
                                    'type': 'radio',
                                    'name': 'tooltip-action',
                                    'checked': tooltipsHover,
                                    'value': 'hover'
                                })
                            ),

                            $('<label/>', {
                                'html': 'Click'
                            }).prepend(
                                $('<input>', {
                                    'type': 'radio',
                                    'name': 'tooltip-action',
                                    'checked': tooltipsClick,
                                    'value': 'click'
                                })
                            )
                        )
                    )
                ),

                $('<div/>', {
                    'id': 'rsw-config-footer'
                }).append(
                    $('<button/>', {
                        'id': 'rsw-config-save',
                        'type': 'button',
                        'html': 'Save settings',
                        // 'class': '', in case it needs a wikia class to blend in
                        'click': function () {
                            modifyCookie();
                        }
                    })
                )
            );

            formBackground = $('<div/>', {
                'id': 'rsw-config-background',
                'click': function () {
                    removeConfig();
                }
            }).css({
                'height': body.clientHeight + 'px',
                'width': body.clientWidth + 'px'
            });

            $('body').append(form);
            $('body').append(formBackground);

        }

        function removeTooltip() {

            $('#rsw-tooltip').remove();

        }

        function createTooltip() {

            var tooltip;

            if (document.getElementById('rsw-tooltip').length) {
                removeTooltip();
            }

            tooltip = document.createElement('ul');
            tooltip.id = 'rsw-tooltip';

        }

        /**
         * Functions for each tooltip activation action
         */
        function tooltipHover() {
            mw.log('hover activation detected');
        }

        function tooltipClick() {
            mw.log('click activation detected');
        }

        /**
         * Functions to run straight away
         */
        function accessConfig() {

            var settingsLink;

            settingsLink = $('<span/>', {
                'id': 'rsw-config-open',
                'title': 'Configure reference tooltips'
            }).append(
                $('<a/>', {
                    'html': '[Reference Tooltip Settings]',
                    'click': function () {
                        createConfig();
                    }
                })
            );

            $('#mw-content-text').append(settingsLink);

        }

        function tooltipAction() {

            getCookie();

            if (tooltipsOn === 'off') {
                return;
            }

            if (tooltipsAction === 'click') {
                tooltipClick();
            }

            if (tooltipsAction === 'hover') {
                tooltipHover();
            }

        }

        accessConfig();
        tooltipAction();

    }

    $(function () {

        // commented out so it works on all pages for now
/*
        if ($('.references').length === 0) {
            return;
        }
*/
        tooltips();

    });

}(this, this.document, this.mediaWiki, this.jQuery));

// </syntaxhighlight>
