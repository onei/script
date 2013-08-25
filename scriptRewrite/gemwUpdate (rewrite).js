
(function ($, mwConfig) {

    'use strict';
    
    var manualUpdate = window.noGED || true,
        initialButtonVal = 'Update price',
        loadingButtonVal = 'Updating';

    function insertButton() {
    
        var customInput = '';
        
        if (manualUpdate) {
            customInput = '<b>Note: Please use the ingame price</b><br /><input id="gePriceInput" type="text">';
        }
        
        $('#gemw_guide').html(
            customInput +
            '<input id="gePriceButton" type="button" value="' + initialButtonVal + '">'
        );
        
    }
    
    function reset($button) {
        $button.val(initialButtonVal)
                           .removeAttr('disabled');
    }
    
    function loading($button) {
        $button.val(loadingButtonVal)
                           .attr('disabled', 'disabled');
    }
    
    function reload(error) {

        if (error) {
            alert('An error occurred whilst updating the price')
            reset();
        } else {
            window.location.replace(mwConfig.wgServer + mwConfig.wgArticlePath.replace('$1', mwConfig.wgPageName) + '?action=purge');
        }

    }
    
    insertButton();

    $(function () {
    
        if (mwConfig.wgNamespaceNumber !== 112) {
            return;
        }

        insertButton();

        $('#gePriceButton').click(function () {
        
            console.log(this)
        
            if (manualUpdate) {
            
                newPrice = $('#gePriceInput').val();
                
                if (newPrice.length === 0) {
                    // throw error about no data
                    reset();
                    return;
                } else {
                    parse
                
            } else {
                // query jagex api here and return newPrice
            }
            
            if (isNaN(newPrice)) {
                // throw error message here
                reset();
                return;
            }
            
            time = new Date();
            
            // query mw api for current content
            
            // do replace here
            
            reload();

        });

    });

}(this.jQuery, this.mediaWiki.config.values));