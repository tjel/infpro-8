$(document).ready(function () {

    var oldValues = $.extend({}, searchAvalProperties, getOldValues(searchAvalProperties));

    // Autocomplete

    $("#txtSearch").autocomplete("disable");

    // Search - Options

    function loadSearchOptions() {
        var sSearchOptionsView = null;

        $.ajax({
            async: false,
            url: siteroot + "/Book/GetSearchOptions",
            method: "post",
            contentType: "application/json;charset=utf-8",
            dataType: "html",
            success: function (data) {
                sSearchOptionsView = data;
            },
            error: function (err) {
                $("html").html(err.responseText);
            }
        });

        sSearchOptionsView = sSearchOptionsView.replace(/(\r\n|\n|\r|\s\s+)/gm, "");
        var searchOptionsView = $.parseHTML(sSearchOptionsView);
        $(searchOptionsView).appendTo($("#divSearchOptions"));
    }

    loadSearchOptions();

    /**
     * Formatuje odstępy divów, w których będą wyniki wyszukiwania
    */
    function formatBooks() {
        var $bookRow = $("#divListBooks .book_row");
        var $divListBooks = $("#divListBooks");
        var lastRowIndex = $bookRow.length - 1;

        $("#divListBooks .book_row .book_content").css({
            "margin": "10px",
            "margin-bottom": "0"
        });

        $bookRow.each(function (i, el) {

            $(el).children().first(".book_content").css({
                "margin-right": "0"
            });

            var elSpacing = ($divListBooks.outerWidth(true) - $(el).outerWidth(true)) / 5;
            $(el).css({
                "margin-right": (i * elSpacing) + "px"
            });

            if (i === lastRowIndex) {
                $(el).children().css({
                    "margin-bottom": "10px"
                });
            }
        });
    }

    formatBooks();

    // Search

    /**
     * Wyświetla dodatkową wiadomość na wynikach wyszukiwania
     * @param {} containerId - ID kontenera z zawartością
     * @param {} contentId - ID zawartości
     * @param {string} message - wiadomość do wyświetlenia
     * @param {boolean} fadeout - Czy wiadomość po wyświetleniu ma zostać po sekundzie wyłączona
     */
    function showSearchMessage(containerId, contentId, message, fadeout) {
        $("#" + containerId).stop(true, true).remove();
        $("#" + contentId).stop(true, true).remove();

        var $bookFirstContent = $("#divListBooks .book_row").first().children().first(".book_content");

        var $divNoSearchResults = $("<div id='" + containerId + "'></div>");
        $divNoSearchResults.appendTo($("#divSearchResults"));
        $divNoSearchResults
            .css({
                "width": ($bookFirstContent.outerWidth() * 2 + 10) + "px",
                "height": $bookFirstContent.outerHeight() / 2
            })
            .position({
                my: "left top",
                at: "left top",
                of: $bookFirstContent
            });
        var $divSearchNoResultsContent = $("<div id='" + contentId + "'>" + message + "</div>");
        $divSearchNoResultsContent.appendTo($("#divSearchResults"));
        $divSearchNoResultsContent.position({
            my: "center center",
            at: "center center",
            of: $divNoSearchResults
        });

        $divNoSearchResults
            .css({ "opacity": "0" })
            .stop(true, true)
            .animate({ "opacity": "0.8" }, { queue: true, duration: 1000 });

        if (fadeout) {
            $divNoSearchResults
                .delay(1000)
                .animate({ "opacity": "0" }, { queue: true, duration: 1000, complete: function () { $divNoSearchResults.remove(); } });
        }

        $("#" + contentId)
            .css({ "opacity": "0" })
            .stop(true, true)
            .animate({ "opacity": "1" }, { queue: true, duration: 1000 });

        if (fadeout) {
            $("#" + contentId)
                .delay(1000)
                .animate({ "opacity": "0" }, { queue: true, duration: 1000, complete: function () { $("#divSearchNoMoreResultsContent").remove(); } });
        }

        //return $divNoSearchResults;
    }

    /**
     * Przypisuje ID do divów z wynikami wyszukiwania i zwraca ich tablicę
     * @param {string} currClass - Klasa bazowa, z której będzie utworzone ID
     * @param {number} lowB - (opcjonalnie) Dolna granica numeracji
     * @param {number} highB - (opcjonalnie) Górna granica numeracji
     * @returns {Object[]} - Zwraca tablicę divów, które otrzymały ID
     */
    function assignSearchDiv(currClass, lowB, highB) {
        var arr = [];
        var elNum = 0;

        $("." + currClass).each(function (i, el) {
            if ((i >= lowB || !lowB) && (i <= highB || !highB)) {
                $(el).attr("id", currClass + "_" + elNum++);
                arr.push(el);
            }
            else {
                $(el).addClass("searchdiv_to_delete");
                $(el).attr("id", "");
            }
        });
        return arr;
    }

    /**
     * Obiekt reprezentujący górne i dolne granice numeracji divów
     * @typedef {Object} BoundaryArguments
     * @property {Number} lowBoundary - dolna granica numeracji divów
     * @property {Number} highBoundary - górna granica numeracji divów
    */
    /**
     * Zwraca w formie obiektu JSON wszystkie divy, wszystkich klas, którym, nadano ID
     * @param {BoundaryArguments} args - granice nadawania ID divom
     * @returns {Object} - obiekt JSON będący reprezentacją wszystkich divów, wszystkich klas, którym nadano ID
     */
    function getSearchDivs(args) {
        args = args || {};
        var lowB = args.lowBoundary || null;
        var highB = args.highBoundary || null;

        var searchResultBackgrounds = assignSearchDiv("searchresult_background", lowB, highB);
        var searchResultContentBackgrounds = assignSearchDiv("searchresult_content_background", lowB, highB);
        var searchResultContainers = assignSearchDiv("searchresult_container", lowB, highB);
        var searchResultCovers = assignSearchDiv("searchresult_cover", lowB, highB);
        var searchResultAdditionDates = assignSearchDiv("searchresult_item_additiondate", lowB, highB);

        return {
            searchResultBackgrounds: searchResultBackgrounds,
            searchResultContentBackgrounds: searchResultContentBackgrounds,
            searchResultContainers: searchResultContainers,
            searchResultAdditionDates: searchResultAdditionDates,
            searchResultCovers: searchResultCovers
        };
    }

    function bindSearchHoverEvents(searchResultCover, searchResultContainer, searchResultContentBackground, searchResultAdditionDate, hoverDiff, duration, initContPosTop, initBgPosTop, initBgHeight, initOpacity) {
        $(searchResultCover).off();

        $(searchResultCover).on("mouseenter", function () {
            var curr = searchResultContainer;
            $(curr).find(".searchresult_item_showmore").stop().slideDown(duration);
            $(curr).stop().animate({ 'top': initContPosTop - hoverDiff }, { queue: false, duration: duration });
            $(searchResultContentBackground).stop()
                .animate({ 'top': initBgPosTop - hoverDiff }, { queue: false, duration: duration })
                .animate({ 'height': initBgHeight + hoverDiff }, { queue: false, duration: duration })
                .animate({ 'opacity': "0.8" }, { queue: false, duration: duration });
            $(searchResultAdditionDate).stop().animate({ 'opacity': "0.7" }, { queue: false, duration: duration });
        });
        $(searchResultCover).on("mouseleave", function () {
            var curr = searchResultContainer;
            $(curr).find(".searchresult_item_showmore").stop().slideUp(duration);
            $(curr).stop().animate({ 'top': initContPosTop }, { queue: false, duration: duration });
            $(searchResultContentBackground).stop()
                .animate({ 'top': initBgPosTop }, { queue: false, duration: duration })
                .animate({ 'height': initBgHeight }, { queue: false, duration: duration })
                .animate({ 'opacity': initOpacity }, { queue: false, duration: duration });
            $(searchResultAdditionDate).stop().animate({ 'opacity': "0" }, { queue: false, duration: duration });
        });
    }

    function formatSingleSearchResult($outerContainer, length, searchResultBackground, searchResultContentBackground, searchResultContainer, searchResultCover, searchResultAdditionDate, bookNum) {
        if (bookNum < length) {

            var margin = 5;

            // Background

            $(searchResultBackground).css({
                "width": $outerContainer.outerWidth() + "px",
                "height": $outerContainer.outerHeight() + "px"
            });
            $(searchResultBackground).position({
                my: "left top",
                at: "left top",
                of: $outerContainer,
                collision: "none"
            });

            // Content

            $(searchResultContainer).css({
                "width": ($(searchResultBackground).innerWidth() - 2 * margin) + "px"
            });

            var hoveredHeight = $(searchResultContainer).outerHeight();
            $(searchResultContainer).find(".searchresult_item_showmore").hide();
            var unhoveredHeight = $(searchResultContainer).outerHeight();

            $(searchResultContainer).position({
                my: "left bottom",
                at: "left+5 bottom-5",
                of: $outerContainer,
                collision: "none"
            });

            // Content Background

            $(searchResultContentBackground).css({
                "width": ($(searchResultContainer).innerWidth() + 2 * margin) + "px",
                "height": ($(searchResultContainer).innerHeight() + 2 * margin) + "px"
            });
            $(searchResultContentBackground).position({
                my: "left bottom",
                at: "left bottom",
                of: $outerContainer,
                collision: "none"
            });

            // Content - Addition Date (not part of container)

            $(searchResultAdditionDate).css({
                "width": "150px",
                "border-left": "1px solid blue",
                "opacity": "0"
            });

            $(searchResultAdditionDate).position({
                my: "right top",
                at: "right top",
                of: $(searchResultBackground),
                collision: "none"
            });

            // Cover

            $(searchResultCover).css({
                "width": $outerContainer.outerWidth() + "px",
                "height": $outerContainer.outerHeight() + "px"
            });
            $(searchResultCover).position({
                my: "left top",
                at: "left top",
                of: $outerContainer,
                collision: "none"
            });

            // Events

            var hoverDiff = hoveredHeight - unhoveredHeight;
            var duration = 250;
            var initContPosTop = $(searchResultContainer).position().top;
            var initBgPosTop = $(searchResultContentBackground).position().top;
            var initBgHeight = $(searchResultContentBackground).outerHeight();
            var initOpacity = $(searchResultContentBackground).css("opacity");
            //var initBgSize = $(searchResultBackground).css("background-size");

            bindSearchHoverEvents(searchResultCover, searchResultContainer, searchResultContentBackground, searchResultAdditionDate, hoverDiff, duration, initContPosTop, initBgPosTop, initBgHeight, initOpacity);
        }
    }

    function scrollSearchResults(scrollDir) {
        var currValues = {
            searchterm: $("#txtSearch").val(),
            includetitle: $("#cbIncludeTitle").prop("checked"),
            includeauthor: $("#cbIncludeAuthor").prop("checked"),
            includecategory: $("#cbIncludeCategory").prop("checked"),
            includedescription: $("#cbIncludeDescription").prop("checked"),
            sortby: $("#ddlSortBy").first("option:selected").val(),
            sortorder: $("#ddlSortOrder").first("option:selected").val(),
            howmuchtake: 12,
            howmuchskip: scrollDir.toLowerCase() === "scrolldown" ? 2 : -2
        }

        var validation = validateSearchProperties({
            props: getAvalPropertyNames(keysToLowerCase(searchAvalProperties)),
            currvalues: currValues
        });

        if (validation.validationresults.all.output) {
            $.ajax({
                async: true,
                url: siteroot + "/Book/GetScrollSearchResults",
                method: "post",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify({
                    SearchTerm: validation.validatedvalues.searchterm,
                    IncludeTitle: validation.validatedvalues.includetitle,
                    IncludeAuthor: validation.validatedvalues.includeauthor,
                    IncludeCategory: validation.validatedvalues.includecategory,
                    IncludeDescription: validation.validatedvalues.includedescription,
                    SortBy: validation.validatedvalues.sortby,
                    SortOrder: validation.validatedvalues.sortorder,
                    HowMuchSkip: validation.validatedvalues.howmuchskip,
                    HowMuchTake: validation.validatedvalues.howmuchtake,
                    ScrollDirection: scrollDir
                }),
                dataType: "json",
                success: function (data) {
                    if (data.ResultsCount === 0) {
                        refreshTooltip({
                            isValidatedBy: validation,
                            areAnyResults: false
                        });
                        $("#txtSearch").tooltip("open");

                        showSearchMessage("divNoSearchResults", "divSearchNoMoreResultsContent", "Nie ma więcej wyników", true);
                    }
                    else {
                        refreshTooltip({
                            isValidatedBy: validation,
                            areAnyResults: true
                        });
                        $("#txtSearch").tooltip("close");
                        $("#txtSearch").tooltip("disable");

                        var sSearchScrollResultsView = data.PartialView.replace(/(\r\n|\n|\r|\s\s+)/gm, "");
                        var searchScrollResultsView = $.parseHTML(sSearchScrollResultsView);

                        // ScrollResults
                        // APPEND i ANIMUJ

                        if (scrollDir.toLowerCase() === "scrolldown") {
                            $(searchScrollResultsView).appendTo($("#divSearchResults"));
                        }
                        else {
                            $(searchScrollResultsView).prependTo($("#divSearchResults"));
                        }
                        // ReSharper disable once FunctionsUsedBeforeDeclared
                        formatScrollResults(scrollDir);

                        //alert(data.ResultsCount);
                    }

                    toggleSpinner("hide");
                },
                error: function (err) {
                    toggleSpinner("hide");
                    $("html").html(err.responseText);
                }
            });
        }
        else {
            var isHovered = !!$("#txtSearch").filter(function () {
                return $(this).is(":hover");
            }).length;

            refreshTooltip({
                isValidatedBy: validation,
                areAnyResults: false
            });
            if (isHovered) {
                $("#txtSearch").tooltip("open");
            }
            toggleSpinner("hide");
        }
    }

    function rebindEvents() {
        $("#divBooksScrollBar #divBooksScrollUp, #divBooksScrollBar #divBooksScrollDown").on("mouseenter", function () {
            $(this).stop().animate({ "opacity": "1" }, 500);
        });

        $("#divBooksScrollBar #divBooksScrollUp, #divBooksScrollBar #divBooksScrollDown").on("mouseleave", function () {
            $(this).stop().animate({ "opacity": "0.6" }, 500);
        });

        $("#divBooksScrollBar #divBooksScrollUp").on("click", function () {
            scrollSearchResults("scrollup");
        });

        $("#divBooksScrollBar #divBooksScrollDown").on("click", function () {
            scrollSearchResults("scrolldown");
        });
    }

    function formatScrollResults(scrollDir) {
        var $bookRow = $("#divListBooks .book_row");
        var $bookContents = [];
        var bookNum = null;
        var initBookNum = null;
        $bookRow.each(function (i, el) {
            $bookContents.push($(el).children().first(".book_content"));
            $bookContents.push($(el).children().last(".book_content"));
        });
        var lowB = scrollDir.toLowerCase() === "scrolldown" ? 2 : 0;
        var highB = scrollDir.toLowerCase() === "scrolldown" ? 13 : 11;
        var divs = getSearchDivs({
            lowBoundary: lowB,
            highBoundary: highB
        });
        var length = divs.searchResultContainers.length;

        if (scrollDir.toLowerCase() === "scrolldown") {
            bookNum = 10;
        }
        else {
            bookNum = 0;
        }
        initBookNum = bookNum;

        formatSingleSearchResult($bookRow.last().children().first(".book_content"), length, divs.searchResultBackgrounds[bookNum], divs.searchResultContentBackgrounds[bookNum], divs.searchResultContainers[bookNum], divs.searchResultCovers[bookNum], divs.searchResultAdditionDates[bookNum], bookNum++); // musi być inkrementacja, bo kolejne wywołanie bierze zaaktualizowaną wartość dla wszystkich argumentów, nie tylko dla bookNum
        formatSingleSearchResult($bookRow.last().children().last(".book_content"), length, divs.searchResultBackgrounds[bookNum], divs.searchResultContentBackgrounds[bookNum], divs.searchResultContainers[bookNum], divs.searchResultCovers[bookNum], divs.searchResultAdditionDates[bookNum], bookNum++);

        $("#divBooksScrollBar #divBooksScrollUp, #divBooksScrollBar #divBooksScrollDown").off().stop().animate({ "opacity": "0.6" }, 500);

        bookNum = initBookNum; // resetuj wartość bookNum

        // Ukryj na początku 2 dodane wyniki

        $.each(divs, function (i, el) {
            $(el[bookNum]).css({ "opacity": "0" });
            $(el[bookNum + 1]).css({ "opacity": "0" });
        });

        // Wyłącz animacje

        $.each(divs, function (i, el) {
            for (var j = 0; j < $bookContents.length; j++) {
                if (i !== bookNum && i !== bookNum + 1) {
                    $(el[j]).stop(true, true);
                }
            }
        });
        var initPriceOpacity = $(divs.searchResultAdditionDates[0]).css("opacity");
        $(".searchresult_cover").off();

        // Fade Out 2 niepotrzebne wyniki

        var duration = 500;

        $(".searchdiv_to_delete")
            .animate({
                "opacity": "0"
            }, {
                queue: true,
                duration: duration,
                complete: function () {
                    //$(this).remove(); // Na koniec
                    // dalsza animacja
                }
            });

        // Animuj Wyniki

        $.each(divs, function (i, el) { // el - typ divu, bookNum - numer divu
            for (var j = 0; j < $bookContents.length; j++) {
                if (i !== bookNum && i !== bookNum + 1) {

                    // Background

                    if ($(el[j]).hasClass("searchresult_background")) {
                        $(el[j]).position({
                            my: "left top",
                            at: "left top",
                            of: $bookContents[j],
                            collision: "none",
                            using: function (pos) {
                                $(this).stop(true, true).animate(pos, { duration: duration });
                            }
                        });
                    }

                    // Content

                    else if ($(el[j]).hasClass("searchresult_container")) {
                        $(el[j]).position({
                            my: "left bottom",
                            at: "left+5 bottom-5",
                            of: $bookContents[j],
                            collision: "none",
                            using: function (pos) {
                                $(this).stop(true, true).animate(pos, { duration: duration });
                            }
                        });
                    }

                    // Content Background

                    else if ($(el[j]).hasClass("searchresult_content_background")) {
                        $(el[j]).position({
                            my: "left bottom",
                            at: "left bottom",
                            of: $bookContents[j],
                            collision: "none",
                            using: function (pos) {
                                $(this).stop(true, true).animate(pos, { duration: duration });
                            }
                        });
                    }

                    // Content - Addition Date (not part of container)

                    else if ($(el[j]).hasClass("searchresult_item_additiondate")) {
                        $(el[j]).css({ "opacity": "0" }).position({
                            my: "right top",
                            at: "right top",
                            of: $bookContents[j],
                            collision: "none",
                            using: function (pos) {
                                $(this).stop(true, true).animate(pos, {
                                    duration: duration,
                                    complete: function () {
                                        $(this).css({ "opacity": initPriceOpacity });
                                    }
                                });
                            }
                        });
                    }

                    // Cover

                    else if ($(el[j]).hasClass("searchresult_cover")) {
                        $(el[j]).position({
                            my: "left top",
                            at: "left top",
                            of: $bookContents[j],
                            collision: "none",
                            using: function (pos) {
                                $(this).stop(true, true).animate(pos, duration,
                                (function (j) {
                                    return function () {
                                        $(divs.searchResultContainers[j]).find(".searchresult_item_showmore").show();
                                        var hoveredHeight = $(divs.searchResultContainers[j]).outerHeight();
                                        $(divs.searchResultContainers[j]).find(".searchresult_item_showmore").hide();
                                        var unhoveredHeight = $(divs.searchResultContainers[j]).outerHeight();

                                        var hoverDiff = hoveredHeight - unhoveredHeight;
                                        var dur = 250;
                                        var initContPosTop = $(divs.searchResultContainers[j]).position().top;
                                        var initBgPosTop = $(divs.searchResultContentBackgrounds[j]).position().top;
                                        var initBgHeight = $(divs.searchResultContentBackgrounds[j]).outerHeight();
                                        var initOpacity = 0.7; // $(divs.searchResultContentBackgrounds[j]).css("opacity"); // Nie mogę wziąć z divu, bo dwa pierwsze albo dwa ostatnie będą ukryte
                                        //var initBgSize = $(divs.searchResultBackgrounds[j]).css("background-size");

                                        bindSearchHoverEvents(divs.searchResultCovers[j], divs.searchResultContainers[j], divs.searchResultContentBackgrounds[j], divs.searchResultAdditionDates[j], hoverDiff, dur, initContPosTop, initBgPosTop, initBgHeight, initOpacity);
                                    } // ReSharper disable once ClosureOnModifiedVariable
                                })(j));
                            }
                        });

                    }
                }
            }

        });

        // Fade In nowe Wyniki

        var fadeInDuration = duration;
        var transparentOpacity = "0.7";

        if (bookNum + 1 < length) {
            $(divs.searchResultBackgrounds[bookNum + 1]).stop(true, true).animate({ "opacity": "1" }, { duration: fadeInDuration });
            $(divs.searchResultContentBackgrounds[bookNum + 1]).stop(true, true).animate({ "opacity": transparentOpacity }, { duration: fadeInDuration });
            $(divs.searchResultContainers[bookNum + 1]).stop(true, true).animate({ "opacity": "1" }, { duration: fadeInDuration });
            $(divs.searchResultAdditionDates[bookNum + 1]).stop(true, true).animate({ "opacity": "0" }, { duration: fadeInDuration });
            $(divs.searchResultCovers[bookNum + 1]).stop(true, true).animate({ "opacity": "1" }, { duration: fadeInDuration });
        }

        $(divs.searchResultBackgrounds[bookNum]).stop(true, true).animate({ "opacity": "1" }, { duration: fadeInDuration });
        $(divs.searchResultContentBackgrounds[bookNum]).stop(true, true).animate({ "opacity": transparentOpacity }, { duration: fadeInDuration });
        $(divs.searchResultContainers[bookNum]).stop(true, true).animate({ "opacity": "1" }, { duration: fadeInDuration });
        $(divs.searchResultAdditionDates[bookNum]).stop(true, true).animate({ "opacity": "0" }, { duration: fadeInDuration });
        $(divs.searchResultCovers[bookNum]).stop(true, true).animate({ "opacity": "1" }, {
            duration: fadeInDuration, queue: true, complete: function () {
                $(".searchdiv_to_delete").remove();

                rebindEvents();
            }
        });

    }

    function formatSearchResults() {
        var $bookRow = $("#divListBooks .book_row");
        var bookNum = 0;
        var divs = getSearchDivs();
        var length = divs.searchResultContainers.length;

        $bookRow.each(function (i, el) {
            formatSingleSearchResult($(el).children().first(".book_content"), length, divs.searchResultBackgrounds[bookNum], divs.searchResultContentBackgrounds[bookNum], divs.searchResultContainers[bookNum], divs.searchResultCovers[bookNum], divs.searchResultAdditionDates[bookNum], bookNum);
            bookNum++;
            formatSingleSearchResult($(el).children().last(".book_content"), length, divs.searchResultBackgrounds[bookNum], divs.searchResultContentBackgrounds[bookNum], divs.searchResultContainers[bookNum], divs.searchResultCovers[bookNum], divs.searchResultAdditionDates[bookNum], bookNum);
            bookNum++;

            if (i === 0) {
                $("#divBooksScrollBar").position({
                    my: "right-10 top",
                    at: "left top",
                    of: $(el).children().first(".book_content"),
                    collision: "none"
                });

                $("#divBooksScrollBar #divBooksScrollUp, #divBooksScrollBar #divBooksScrollDown").off();

                rebindEvents();
            }
        });
    }

    function searchMenu() {
        var currValues = {
            searchterm: $("#txtSearch").val(),
            includetitle: $("#cbIncludeTitle").prop("checked"),
            includeauthor: $("#cbIncludeAuthor").prop("checked"),
            includecategory: $("#cbIncludeCategory").prop("checked"),
            includedescription: $("#cbIncludeDescription").prop("checked"),
            sortby: $("#ddlSortBy").first("option:selected").val(),
            sortorder: $("#ddlSortOrder").first("option:selected").val(),
            howmuchtake: 12,
            howmuchskip: 0
        }

        // DEBUGOWANIE

        var key;
        var $divDebugSearch = $("<div id='divDebug_Search'></div>");
        var $divDebug = $("#divDebug");
        if (debugMode) {
            $("#divDebug_Search").remove();
            
            $divDebugSearch.html("DEBUG - SEARCH <br /><br />");
            $divDebugSearch.append("currValues: <br /><br />");

            for (key in currValues) {
                if (currValues.hasOwnProperty(key)) {
                    $divDebugSearch.append(key + " -> " + currValues[key] + "<br />");
                }
            }
        }

        // ===========

        var validation = validateSearchProperties({
            props: getAvalPropertyNames(keysToLowerCase(searchAvalProperties)),
            currvalues: currValues,
            getchangedagainst: oldValues
        });

        // DEBUGOWANIE

        if (debugMode) {
            $divDebugSearch.append("<br />validatedValues: <br /><br />");

            for (key in validation.validatedvalues) {
                if (validation.validatedvalues.hasOwnProperty(key)) {
                    $divDebugSearch.append(key + " -> " + validation.validatedvalues[key] + "<br />");
                }
            }

            $divDebugSearch.appendTo($divDebug);
        }

        // ===========

        oldValues = currValues;

        if (validation.validationresults.all.output) {
            $.ajax({
                async: true,
                url: siteroot + "/Book/GetSearchResults",
                method: "post",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify({
                    SearchTerm: validation.validatedvalues.searchterm,
                    IncludeTitle: validation.validatedvalues.includetitle,
                    IncludeAuthor: validation.validatedvalues.includeauthor,
                    IncludeCategory: validation.validatedvalues.includecategory,
                    IncludeDescription: validation.validatedvalues.includedescription,
                    SortBy: validation.validatedvalues.sortby,
                    SortOrder: validation.validatedvalues.sortorder,
                    HowMuchSkip: validation.validatedvalues.howmuchskip,
                    HowMuchTake: validation.validatedvalues.howmuchtake
                }),
                dataType: "json",
                success: function (data) { 
                    if (data.ResultsCount === 0) {
                        refreshTooltip({
                            isValidatedBy: validation,
                            areAnyResults: false
                        });
                        $("#txtSearch").tooltip("open");

                        //var $bookFirstContent = $("#divListBooks .book_row").first().children().first(".book_content");

                        $("#divSearchResults").empty();
                        showSearchMessage("divNoSearchResults", "divSearchNoResultsContent", "Brak Rezultatów Wyszukiwania", false);
                    }
                    else {
                        refreshTooltip({
                            isValidatedBy: validation,
                            areAnyResults: true
                        });
                        $("#txtSearch").tooltip("close");
                        $("#txtSearch").tooltip("disable");

                        var sSearchResultsView = data.PartialView.replace(/(\r\n|\n|\r|\s\s+)/gm, "");
                        var searchResultsView = $.parseHTML(sSearchResultsView);
                        $("#divSearchResults").empty();
                        $(searchResultsView).appendTo($("#divSearchResults"));
                        formatSearchResults();
                    }

                    toggleSpinner("hide");
                },
                error: function (err) {
                    toggleSpinner("hide");
                    $("html").html(err.responseText);
                }
            });
        }
        else {
            var isHovered = !!$("#txtSearch").filter(function () {
                return $(this).is(":hover");
            }).length;

            refreshTooltip({
                isValidatedBy: validation,
                areAnyResults: false
            });
            if (isHovered) {
                $("#txtSearch").tooltip("open");
            }
            toggleSpinner("hide");
        }
    }

    searchMenu();

    $("#btnSearchSubmit").click(function () { // submit wywoływany po evencie submit preventDefault z Base/Index
        searchMenu();
    });

    $("#txtSearch").on("keyup change", function () {
        // po odświeżeniu tooltipa (z Base)

        searchMenu();
    });

    $("#cbIncludeTitle").click(function () {
        searchMenu();
    });

    $("#cbIncludeAuthor").click(function () {
        searchMenu();
    });

    $("#cbIncludeCategory").click(function () {
        searchMenu();
    });

    $("#cbIncludeDescription").click(function () {
        searchMenu();
    });

    $("#ddlSortBy").selectmenu({
        width: 200,
        icons: { button: "custom-icon-down-arrow" },
        select: function () { // event, ui
            searchMenu();
        }
    });

    $("#ddlSortOrder").selectmenu({
        width: 200,
        icons: { button: "custom-icon-down-arrow" }, //ui-icon-arrow-1-s
        select: function () { // event, ui
            searchMenu();
        }
    });

    // Formatowanie

    resizeBackground();

});