/**
 * Gather site metrics data and send it to a server to be stored in a database.
 * This script is under development and not yet ready for use.
 *
 * Gathers data about how readers use the wiki. This includes:
 * - Clickstream, which pages are visited and from where. From this we can see
 *   how various links are used, such as navboxes, links in the article, wiki
 *   navigation or search.
 * - Browser info, so we know what we need to support and what we can ignore.
 *   <http://gs.statcounter.com/?PHPSESSID=0hi8cvrnaba1lpe5tsl7uddv31#browser-ww-monthly-201207-201307>
 * - Referring sites, to see what searches are being used to get to the wiki
 * - If the reader is anonymous or logged in
 * - The number of new users that are coming to the site
 * - How long a reader is spending on the page to find the information they want,
 *   which can be compared with search queries retrieved from the referring url
 *   <http://www.kaushik.net/avinash/standard-metrics-revisited-time-on-page-and-time-on-site/>
 * - Screen size
 *   <http://gs.statcounter.com/#resolution-ww-monthly-201207-201307>
 * This data is then sent to the server, and converted into a database.
 * 
 * @author      <mdowdell244@gmail.com>
 * @license     <http://www.gnu.org/licenses/gpl.html> GPLv3
 * @link        <https://github.com/onei/script/blob/master/userStats/userStats.js>
 * @todo        Implement check for mobile browsing
 */

/*jshint
    asi: false, bitwise: true, boss: false, camelcase: true, curly: true,
    eqeqeq: true, es3: true, evil: false, expr: false, forin: true,
    funcscope: false, globalstrict: false, immed: true, indent: 4, lastsemic: false,
    latedef: true, laxbreak: false, laxcomma: false, loopfunc: false, multistr: false,
    noarg: true, noempty: true, onevar: true, plusplus: true, quotmark: single,
    undef: true, unused: true, scripturl: false, smarttabs: false, shadow: false,
    strict: true, sub: false, trailing: true, white: true
*/

/*jslint
    ass: true
*/

/*global
    Date: true, Math: true, String: true, isNaN: true, parseFloat: true,
    parseInt: true
*/

