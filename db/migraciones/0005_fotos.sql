CREATE TABLE "fotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"pose" text NOT NULL,
	"mime" text NOT NULL,
	"ancho" smallint NOT NULL,
	"alto" smallint NOT NULL,
	"datos" text NOT NULL,
	"creada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fotos_fecha_idx" ON "fotos" USING btree ("fecha");