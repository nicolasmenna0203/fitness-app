CREATE TABLE "actividades" (
	"id" serial PRIMARY KEY NOT NULL,
	"origen" text NOT NULL,
	"externo_id" text,
	"tipo" text NOT NULL,
	"nombre" text,
	"fecha" date NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"kcal" integer,
	"fc_media" smallint,
	"pasos" integer,
	"distancia_m" integer,
	"crudo" jsonb,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actividades_externoId_unique" UNIQUE("externo_id")
);
--> statement-breakpoint
CREATE TABLE "conexion_google" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"refresh_token_cifrado" text NOT NULL,
	"permisos" text NOT NULL,
	"conectado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ultima_sync" timestamp with time zone,
	"ultimo_error" text,
	CONSTRAINT "una_sola_conexion" CHECK ("conexion_google"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "metricas_diarias" (
	"fecha" date PRIMARY KEY NOT NULL,
	"pasos" integer,
	"kcal_activas" integer,
	"fc_reposo" smallint,
	"vfc_ms" real,
	"spo2_pct" real,
	"sueno_min" integer,
	"crudo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suenos" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"minutos_dormido" integer,
	"crudo" jsonb NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "actividades_fecha_idx" ON "actividades" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "suenos_fecha_idx" ON "suenos" USING btree ("fecha");