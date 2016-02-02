// ==UserScript==
// @name       Foreman fixer
// @namespace  http://cern.ch
// @version    1.1
// @description  Fixes foreman's "X minutes ago" shit, plus adds "copy" buttons to Console Username and Password
// @match      https://judy.cern.ch/*
// @match      https://judy-ext.cern.ch/*
// @match      https://foreman-test.cern.ch/*
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

function addCopy(item) {
    $(item).html($("<span>").attr('id', 'copyme').text($(item).text()));
    $(item).append($("<span>").html("&nbsp;"));
    $(item).append(
        $("<a>")
            .attr('id', 'copy-button')
            .text("copy")
            .on('click', function (e) {
                GM_setClipboard($('span#copyme', item).text());
                e.preventDefault();
            })
    );
}

var nameF = $("td:contains(Console Username)");
if (nameF) {

    username = nameF.siblings().text();

    var pwdF = $("td:contains(Console Password)");
    var password = pwdF.siblings().text();

    addCopy(nameF.siblings()[0]);
    addCopy(pwdF.siblings()[0]);

    // Now make the Console link log in directly
    var consoleF = $("a:contains(Console)");

    if (consoleF.length > 0) {
        var form = $('<form>')
            .attr('target', '_blank')
            .attr('method', 'post')
            .css('display', 'none')
            .attr('action', consoleF[0].href + 'cgi/login.cgi')
            .append($('<input>').attr('name', 'name').attr('value', username).attr('type', 'hidden'))
            .append($('<input>').attr('name', 'pwd').attr('value', password).attr('type', 'hidden'));

        consoleF.parent().append(form);
        consoleF.on('click', function (e) { form.submit(); e.preventDefault(); });
    }
}

// Don't abbreviate stuff (particularly environment names)
$('span:not(.label)[data-original-title]').each(function() {
    $(this).text($(this).attr('data-original-title'));
});

// Increase the width of the table
$('#content > table').parent().css('width', '90%');

// Compress lines a bit
GM_addStyle('.btn-sm { line-height: 1 !important; }');

// Hide incoming hostgroup
var HIDE_INCOMING = 'hostgroup != incoming';
$('.input-group').append(
    $('<input>')
        .attr('type', 'checkbox')
        .attr('id', 'hide-incoming')
        .attr('name', 'hide-incoming')
    );
$('#hide-incoming')
    .after($('<label>').text('Hide incoming hostgroup').attr('for', 'hide-incoming'))
    .change(function() {
        var search = $('#search').val();
        if($(this).is(":checked") && search.indexOf(HIDE_INCOMING) == -1) {
            $('#search').val(HIDE_INCOMING);
            if (search != '') {
                search += ' and ';
            }
            search += HIDE_INCOMING;
            $('#search').val(search)
        } else if (search.indexOf(HIDE_INCOMING) != -1) {
            if (search.indexOf(' and ' + HIDE_INCOMING) != -1) {
                search = search.replace(' and ' + HIDE_INCOMING, '');
            } else if (search.indexOf(HIDE_INCOMING + ' and ') != -1) {
                search = search.replace(HIDE_INCOMING + ' and ', '');
            } else {
                search = search.replace(HIDE_INCOMING, '');
            }
            $('#search').val(search);
        }
        $('#search-form').submit();
    });

function updateHideIncoming() {
    if($('#search').val().indexOf(HIDE_INCOMING) != -1) {
        $('#hide-incoming').attr("checked", true);
    } else {
        $('#hide-incoming').attr("checked", false);
    }
}

$('#search').change(updateHideIncoming);

$(document).ready(function() {
    updateHideIncoming();
});
