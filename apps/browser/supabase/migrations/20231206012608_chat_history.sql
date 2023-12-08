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
