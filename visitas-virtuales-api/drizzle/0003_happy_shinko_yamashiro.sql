CREATE TABLE "poi_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"poi_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_center_id_centers_id_fk";
--> statement-breakpoint
ALTER TABLE "poi_history" ADD CONSTRAINT "poi_history_poi_id_pois_id_fk" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poi_history" ADD CONSTRAINT "poi_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "center_id";