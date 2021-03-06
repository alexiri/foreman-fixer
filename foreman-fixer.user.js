// ==UserScript==
// @name         Foreman fixer
// @namespace    http://cern.ch
// @version      1.12
// @description  Fixes foreman's "X minutes ago" shit, plus adds "copy" buttons to Console Username and Password
// @match        https://judy.cern.ch/*
// @match        https://judy-ext.cern.ch/*
// @match        https://foreman.cern.ch/*
// @match        https://foreman-test.cern.ch/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @copyright    2013+, Alex Iribarren
// @downloadURL  https://raw.githubusercontent.com/alexiri/foreman-fixer/master/foreman-fixer.user.js
// @require      http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==


(function() {
    'use strict';

    GM_addStyle('@import url(//fonts.googleapis.com/css?family=Coming+Soon);');
    GM_addStyle('.navbar-brand a { font-family: "Coming Soon"; padding-top: 5px; }');

    // Don't abbreviate stuff (particularly environment names)
    GM_addStyle('.ellipsis { overflow: initial; overflow-wrap: initial; white-space: initial; text-overflow: initial; }');

    // Compress lines a bit
    GM_addStyle('.btn-sm { line-height: 1 !important; }');

    GM_addStyle('.table-fixed { table-layout: auto; }');
    GM_addStyle('#content > table.table-fixed th:not(:first-child) { width: initial !important; }');
    GM_addStyle('#content > table.table-fixed th:nth-child(2) { width: 20% !important; }');
    GM_addStyle('#content > table.table-fixed th:nth-child(6) { width: 20% !important; }');
    GM_addStyle('#content > table.table-fixed th:last-child { width: 80px !important; }');

    GM_addStyle('#main { padding: 0px; }');
    GM_addStyle('#content { width: 100%; max-width: none; }');


    function format(time) {
        var t = new Date(time);
        return ("0"+t.getHours()).slice(-2) + ":" + ("0"+t.getMinutes()).slice(-2);
    }

    function addCopy(item, text, value) {
        if (!text) { text = "copy"; }
        if (!value) { value = $(item).text(); }

        newitem = $("<span>").attr('id', 'copyme').css("visibility", "hidden").css("font-size", "0px").text(value);
        $(item).append($("<span>").html("&nbsp;"));
        $(item).append(newitem);
        $(newitem).after(
            $("<a>")
            .attr('id', 'copy-button')
            .css("float", "right")
            .text(text)
            .on('click', function (e) {
                GM_setClipboard($('span#copyme', item).text());
                e.preventDefault();
            })
        );
    }

    // Hide incoming hostgroup
    var HIDE_INCOMING = 'hostgroup != incoming';

    function updateHideIncoming() {
        if( $('#search').length === 0) return;
        if($('#search').val().indexOf(HIDE_INCOMING) != -1) {
            $('#hide-incoming').attr("checked", true);
        } else {
            $('#hide-incoming').attr("checked", false);
        }
    }

    function changeStuff() {
        // Add "hide incoming" checkbox
        $('input[id="search"]').parent().append(
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
                if (search !== '') {
                    search += ' and ';
                }
                search += HIDE_INCOMING;
                $('#search').val(search);
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

        updateHideIncoming();

        // Change links to reports to add absolute times
        var now = new Date();
        var links = $('a');
        links.each(function() {
            href = $(this).attr('href');
            if(href && href.indexOf('/config_reports/') !== -1) {
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

        // Improve host details page
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

                // Add the command-line
                var host = consoleF[0].host;
                var command = "ipmitool -I lanplus -U '" + username + "' -P '" + password + "' -H '" + host + "' sol activate";
                addCopy(consoleF.parent()[0], "sol", command);
            }
        }
    }

    $(document).ready(function() { changeStuff(); });
    $(document).on('page:load', function() { changeStuff(); });
    $('#search').change(updateHideIncoming);
})();
