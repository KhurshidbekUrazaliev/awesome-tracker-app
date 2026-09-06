CREATE TABLE "auction_bids" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"bidder_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "starting_bid_cents" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "auction_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "current_bid_cents" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "current_bidder_id" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_bidder_id_users_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auction_bids_listing_id_created_at_idx" ON "auction_bids" USING btree ("listing_id","created_at");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_current_bidder_id_users_id_fk" FOREIGN KEY ("current_bidder_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_type_status_ends_at_idx" ON "listings" USING btree ("type","status","auction_ends_at");