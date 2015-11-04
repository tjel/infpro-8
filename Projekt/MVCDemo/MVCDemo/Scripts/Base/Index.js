// DEBUGOWANIE

var debugMode = true;

// Zmienne

var $divMain = $("#Main");
var siteroot = "/MVCDemo";

// - walidacja - wiadomości

var msgSearchTermInitial = "Przeszukaj menu, słowa muszą zawierać co najmniej 3 znaki, aby były uwzględnione w wyszukiwaniu. ";
var msgSearchTermValid = "Wyszukiwana fraza jest poprawna. ";
var msgSearchTermInvalidCharacters = "Szukana fraza zawiera niepoprawne znaki. ";
var msgSearchTermFirstStringNotLongEnough = "Wyszukiwane frazy muszą mieć co najmniej 3 znaki. ";

var msgIncludeTitleValid = "Wartość dla pola wyboru \"Uwzględnij Tytuł\" jest poprawna. ";
var msgIncludeTitleInvalid = "Wartość dla pola wyboru \"Uwzględnij Tytuł\" jest nieprawidłowa. ";

var msgIncludeAuthorValid = "Wartość dla pola wyboru \"Uwzględnij Autora\" jest poprawna. ";
var msgIncludeAuthorInvalid = "Wartość dla pola wyboru \"Uwzględnij Autora\" jest nieprawidłowa. ";

var msgIncludeCategoryValid = "Wartość dla pola wyboru \"Uwzględnij Kategorię\" jest poprawna. ";
var msgIncludeCategoryInvalid = "Wartość dla pola wyboru \"Uwzględnij Kategorię\" jest nieprawidłowa. ";

var msgIncludeDescriptionValid = "Wartość dla pola wyboru \"Uwzględnij Opis\" jest poprawna. ";
var msgIncludeDescriptionInvalid = "Wartość dla pola wyboru \"Uwzględnij Opis\" jest nieprawidłowa. ";

var msgIncludesValid = "Zaznaczono przynajmniej jedną kategorię wyszukiwania. ";
var msgIncludesInvalid = "Należy zaznaczyć przynajmniej jedną kategorię wyszukiwania. ";

var msgSortByValid = "Wartość dla listy rozwijanej \"Kategoria Sortowania\" jest poprawna. ";
var msgSortByInvalid = "Wartość dla listy rozwijanej \"Kategoria Sortowania\" jest nieprawidłowa. ";

var msgSortOrderValid = "Wartość dla listy rozwijanej \"Kierunek Sortowania\" jest poprawna. ";
var msgSortOrderInvalid = "Wartość dla listy rozwijanej \"Kierunek Sortowania\" jest nieprawidłowa. ";

var msgHowMuchSkipValid = "Wartość dla wartości \"Ile Wyników Pominąć\" jest poprawna. ";
var msgHowMuchSkipInvalid = "Wartość dla wartości \"Ile Wyników Pominąć\" jest nieprawidłowa. ";

var msgHowMuchTakeValid = "Wartość dla wartości \"Ile Wyników Wyświetlić\" jest poprawna. ";
var msgHowMuchTakeInvalid = "Wartość dla wartości \"Ile Wyników Wyświetlić\" jest nieprawidłowa. ";

var msgAllValid = "Wyszukiwana fraza i pola wyszukiwania są poprawne. ";
var msgAllInvalid = "Nie wszystkie pola wyszukiwania są poprawne. ";

// - walidacja - kolory

var colorInformation = "white";
var colorValid = "#04B512";
var colorInvalid = "#FF5468";

// Wyszukiwanie - inicjalizuj możliwe właściwości i ich domyślne wartości

function getDefaultSearchProperties() {
    var defProps = null;

    $.ajax({
        async: false,
        url: siteroot + "/Base/GetDefaultSearchProperties",
        method: "post",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        success: function (defaultSearchProperties) {
            defProps =  defaultSearchProperties;
        },
        error: function (err) {
            $("html").html(err.responseText);
        }
    });

    return defProps;
}

