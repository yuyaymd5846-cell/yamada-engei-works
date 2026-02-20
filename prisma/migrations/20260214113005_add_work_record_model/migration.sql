-- CreateTable
CREATE TABLE "work_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_name" TEXT NOT NULL,
    "greenhouse_name" TEXT NOT NULL,
    "area_acre" REAL NOT NULL,
    "spent_time" REAL NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
