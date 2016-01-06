using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.Spatial;


namespace MVCDemo.Models
{
    [Table("project.tblusers")]
    public sealed class User
    {
        [SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public User()
        {
            Books = new HashSet<Book>();
        }
        
        //public byte[] IdBinary { get; private set; }

        //[NotMapped]
        public Guid Id { get; set; }

        [StringLength(100)]
        public string UserName { get; set; }
        
        [StringLength(200)]
        public string Password { get; set; }
        
        [StringLength(200)]
        public string Email { get; set; }

        public DateTime? RegistrationDate { get; set; }

        public int? RetryAttempts { get; set; }

        public int? IsLocked { get; set; }

        public DateTime? LockedDateTime { get; set; }

        [SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        //[JsonIgnore]
        public ICollection<Book> Books { get; set; }
    }
}