(function (window, document, $, mwConfig, log) {

    'use strict';

    /**
     * Zero pad numbers for toISOString polyfill
     *
     * @source <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString#Description>
     * @param  number - number - number to be padded.
     * @return r      - string - padded number
     */
    function datePad(number) {

        var r = String(number);

        if (r.length === 1) {
            r = '0' + r;
        }

        return r;

    }

    /**
     * toISOString polyfill for non-ES5 browsers
     *
     * @source <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString#Description>
     */
    if (!Date.prototype.toISOString) {

        Date.prototype.toISOString = function () {
            return this.getUTCFullYear() +
                   '-' + datePad(this.getUTCMonth() + 1) +
                   '-' + datePad(this.getUTCDate()) +
                   'T' + datePad(this.getUTCHours()) +
                   ':' + datePad(this.getUTCMinutes()) +
                   ':' + datePad(this.getUTCSeconds()) +
                   '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) +
                   'Z';
        };

    }

    var userStats = {

        /**
         * Main function to load when document is ready
         */
        init: function () {

            var cookie,
                curPage = mwConfig.wgPageName,
                data,
                i,
                loadCheck,
                loggedIn = false,
                newUser = false,
                prevPage = '',
                referrer = document.referrer,
                session,
                time = (new Date()).toISOString(),
                usergroups = mwConfig.wgUserGroups;

            // don't load twice
            if (!!loadCheck) {
                return;
            }
            loadCheck = true;

            // don't gather data on bots
            // only an issue if someone is using a client side script
            // do I really need this? copied from ga extension
            for (i = 0; i < usergroups.length; i += 1) {
                if (usergroups[i].indexOf('bot') > -1) {
                    return;
                }
            }

            // if a page is reloaded, referrer will be a blank string
            // @todo check referrer keeps the actual referring page
            //       not the page that has just been reloaded
            if (referrer === '') {
                return;
            }

            // do I want to check if cookies are enabled?
            // possibly return here if not

            // how to compensate for new tabs being opened and going back to the old tab?

            // check for new visitor
            if (!!$.cookie('metricsNew')) {
                newUser = true;
            }

            // (re)create the new user cookie
            $.cookie('metricsNew', 'true', {
                expires: 365,
                path: '/'
            });

            // check for logged in users
            // returns a string if logged in, null if not
            // another method is to check wgUserGroups for 'user' usergroup
            // but that seems far more drawn out
            if (!!mwConfig.wgUserName) {
                loggedIn = true;
            }

            cookie = $.cookie('metricsData');

            if (!cookie) {

                log('no cookie');
                session = userStats.createSession();
                data = userStats.gatherData(true, session, time, loggedIn, referrer, curPage, newUser);

            } else {

                cookie.split('|');
                log(cookie);

                // check the user hasn't left and come back before the cookie expired
                if (referrer.indexOf(cookie[1]) === -1) {

                    log('navigated away');
                    session = userStats.createSession();
                    data = userStats.gatherData(true, session, time, loggedIn, referrer, curPage, newUser);

                } else {

                    log('continue session');
                    data = userStats.gatherData(false, session, time, loggedIn, prevPage, curPage);

                }

            }

            $.cookie('metricsData', session + '|' + curPage, {
                expires: 1, // alter to the session time here
                path: '/'
            });

            userStats.sendData(data);

        },

        /**
         * Create a alphanumeric string to identify the session
         *
         * Due to coppa restrictions we are unable to indiscriminately gather IP addresses,
         * so have to identify users by their session id.
         *
         * @source <http://stackoverflow.com/a/10727155/1942596>
         * @return result - string - session id
         * @todo   generate this server side?
         */
        createSession: function () {

            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
                i,
                result = '';

            for (i = 0; i < 20; i += 1) {
                result += chars[Math.round(Math.random() * (chars.length - 1))];
            }

            return result;

        },

        /**
         * Gather/convert data into an object
         *
         * @param  freshData - boolean - true if gathering a full set of data
         * @param  session   - string  - session id
         * @param  timestamp - string  - ISO time stamp
         * @param  loggedIn  - boolean - true if the user is logged in
         * @param  previous  - string  - referring url or name of the previous page
         * @param  current   - string  - name of the current page
         * @param  newUser   - boolean - optional, true if the user has not visited the site before
         * @return data      - object  - gathered data
         * @todo   get url of current page as well?
         */
        gatherData: function (freshData, session, timestamp, loggedIn, previous, current, newUser) {

            var browser,
                res,
                data;

            // check if session exists already
            log('freshData:' + freshData);

            if (freshData) {

                browser = mwConfig.browserDetect;
                res = window.screen.availHeight + 'x' + window.screen.availWidth;

                data = {
                    newSession: true,                       // boolean - for easy checking when processing on server
                    session: session,
                    time: timestamp,
                    li: loggedIn,
                    refer: previous,                        // string  - url of the referring site
                    current: current,
                    nu: newUser,
                    res: res,                               // string  - screen resolution
                                                            // @example '1024x768'
                    bname: browser.browser,                 // string  - name of the browser
                                                            // @example 'Chrome'
                    bver: browser.browser + browser.version // string  - name of the browser with major version
                                                            // @example 'Chrome 28'
                };

            } else {

                data = {
                    newSession: false,  // boolean - for easy checking when processing on server
                    session: session,
                    time: timestamp,
                    li: loggedIn,
                    previous: previous, // string  - name of the previous visited page
                    current: current
                };

            }

            return data;

        },

        /**
         * POST the data to the server for processing
         *
         * @param data - object - data to send
         * @todo  fill out $.ajax()
         */
        sendData: function (data) {

            log(data);
/*
            $.ajax({
                url: '/index.php?title=Special:SiteMetrics',
                data: data
            });
*/
        }

    };

    $(userStats.init());

}(this, this.document, this.jQuery, this.mediaWiki.config.values, this.console.log));
