-- CreateTable
CREATE TABLE "crop_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "greenhouse_id" TEXT NOT NULL,
    "greenhouse_name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "color" TEXT DEFAULT '#28a745',
    "batch_number" INTEGER,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
