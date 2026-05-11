CREATE TYPE "public"."breed_profile_kind" AS ENUM('pure', 'composite', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."energy_level" AS ENUM('low', 'moderate', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."trainability" AS ENUM('moderate', 'high', 'very_high');--> statement-breakpoint
CREATE TABLE "breed_profile" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" "breed_profile_kind" DEFAULT 'pure' NOT NULL,
	"aka" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"group_name" text,
	"bred_for" text,
	"temperament" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"energy_level" "energy_level" DEFAULT 'moderate' NOT NULL,
	"trainability" "trainability" DEFAULT 'high' NOT NULL,
	"weight_kg_range" jsonb,
	"height_cm_range" jsonb,
	"lifespan_years_range" jsonb,
	"grooming_notes" text,
	"health_predispositions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"daily_exercise_target" text,
	"notes" text,
	"parent_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
