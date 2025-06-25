-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "user" TEXT,
    "reportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_reportId_idx" ON "Activity"("reportId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "ReportShare_reportId_idx" ON "ReportShare"("reportId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
