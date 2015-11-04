Select * from tblUsers;
Select * from tblBooks;

DROP TABLE tblUsers;
DROP TABLE tblBooks;

CREATE TABLE tblUsers 
(
	Id BINARY(16) PRIMARY KEY,
	UserName VARCHAR(100),
	Password VARCHAR(200),
	Email VARCHAR(200),
	RegistrationDate DATETIME,
	RetryAttempts INT,
	IsLocked INT,
	LockedDateTime DATETIME
);

CREATE TABLE tblBooks 
(
  Id BINARY(16) PRIMARY KEY,
  Title VARCHAR(100),
  Category VARCHAR(100),
  Description TEXT,
  AuthorId BINARY(16),
  Thumbnail VARCHAR(255),
  AdditionDate DATETIME,
  IsPublic BIT,
  FOREIGN KEY (AuthorId) REFERENCES tblUsers(Id)
);

DELIMITER //

CREATE FUNCTION UuidToBin(_uuid BINARY(36))
  RETURNS BINARY(16)
  LANGUAGE SQL DETERMINISTIC CONTAINS SQL SQL SECURITY INVOKER
RETURN
  UNHEX(CONCAT(
    SUBSTR(_uuid, 15, 4),
    SUBSTR(_uuid, 10, 4),
    SUBSTR(_uuid,  1, 8),
    SUBSTR(_uuid, 20, 4),
    SUBSTR(_uuid, 25) ));

CREATE FUNCTION UuidFromBin(_bin BINARY(16))
  RETURNS BINARY(36)
  LANGUAGE SQL DETERMINISTIC CONTAINS SQL SQL SECURITY INVOKER
RETURN
  LCASE(CONCAT_WS('-',
    HEX(SUBSTR(_bin,  5, 4)),
    HEX(SUBSTR(_bin,  3, 2)),
    HEX(SUBSTR(_bin,  1, 2)),
    HEX(SUBSTR(_bin,  9, 2)),
    HEX(SUBSTR(_bin, 11))
  ));

//

DELIMITER ;

-- Sample database

-- USERS
INSERT INTO tblUsers (tblUsers.Id, tblUsers.UserName, tblUsers.Password, tblUsers.Email, tblUsers.RegistrationDate, tblUsers.RetryAttempts, tblUsers.IsLocked, tblUsers.LockedDateTime) 
  VALUES (UuidToBin("748cea8f-80be-11e5-87be-d43d7ef137da"), "rvnlord", "lU80CJOjak3avac/ekz/6KsNmDP4emkviKRSl6uYobrZpQ2ACrycpFNOhmWLZiTUh5qqaUfb75GXn+J8GBVfNmBiM+s=", "rvnlord@gmail.com", "2014-10-27 18:54:55", 1, 0, null);

-- BOOKS
INSERT INTO tblBooks (tblBooks.Id, tblBooks.Title, tblBooks.Category, tblBooks.Description, tblBooks.AuthorId, tblBooks.Thumbnail, tblBooks.AdditionDate, tblBooks.IsPublic)
  VALUES (UuidToBin("231f4f0c-80be-11e5-87be-d43d7ef137da"), "Dzieñ Smoka", "Fantastyka", "ksi¹¿ka w œwiecie Warcrafta", UuidToBin("748cea8f-80be-11e5-87be-d43d7ef137da"), "~/Data/Books/231f4f0c-80be-11e5-87be-d43d7ef137da/Cover.jpg", "2015-11-01 22:52:47", 1);
INSERT INTO tblBooks (tblBooks.Id, tblBooks.Title, tblBooks.Category, tblBooks.Description, tblBooks.AuthorId, tblBooks.Thumbnail, tblBooks.AdditionDate, tblBooks.IsPublic)
  VALUES (UuidToBin("d91aabca-8314-11e5-91da-d43d7ef137da"), "Noc Smoka", "Fantastyka", "Kolejna ksi¹¿ka w œwiecie Warcrafta", UuidToBin("748cea8f-80be-11e5-87be-d43d7ef137da"), "~/Data/Books/d91aabca-8314-11e5-91da-d43d7ef137da/Cover.jpg", "2015-11-04 22:53:47", 1);
INSERT INTO tblBooks (tblBooks.Id, tblBooks.Title, tblBooks.Category, tblBooks.Description, tblBooks.AuthorId, tblBooks.Thumbnail, tblBooks.AdditionDate, tblBooks.IsPublic)
  VALUES (UuidToBin("e039cc94-8315-11e5-91da-d43d7ef137da"), "Ostatni Stra¿nik", "Fantastyka", "Jeszcze jedna ksi¹¿ka w œwiecie Warcrafta", UuidToBin("748cea8f-80be-11e5-87be-d43d7ef137da"), "~/Data/Books/e039cc94-8315-11e5-91da-d43d7ef137da/Cover.jpg", "2015-11-04 22:54:47", 1);
INSERT INTO tblBooks (tblBooks.Id, tblBooks.Title, tblBooks.Category, tblBooks.Description, tblBooks.AuthorId, tblBooks.Thumbnail, tblBooks.AdditionDate, tblBooks.IsPublic)
  VALUES (UuidToBin("bd4cff46-8316-11e5-91da-d43d7ef137da"), "W³adca Klanów", "Fantastyka", "Jeszcze jedna ksi¹¿ka w œwiecie Warcrafta", UuidToBin("748cea8f-80be-11e5-87be-d43d7ef137da"), "~/Data/Books/bd4cff46-8316-11e5-91da-d43d7ef137da/Cover.jpg", "2015-11-04 22:54:47", 1);
INSERT INTO tblBooks (tblBooks.Id, tblBooks.Title, tblBooks.Category, tblBooks.Description, tblBooks.AuthorId, tblBooks.Thumbnail, tblBooks.AdditionDate, tblBooks.IsPublic)
  VALUES (UuidToBin("261f79ef-8317-11e5-91da-d43d7ef137da"), "Studnia Wiecznoœci", "Fantastyka", "Jeszcze jedna ksi¹¿ka w œwiecie Warcrafta", UuidToBin("748cea8f-80be-11e5-87be-d43d7ef137da"), "~/Data/Books/261f79ef-8317-11e5-91da-d43d7ef137da/Cover.jpg", "2015-11-04 22:54:47", 1);


DELETE FROM tblBooks WHERE tblBooks.Id = UuidToBin("261f79ef-8317-11e5-91da-d43d7ef137da");

SELECT * FROM tblBooks b;

Select UUID();
SELECT NOW();

UPDATE tblBooks 
  SET tblBooks.IsPublic = 0 
  WHERE tblBooks.Id = UuidToBin("261f79ef-8317-11e5-91da-d43d7ef137da");

ALTER TABLE tblBooks CHANGE ThumbnailPath Thumbnail VARCHAR(257)
