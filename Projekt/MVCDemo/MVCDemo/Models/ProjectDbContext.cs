using System;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Reflection;
using MySql.Data.Entity;

namespace MVCDemo.Models
{
    //[DbConfigurationType(typeof(MySqlEFConfiguration))]
    public partial class ProjectDbContext : DbContext
    {
        public ProjectDbContext() : base("name=DBCS")
        { }

        public virtual DbSet<Book> Books { get; set; }
        public virtual DbSet<User> Users { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            //modelBuilder.Types().Configure(c =>
            //{
            //    var properties = c.ClrType.GetProperties(BindingFlags.NonPublic | BindingFlags.Instance)
            //        .Where(p => p.Name == "IdBinary");
            //    foreach (var p in properties)
            //        c.Property(p).HasColumnName("Id");
            //});

            modelBuilder.Entity<Book>()
                .HasKey(e => e.Id)
                .ToTable("tblBooks");

            //modelBuilder.Entity<Book>()
            //    .Property(e => e.IdBinary)
            //    .HasColumnName("Id");

            //modelBuilder.Entity<Book>()
            //    .Property(e => e.AuthorIdBinary)
            //    .HasColumnName("AuthorId");

            modelBuilder.Entity<Book>()
                .Property(e => e.Title)
                .IsUnicode(true);

            modelBuilder.Entity<Book>()
                .Property(e => e.Category)
                .IsUnicode(true);

            modelBuilder.Entity<Book>()
                .Property(e => e.Description)
                .IsUnicode(true);

            modelBuilder.Entity<Book>()
                .Property(e => e.Thumbnail)
                .IsUnicode(true);

            //.Property(e => new Guid(string.Join("-", e.Id.ToString().Substring(4, 4), e.Id.ToString().Substring(2, 2), e.Id.ToString().Substring(0, 2), e.Id.ToString().Substring(8, 2), e.Id.ToString().Substring(10))));

            modelBuilder.Entity<User>()
                .HasKey(e => e.Id)
                .ToTable("tblUsers");

            //modelBuilder.Entity<User>()
            //    .Property(e => e.idBinary)
            //    .HasColumnName("Id");

            modelBuilder.Entity<User>()
                .Property(e => e.UserName)
                .IsUnicode(true);

            modelBuilder.Entity<User>()
                .Property(e => e.Password)
                .IsUnicode(true);

            modelBuilder.Entity<User>()
                .Property(e => e.Email)
                .IsUnicode(true);

            modelBuilder.Entity<User>()
                .HasMany(e => e.Books)
                .WithOptional(e => e.Author)
                .HasForeignKey(e => e.AuthorId);
        }
    }
}
