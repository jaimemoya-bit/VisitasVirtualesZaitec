CREATE TYPE "public"."user_roles" AS ENUM('admin', 'teacher', 'student');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student'::"public"."user_roles";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_roles" USING "role"::"public"."user_roles";--> statement-breakpoint
CREATE UNIQUE INDEX "pois_name_center_unique" ON "pois" USING btree ("name","center_id");