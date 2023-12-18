ALTER TABLE "public"."variables" DROP CONSTRAINT "variables_chat_id_fkey";
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_chat_id_fkey";
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_chat_id_fkey";

ALTER TABLE "public"."variables" 
ADD FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;

ALTER TABLE "public"."messages" 
ADD FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;

ALTER TABLE "public"."logs" 
ADD FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;

ALTER TABLE "public"."chats"
ADD COLUMN "title" text;

UPDATE "public"."chats" c
SET "title" = (
    SELECT l."title"
    FROM "public"."logs" l
    WHERE l."chat_id" = c."id"
    ORDER BY l."created_at" ASC
    LIMIT 1
);

ALTER TABLE "public"."chats"
ALTER COLUMN "title" SET NOT NULL;