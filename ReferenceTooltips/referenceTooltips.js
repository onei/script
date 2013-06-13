// <syntaxhighlight lang="javascript">

/**
 * Reference tooltips
 *
 * Description:
 * Adds a tooltip to references when hovering over or clicking them
 *
 * The original can be found at [[mw:Reference tooltips]]
 */

 ;(function (window, document, mw, $) {
    'use strict';
	
    function tooltips() {

        var console, // temp for devel
            tooltipsOn,
            tooltipsDelay,
            tooltipsAction;
            
        console = window.console;
		
        /**
         * Cookie functions
         */
	    function createCookie() {

            $.cookie('rsw-reference-tooltips', 'on-200-hover', {
                path: '/',
                expires: 90
            });

        }
		
        function getCookie() {

            var cookie,
                settings;
            
            cookie = $.cookie('rsw-reference-tooltips');

            if (cookie === null) {
                createCookie();
                cookie = 'on-200-hover';
            }

            settings = cookie.split('-');

            tooltipsOn = settings[0]; // 'on' or 'off'
            tooltipsDelay = settings[1]; // 0 - 1000 milliseconds
            tooltipsAction = settings[2]; // 'hover' or 'click'

		}
		
		function modifyCookie() {
		
		}
		
		function stopTooltips() {
		
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
                console.log('close config')
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
                console.log('save settings');
            };
            
            formFooter.appendChild(formSave);
            
            form.appendChild(formFooter);

            // create background, make it more lightbox-ish
            formBackground = document.createElement('div')
            formBackground.style.height = body.clientHeight + 'px';
            formBackground.style.width = body.clientWidth + 'px';
            
            body.appendChild(formBackground);
        
        }

        function removeTooltip() {

            var removeRefTooltip();

            removeRefTooltip = document.getElementById('rsw-tooltip');
            removeRefTooltip.parentNode.removeChild(removeRefTooltip);

        }

        function createTooltip() {

            var tooltip;
        
            tooltip = document.createElement('ul');
            tooltip.id = 'rsw-tooltip';            
        
        }

        /**
         * Functions for each tooltip activation action
         */        
        function tooltipHover() {
        
        }

        function tooltipClick() {
        
        }

        /**
         * Functions to run straight away
         */
        function accessConfig() {
        
        }

        function tooltipAction() {
        
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