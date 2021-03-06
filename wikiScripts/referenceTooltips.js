/**
 * Reference tooltips
 *
 * @description
 * Adds a tooltip to references when hovering over or clicking them
 * Based on [[mw:Reference tooltips]]
 *
 * @notes
 * To access mw.log messages append ?debug=true to the url
 *
 * vars stored in cookie:
 * tooltipsOn: 'on', 'off'
 *     sets whether tooltips appear. allows config for anons
 * tooltipsDelay: '1' - '1000' (in milliseconds)
 *     delay before tooltips appear after trigger event
 * tooltipsAction: 'click' or 'hover'
 *     event that triggers tooltips appearing
 *
 * @todo
 * add fade in/fade out animations for config form and tooltip
 */

/*jshint
    asi: false, bitwise: true, boss: false, camelcase: true, curly: true,
    eqeqeq: true, es3: false, evil: false, expr: false, forin: true,
    funcscope: false, globalstrict: false, immed: true, lastsemic: false, latedef: true,
    laxbreak: false, laxcomma: false, loopfunc: false, multistr: false, noarg: true,
    noempty: true, onevar: true, plusplus: true, quotmark: single, undef: true,
    unused: true, scripturl: false, smarttabs: false, shadow: false, strict: true,
    sub: false, trailing: true, white: true
*/

/*jslint
    indent: 4
*/

(function (window, document, $, mw) {

    'use strict';

    function tooltips() {

        var i,
            settings,
            timer;

        /**
         * Cookie functions
         */
        function createCookie() {

            $.cookie('ref-tooltips', 'on-200-hover', {
                path: '/',
                expires: 90
            });

            return 'on-200-hover';

        }

        function getCookie() {

            var cookie,
                storedVars,
                touchscreen;

            cookie = $.cookie('ref-tooltips');

            if (cookie === null) {
                cookie = createCookie();
            }

            storedVars = cookie.split('-');

            settings = {
                on: storedVars[0],
                delay: storedVars[1],
                delayNo: parseInt(storedVars[1], 10),
                action: storedVars[2]
            };

            if (settings.action === 'hover') {
                settings.hover = true;
                settings.click = false;
            }

            if (settings.action === 'click') {
                settings.hover = false;
                settings.click = true;
            }

            // returns boolean
            touchscreen = 'ontouchstart' in document.documentElement;

            if (touchscreen === true) {
                settings.action = 'click';
                settings.hover = false;
                settings.click = true;
            }

            mw.log(settings);

        }

        function modifyCookie() {

            var inputs;

            inputs = document.getElementById('rsw-config-action').getElementsByTagName('input');

            for (i = 0; i < inputs.length; i += 1) {
                if (inputs[i].checked) {
                    settings.action = inputs[i].value;
                }
            }

            settings.delay = document.getElementById('rsw-config-delay').getElementsByTagName('input')[0].value;

            // in case someone sets a greater value manually
            if (parseInt(settings.delay, 10) > 1000) {
                settings.delay = '1000';
            }

            $.cookie('ref-tooltips', 'on' + '-' + settings.delay + '-' + settings.action, {
                path: '/',
                expires: 90
            });

            window.location.reload(false);

        }

        function disableTooltips() {

            // just use defaults for delay and action as no one really cares
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
            formTop = ($(window).height() / 4) + 'px';
            formLeft = (($(window).width() - 510) / 2) + 'px';

            // create form container
            form = $('<div/>', {
                'id': 'rsw-config'
            }).css({
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
                                'value': settings.delay
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
                                    'checked': settings.hover,
                                    'value': 'hover'
                                })
                            ),

                            $('<label/>', {
                                'html': 'Click'
                            }).prepend(
                                $('<input>', {
                                    'type': 'radio',
                                    'name': 'tooltip-action',
                                    'checked': settings.click,
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

            $('.rsw-tooltip').remove();

        }

        function createTooltip(event) {

            var offset,
                refId,
                ref,
                openSettings,
                tooltip,
                tooltipHeight,
                tooltipWidth,
                top,
                left;

            if ($('.rsw-tooltip').length) {
                removeTooltip();
            }

            offset = $(event.target).offset();

            // use native js for most of this as it's easier to debug
            refId = event.target.href.split('#')[1];

            ref = $('#' + refId).children('.reference-text').clone();


            openSettings = $('<span/>', {
                'id': 'rsw-tooltip-settings',
                'click': function () {
                    createConfig();
                }
            });


            tooltip = $('<div/>', {
                'class': 'rsw-tooltip'
            }).append(
                openSettings,
                ref
            );

            $('body').append(tooltip);

            tooltipHeight = $('.rsw-tooltip').height();
            tooltipWidth = $('.rsw-tooltip').width();

            top = offset.top - tooltipHeight - 25;
            left = offset.left - 7;

            // if above the top of the page
            if (top < window.pageYOffset) {
                top = window.pageYOffset;
            }

            // if too far right
            // only an issue in monobook
            if ((tooltipWidth + left) > $('body').width()) {
                left = $('body').width() - tooltipWidth;
            }

            $('.rsw-tooltip').css({
                'top': top + 'px',
                'left': left + 'px'
            });

        }

        /**
         * Functions for each tooltip activation action
         */
        function tooltipHover() {

            function hide() {

                timer = window.setTimeout(function () {
                    removeTooltip();
                }, 500);

            }

            $('.reference').mouseover(function (event) {
                window.clearTimeout(timer);
                window.setTimeout(function () {
                    createTooltip(event);
                }, settings.delayNo);
            }); // .mouseout(hide);

            $('body').mouseover(function (event) {

                var hoverTarget;

                if ($('.rsw-tooltip').length) {

                    mw.log(event.target);
                    hoverTarget = $(event.target);

                    // there's a bug here somewhere...
                    if (hoverTarget.is('.rsw-tooltip, .rsw-tooltip *')) {
                        window.clearTimeout(timer);
                        return;
                    }

                    hide();

                }
            });

        }

        function tooltipClick() {

            $('body').on('click', function (event) {

                var clickTarget;

                clickTarget = $(event.target);

                if (clickTarget.is('.reference') || clickTarget.is('.reference a')) {
                    event.preventDefault();
                    window.setTimeout(function () {
                        createTooltip(event);
                    }, settings.delayNo);
                }

                if ($('.rsw-tooltip').length) {
                    if (clickTarget.is('.rsw-tooltip, .rsw-tooltip *')) {
                        return;
                    }

                    removeTooltip();

                }

            });

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

            if (settings.on === 'off') {
                return;
            }

            if (settings.action === 'click') {
                tooltipClick();
            }

            if (settings.action === 'hover') {
                tooltipHover();
            }

        }

        /**
         * Function invocation
         */
        accessConfig();
        tooltipAction();

    }

    $(function () {

        var namespace = mw.config.get('wgNamespaceNumber');

        if (namespace === 0 || namespace === 4) {

            if ($('.references').length === 0) {
                mw.log('no references');
                return;
            }

            if (mw.config.get('wgAction') !== 'view') {
                return;
            }

            tooltips();

        }

    });

}(this, this.document, this.jQuery, this.mediaWiki));