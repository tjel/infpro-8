using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Dynamic;
using System.Web.Mvc;
using MVCDemo.Models;
using System.Web.Script.Serialization;
using System.Text;
using System.IO;
using Newtonsoft.Json;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Infrastructure;
using System.Linq.Expressions;
using System.Threading;
using MySql.Data.MySqlClient;

namespace MVCDemo.Controllers
{
    public class BaseController : Controller
    {
        public string GetAutocompleteResults(Search search)
        {
            if (!ModelState.IsValid)
                throw new Exception("Model dla 'search' jest nieprawidłowy");

            bool error;
            string resultsCounter;
            var books = GetBooks(search, out resultsCounter, out error);

            var dateFormatSettings = new JsonSerializerSettings
            {
                DateFormatHandling = DateFormatHandling.IsoDateFormat,
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore
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

        protected List<Book> GetBooks(Search search, out string resultsCounter, out bool error)
        {
            error = false;
            resultsCounter = "n/a";
            var books = Enumerable.Empty<Book>().ToList();

            using (var db = new ProjectDbContext())
            {
                db.Database.Initialize(force: false); // MODEL MUSI BYĆ ZBUDOWANY ZANIM OTWORZYMY POŁĄCZENIE, INACZEJ BĘDZIE BŁĄD, CANNOT USE CONTEXT DURING MODEL CREATING

                var paramSearchTerms = new MySqlParameter { ParameterName = "p_SearchTerms", Value = search.SearchTerm };
                var paramIncludeTitle = new MySqlParameter { ParameterName = "p_IncludeTitle", Value = search.IncludeTitle };
                var paramIncludeAuthor = new MySqlParameter { ParameterName = "p_IncludeAuthor", Value = search.IncludeAuthor };
                var paramIncludeCategory = new MySqlParameter { ParameterName = "p_IncludeCategory", Value = search.IncludeCategory };
                var paramIncludeDescription = new MySqlParameter { ParameterName = "p_IncludeDescription", Value = search.IncludeDescription };
                var paramHowMuchSkip = new MySqlParameter { ParameterName = "p_HowMuchSkip", Value = search.HowMuchSkip };
                var paramHowMuchTake = new MySqlParameter { ParameterName = "p_HowMuchTake", Value = search.HowMuchTake };
                var paramSortBy = new MySqlParameter { ParameterName = "p_SortBy", Value = search.SortBy };
                var paramSortOrder = new MySqlParameter { ParameterName = "p_SortOrder", Value = search.SortOrder };

                var cmd = db.Database.Connection.CreateCommand();
                cmd.CommandText = "sp_SearchBooks";
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.Add(paramSearchTerms);
                cmd.Parameters.Add(paramIncludeTitle);
                cmd.Parameters.Add(paramIncludeAuthor);
                cmd.Parameters.Add(paramIncludeCategory);
                cmd.Parameters.Add(paramIncludeDescription);
                cmd.Parameters.Add(paramHowMuchSkip);
                cmd.Parameters.Add(paramHowMuchTake);
                cmd.Parameters.Add(paramSortBy);
                cmd.Parameters.Add(paramSortOrder);

                try
                {
                    if (search.HowMuchSkip >= 0)
                    {
                        db.Database.Connection.Open();
                        var reader = cmd.ExecuteReader();

                        resultsCounter = ((IObjectContextAdapter)db)
                            .ObjectContext
                            .Translate<string>(reader).SingleOrDefault();

                        reader.NextResult();
                        books = ((IObjectContextAdapter)db)
                            .ObjectContext
                            .Translate<Book>(reader).ToList(); //.AsQueryable().Include(b => b.Author)
                        reader.Close();

                        var loadedUsers = new List<User>();
                        foreach (var b in books)
                        {
                            var loadedCurrAuthor = loadedUsers.SingleOrDefault(u => b.AuthorId == u.Id);

                            if (loadedCurrAuthor == null)
                                loadedUsers.Add(db.Users.Single(u => b.AuthorId == u.Id));

                            b.Author = loadedUsers.Single(u => b.AuthorId == u.Id);
                        }
                    }
                }
                catch (Exception ex)
                {
                    error = true;
                    return books; // fallback, zwróć pusty zestaw
                }
                finally
                {
                    if (db.Database.Connection.State == ConnectionState.Open)
                        db.Database.Connection.Close();
                }

                return books;
            }
        }

        protected List<Book> GetBooksAlternate(Search search) // NIEUŻYWANE
        {
            var db = new ProjectDbContext();
            var books = db.Books;

            var listTerms = search.SearchTerm.Split(new[] { " " }, StringSplitOptions.RemoveEmptyEntries)
                .Where(s => s.Length >= 3).ToList().ConvertAll(t => t.ToLower().Replace("|", ""));

            var searchedBooks = books
                .Where(delegate (Book book)
                {
                    if (book.IsPublic != true)
                        return false;

                    if (listTerms.Count <= 0)
                        return true;

                    var sbWhereToSearch = new StringBuilder();
                    var titleValue = book.Title;
                    var authorValue = db.Users.Single(u => u.Id == book.AuthorId).UserName;
                    var categoryValue = book.Category;
                    var descriptionValue = book.Description;

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

                    return listTerms.All(sbWhereToSearch.ToString().ToLower().Contains); // true jeśli zawiera wszystkie elementy z wpisanych przez usera
                });

            var sortedBooks = searchedBooks.OrderBy(search.SortBy + " " + search.SortOrder.ToLower()); // dynamic LINQ query helper

            var pagedBooks = search.HowMuchSkip >= 0 ?
                sortedBooks.Skip(search.HowMuchSkip).Take(search.HowMuchTake) :
                Enumerable.Empty<Book>().AsQueryable();

            return pagedBooks.ToList();
        }

        protected List<Book> GetBooksDynamicLinqExpressions(Search search) // NIEUŻYWANE
        {
            var db = new ProjectDbContext();
            var books = db.Books;//.Include(b => b.Author);

            var listTerms = search.SearchTerm.Split(new[] { " " }, StringSplitOptions.RemoveEmptyEntries)
                .Where(s => s.Length >= 3).ToList().ConvertAll(t => t.ToLower().Replace("|", ""));

            var searchedBooks = books;
            //.AsQueryable().Where(delegate (Book book)
            //{
            //    if (book.IsPublic != true)
            //        return false;

            //    if (listTerms.Count <= 0)
            //        return true;

            //    var sbWhereToSearch = new StringBuilder();
            //    var titleValue = book.Title;
            //    var authorValue = db.Users.Single(u => u.Id == book.AuthorId).UserName;
            //    var categoryValue = book.Category;
            //    var descriptionValue = book.Description;

            //    if (search.IncludeTitle)
            //        sbWhereToSearch.Append(titleValue + " ");

            //    if (search.IncludeAuthor)
            //        sbWhereToSearch.Append(authorValue + " ");

            //    if (search.IncludeCategory)
            //        sbWhereToSearch.Append(categoryValue + " ");

            //    if (search.IncludeDescription)
            //        sbWhereToSearch.Append(descriptionValue + " ");

            //    if (sbWhereToSearch.Length == 0) // jeśli nic nie zostało wybrane
            //        sbWhereToSearch.Append(titleValue + " ");

            //    return listTerms.All(s => sbWhereToSearch.ToString().ToLower().Contains(s));
            //});

            //// Drzewo wyrażenia reprezentujące parametr predykatu
            //ParameterExpression pe = Expression.Parameter(typeof(Book), "book");
            //LabelTarget returnTarget = Expression.Label(typeof(bool));

            //// if (book.IsPublic != true)
            ////     return false;
            //Expression ifBookNotPublic = Expression.IfThen(
            //    Expression.NotEqual(
            //        Expression.Property(pe, typeof(Book).GetProperty("IsPublic")), 
            //        Expression.Constant(true)), 
            //    Expression.Return(returnTarget, Expression.Constant(false)));

            //// if (listTerms.Count <= 0)
            ////     return true;
            //Expression paramListTerms = Expression.Constant(listTerms);
            //Expression ifListTermsCountLessOrEqualThanZero = Expression.IfThen(
            //    Expression.LessThanOrEqual(
            //        Expression.Property(paramListTerms, typeof(List<string>).GetProperty("Count")),
            //        Expression.Constant(0, typeof(int))), 
            //    Expression.Return(returnTarget, Expression.Constant(true)));

            //// listTerms.All(s => sbWhereToSearch.ToString().ToLower().Contains(s));
            //ParameterExpression pTerm = Expression.Parameter(typeof(string), "s");
            //Expression paramSearch = Expression.Constant(search);

            //// if (search.IncludeTitle)
            ////     sbWhereToSearch.Append(titleValue + " ");
            //Expression ifSearchIncludeTitleThenConcat = Expression.IfThen(
            //    Expression.Equal(
            //        Expression.Property(paramSearch, typeof(Search).GetProperty("IncludeTitle")),
            //        Expression.Constant(true)),
            //    Expression. WHAT NOW? );


            //// ===================================
            //var exprBlock = Expression.Block(); // Expression Calls here
            //var searchedBooks = books.AsQueryable().Where(Expression.Lambda<Func<Book, bool>>(exprBlock, pe)); // książki, takie dla których cały blok zwraca true

            var sortedBooks = searchedBooks.OrderBy(search.SortBy + " " + search.SortOrder.ToLower()); // dynamic LINQ query helper

            var pagedBooks = search.HowMuchSkip >= 0 ?
                sortedBooks.Skip(search.HowMuchSkip).Take(search.HowMuchTake) :
                Enumerable.Empty<Book>().AsQueryable();

            //var sql = ((ObjectQuery)pagedBooks).ToTraceString();
            //var linq = pagedBooks.ToString();

            // całe procedurą z LIMIT search.HowMuchSkip OFFSET search.HowMuchTake
            // E:\Program Files\XAMPP\mysql\data\Szymon.log

            return pagedBooks.ToList(); // Error: LINQ to Entities does not recognize the method 'Boolean CheckWhatToSearch(MVCDemo.Models.Book, MVCDemo.Models.Search, System.Collections.Generic.List`1[System.String])' method, and this method cannot be translated into a store expression.
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
