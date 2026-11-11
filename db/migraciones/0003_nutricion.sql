CREATE TABLE "comidas_frecuentes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"kcal" integer NOT NULL,
	"proteina_g" real NOT NULL,
	"usos" integer DEFAULT 0 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metas_calorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"desde" date NOT NULL,
	"kcal" integer NOT NULL,
	"gasto_estimado" integer NOT NULL,
	"motivo" text NOT NULL,
	"creada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metas_calorias_desde_unique" UNIQUE("desde")
);
--> statement-breakpoint
CREATE TABLE "registros_comida" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"hora" timestamp with time zone DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"kcal" integer NOT NULL,
	"proteina_g" real NOT NULL,
	"frecuente_id" integer
);
--> statement-breakpoint
ALTER TABLE "registros_comida" ADD CONSTRAINT "registros_comida_frecuente_id_comidas_frecuentes_id_fk" FOREIGN KEY ("frecuente_id") REFERENCES "public"."comidas_frecuentes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registros_comida_fecha_idx" ON "registros_comida" USING btree ("fecha");