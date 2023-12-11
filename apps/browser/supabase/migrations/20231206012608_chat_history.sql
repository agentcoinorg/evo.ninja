drop table roles CASCADE;

create table "public"."logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "content" text,
    "chat_id" uuid not null,
    "user" text not null
);

alter table "public"."logs" enable row level security;

create table "public"."variables" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" text not null,
    "value" text not null,
    "chat_id" uuid not null
);

alter table "public"."variables" enable row level security;

alter table "public"."chats" alter column "id" drop identity;
alter table "public"."chats" add column "new_id" uuid;
update "public"."chats" set "new_id" = uuid_generate_v4();
alter table "public"."chats" drop column "id" cascade;
alter table "public"."chats" rename column "new_id" to "id";
alter table "public"."chats" add primary key ("id");
alter table "public"."chats" alter column "id" set default gen_random_uuid();


alter table "public"."messages" alter column "id" drop identity;
alter table "public"."messages" add column "new_id" uuid;
update "public"."messages" set "new_id" = uuid_generate_v4();
alter table "public"."messages" drop column "id" cascade;
alter table "public"."messages" rename column "new_id" to "id";
alter table "public"."messages" add primary key ("id");
alter table "public"."messages" alter column "id" set default gen_random_uuid();


alter table "public"."messages" add column "temporary" boolean not null;

alter table "public"."messages" add column "tool_call_id" text;

alter table "public"."messages" add column "tool_calls" json;

alter table "public"."messages" alter column "role" type text using "role"::text;
alter table "public"."messages" drop column "chat_id";
alter table "public"."messages" add column "chat_id" uuid not null;

alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) not valid;

CREATE UNIQUE INDEX logs_pkey ON public.logs USING btree (id);

CREATE UNIQUE INDEX variables_pkey ON public.variables USING btree (id);

alter table "public"."logs" add constraint "logs_pkey" PRIMARY KEY using index "logs_pkey";

alter table "public"."variables" add constraint "variables_pkey" PRIMARY KEY using index "variables_pkey";

alter table "public"."logs" add constraint "logs_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) not valid;

alter table "public"."logs" validate constraint "logs_chat_id_fkey";

alter table "public"."variables" add constraint "variables_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) not valid;

alter table "public"."variables" validate constraint "variables_chat_id_fkey";

CREATE POLICY "Users can only manage their own messages" ON "public"."messages" USING ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "messages"."chat_id") AND ("chats"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "messages"."chat_id") AND ("chats"."user_id" = "auth"."uid"())))));

CREATE POLICY "Users can only manage their own logs" ON "public"."logs" USING ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "logs"."chat_id") AND ("chats"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "logs"."chat_id") AND ("chats"."user_id" = "auth"."uid"())))));

CREATE POLICY "Users can only manage their own variables" ON "public"."variables" USING ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "variables"."chat_id") AND ("chats"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chats"
  WHERE (("chats"."id" = "variables"."chat_id") AND ("chats"."user_id" = "auth"."uid"())))));

alter table "public"."chats" alter column "user_id" set default auth.uid();

insert into storage.buckets
  (id, name, public)
values
  ('workspaces', 'workspaces', false);

CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'workspaces' AND
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = (storage.foldername(name))[1]::uuid AND
          chats.user_id = auth.uid()
  )
);