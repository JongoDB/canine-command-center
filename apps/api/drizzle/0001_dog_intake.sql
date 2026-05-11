CREATE TYPE "public"."breed_kind" AS ENUM('pure', 'mix', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."dog_sex" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."dog_source" AS ENUM('breeder', 'shelter', 'rescue', 'stray', 'bred_by_me', 'gift', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."neuter_status" AS ENUM('intact', 'neutered', 'spayed', 'unknown');--> statement-breakpoint
CREATE TABLE "dog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"breed_kind" "breed_kind" DEFAULT 'unknown' NOT NULL,
	"breed_primary" text,
	"breed_secondary" text,
	"breed_is_guess" boolean DEFAULT false NOT NULL,
	"sex" "dog_sex" DEFAULT 'unknown' NOT NULL,
	"neuter_status" "neuter_status" DEFAULT 'unknown' NOT NULL,
	"neutered_on" date,
	"birth_date" date,
	"birth_date_is_estimate" boolean DEFAULT false NOT NULL,
	"weight_kg" real,
	"color" text,
	"microchip" text,
	"source" "dog_source" DEFAULT 'unknown' NOT NULL,
	"acquired_on" date,
	"acquired_at_age_weeks" integer,
	"notes" text,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dog_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "intake_dog_version_unique" UNIQUE("dog_id","version")
);
--> statement-breakpoint
ALTER TABLE "dog" ADD CONSTRAINT "dog_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_response" ADD CONSTRAINT "intake_response_dog_id_dog_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_response" ADD CONSTRAINT "intake_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;