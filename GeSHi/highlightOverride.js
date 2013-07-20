/**
 * highlightOverride.js
 *
 * @description
 * Finds global and defined variables and attaches a class to them
 * to make undefined variables and spelling errors more noticeable.
 * Designed to compliment JavaScript syntax highlighting of MediaWiki GeSHi extension.
 *
 * @author Cam
 */

;(function ($, mw) {

    'use strict';

    /**
     * Find global variables and adds the gl0 class to them
     * 
     * Currently applies to window, document, jQuery, $, mediaWiki and mw
     * More can be added in required (tundra?)
     * Find a way to automate this?
     */
/*
(function () {




*/

    var source,
        regex,
        matches,
        globals;

    source = $('.javascript.source-javascript').text();
    startRegex = /\(function(?: |)\(([\w, \$]+)\)(?: |){/g;
    endRegex = /}(\)\(([\w\.,\(\)'=\|\{\}\$ ]+)\)(|;)|\(([\w\.,\(\)'=\|\{\}\$ ]+)\)\)(|;))/g;
    startMatches = source.match(startRegex);
    endMatches = source.match(endRegex);
    console.log(startMatches, startMatches.length, endMatches, endMatches.length);
    //matches.replace(/ /g, '');
    //globals = matches.split(',');
    
// ---------------------------------------------

    function findGlobals() {

        var textSplit;

        $('pre.javascript.source-javascript').contents().each(function () {
            if (this.nodeType === 3) {
                // window
                if (this.nodeValue.match(/([^\w]|\b|\s)window(\.|[^\w]|\b)/)) {
                    textSplit = $(this).text().split('window');
                    $(this).replaceWith(textSplit[0] + '<span class="gl0">window</span>' + textSplit[1]);
                }

                // document
                if (this.nodeValue.match(/([^\w]|\b|\s)document(\.|[^\w]|\b)/)) {
                    textSplit = $(this).text().split('document');
                    $(this).replaceWith(textSplit[0] + '<span class="gl0">document</span>' + textSplit[1]);
                }

                // jQuery
                if (this.nodeValue.match(/([^\w]|\b|\s)jQuery(\.|[^\w]|\b)/)) {
                    textSplit = $(this).text().split('jQuery');
                    $(this).replaceWith(textSplit[0] + '<span class="gl0">jQuery</span>' + textSplit[1]);
                }
                if (this.nodeValue.match(/([^\w]|\b|\s)\$(\.|[^\w]|\b)/)) {
                    textSplit = $(this).text().split('$');
                    $(this).replaceWith(textSplit[0] + '<span class="gl0">$</span>' + textSplit[1]);
                }

                // mediaWiki
                if (this.nodeValue.match(/([^\w]|\b|\s)mediaWiki(\.|[^\w]|\b)/)) {
                    textSplit = $(this).text().split('mediaWiki');
                    $(this).replaceWith(textSplit[0] + '<span class="gl0">mediaWiki</span>' + textSplit[1]);
                }
                if (this.nodeValue.match(/([^\w]|\b|\s)mw(\.|[^\w]|\b)/)) {
                    textSplit = $(this).text().split('mw');
                    $(this).replaceWith(textSplit[0] + '<span class="gl0">mw</span>' + textSplit[1]);
                }
            }
        });
        
        $('.me1').each(function () {
            if ($(this).text() === 'document' || $(this).text() === 'jQuery' || $(this).text() === 'mediaWiki') {
                $(this).attr('class', 'gl0');
            }
        });
    }

    $(function () {

        if (mw.config.get('wgAction') !== 'view') {
            return;
        }

        findGlobals();

    });


}(this.jQuery, this.mediaWiki));