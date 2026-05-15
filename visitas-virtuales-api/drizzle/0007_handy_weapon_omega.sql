ALTER TABLE "poi_history" DROP CONSTRAINT "poi_history_poi_id_pois_id_fk";
--> statement-breakpoint
ALTER TABLE "poi_history" ALTER COLUMN "details" SET NOT NULL;