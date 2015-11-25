using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic;
using System.Web.Mvc;
using MVCDemo.Models;
using System.Web.Script.Serialization;
using System.Text;
using System.IO;
using Newtonsoft.Json;
using System.Data.Entity;

namespace MVCDemo.Controllers
{
    public class BaseController : Controller
    {
        public string GetAutocompleteResults(Search search)
        {
            if (!ModelState.IsValid)
                throw new Exception("Model dla 'search' jest nieprawidłowy");

            var books = GetBooks(search);

            var dateFormatSettings = new JsonSerializerSettings
            {
                DateFormatHandling = DateFormatHandling.IsoDateFormat
            };

            return JsonConvert.SerializeObject(books, dateFormatSettings);
        }

        public PartialViewResult GetSearchWidget(string controller, string action)
        {
            var search = new Search();

            var dictSearchParams = GetSearchParamsSession();
            if (dictSearchParams != null && dictSearchParams.Count > 0)
            {
                search.SearchTerm = dictSearchParams["SearchTerm".ToLower()] != null ? dictSearchParams["SearchTerm".ToLower()].ToString() : string.Empty;
                search.IncludeAuthor = Convert.ToBoolean(dictSearchParams["IncludeAuthor".ToLower()]);
            }

            ViewBag.Controller = controller;
            ViewBag.Action = action;
            return PartialView("_SearchWidget", search);
        }

        protected List<Book> GetBooks(Search search)
        {
            var db = new ProjectDbContext();
            var books = db.Books; 
            
            var listTerms = search.SearchTerm.Split(new[] { " " }, StringSplitOptions.RemoveEmptyEntries)
                .Where(s => s.Length >= 3).ToList();

            var searchedBooks = books.AsEnumerable()
                .Where(book => CheckWhatToSearch(book, search, listTerms));

            var sortedBooks = search.SortOrder.ToLower() == "asc" ? 
                searchedBooks.OrderBy(search.SortBy) : 
                searchedBooks.OrderBy(search.SortBy).Reverse();

            var pagedBooks = search.HowMuchSkip >= 0 ?
                sortedBooks.Skip(search.HowMuchSkip).Take(search.HowMuchTake) :
                new List<Book>();

            return pagedBooks.ToList();
        }

        private static bool CheckWhatToSearch(Book book, Search search, List<string> listTerms)
        {
            var db = new ProjectDbContext();
            var users = db.Users.ToList();

            if (book.IsPublic == false || book.IsPublic == null)
                return false;

            if (listTerms.Count <= 0)
                return true;

            listTerms = listTerms.ConvertAll(t => t.ToLower());

            var sbWhereToSearch = new StringBuilder();
            var titleValue = book.Title.ToLower();
            var authorValue = users.Single(u => u.Id == book.AuthorId).UserName;
            var categoryValue = book.Category.ToLower();
            var descriptionValue = book.Description.ToLower();

            if (search.IncludeTitle)
                sbWhereToSearch.Append(titleValue + " ");

            if (search.IncludeAuthor)
                sbWhereToSearch.Append(authorValue + " ");

            if (search.IncludeCategory)
                sbWhereToSearch.Append(categoryValue + " ");

            if (search.IncludeDescription)
                sbWhereToSearch.Append(descriptionValue + " ");

            if (sbWhereToSearch.Length == 0) // jeśli nic nie zostało wybrane
                sbWhereToSearch.Append(titleValue + " ");

            return listTerms.All(sbWhereToSearch.ToString().Contains); // true jeśli zawiera wszystkie elementy z wpisanych przez usera
        }

        public PartialViewResult GetAutocompleteItem(string item) // wywoływany w JS, otrzymuje po kolei itemy pobrane z bazy danych
        {
            var js = new JavaScriptSerializer();
            var dictItem = (Dictionary<string, object>)js.DeserializeObject(item);
            var db = new ProjectDbContext();
            var users = db.Users.ToList();
            var authorGuid = new Guid(dictItem["AuthorId"].ToString());

            var book = new Book
            {
                Id = new Guid(dictItem["Id"].ToString()),
                Title = dictItem["Title"].ToString(),
                Category = dictItem["Category"].ToString(),
                AuthorId = authorGuid,
                Description = dictItem["Description"].ToString(),
                AdditionDate = Convert.ToDateTime(dictItem["AdditionDate"].ToString()),
                Thumbnail = dictItem["Thumbnail"].ToString(),
                IsPublic = Convert.ToBoolean(dictItem["IsPublic"]),
                // Navigation Properties - (added with include)
                Author = users.Single(u => u.Id == authorGuid)
            };

            return PartialView("_AutocompleteItem", book);
        }

        public JsonResult GetDefaultSearchProperties()
        {
            var filteredSearchOptions = new Search().ToDictionary().Where(kvp => kvp.Key.GetType() != typeof(List<SelectListItem>)).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

            return Json(filteredSearchOptions, JsonRequestBehavior.AllowGet);
        }

        public Dictionary<string, object> GetSearchParamsSession()
        {
            if (Session["SearchParams"] != null)
                return (Dictionary<string, object>)Session["SearchParams"];
            return new Dictionary<string, object>();
        }

        public JsonResult GetJsonSearchParamsSession()
        {
            return Json(GetSearchParamsSession(), JsonRequestBehavior.AllowGet);
        }

        public void SaveSearchParamsSession(Dictionary<string, object> dictSearchParams)
        {
            Session["SearchParams"] = dictSearchParams;
        }

        protected Dictionary<string, object> MergeDictonaries(Dictionary<string, object> dict1, Dictionary<string, object> dict2)
        {
            var d1 = (new Dictionary<string, object>(dict1)).ToDictionary(kvp => kvp.Key.ToLower(), kvp => kvp.Value);
            var d2 = (new Dictionary<string, object>(dict2)).ToDictionary(kvp => kvp.Key.ToLower(), kvp => kvp.Value);

            return d2.Concat(d1.Where(x => !d2.Keys.Contains(x.Key))).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        /// <summary>
        /// Render a PartialView into a string that contain the Html to display to the browser.
        /// </summary>
        /// <param name="partialViewName">The name of the partial view to render</param>
        /// <param name="model">The model to bind to the partial view</param>
        /// <returns>The html rendered partial view</returns>
        public virtual string RenderPartialView(string partialViewName, object model)
        {
            if (ControllerContext == null)
                return string.Empty;

            if (model == null)
                throw new ArgumentNullException(nameof(model));

            if (string.IsNullOrEmpty(partialViewName))
                throw new ArgumentNullException(nameof(partialViewName));

            ModelState.Clear();//Remove possible model binding error.

            ViewData.Model = model;//Set the model to the partial view

            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(ControllerContext, partialViewName);
                var viewContext = new ViewContext(ControllerContext, viewResult.View, ViewData, TempData, sw);
                viewResult.View.Render(viewContext, sw);
                return sw.GetStringBuilder().ToString();
            }
        }
    }
}
