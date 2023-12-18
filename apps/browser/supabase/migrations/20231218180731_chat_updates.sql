-- Drop existing foreign keys
ALTER TABLE "public"."variables" DROP CONSTRAINT "variables_chat_id_fkey";
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_chat_id_fkey";
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_chat_id_fkey";

-- Add new foreign keys with DELETE ON CASCADE
ALTER TABLE "public"."variables" 
ADD FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;

ALTER TABLE "public"."messages" 
ADD FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;

ALTER TABLE "public"."logs" 
ADD FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;
