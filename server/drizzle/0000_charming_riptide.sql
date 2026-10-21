CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"text_enc" text NOT NULL,
	"highlights_enc" text NOT NULL,
	"depression" smallint NOT NULL,
	"anxiety" smallint NOT NULL,
	"meaning" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_scores_range" CHECK ("entries"."depression" between 0 and 100 and "entries"."anxiety" between 0 and 100 and "entries"."meaning" between 0 and 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "entries_user_date_idx" ON "entries" USING btree ("user_id","entry_date");