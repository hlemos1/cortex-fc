CREATE TYPE "public"."agent_type" AS ENUM('ORACLE', 'ANALISTA', 'SCOUT', 'BOARD_ADVISOR', 'CFO_MODELER', 'COACHING_ASSIST');--> statement-breakpoint
CREATE TYPE "public"."cortex_decision" AS ENUM('CONTRATAR', 'BLINDAR', 'MONITORAR', 'EMPRESTIMO', 'RECUSAR', 'ALERTA_CINZA');--> statement-breakpoint
CREATE TYPE "public"."position_cluster" AS ENUM('GK', 'CB', 'FB', 'DM', 'CM', 'AM', 'W', 'ST');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'scout_individual', 'club_professional', 'holding_multiclub');--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" "agent_type" NOT NULL,
	"input_context" jsonb NOT NULL,
	"output_result" jsonb,
	"model_used" text NOT NULL,
	"tokens_used" integer,
	"duration_ms" integer,
	"success" boolean DEFAULT true,
	"error" text,
	"user_id" uuid,
	"org_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"country" text NOT NULL,
	"league_id" uuid,
	"logo_url" text,
	"stadium_name" text,
	"founded_year" integer,
	"external_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"tier" integer DEFAULT 1,
	"external_id" text
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_club_id" uuid NOT NULL,
	"away_club_id" uuid NOT NULL,
	"season_id" uuid,
	"match_date" timestamp NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"competition" text,
	"round" text,
	"external_id" text,
	"stats_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "neural_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"club_context_id" uuid NOT NULL,
	"season_id" uuid,
	"vx" real NOT NULL,
	"rx" real NOT NULL,
	"vx_components" jsonb NOT NULL,
	"rx_components" jsonb NOT NULL,
	"c1_technical" real NOT NULL,
	"c2_tactical" real NOT NULL,
	"c3_physical" real NOT NULL,
	"c4_behavioral" real NOT NULL,
	"c5_narrative" real NOT NULL,
	"c6_economic" real NOT NULL,
	"c7_ai" real NOT NULL,
	"ast" real,
	"clf" real,
	"gne" real,
	"wse" real,
	"rbl" real,
	"sace" real,
	"scn_plus" real,
	"decision" "cortex_decision" NOT NULL,
	"confidence" real NOT NULL,
	"reasoning" text NOT NULL,
	"recommended_actions" jsonb,
	"risks" jsonb,
	"comparables" jsonb,
	"analyst_id" uuid,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "player_match_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"minutes_played" integer,
	"goals" integer DEFAULT 0,
	"assists" integer DEFAULT 0,
	"xg" real,
	"xa" real,
	"shots" integer DEFAULT 0,
	"shots_on_target" integer DEFAULT 0,
	"passes" integer DEFAULT 0,
	"pass_accuracy" real,
	"tackles" integer DEFAULT 0,
	"interceptions" integer DEFAULT 0,
	"duels_won" integer DEFAULT 0,
	"duels_total" integer DEFAULT 0,
	"dribbles" integer DEFAULT 0,
	"fouls" integer DEFAULT 0,
	"yellow_cards" integer DEFAULT 0,
	"red_cards" integer DEFAULT 0,
	"rating" real,
	"position" text,
	"stats_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"full_name" text,
	"nationality" text NOT NULL,
	"second_nationality" text,
	"date_of_birth" timestamp,
	"age" integer,
	"height" integer,
	"weight" integer,
	"preferred_foot" text,
	"position_cluster" "position_cluster" NOT NULL,
	"position_detail" text,
	"current_club_id" uuid,
	"market_value" real,
	"contract_until" timestamp,
	"salary" real,
	"photo_url" text,
	"external_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"org_id" uuid,
	"content" jsonb,
	"html_content" text,
	"pdf_url" text,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scouting_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'watching',
	"notes" text,
	"target_price" real,
	"analysis_id" uuid,
	"added_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"league_id" uuid
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"from_club_id" uuid,
	"to_club_id" uuid,
	"fee" real,
	"transfer_date" timestamp NOT NULL,
	"transfer_type" text,
	"contract_years" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"org_id" uuid,
	"role" text DEFAULT 'analyst' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_club_id_clubs_id_fk" FOREIGN KEY ("home_club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_club_id_clubs_id_fk" FOREIGN KEY ("away_club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neural_analyses" ADD CONSTRAINT "neural_analyses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neural_analyses" ADD CONSTRAINT "neural_analyses_club_context_id_clubs_id_fk" FOREIGN KEY ("club_context_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neural_analyses" ADD CONSTRAINT "neural_analyses_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neural_analyses" ADD CONSTRAINT "neural_analyses_analyst_id_users_id_fk" FOREIGN KEY ("analyst_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_current_club_id_clubs_id_fk" FOREIGN KEY ("current_club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_targets" ADD CONSTRAINT "scouting_targets_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_targets" ADD CONSTRAINT "scouting_targets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_targets" ADD CONSTRAINT "scouting_targets_analysis_id_neural_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."neural_analyses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_targets" ADD CONSTRAINT "scouting_targets_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_club_id_clubs_id_fk" FOREIGN KEY ("from_club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_club_id_clubs_id_fk" FOREIGN KEY ("to_club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ar_agent" ON "agent_runs" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "idx_ar_created" ON "agent_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_na_player" ON "neural_analyses" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_na_club" ON "neural_analyses" USING btree ("club_context_id");--> statement-breakpoint
CREATE INDEX "idx_na_decision" ON "neural_analyses" USING btree ("decision");--> statement-breakpoint
CREATE INDEX "idx_pms_player" ON "player_match_stats" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_pms_match" ON "player_match_stats" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_players_club" ON "players" USING btree ("current_club_id");--> statement-breakpoint
CREATE INDEX "idx_players_position" ON "players" USING btree ("position_cluster");--> statement-breakpoint
CREATE INDEX "idx_players_nationality" ON "players" USING btree ("nationality");