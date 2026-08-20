CREATE TYPE "public"."BatchStageEnum" AS ENUM('seed', 'prick', 'pot', 'plant');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('USER', 'MANAGER', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."SeasonEnum" AS ENUM('winter', 'spring', 'summer', 'autumn');--> statement-breakpoint
CREATE TABLE "allotments" (
	"id" serial PRIMARY KEY NOT NULL,
	"batchId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"seasonId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"speciesId" integer NOT NULL,
	"quantity" integer,
	"notes" text,
	"nurseryId" integer NOT NULL,
	"origin" text,
	"stage" "BatchStageEnum",
	"isOrder" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nurseries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organisationId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisation_species" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisationId" integer NOT NULL,
	"speciesId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "organisation_species_organisationId_speciesId_unique" UNIQUE("organisationId","speciesId")
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"siteId" integer NOT NULL,
	"organisationId" integer NOT NULL,
	"year" integer NOT NULL,
	"season" "SeasonEnum" NOT NULL,
	"notes" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_siteId_year_season_unique" UNIQUE("siteId","year","season")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"coordinates" text,
	"area" numeric(10, 2),
	"owner" text,
	"type" text,
	"notes" text,
	"organisationId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"botanicalName" text,
	"commonName" text,
	"maoriName" text,
	"threatenedSpecies" boolean DEFAULT false NOT NULL,
	"treesThatCount" boolean DEFAULT false NOT NULL,
	"notes" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"organisationId" integer NOT NULL,
	"role" "Role" DEFAULT 'USER' NOT NULL,
	"tokenVersion" integer DEFAULT 0 NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"invitationToken" text,
	"invitationExpires" timestamp (3),
	"notes" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_invitationToken_unique" UNIQUE("invitationToken")
);
--> statement-breakpoint
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_batchId_batches_id_fk" FOREIGN KEY ("batchId") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_seasonId_seasons_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_speciesId_species_id_fk" FOREIGN KEY ("speciesId") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_nurseryId_nurseries_id_fk" FOREIGN KEY ("nurseryId") REFERENCES "public"."nurseries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurseries" ADD CONSTRAINT "nurseries_organisationId_organisations_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_species" ADD CONSTRAINT "organisation_species_organisationId_organisations_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_species" ADD CONSTRAINT "organisation_species_speciesId_species_id_fk" FOREIGN KEY ("speciesId") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_siteId_sites_id_fk" FOREIGN KEY ("siteId") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_organisationId_organisations_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organisationId_organisations_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organisationId_organisations_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;