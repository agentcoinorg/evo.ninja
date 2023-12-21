DROP TABLE roles CASCADE;

DROP TABLE chats CASCADE;

DROP TABLE messages CASCADE;

ALTER TABLE "public"."goals" ADD COLUMN chat_id uuid;

CREATE TABLE "public"."chats" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL,
  "user_id" "uuid" DEFAULT auth.uid(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

ALTER TABLE
  "public"."chats" enable ROW LEVEL SECURITY;

CREATE TABLE "public"."logs" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "created_at" timestamp WITH time zone NOT NULL DEFAULT NOW(),
  "title" text NOT NULL,
  "content" text,
  "chat_id" uuid NOT NULL,
  "user" text NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id")
);

ALTER TABLE
  "public"."logs" enable ROW LEVEL SECURITY;

CREATE TABLE "public"."variables" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "key" text NOT NULL,
  "value" text NOT NULL,
  "chat_id" uuid NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id")
);

ALTER TABLE
  "public"."variables" enable ROW LEVEL SECURITY;

CREATE TABLE "public"."messages" (
  "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
  "created_at" timestamp WITH time zone DEFAULT "now"() NOT NULL,
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

ALTER TABLE
  "public"."messages" enable ROW LEVEL SECURITY;

CREATE INDEX messages_chat_id_idx ON public.messages USING btree (chat_id);

CREATE INDEX logs_chat_id_idx ON public.logs USING btree (chat_id);

CREATE INDEX variables_chat_id_idx ON public.variables USING btree (chat_id);

CREATE POLICY "Users can only manage their own chats" ON "public"."chats" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can only manage their own messages" ON "public"."messages" USING (
  (
    EXISTS (
      SELECT
        1
      FROM
        "public"."chats"
      WHERE
        (
          ("chats"."id" = "messages"."chat_id")
          AND ("chats"."user_id" = "auth"."uid"())
        )
    )
  )
) WITH CHECK (
  (
    EXISTS (
      SELECT
        1
      FROM
        "public"."chats"
      WHERE
        (
          ("chats"."id" = "messages"."chat_id")
          AND ("chats"."user_id" = "auth"."uid"())
        )
    )
  )
);

CREATE POLICY "Users can only manage their own logs" ON "public"."logs" USING (
  (
    EXISTS (
      SELECT
        1
      FROM
        "public"."chats"
      WHERE
        (
          ("chats"."id" = "logs"."chat_id")
          AND ("chats"."user_id" = "auth"."uid"())
        )
    )
  )
) WITH CHECK (
  (
    EXISTS (
      SELECT
        1
      FROM
        "public"."chats"
      WHERE
        (
          ("chats"."id" = "logs"."chat_id")
          AND ("chats"."user_id" = "auth"."uid"())
        )
    )
  )
);

CREATE POLICY "Users can only manage their own variables" ON "public"."variables" USING (
  (
    EXISTS (
      SELECT
        1
      FROM
        "public"."chats"
      WHERE
        (
          ("chats"."id" = "variables"."chat_id")
          AND ("chats"."user_id" = "auth"."uid"())
        )
    )
  )
) WITH CHECK (
  (
    EXISTS (
      SELECT
        1
      FROM
        "public"."chats"
      WHERE
        (
          ("chats"."id" = "variables"."chat_id")
          AND ("chats"."user_id" = "auth"."uid"())
        )
    )
  )
);