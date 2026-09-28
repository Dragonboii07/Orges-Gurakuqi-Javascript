-- Table used by the app. Run once against your database.
CREATE TABLE Persons (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    firstname         VARCHAR(100) NOT NULL,
    lastname          VARCHAR(100) NOT NULL,
    birthdate         DATE         NOT NULL,
    gender            CHAR(1)      NOT NULL CHECK (gender IN ('M', 'F')),
    firstRegistration DATE         NOT NULL,
    celular           VARCHAR(50)  NOT NULL,
    email             VARCHAR(200) NOT NULL,
    phone             VARCHAR(50)  NOT NULL
);
