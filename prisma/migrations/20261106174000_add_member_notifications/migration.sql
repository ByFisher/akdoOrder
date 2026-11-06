CREATE TABLE "MemberNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNOUNCEMENT',
    "readAt" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberNotification_memberId_readAt_createdAt_idx"
ON "MemberNotification"("memberId", "readAt", "createdAt");

CREATE INDEX "MemberNotification_orderId_idx"
ON "MemberNotification"("orderId");

ALTER TABLE "MemberNotification"
ADD CONSTRAINT "MemberNotification_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberNotification"
ADD CONSTRAINT "MemberNotification_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "DiningOrder"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
