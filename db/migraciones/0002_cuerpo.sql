CREATE TABLE "perfil" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"peso_meta_kg" real NOT NULL,
	"fecha_meta" date NOT NULL,
	"peso_inicial_kg" real NOT NULL,
	"proteina_g_por_kg" real DEFAULT 1.8 NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "un_solo_perfil" CHECK ("perfil"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "pesajes" (
	"fecha" date PRIMARY KEY NOT NULL,
	"kg" real NOT NULL,
	"origen" text NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportes_balanza" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"kg" real NOT NULL,
	"grasa_pct" real,
	"masa_muscular_kg" real,
	"musculo_esqueletico_kg" real,
	"agua_pct" real,
	"grasa_visceral" real,
	"basal_kcal" integer,
	"valores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reportes_balanza_fecha_idx" ON "reportes_balanza" USING btree ("fecha");