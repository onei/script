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

(function (window, document, mw, $) {
    'use strict';

    function tooltips() {

        var i,
            len,
            tooltipsOn,
            tooltipsDelay,
            tooltipsAction;

        /**
         * Cookie functions
         */
        function createCookie() {

            $.cookie('ref-tooltips', 'on-200-hover', {
                path: '/',
                expires: 90
            });

            return $.cookie('ref-tooltips');

        }

        function getCookie() {

            var cookie,
                settings;

            cookie = $.cookie('ref-tooltips');

            if (cookie === null) {
                cookie = createCookie();
            }

            settings = cookie.split('-');

            tooltipsOn = settings[0]; // 'on' or 'off'
            tooltipsDelay = settings[1]; // 0 - 1000 milliseconds
            tooltipsAction = settings[2]; // 'hover' or 'click'

        }

        function modifyCookie() {

            var inputArray;

            inputArray = document.getElementsByTagName('input');
            len = inputArray.length;

            for (i = 0; i < len; i += 1) {
                if (inputArray[i].checked) {
                    tooltipsAction = inputArray[i].name;
                }
            }

            tooltipsDelay = document.getElementById('rsw-config-delay').value;

            $.cookie('ref-tooltips', 'on' + tooltipsDelay + tooltipsAction, {
                path: '/',
                expires: 90
            });

            window.location.reload;

        }

        function stopTooltips() {

            // recreate with near defaults 
            $.cookie('ref-tooltips', 'off-200-hover', {
                path: '/',
                expires: 90
            });

            window.location.reload;

        }

        /**
         * Create and remove functions
         */
        function removeConfig() {

            var removeConfigForm;

            removeConfigForm = document.getElementById('rsw-config');
            removeConfigForm.parentNode.removeChild(removeConfigForm);

        }

        function createConfig() {

            var body,
                // form container
                form,
                // form header
                formHeader,
                formTitle,
                formClose,
                // form body
                formBody,
                // ....
                // form footer
                formFooter,
                formSave,
                // form background
                formBackground;

            // cache body                
            body = document.body;

            // create form container
            form = document.createElement('div');
            form.id = 'rsw-config';

            // create form header
            formHeader = document.createElement('div');
            formHeader.id = 'rsw-config-header';

            formTitle = document.createElement('span');
            formTitle.id = 'rsw-config-title';
            formTitle.innerHTML = 'Reference Tooltip Settings';

            formClose = document.createElement('span');
            formClose.id = 'rsw-config-close';
            formClose.onclick = function () {
                mw.log('close config');
            };

            formHeader.appendChild(formTitle);
            formHeader.appendChild(formClose);

            form.appendChild(formHeader);

            // create form body
            formBody = document.createElement('div');
            formBody.id = 'rsw-config-body';

            // create form footer
            formFooter = document.createElement('div');
            formFooter.id = 'rsw-config-footer';

            formSave = document.createElement('button');
            formSave.type = 'button';
            formSave.id = 'rsw-config-save';
            //formSave.className = ''; in case it needs a wikia class to blend in
            formSave.onclick = function () {
                mw.log('save settings');
            };

            formFooter.appendChild(formSave);

            form.appendChild(formFooter);

            // create background, make it more lightbox-ish
            formBackground = document.createElement('div');
            formBackground.style.height = body.clientHeight + 'px';
            formBackground.style.width = body.clientWidth + 'px';

            body.appendChild(formBackground);

        }

        function removeTooltip() {

            var removeRefTooltip;

            removeRefTooltip = document.getElementById('rsw-tooltip');
            removeRefTooltip.parentNode.removeChild(removeRefTooltip);

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
            // do hover stuff here        
        }

        function tooltipClick() {
            // do click stuff here
        }

        /**
         * Functions to run straight away
         */
        function accessConfig() {

            var settingsLinkSpan,
                settingsLink;

            settingsLinkSpan = document.createElement('span');
            settingsLinkSpan.id = 'rsw-config-open';

            settingsLink = document.createElement('a');
            settingsLink.innerHTML = '[Reference Tooltip Settings]';
            settingsLink.onclick = function () { // createConfig();
                mw.log('open settings');
            };

            settingsLinkSpan.appendChild(settingsLink);
            document.getElementById('mw-content-text').appendchild(settingsLinkSpan);

        }

        function tooltipAction() {

            if (tooltipsOn === 'off') {
                return;
            }

            if (tooltipsAction === 'click') {
                tooltipClick();
            }

            if (tooltipAction === 'hover') {
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

        if ($('.references').length === 0) {
            return;
        }

        tooltips();

    });

}(this, this.document, this.mediaWiki, this.jQuery));

// </syntaxhighlight>
