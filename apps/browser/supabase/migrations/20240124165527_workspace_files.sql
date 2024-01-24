CREATE TABLE "public"."workspace_files" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "chat_id" "uuid" NOT NULL,
  "path" text NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE
);

ALTER TABLE
  "public"."workspace_files" enable ROW LEVEL SECURITY;

ALTER TABLE "public"."workspace_files"
  ADD CONSTRAINT unique_chat_id_path UNIQUE (chat_id, path);

CREATE INDEX workspace_files_chat_id_idx ON "public"."workspace_files" USING btree ("chat_id");

INSERT INTO "public"."workspace_files" ("chat_id", "path")
SELECT
  "path_tokens"[1]::uuid as "chat_id",
  "name" as "path"
from
  storage.objects
where
  bucket_id = 'workspaces';

CREATE POLICY "Users can only manage their own workspace_files" ON "public"."workspace_files"
USING (
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = chat_id AND
          chats.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = chat_id AND
          chats.user_id = auth.uid()
  )
)
