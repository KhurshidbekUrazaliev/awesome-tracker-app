CREATE TABLE "rental_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"renter_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"rental_fee_cents" integer NOT NULL,
	"deposit_amount_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"deposit_resolution" text,
	"deposit_claimed_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "price_per_day_cents" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "deposit_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "currency" text DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_renter_id_users_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_bookings_listing_id_status_idx" ON "rental_bookings" USING btree ("listing_id","status");