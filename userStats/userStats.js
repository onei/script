/**
 * UserStats.js
 *
 * Collects various data on users for processing somewhere else
 *
 * @author cqm <mdowdell244@gmail.com>
 * @todo   Find somewhere to keep data. Separate server somewhere? Possibly here and make a js redirect?
 * Time spent on site - http://www.kaushik.net/avinash/standard-metrics-revisited-time-on-page-and-time-on-site/
 */

(function (document, $, mwConfig, navigator) {

    'use strict';

    // .toISOString is an ES5 standard.
    // This stops errors on older browsers, e.g. IE8 or older.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString#Description
    function pad(number) {

        var r = String(number);

        if (r.length === 1) {
            r = '0' + r;
        }

        return r;

    }

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

    // http://www.javascripter.net/faq/browsern.htm
    function browserDetect() {

        var nVer = navigator.appVersion,
            nAgt = navigator.userAgent,
            browserName = navigator.appName,
            fullVersion = parseFloat(navigator.appVersion),
            majorVersion = parseInt(navigator.appVersion, 10),
            nameOffset,
            verOffset,
            ix,
            browserDetails;

        // In Opera, the true version is after 'Opera' or after 'Version'
        if ((verOffset = nAgt.indexOf('Opera')) > -1) {
            browserName = 'Opera';
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) > -1) {
                fullVersion = nAgt.substring( verOffset + 8 );
            }

        // In MSIE, the true version is after 'MSIE' in userAgent
        } else if ((verOffset = nAgt.indexOf('MSIE')) > -1) {
            browserName = 'Microsoft Internet Explorer';
            fullVersion = nAgt.substring(verOffset + 5);

        // In Chrome, the true version is after 'Chrome'
        } else if ((verOffset = nAgt.indexOf('Chrome')) > -1) {
            browserName = 'Chrome';
            fullVersion = nAgt.substring(verOffset + 7);

        // In Safari, the true version is after 'Safari' or after 'Version'
        } else if ((verOffset = nAgt.indexOf('Safari')) > -1) {
            browserName = 'Safari';
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) > -1) {
                fullVersion = nAgt.substring(verOffset + 8);
            }

        // In Firefox, the true version is after 'Firefox'
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
        if ((ix = fullVersion.indexOf(";")) > -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        if ((ix = fullVersion.indexOf(" ")) > -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt(fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        return [
            browserName,
            fullVersion,
            majorVersion
        ];

    }

    $(function () {

        var usergroups = mwConfig.wgUserGroups,
            timestamp = (new Date()).toISOString(),
            referrer = '',
            prevPage = '',
            curPage = mwConfig.wgPageName,
            newUser,
            cookie,
            browserArr = browserDetect(),
            i;

        for (i = 0; i < usergroups.length; i += 1) {
            // don't collect info on bots
            if (usergroups[i].indexOf('bot') > -1) {
                return;
            }
        }

        // check for new user
        // refresh if cookie exists, create a new one if not
        if (getCookie('someCookie') === null) 
            newUser = true;
        } else {
            newUser = false;
        }

        setCookie('someCookie');

        // look for session cookie
        cookie = getCookie();

        // if new session
        if (cookie === null) {
            // generate session id here
            session = ''; // some sort of authenticate for this?
            referrer = document.referrer;
            data = collectFreshData(session, timestamp);
        } else {
            // [session, prevPage, curPage, timestamp]
            sessionInfo = cookie.split('-');
            session = sessionInfo[0];
            data = collectMoreData(session, curPage, timestamp);
        }

        // then do something with data
        // http://stackoverflow.com/questions/298745/how-do-i-send-a-cross-domain-post-request-via-javascript
        sendData = {
            newUser: newUser,
            session: session,
            time: timestamp,
            prevPage: prevPage,
            referrer: referrer,
            curPage: curPage
            screenHeight: window.screen.availHeight,
            screenWidth: window.screen.availWidth
            browserName: browserArr[0],
            majorBrowserVersion: browserArr[0] + browserArr[2],
            fullBrowserVersion: browserArr[0] + browserArr[1]
        };

    });


}(this.document, this.jQuery, this.mediaWiki.config.values, this.navigator));