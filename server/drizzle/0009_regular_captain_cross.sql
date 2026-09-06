ALTER TABLE "listings" ADD COLUMN "location_lat" double precision;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_lng" double precision;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_city" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_region" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_country" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_country_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_lat" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_lng" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_region" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_country_code" text;