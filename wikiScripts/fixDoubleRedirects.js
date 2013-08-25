/**
 * Adds a fix links to [[Special:DoubleRedirects]]
 * @author Cqm
 */
(function ($) {

    var fixDoubleRedirects = {
        /**
         *
         */
        init: function () {
            // init
        },
        /**
         *
         */
        callAPI: function (data, method, callback, addurl) {

            data.format = 'json';

            $.ajax({
                data: data,
                dataType: 'json',
                url: '/api.php' + (addurl || ''),
                type: method,
                cache: false,
                success: function (response) {
                    if (response.error) {
                        console.log('API error: ' + response.error.info);
                    } else {
                        callback(response);
                    }
                },
                error: function (xhr, error) {
                    console.log('AJAX response: ' + xhr.responseText);
                    console.log('AJAX error: ' + error);
                }
            });
 
        },
        /**
         *
         */
        createFixLink: function () {

            $('.special li').each(function () {

                var links = $(this).children('a');

                if (!links.length) {
                    console.log('redirect fixed');
                    return;
                }

                $(links[1]).after(
                    ' ',
                    $('<a/>').attr({
                        'class': 'mw-redirect-fix',
                        'click': function (e) {
                            console.log(e.target);
                        },
                        'title': 'Fix redirect'
                    }).text('(fix)')
                );
            });
                
                oldPage = links[0].attr('href').replace('?redirect=no', '')
                                               .replace('/wiki/', '');

                newPage = links[3].attr('href').replace('/wiki/', '')
                                               .replace(/_/g. '_');                                   

            });

        },
        /**
         *
         */
        reportProgress: function (elem, status) {
            $(elem).append(
                // error message
                // or done message
            );
        }
    };
    
    $(fixDoubleRedirects.link);
    
}(this.jQuery));