var searchAvalProperties = keysToLowerCase(getDefaultSearchProperties());

// Klasy

function ValidationResult(output, code, message, color, ischanged, isdefaulted) {
    this.output = output;
    this.code = code;
    this.message = message;
    this.color = color;
    this.ischanged = ischanged;
    this.isdefaulted = isdefaulted;
}

function setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults) {

    // set default - jeśli walidacja zwróci false

    if (searchAvalProperties != null && !vResults[currProp].output) {
        currValues[currProp] = searchAvalProperties[currProp];
        vResults[currProp].isdefaulted = true;
    }
    else {
        vResults[currProp].isdefaulted = false;
    }

    // set ischanged - jeśli wartość jest inna niż poprzednia

    if (oldValues != null) {
        vResults[currProp].ischanged = oldValues[currProp] !== currValues[currProp];
    }

    return { currValues: currValues, vResults: vResults }
}

function removeJsonNulls(jsonObj) {
    $.each(jsonObj, function (key, val) {
        if (typeof (val) != "function" && isNullOrEmpty(val)) {
            jsonObj[key] = "";
        }
    });

    return jsonObj;
}

function getOldValues(searchAvalProperties) {
    var jsonValues = null;

    $.ajax({
        async: false,
        url: siteroot + "/Base/GetJsonSearchParamsSession",
        method: "post",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        success: function (oldValues) {
            jsonValues = removeJsonNulls($.extend({}, searchAvalProperties, keysToLowerCase(oldValues)));
        },
        error: function (err) {
            $("html").html(err.responseText);
        }
    });

    return jsonValues;
}

function getAvalPropertyNames(avalProps) {
    var names = [];

    for (var o in avalProps) {
        if (avalProps.hasOwnProperty(o)) {
            names.push(o); // the property name
        }
    }

    return names;
}

