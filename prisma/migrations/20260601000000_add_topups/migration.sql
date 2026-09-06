-- CreateEnum
CREATE TYPE "topup_status" AS ENUM ('CREATED', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "topups" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "entity_id" TEXT,
    "partner_user_ref" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'base',
    "asset" TEXT NOT NULL DEFAULT 'USDC',
    "fiat_currency" TEXT NOT NULL DEFAULT 'USD',
    "fiat_amount" DECIMAL(20, 8),
    "crypto_amount" DECIMAL(38, 18),
    "status" "topup_status" NOT NULL DEFAULT 'CREATED',
    "tx_hash" TEXT,
    "error_message" TEXT,
    "onramp_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topups_partner_user_ref_key" ON "topups"("partner_user_ref");

-- CreateIndex
CREATE INDEX "topups_user_id_created_at_idx" ON "topups"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "topups_destination_address_idx" ON "topups"("destination_address");
