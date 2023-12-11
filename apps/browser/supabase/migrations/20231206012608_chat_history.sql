drop table roles CASCADE;
drop table chats CASCADE;
drop table messages CASCADE;

CREATE TABLE "public"."chats" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "user_id" "uuid" default auth.uid(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

alter table "public"."chats" enable row level security;

create table "public"."logs" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "created_at" timestamp with time zone not null default now(),
  "title" text not null,
  "content" text,
  "chat_id" uuid not null,
  "user" text not null,
  FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id")
);

alter table "public"."logs" enable row level security;

create table "public"."variables" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "key" text not null,
  "value" text not null,
  "chat_id" uuid not null,
  FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id")
);

alter table "public"."variables" enable row level security;

CREATE TABLE "public"."messages" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "chat_id" uuid NOT NULL,
  "content" "text",
  "name" "text",
  "function_call" "json",
  "temporary" boolean NOT NULL,
  "tool_call_id" "text",
  "tool_calls" json,
  "role" "text" NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id")
);

CREATE UNIQUE INDEX logs_pkey ON public.logs USING btree (id);

CREATE UNIQUE INDEX variables_pkey ON public.variables USING btree (id);

alter table "public"."logs" add constraint "logs_pkey" PRIMARY KEY using index "logs_pkey";

alter table "public"."variables" add constraint "variables_pkey" PRIMARY KEY using index "variables_pkey";

alter table "public"."logs" validate constraint "logs_chat_id_fkey";

alter table "public"."variables" validate constraint "variables_chat_id_fkey";

CREATE POLICY "Users can only manage their own chats" ON "public"."chats"
  USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

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