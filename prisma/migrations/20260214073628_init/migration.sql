-- CreateTable
CREATE TABLE "work_manual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "timing_standard" TEXT NOT NULL,
    "input_parameters" TEXT NOT NULL,
    "action_steps" TEXT NOT NULL,
    "risk_if_not_done" TEXT NOT NULL,
    "impact_on_quality" TEXT NOT NULL,
    "impact_on_yield" TEXT NOT NULL,
    "impact_on_yield_profit" TEXT NOT NULL,
    "required_time_10a" REAL NOT NULL,
    "difficulty_level" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
