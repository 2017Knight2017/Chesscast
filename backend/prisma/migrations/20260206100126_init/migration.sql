-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "pgn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movesData" JSONB,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);
