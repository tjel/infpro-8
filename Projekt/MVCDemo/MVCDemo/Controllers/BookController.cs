using MVCDemo.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace MVCDemo.Controllers
{
    public class BookController : BaseController
    {
        public ActionResult Index(Search search)
        {
            if (!ModelState.IsValid)
                throw new Exception("Model dla 'search' jest nieprawidłowy");

            var requestType = System.Web.HttpContext.Current.Request.HttpMethod;
            var searchOptions = new Search { HowMuchTake = 12 };

            var dictDefaultSearchOptions = searchOptions.ToDictionary();
            var dictSessionSearchOptions = GetSearchParamsSession();
            var dictPostedSearchOptions = new Dictionary<string, object>();

            if (requestType == "POST")
            {
                dictPostedSearchOptions.Add("searchTerm", search.SearchTerm);
                dictPostedSearchOptions.Add("includeAuthor", search.IncludeAuthor);
            }

            var dictMergedSearchOptions = dictDefaultSearchOptions;
            if (dictSessionSearchOptions != null && requestType == "GET")
                dictMergedSearchOptions = MergeDictonaries(dictMergedSearchOptions, dictSessionSearchOptions);
            if (requestType == "POST")
                dictMergedSearchOptions = MergeDictonaries(dictMergedSearchOptions, dictPostedSearchOptions);

            SaveSearchParamsSession(dictMergedSearchOptions);
            return View();
        }

        //public ActionResult Details(int id)
        //{
        //    return View();
        //}

        public PartialViewResult GetSearchOptions()
        {
            var search = new Search { HowMuchTake = 12 };

            var dictSearchParams = GetSearchParamsSession();
            if (dictSearchParams != null && dictSearchParams.Count > 0)
            {
                search = new Search(dictSearchParams);
            }

            return PartialView("_SearchOptions", search);
        }

        public JsonResult GetSearchResults(Search search)
        {
            if (!ModelState.IsValid)
                throw new Exception("Model dla 'search' jest nieprawidłowy");

            var books = GetBooks(search);

            var db = new ProjectDbContext();
            var users = db.Users.ToList();

            foreach (var b in books)
                b.Author = users.Single(u => u.Id == b.AuthorId);

            SaveSearchParamsSession(search.ToDictionary());

            if (books.Count == 0)
            {
                return Json(new
                {
                    ResultsCount = books.Count,
                    PartialView = string.Empty
                }, JsonRequestBehavior.AllowGet);
            }

            return Json(new
            {
                ResultsCount = books.Count,
                PartialView = RenderPartialView("_SearchResults", books)
            }, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetScrollSearchResults(Search search, string scrollDirection)
        {
            if (!ModelState.IsValid || !new[] {"scrollup", "scrolldown"}.Contains(scrollDirection.ToLower()))
                throw new Exception("Model dla 'search' lub Kierunek sortowania przekazany przez Ajax jest nieprawidłowy");

            var sessSearch = new Search((Dictionary<string, object>)Session["SearchParams"]);
            var expectedSearch = new Search(search) { HowMuchSkip = sessSearch.HowMuchSkip };

            if (Session["SearchParams"] == null || !sessSearch.Equals(expectedSearch))
                throw new Exception("Sesja jest pusta lub nieprawidłowa");

            var totalSkip = search.HowMuchSkip + sessSearch.HowMuchSkip;
            search.HowMuchSkip = totalSkip;
            var searchWithoutInvertedValues = new Search(search);

            switch (scrollDirection.ToLower())
            {
                case "scrolldown":
                    totalSkip = search.HowMuchSkip + search.HowMuchTake - 2;
                    search.HowMuchSkip = totalSkip;
                    break;
                case "scrollup":
                    totalSkip = search.HowMuchSkip; // dummy, do usunięcia
                    search.HowMuchSkip = totalSkip;
                    break;
                default:
                    throw new Exception("Nie poprawny kierunek przewijania. ");
            }

            search.HowMuchTake = 2;
            var books = GetBooks(search);

            if (books.Count == 0)
                return Json(new
                {
                    ResultsCount = books.Count,
                    PartialView = string.Empty
                }, JsonRequestBehavior.AllowGet);

            SaveSearchParamsSession(searchWithoutInvertedValues.ToDictionary());

            return Json(new
            {
                ResultsCount = books.Count,
                PartialView = RenderPartialView("_SearchScrollResults", books)
            }, JsonRequestBehavior.AllowGet);
        }
    }
}