/** <nowiki>
 * Parts of this script are copied from [[User:Quarenon/gemwupdate.js]].
 * Credit goes to Quarenon for writing that code.
 *
 * @todo merge old script into this for easier switching between the two when GED breaks
 */

/*global alert:true, prompt:true */
/*jshint bitwise: true, curly: true, devel: false, eqeqeq: true, es3: false,  forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: false, quotmark: single, undef: true, unused: true, strict: true, trailing: true */

(function (window, document, $, mwConfig, callAPI, addCommas) {

    'use strict';

    var button;

    // queries the jagex api for price data
    function crossDomain(u, s) {

        var url;

        if (s === 'yahoo') {
            url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%20%3D%20"' + encodeURIComponent(u) + '"%20and%20xpath%3D"*"&format=json&_maxage=900';
        } else if (s === 'anyorigin') {
            url = 'http://anyorigin.com/get?url=' + encodeURIComponent(u) + '&callback=?';
        } else {
            url = 'http://whateverorigin.org/get?url=' + encodeURIComponent(u) + '&callback=?';
        }

        return url;
    }

    function millbill(n) {

        var mb = (n.match(/[a-zA-Z]/) || [''])[0];

        if (mb === 'b') {
            mb = 1000;
        } else {
            mb = 1;
        }

        return parseFloat(n) * mb;
    }

    // reloads the page is successful, alerts if not
    function geReqsDone(failed) {
        if (!failed) {
            alert('Thank you for your submission! The page will now be reloaded.');
            document.location.replace(mwConfig.wgScript + '?title=' + encodeURIComponent(mwConfig.wgPageName) + '&action=purge');
        } else {
            alert('An error occurred while submitting the edit.');
            button.disabled = false;
            button.innerHTML = 'Update price';
        }
    }

    function submitUpdates(vol) {

        callAPI({
            'action': 'query',
            'prop': 'info|revisions',
            'intoken': 'edit',
            'titles': mwConfig.wgPageName,
            'rvprop': 'content',
            'rvlimit': '1',
            'indexpageids': 'true'
        }, 'GET', function (response) {

            var page = response.query.pages[response.query.pageids[0]],
                content = page.revisions[0]['*'],
                cPrice = content.match(/\|Price\s*=\s*([\d,]+)/)[0].replace(/\|Price\s*=\s*/, ''),
                cDate,
                updated;

            if (window.price === parseInt(cPrice.replace(/,/g, ''), 10) && window.curdate > window.unixnow) {
                alert('The price is already the same as the price on the official GE database.');
                button.disabled = false;
                button.innerHTML = 'Update price';
                return false;
            }

            cDate = content.match(/\|Date\s*=\s*([^\|\n]+)/)[0].replace(/\|Date\s*=\s*/, '');
            updated = content.replace(/\|Price\s*=\s*([\d,]+)/, '|Price=' + addCommas(window.price))
                             .replace(/\|Last\s*=\s*([\d,]+)/, '|Last=' + cPrice)
                             .replace(/\|Date\s*=\s*([^\|\n]+)/, '|Date=~~~~~')
                             .replace(/\|LastDate\s*=\s*([^\|\n]+)/, '|LastDate=' + cDate);

            if (vol) {
                updated = updated.replace(/\|Volume\s*=\s*([\d,\.]+)/, '|Volume=' + vol)
                                 .replace(/\|VolumeDate\s*=\s*([^\|\n]+)/, '|VolumeDate=~~~~~');
            }

            callAPI({
                'minor': 'yes',
                'bot': 'yes',
                'summary': 'Updated GEMW data via script on the exchange page.',
                'action': 'edit',
                'title': mwConfig.wgPageName,
                'basetimestamp': page.revisions[0].timestamp,
                'startimestamp': page.starttimestamp,
                'token': page.edittoken,
                'text': updated
            }, 'POST', function (response) {
                if (response.edit.result === 'Success') {
                    geReqsDone();
                } else {
                    geReqsDone(true);
                }
            });
        });
    }


    function submitUpdateVols() {

        $.ajax({
            url: crossDomain('http://services.runescape.com/m=itemdb_rs/top100.ws'),
            success: function (result) {
                var HTML = (result.contents || result.results[0]);

                if (!HTML || !HTML.length) {
                    return submitUpdates();
                }

                var tablestr = HTML.replace(/src=/g, 'data-src=').substring(HTML.match(/<table/).index, HTML.match(/<\/table>/).index),
                    table = $(tablestr).children('tbody'),
                    imgs = table.find('.item img'),
                    ttcElems = table.find('td:nth-child(6)'),
                    ttcVals = {};

                if (ttcElems.length === ttcElems.find('p').length) {
                    ttcElems = ttcElems.find('p');
                }

                ttcElems.each(function (i) {
                    var itemid = imgs.eq(i).attr('data-src').match(/id=(\d+)/)[1];
                    ttcVals[itemid] = millbill(ttcElems.eq(i).html());
                });

                if (ttcVals[$('#GEDBID').html()]) {
                    submitUpdates(ttcVals[$('#GEDBID').html()]);
                } else {
                    submitUpdates();
                }
            },
            dataType: 'json'
        });
    }

    function updateGEPrice() {
        var reqs = 0;
        button.disabled = true;
        button.innerHTML = 'Updating price...';

        $.getJSON(crossDomain('http://services.runescape.com/m=itemdb_rs/api/graph/' + $('#GEDBID').html() + '.json', 'anyorigin'), function (data) {
            var pricelist = data.contents.daily,
                names = [],
                name;

            for (name in pricelist) {
                if (pricelist.hasOwnProperty(name)) {
                    names.push(name);
                }
            }

            window.unixnow = names[names.length - 1];
            window.price = pricelist[window.unixnow];

            if (window.price === 0) {
                window.price = parseInt(prompt("The Grand Exchange Database did not have a price stored at the moment. Please check the item's price in-game, and enter it below."), 10);

                if (window.price % 1 !== 0) {
                    button.disabled = false;
                    button.innerHTML = 'Update price';
                    return false;
                }

            }

            window.unixnow = Math.round(parseInt(window.unixnow, 10) / 1000);
            window.curprice = parseInt($('#GEPrice').html().replace(/,/g, ''), 10);
            window.curdate = Math.round(Date.parse($('#GEDate').html().replace('(UTC)', 'UTC')) / 1000);

            if (window.price === window.curprice && window.curdate > window.unixnow) {
                alert('The price is already the same as the price on the official GE database.');
                button.disabled = false;
                button.innerHTML = 'Update price';
                return false;
            }

            if ($('#volumeData').length) {
                submitUpdateVols();
            } else {
                submitUpdates();
            }

        });
    }

    $(function () {

        $('#gemw_guide').html(

            $('<b/>').text('Update item price'),

            '&nbsp;',

            $('<button/>').attr({
                'id': 'updateGEP'
            }).click(function () {
                updateGEPrice();
            })

        );

        button = document.getElementById('updateGEP');
    });

}(this, this.document, this.jQuery, this.mediaWiki.config.values, this.callAPI, this.addCommas));