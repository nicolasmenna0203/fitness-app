CREATE TABLE "ejercicios" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"equipo" text NOT NULL,
	"grupo" text NOT NULL,
	"tipo_carga" text NOT NULL,
	"reps_min" smallint NOT NULL,
	"reps_max" smallint NOT NULL,
	"incremento_kg" real,
	"carga_max_kg" real,
	"nota" text,
	CONSTRAINT "ejercicios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entrenos" (
	"id" serial PRIMARY KEY NOT NULL,
	"plantilla_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"inicio" timestamp with time zone DEFAULT now() NOT NULL,
	"fin" timestamp with time zone,
	"liviana" boolean DEFAULT false NOT NULL,
	"estado" text DEFAULT 'en_curso' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantilla_ejercicios" (
	"plantilla_id" integer NOT NULL,
	"orden" smallint NOT NULL,
	"ejercicio_id" integer NOT NULL,
	"series" smallint NOT NULL,
	"descanso_seg" smallint DEFAULT 90 NOT NULL,
	CONSTRAINT "plantilla_ejercicios_plantilla_id_orden_pk" PRIMARY KEY("plantilla_id","orden")
);
--> statement-breakpoint
CREATE TABLE "plantillas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"orden" smallint NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "plantillas_orden_unique" UNIQUE("orden")
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" serial PRIMARY KEY NOT NULL,
	"entreno_id" integer NOT NULL,
	"ejercicio_id" integer NOT NULL,
	"numero" smallint NOT NULL,
	"kg" real,
	"reps" smallint NOT NULL,
	"hecha_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "series_unica" UNIQUE("entreno_id","ejercicio_id","numero")
);
--> statement-breakpoint
ALTER TABLE "entrenos" ADD CONSTRAINT "entrenos_plantilla_id_plantillas_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_ejercicios" ADD CONSTRAINT "plantilla_ejercicios_plantilla_id_plantillas_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantilla_ejercicios" ADD CONSTRAINT "plantilla_ejercicios_ejercicio_id_ejercicios_id_fk" FOREIGN KEY ("ejercicio_id") REFERENCES "public"."ejercicios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_entreno_id_entrenos_id_fk" FOREIGN KEY ("entreno_id") REFERENCES "public"."entrenos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_ejercicio_id_ejercicios_id_fk" FOREIGN KEY ("ejercicio_id") REFERENCES "public"."ejercicios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entrenos_fecha_idx" ON "entrenos" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "series_ejercicio_idx" ON "series" USING btree ("ejercicio_id");