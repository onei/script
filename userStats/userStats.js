/** <nowiki>
 * @name        userStats.js
 * @description Collects various data on users for processing somewhere else
 * @author      cqm <mdowdell244@gmail.com>
 * @comment     Due to coppa restrictions we are unable to collect any IP data in case
 *              incase we inadvertently gain the IP address of someone under 13.
 *
 * @license     This program is free software: you can redistribute it and/or modify
 *              it under the terms of the GNU General Public License as published by
 *              the Free Software Foundation, either version 3 of the License, or
 *              (at your option) any later version.
 *
 *              This program is distributed in the hope that it will be useful,
 *              but WITHOUT ANY WARRANTY; without even the implied warranty of
 *              MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *              GNU General Public License for more details.
 *
 *              You should have received a copy of the GNU General Public License
 *              along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

(function (window, document, $, mwConfig, navigator) {

    'use strict';

    /**
     * @description Retrieve a cookie if it exists, return null if it doesn't
     * @param       name - Name of cookie to retrieve
     */
    function getCookie(name) {
        var cookies = document.cookie.split(';'),
            i,
            cookie;

        for (i = 0; i < cookies.length; i += 1) {
            cookie = cookies[i].split('=');
            if (cookie[0].replace(/\s/g, '') === name) {
                return cookie[1];
            }
        }

        return null;
    }

    /**
     * @description Create a cookie
     * @param       name - Name of cookie to set
     * @param       value - Content of the cookie
     * @param       expires - How long the cookie lasts
     * @param       measurement - Time measurement of expiry, days or hours. Default to hours
     */
    function setCookie(name, value, expires, measurement) {

        if (measurement === 'days') {
            expires = expires * 24 * 60 * 60 * 1000;
        } else {
            expires = expires * 60 * 60 * 1000;
        }

        document.cookie =
            name + '=' + value +
            '; expires=' + expires +
            '; path =/';
    }

    /**
     * @description Zero pad numbers for toISOString polyfill
     * @param       number - Number to be padded
     */
    function pad(number) {

        var r = String(number);

        if (r.length === 1) {
            r = '0' + r;
        }

        return r;

    }

    /**
     * @description toISOString polyfill for older non-ES5, browsers
     * @source      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString#Description
     */
    if (!Date.prototype.toISOString) {

        Date.prototype.toISOString = function () {
            return this.getUTCFullYear() +
                   '-' + pad(this.getUTCMonth() + 1) +
                   '-' + pad(this.getUTCDate()) +
                   'T' + pad(this.getUTCHours()) +
                   ':' + pad(this.getUTCMinutes()) +
                   ':' + pad(this.getUTCSeconds()) +
                   '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) +
                   'Z';
        };

    }

    /**
     * @description Retrieves browser and version
     * @source      http://www.javascripter.net/faq/browsern.htm
     * @comment     slightly modified from source for our needs
     */
    function browserDetect() {

        var nAgt = navigator.userAgent,
            browserName = navigator.appName,
            fullVersion = parseFloat(navigator.appVersion),
            majorVersion = parseInt(navigator.appVersion, 10),
            nameOffset,
            verOffset,
            ix;

        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset = nAgt.indexOf('Opera')) > -1) {
            browserName = 'Opera';
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) > -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }

        // In MSIE, the true version is after "MSIE" in userAgent
        } else if ((verOffset = nAgt.indexOf('MSIE')) > -1) {
            browserName = 'Microsoft Internet Explorer';
            fullVersion = nAgt.substring(verOffset + 5);

        // In Chrome, the true version is after "Chrome" 
        } else if ((verOffset = nAgt.indexOf('Chrome')) > -1) {
            browserName = 'Chrome';
            fullVersion = nAgt.substring(verOffset + 7);

        // In Safari, the true version is after "Safari" or after "Version" 
        } else if ((verOffset = nAgt.indexOf('Safari')) > -1) {
            browserName = 'Safari';
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) > -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }

        // In Firefox, the true version is after "Firefox" 
        } else if ((verOffset = nAgt.indexOf('Firefox')) > -1) {
            browserName = 'Firefox';
            fullVersion = nAgt.substring(verOffset + 8);

        // In most other browsers, "name/version" is at the end of userAgent 
        } else if (
            (nameOffset = nAgt.lastIndexOf(' ') + 1) <
                (verOffset = nAgt.lastIndexOf('/'))
        ) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);
            if (browserName.toLowerCase() === browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }

        // trim the fullVersion string at semicolon/space if present
        if ((ix = fullVersion.indexOf(';')) > -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        if ((ix = fullVersion.indexOf(' ')) > -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt(fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        majorVersion = browserName + ' ' + majorVersion;
        fullVersion = browserName + ' ' + fullVersion;


        return [browserName, majorVersion, fullVersion];

    }

    /**
     * @description Create a session id
     * @source      http://stackoverflow.com/a/10727155/1942596
     * @param       timestamp The time the session is created for
     */
    function createSession() {

        var result = '',
            chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            length = 20,
            i;

        for (i = 0; i < length; i += 1) {
            result += chars[Math.round(Math.random() * (chars.length - 1))];
        }

        return result;

    }

    /**
     * @description collect a complete set of data
     * @param       newUser Boolean if the reader has visited the site before
     * @param       session Session id
     * @param       timestamp ISO timestamp
     * @param       referrer Site that linked to the page
     * @param       user Boolean for whether the reader is logged in or not
     * @param       page What page is currently being viewed
     */
    function collectNewData(newUser, session, timestamp, referrer, user, page) {

        var browser = browserDetect(),
            data = {
                newUser: newUser,
                session: session,
                time: timestamp,
                referrer: referrer,
                user: user,
                prevPage: '',
                curPage: page,
                screenHeight: window.screen.availHeight,
                screenWidth: window.screen.availWidth,
                browserName: browser[0],
                majorBrowserVersion: browser[1],
                fullBrowserVersion: browser[2]
            };

        return data;

    }

    /**
     * @description Collect more data after a session has started
     * @param       session The session id
     * @param       timestamp The time of accessing the new page
     * @param       prevPage The previous page accessed
     * @param       curPage The current page the user is on
     * @param       user A boolean for if the user is logged in or not
     */
    function collectMoreData(session, timestamp, prevPage, curPage, user) {
        var data = {
            session: session,
            time: timestamp,
            prevPage: prevPage,
            curPage: curPage,
            // check for user again incase they've logged in since we started the session
            user: user
        };

        return data;
    }

    $(function () {

        var usergroups = mwConfig.wgUserGroups,
            i,
            newUser,
            cookie,
            time = (new Date()).toISOString(),
            refer = document.referrer,
            page = encodeURIComponent(mwConfig.wgPageName),
            user,
            session,
            data;

        for (i = 0; i < usergroups.length; i += 1) {
            // don't collect data on bots
            if (usergroups.indexOf('bot') > -1) {
                return;
            }
        }

        // stop if the page is refreshed or purged as nothing will have changed
        // on wikimedia there's seems to be a distinct purge page
        // will need to account for this if this ever becomes an extension
        if (refer === '') {
            return;
        }

        // possibly check if cookies are enabled? could skew results if lots of people have them disabled

        // check for new user
        if (getCookie('rswMetricsNew') === null) {
            newUser = true;
        } else {
            newUser = false;
        }
        // (re)create cookie
        // is there a limit to how long a cookie can be set for?
        setCookie('rswMetricsNew', 'true', 180, 'days');

        // check for logged in users
        if (mwConfig.wgUserName === null) {
            user = false;
        } else {
            user = true;
        }

        // 'session-timestamp-curPage-prevPage
        cookie = getCookie('rswMetricsData');

        if (cookie === null) {
            session = createSession();
            // ignore previous page for now
            setCookie('rswMetricsData', session  + '#' + page + '#', 0.5, 'hours');
            data = collectNewData(newUser, session, time, refer, user, page);
            console.log('no cookie');
        } else {
            cookie = cookie.split('#');
            console.log(cookie[1], refer);

            // make sure they haven't navigated away since the cookie was created
            if (encodeURIComponent(refer).indexOf(cookie[1]) === -1) {
                console.log('navigated away');
                session = createSession();
                setCookie('rswMetricsData', session  + '#' + page + '#' + cookie[2], 0.5, 'hours');
                data = collectNewData(newUser, session, time, refer, user, page);
            } else {
                console.log('continue session');
                session = cookie[0];
                setCookie('rswMetricsData', session  + '#' + page + '#' + cookie[2], 0.5, 'hours');
                data = collectMoreData(session, time, refer, page, user)
            }

        }

        window.console.log(data);

/*
       // sample data output
       data = {
           newUser: true,                         // boolean based on what cookie returns
           referrer: 'http://google.com',         // always gathered to check if the person leaves and returns within the half hour timeframe of the cookie
           session: 'jhadjhbvkl',                 // some random string to identify the session, expires after half hour or so. If a new session create a session id, if existing session gather from cookie. Cookie expires after half hour and is refreshed with each new page
           screenWidth: '1000',                   // screen width in pixels
           screenHeight: '800',                   // screen height in pixels
           timestamp: '2013-08-08T09:57:26.492Z', // ISO string of the date (same format as mw returns from api calls
           prevPage: 'Sandbox',                   // only return this if referrer is null, gathered from cookie. returns null if from another site
           curPage: 'Main_page',                  // current page
           browserName: 'Chrome',                 // browser name
           browserMainVer: 'Chrome 28',           // main browser version
           browserFullVer: 'Chrome 28.0.1500.72', // full browser version
           loggedIn: true                         // boolean if a user is logged in or anonymous
       };

       // from the returned data we can calculate the time spent on the page and the trail of pages
       // time returned will be 0 if only one page is visited
       // can also detect bounce rate (visit one page and then leave)

*/
        // then do something with data
        // http://stackoverflow.com/questions/298745/how-do-i-send-a-cross-domain-post-request-via-javascript

        // time spent on site - http://www.kaushik.net/avinash/standard-metrics-revisited-time-on-page-and-time-on-site/

    });

}(this, this.document, this.jQuery, this.mediaWiki.config.values, this.navigator));

/*
== How to interact with the server ==
POST the data to a server, which is then transferred to a database (MySQL) via server side scripting (PHP?)
Immo tells me to store the data in proper tables as it's easier to work from
http://dev.mysql.com/tech-resources/articles/mysql_intro.html

Then when using the site, query the database to build the graphs, possibly going to need some js library for this
SQL can do this for you according to Immo. It is handy having techs in IRC.

Meiko chat:
http://www.xlhost.com/hosting/dedicated-servers/?gclid=CPSs8PKz8rgCFU6Z4AodvS8Abw
brickimedia use ramnode, may be better alternatives
OS Linux, Ubuntu w/ Debian
https://clientarea.ramnode.com/cart.php?gid=15 2048MB CVZ-E5

*/

/* </nowiki> */