function validateSearchProperties(args) {
    args = args || {};
    var currValues = args.currvalues || null;
    var props = args.props || ["all"];
    var oldValues = args.getchangedagainst || null;
    //var avalProps = args.setdefaultsagainst || null; // teraz jako zmienna globalna

    var vResults = {};
    var currProp = null;
    var includeProps = [];

    if (props.length > 0) {
        args = $.map(props, function (n) { // , i
            n.toLowerCase();
        });
    }

    // searchTerm
    currProp = "searchTerm".toLowerCase();
    var changedProps;
    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(true, "null_or_empty", msgSearchTermInitial, colorInformation);
        }
        else if (!currValues.searchterm.match(/^[a-zA-Z ĄąĆćĘęŁłŃńÓóŚśŹźŻż]*$/)) {
            vResults[currProp] = new ValidationResult(false, "invalid_chars", msgSearchTermInvalidCharacters, colorInvalid);
        }
        else {
            var arrCurrTerm = currValues.searchterm.split(" ");

            if (arrCurrTerm[0].length < 3) {
                vResults[currProp] = new ValidationResult(false, "too_short_words", msgSearchTermFirstStringNotLongEnough, colorInvalid);
            }
            else {
                vResults[currProp] = new ValidationResult(true, "ok", msgSearchTermValid, colorValid);
            }
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // includeTitle
    currProp = "includeTitle".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        includeProps.push(currProp);
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgIncludeTitleInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgIncludeTitleInvalid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // includeAuthor
    currProp = "includeAuthor".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        includeProps.push(currProp);
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgIncludeAuthorInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgIncludeAuthorValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // includeCategory
    currProp = "includeCategory".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        includeProps.push(currProp);
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgIncludeCategoryInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgIncludeCategoryValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // includeDescription
    currProp = "includeDescription".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        includeProps.push(currProp);
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgIncludeDescriptionInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgIncludeDescriptionValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // All includes must be true

    if (includeProps && includeProps.length > 0 && currValues["includeTitle".toLowerCase()] === false && currValues["includeAuthor".toLowerCase()] === false && currValues["includeCategory".toLowerCase()] === false && currValues["includeDescription".toLowerCase()] === false) {
        vResults["allincludes"] = new ValidationResult(false, "all_includes_false", msgIncludesInvalid, colorInvalid);
    }
    else {
        vResults["allincludes"] = new ValidationResult(true, "ok", msgIncludesValid, colorValid);
    }

    // sortBy
    currProp = "sortBy".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        var sortByOptions = $("#ddlSortBy").children("option");
        var sortByValues = $.map(sortByOptions, function (option) {
            if (option.value.toLowerCase() !== "default") {
                return option.value.toLowerCase();
            } // ReSharper disable once NotAllPathsReturnValue
        });

        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgSortByInvalid, colorInvalid);
        }
        else if (sortByValues.indexOf(currValues[currProp]) === -1) {
            vResults[currProp] = new ValidationResult(false, "not_valid_sortby", msgSortByInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgSortByValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // sortOrder
    currProp = "sortOrder".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgSortOrderInvalid, colorInvalid);
        }
        else if (["asc", "desc"].indexOf(currValues[currProp]) === -1) {
            vResults[currProp] = new ValidationResult(false, "not_valid_sortorder", msgSortOrderInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgSortOrderValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // howMuchSkip
    currProp = "howMuchSkip".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgHowMuchSkipInvalid, colorInvalid);
        }
        else if (isNaN(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "not_valid_sikp", msgHowMuchSkipInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgHowMuchSkipValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // howMuchTake
    currProp = "howMuchTake".toLowerCase();

    if (props.indexOf(currProp) > -1 || props.indexOf("all") > -1) {
        if (isNullOrEmpty(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "null_or_empty", msgHowMuchTakeInvalid, colorInvalid);
        }
        else if (isNaN(currValues[currProp])) {
            vResults[currProp] = new ValidationResult(false, "not_valid_take", msgHowMuchTakeInvalid, colorInvalid);
        }
        else {
            vResults[currProp] = new ValidationResult(true, "ok", msgHowMuchTakeValid, colorValid);
        }

        // set default & ischanged
        changedProps = setDefaultAndIsChangedProperties(currProp, currValues, oldValues, vResults);
        currValues = changedProps.currValues;
        vResults = changedProps.vResults;
    }

    // Wszystkie Właściwości

    vResults["all"] = new ValidationResult(true, "ok", msgAllValid, colorValid);
    $.each(vResults, function (key, val) {
        if (!val.output) {
            vResults["all"] = new ValidationResult(false, "not_all_correct", msgAllInvalid, colorInvalid);
            return false;
        } // ReSharper disable once NotAllPathsReturnValue      
    });

    return {
        validationresults: vResults,
        validatedvalues: currValues
    };
};

// Tooltip

function refreshTooltip(args) {
    args = args || {};
    var areAnyResults = args.areAnyResults || false;
    var validation = args.isValidatedBy || null;

    var isTooltipDisabled = $("#txtSearch").tooltip("option", "disabled");
    if (isTooltipDisabled) {
        $("#txtSearch").tooltip("enable");
    }

    var sTooltipContent = "<ul class='custom_validation_summary'>";

    if (!validation) {
        var address = window.location.href;
        var controller = "Book";
        var action = "Index";

        var endsWithAction = address.endsWith("/" + controller + "/" + action) || address.indexOf("/" + controller + "/" + action + "?") > -1 || address.indexOf("/" + controller + "/" + action + "#") > -1;
        var endsWithController = address.endsWith("/" + controller) || address.indexOf("/" + controller + "?") > -1 || address.indexOf("/" + controller + "#") > -1;

        if (endsWithAction || endsWithController) {
            validation = validateSearchProperties({
                props: getAvalPropertyNames(keysToLowerCase(searchAvalProperties)),
                currvalues: {
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
            });
        }
        else {
            validation = validateSearchProperties({
                props: ["searchterm", "includeauthor"],
                currvalues: {
                    searchterm: $("#txtSearch").val(),
                    includeauthor: $("#cbIncludeAuthor").prop("checked")
                },
                setdefaultsagainst: searchAvalProperties
            });
        }
    }

    if (areAnyResults) {
        if (validation.validationresults.all.output) { // WYNIKI = true, WALIDACJA POPRAWNA = true
            if ($("#txtSearch").val().length === 0) {
                sTooltipContent += "<li style='color: " + validation.validationresults.searchterm.color + "'>" + validation.validationresults.searchterm.message + "</li>";
            }
            else {
                sTooltipContent += "<li style='color: " + validation.validationresults.all.color + "'>" + validation.validationresults.all.message + "</li>";
            }
        } else { // ReSharper disable once UnusedParameter // WYNIKI = true, WALIDACJA POPRAWNA = false 
            $.each(validation.validationresults, function (key, value) {
                if (validation.validationresults[key].output === false && key !== "all") {
                    sTooltipContent += "<li style='color: " + validation.validationresults[key].color + "'>" + validation.validationresults[key].message + "</li>";
                }
            });
        } 
    }
    else {
        if (validation.validationresults.all.output) { // WYNIKI = false, WALIDACJA POPRAWNA = true
            if (args.isValidatedBy) { // WYNIKI = false, WALIDACJA POPRAWNA = true, WALIDACJA PRZEKAZANA = true
                sTooltipContent += "<li style='color: " + colorInformation + "'>" + "Brak Rezultatów" + "</li>";
            }
            else { // WYNIKI = false, WALIDACJA POPRAWNA = true, WALIDACJA PRZEKAZANA = false
                if ($("#txtSearch").val().length === 0) {
                    sTooltipContent += "<li style='color: " + validation.validationresults.searchterm.color + "'>" + validation.validationresults.searchterm.message + "</li>";
                }
                else {
                    sTooltipContent += "<li style='color: " + validation.validationresults.all.color + "'>" + validation.validationresults.all.message + "</li>";
                }
            }
        }
        else { // ReSharper disable once UnusedParameter // WYNIKI = false, WALIDACJA POPRAWNA = false
            $.each(validation.validationresults, function (key, value) {
                if (validation.validationresults[key].output === false && key !== "all") {
                    sTooltipContent += "<li style='color: " + validation.validationresults[key].color + "'>" + validation.validationresults[key].message + "</li>";
                }
            });
        }         
    }
    sTooltipContent += "</ul>";
    $("#txtSearch").tooltip("option", "content", sTooltipContent);
}

function fixTooltipPosition() {
    $(".txtSearch_tooltip").css({
        "left": $("#txtSearch").offset().left
    });
}

// Search i Autocomplete

function toggleSpinner(option) {
    var bgImage = "url('Images/Loading/loading1.gif')";
    var bgNone = "none";

    $(".autocomplete_loading_container").css({
        "background-image": function (/*i, val*/) {
            if (option === "show") {
                return bgImage;
            }
            else if (option === "hide") {
                return bgNone;
            }
            else {
                alert("toggleSpinner - podana opcja jest nieprawidłowa. ");
                return bgNone;
            }
        }
    });
}

// Rozszerzone funkcje

if (typeof String.prototype.startsWith != "function") { // ReSharper disable once NativeTypePrototypeExtending
    String.prototype.startsWith = function (prefix) {
        return this.slice(0, prefix.length) === prefix;
    };
}

if (typeof String.prototype.endsWith != "function") { // ReSharper disable once NativeTypePrototypeExtending
    String.prototype.endsWith = function (suffix) {
        return this.slice(-suffix.length) === suffix;
    };
}

function isNullOrEmpty(str) {
    return str == null || 0 === str.length;
}

function resizeBackground() {
    $("#Background").height($("#Main").outerHeight(true));
}

function keysToLowerCase(obj) {
    var key, keys = Object.keys(obj);
    var n = keys.length;
    var newobj = {}
    while (n--) {
        key = keys[n];
        newobj[key.toLowerCase()] = obj[key];
    }
    return (newobj);

    //return obj.replace(/"([^"]+)":/g, function ($0, $1) { return ('"' + $1.toLowerCase() + '":'); });
}



$(document).ready(function () {

    $("#btnSearchSubmit").prop("disabled", false);

    // DEBUGOWANIE

    if (!debugMode) {
        $("#divDebug").hide();
    }
    else {
        $("#divDebug").draggable();
    }
    
    //var oldValues = searchAvalProperties;

    // Formatowanie

    $.fn.extend({
        center: function (options) {
            options = $.extend({ // Default values
                inside: window, // element, center into window
                transition: 0, // millisecond, transition time
                minX: 0, // pixel, minimum left element value
                minY: 0, // pixel, minimum top element value
                withScrolling: true, // booleen, take care of the scrollbar (scrollTop)
                vertical: true, // booleen, center vertical
                horizontal: true // booleen, center horizontal
            }, options);
            return this.each(function () {
                var props = { position: "absolute" };
                if (options.vertical) {
                    var top = ($(options.inside).height() - $(this).outerHeight()) / 2;
                    if (options.withScrolling) top += $(options.inside).scrollTop() || 0;
                    top = (top > options.minY ? top : options.minY);
                    $.extend(props, { top: top + "px" });
                }
                if (options.horizontal) {
                    var left = ($(options.inside).width() - $(this).outerWidth()) / 2;
                    if (options.withScrolling) left += $(options.inside).scrollLeft() || 0;
                    left = (left > options.minX ? left : options.minX);
                    $.extend(props, { left: left + "px" });
                }
                if (options.transition > 0) $(this).animate(props, options.transition);
                else $(this).css(props);
                return $(this);
            });
        }
    });

    $("#Background").center({ vertical: false });

    $(window).on("resize", function () {
        $("#Background").center({ transition: 0, vertical: false });
        resizeBackground();
    });

    $divMain.find("*").on("attrchange", function () {
        resizeBackground();
    });

    // Animacje

    $("input[type=button], input[type=submit]").mouseenter(function () {
        $(this).stop().animate({
            color: "white",
            backgroundColor: "#252525",
            borderColor: "white"
        }, 250);
    });

    $("input[type=button], input[type=submit]").mouseleave(function () {
        $(this).stop().animate({
            color: "yellow",
            backgroundColor: "transparent",
            borderColor: "#254117"
        }, 250);
    });


    // Date Picker

    $.validator.methods.date = function (value/*, element*/) {
        var mDate = moment(value, "DD-MM-YYYY");
        var d = mDate.toDate();
        var dRegEx = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

        return dRegEx.test(value) && mDate && d;
    }

    $("input:text.date").datepicker(
    {
        dateFormat: "dd-mm-yy"
    });


    // Tooltip

    $("#txtSearch").tooltip({
        tooltipClass: "txtSearch_tooltip",
        track: false,
        show: { delay: 10, duration: 500, effect: 'fadeIn' },
        hide: { delay: 10, duration: 500, effect: 'fadeOut' },
        left: 0,
        position: {
            my: "left top", 
            at: "left bottom+10"
        },
        open: function (/*event, ui*/) {
            fixTooltipPosition();
        }
    });

    $("#txtSearch").mouseenter(function () {
        refreshTooltip({
            isValidatedBy: null,
            areAnyResults: false
        });
    });

    // Autocomplete

    function updateTextBox(event, ui) { // ReSharper disable once PossiblyUnassignedProperty
        $(this).val(ui.item.Title);
        return false;
    }

    $("#txtSearch").autocomplete({
        search: function (/*event, ui*/) {
            toggleSpinner("show");
        },
        source: function (request, response) {
            var validation = validateSearchProperties({
                props: ["searchterm", "includeauthor"],
                currvalues: {
                    searchterm: $("#txtSearch").val(),
                    includeauthor: $("#cbIncludeAuthor").prop("checked")
                }
            });

            if (validation.validationresults.all.output) {
                $.ajax({
                    async: true,
                    url: siteroot + "/Base/GetAutocompleteResults",
                    method: "post",
                    contentType: "application/json;charset=utf-8",
                    data: JSON.stringify({
                        SearchTerm: validation.validatedvalues.searchterm,
                        IncludeAuthor: validation.validatedvalues.includeauthor
                    }),
                    dataType: "json",
                    success: function (data) {
                        if (data.length === 0) {
                            refreshTooltip({
                                isValidatedBy: validation,
                                areAnyResults: false
                            });
                            $("#txtSearch").tooltip("open");
                        }
                        else {
                            refreshTooltip({
                                isValidatedBy: validation,
                                areAnyResults: true
                            });
                            $("#txtSearch").tooltip("close");
                            $("#txtSearch").tooltip("disable");
                        }
                        toggleSpinner("hide");
                        //data["AdditionDate"] = JSON.parse(data.AdditionDate);
                        response(data);
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
                response();
            }
        },
        minLength: 1,
        position: {
            my: "left top",
            at: "left bottom+10"
        },
        select: updateTextBox
    })
        .autocomplete("instance")._renderItem = function (ul, item) {
            var sTableRow = null;

            $.ajax({
                async: false,
                url: siteroot + "/Base/GetAutocompleteItem",
                method: "post",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify({
                    item: JSON.stringify(item)
                }),
                dataType: "html",
                success: function (data) {
                    sTableRow = data;
                },
                error: function (err) {
                    $("html").html(err.responseText);
                }
            });

            sTableRow = sTableRow.replace(/(\r\n|\n|\r|\s\s+)/gm, "");
            var tableRow = $.parseHTML(sTableRow);
            var currTerm = this.term;
            var arrCurrTerm = currTerm.split(" ");
            var itemsToCheck = $("#cbIncludeAuthor").prop("checked") ? ".autocomplete_item_title, .autocomplete_item_author" : ".autocomplete_item_title";

            $.each(arrCurrTerm, function (index, value) {
                if (value.length > 2) {
                    var regex = new RegExp("(" + value + ")(?![^<]*>|[^<>]*<\/)", "i"); // druga część zapobiega podmianie tagów html

                    $(tableRow).find(itemsToCheck).each(function (i, el) {
                        $(el).html($(el).html().replace(regex, "<span style='text-decoration: underline; font-weight: bold; color: blue;'>" + "$1" + "</span>"));
                    });
                }
            });

            return $(tableRow).appendTo(ul);
        };

    $("#frmSearch").submit(function (e) {
        //$(e.target).find("input[type='hidden'][name='includeAuthor']").detach(); // usuwa przed wysłaniem hidden element tworzony dla każdego checknboxa przez MVC, żeby nie było podwójnych wartości Query Stringów, wartość pola hidden pozwala otrzymać controllerowi wartość checkboxa jeśli jest false // komentarz, bo nie używam obecnie w projekcie querystringów to przekazywania wartości tego formularza
        var address = window.location.href;
        var controller = "Book";
        var action = "Index";

        var endsWithAction = address.endsWith("/" + controller + "/" + action) || address.indexOf("/" + controller + "/" + action + "?") > -1 || address.indexOf("/" + controller + "/" + action + "#") > -1;
        var endsWithController = address.endsWith("/" + controller) || address.indexOf("/" + controller + "?") > -1 || address.indexOf("/" + controller + "#") > -1;

        if (endsWithAction || endsWithController) {
            e.preventDefault();
        }
        else { // Jeśli nie jesteśmy w w Index/Book to Submit wysyła do Book/Index
            var currValues = {
                searchterm: $("#txtSearch").val(),
                includeauthor: $("#cbIncludeAuthor").prop("checked")
            }

            var validation = validateSearchProperties({
                props: ["searchterm", "includeauthor"],
                currvalues: currValues
            });

            if (!validation.validationresults.all.output) {
                e.preventDefault();
            }
            else {
                $("#btnSearchSubmit").prop("disabled", true);
            }
        }
    });
});