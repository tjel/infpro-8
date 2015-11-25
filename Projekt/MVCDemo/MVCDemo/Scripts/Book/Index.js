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

    // DALSZA CZĘŚĆ W TRAKCIE TWORZENIA...

});