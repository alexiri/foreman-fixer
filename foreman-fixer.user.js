

// ==UserScript==
// @name       Foreman fixer
// @namespace  http://cern.ch
// @version    0.2
// @description  Fixes foreman's "X minutes ago" shit, plus adds "copy" buttons to Console Username and Password
// @match      https://judy.cern.ch/*
// @copyright  2013+, Alex Iribarren
// @downloadURL https://raw.githubusercontent.com/alexiri/foreman-fixer/master/foreman-fixer.user.js
// @require http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

function format(time) {
    var time = new Date(time);
    return ("0"+time.getHours()).slice(-2) + ":"
         + ("0"+time.getMinutes()).slice(-2);
}

var now = new Date();
var links = $('a');
links.each(function() {
    href = $(this).attr('href');
    if(href && href.indexOf('/reports/') !== -1) {
        var text = $(this).text();
        //console.log("Found a report! " + text);
        var newtext;
        if(text.indexOf('less than a minute') !== -1) {
            newtext = format(now-30*1000);
        } else if(match = /(\d+) minute/.exec(text)) {
            newtext = format(now-match[1]*60000);
        } else if(match = /(\d+) hour/.exec(text)) {
            newtext = "~"+format(now-match[1]*3600000);
        }
        if (newtext) {
            $(this).text(newtext + " ("+text+")");
        }
    }
});

var trs = $('tr');
trs.each(function() {
    var tds = $('td', this);
    if(tds.length == 2) {
        var text = $(tds[0]).text();
        if(text == 'Console Username' || text == 'Console Password') {
            var data = $(tds[1]).text();

            $(tds[1]).html($("<span>").attr('id', 'copyme').text(data));
            $(tds[1]).append($("<span>").html("&nbsp;"));
            $(tds[1]).append(
                $("<a>")
                    .attr('id', 'copy-button')
                    .text("copy")
                    .on('click', function (e) {
                        GM_setClipboard($('span#copyme', tds[1]).text());
                        e.preventDefault();
					})
            );

        }
    }
});
