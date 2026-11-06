ALTER TABLE "Member"
ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "Member_username_key"
ON "Member"("username");
