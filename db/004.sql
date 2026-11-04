CREATE TABLE habit_days (
 item INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
 day TEXT NOT NULL, amount REAL NOT NULL CHECK(amount>=0),
 unit TEXT NOT NULL, target REAL NOT NULL CHECK(target>0),
 PRIMARY KEY(item,day)
);
PRAGMA user_version=4;
