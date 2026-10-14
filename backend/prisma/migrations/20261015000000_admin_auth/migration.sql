CREATE TYPE "AdminRole" AS ENUM ('MANAGER', 'STAFF');

CREATE TABLE "admins" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "AdminRole" NOT NULL,
    "created_by_admin_id" BIGINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE INDEX "admins_created_by_admin_id_idx" ON "admins"("created_by_admin_id");
CREATE INDEX "admins_role_idx" ON "admins"("role");

ALTER TABLE "admins" ADD CONSTRAINT "admins_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refresh_sessions" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "refresh_sessions" ADD COLUMN "admin_id" BIGINT;
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_owner_check"
    CHECK (("user_id" IS NOT NULL) <> ("admin_id" IS NOT NULL));

CREATE INDEX "refresh_sessions_admin_id_expires_at_idx" ON "refresh_sessions"("admin_id", "expires_at");
