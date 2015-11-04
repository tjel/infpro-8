using System;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using MySql.Data.Entity;

namespace MVCDemo.Models
{
    //[DbConfigurationType(typeof(MySqlEFConfiguration))]
    public partial class ProjectDbContext : DbContext
    {
        public ProjectDbContext()
            : base("name=DBCS")
        {
        }

        public virtual DbSet<Book> Books { get; set; }
        public virtual DbSet<User> Users { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Book>()
                .Property(e => e.Title)
                .IsUnicode(false);

            modelBuilder.Entity<Book>()
                .Property(e => e.Category)
                .IsUnicode(false);

            modelBuilder.Entity<Book>()
                .Property(e => e.Description)
                .IsUnicode(false);

            modelBuilder.Entity<Book>()
                .Property(e => e.Thumbnail)
                .IsUnicode(false);

            modelBuilder.Entity<User>()
                .Property(e => e.UserName)
                .IsUnicode(false);

            modelBuilder.Entity<User>()
                .Property(e => e.Password)
                .IsUnicode(false);

            modelBuilder.Entity<User>()
                .Property(e => e.Email)
                .IsUnicode(false);

            modelBuilder.Entity<User>()
                .HasMany(e => e.Books)
                .WithOptional(e => e.Author)
                .HasForeignKey(e => e.AuthorId);
        }
    }
}
