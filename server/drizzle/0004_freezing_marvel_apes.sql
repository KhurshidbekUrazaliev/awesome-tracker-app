CREATE TABLE "room_items" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"url" text,
	"media" text[] DEFAULT '{}' NOT NULL,
	"due_at" timestamp with time zone,
	"checklist" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_members" (
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_members_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_items" ADD CONSTRAINT "room_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_items_room_id_idx" ON "room_items" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX "room_members_user_id_idx" ON "room_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rooms_owner_id_idx" ON "rooms" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "rooms_visibility_idx" ON "rooms" USING btree ("visibility");