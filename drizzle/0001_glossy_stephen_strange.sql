CREATE TABLE "verification_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" uuid,
	"result" varchar(30) NOT NULL,
	"matcher_id" varchar(64),
	"score" numeric,
	"good_match_count" integer,
	"inlier_count" integer,
	"inlier_ratio" numeric,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credentials" DROP CONSTRAINT "credentials_token_unique";--> statement-breakpoint
ALTER TABLE "credentials" ALTER COLUMN "feature_payload" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "public_token_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "passcode_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "passcode_hint" varchar(32);--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "status" varchar(20) DEFAULT 'reserved' NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "secret_ciphertext" "bytea";--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "secret_iv" "bytea";--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "secret_auth_tag" "bytea";--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "secret_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "matcher_id" varchar(64) DEFAULT 'orb-hamming-ransac-v1';--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "reserve_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_credential_id_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "credentials" DROP COLUMN "secret";--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_public_token_hash_unique" UNIQUE("public_token_hash");--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_passcode_hash_unique" UNIQUE("passcode_hash");