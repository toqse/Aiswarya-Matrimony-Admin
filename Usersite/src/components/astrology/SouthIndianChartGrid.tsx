"use client";

import { cn, formatDateDdMmYyyy, formatTimeOfBirthDisplay } from "@/lib/utils";
import {
  dasaDurationMalayalam,
  grahaNameMalayalam,
  ml,
  nakshatraNameMalayalam,
  rasiNameMalayalam,
} from "@/lib/malayalam/horoscopeDisplayMl";
import type { MatchChartPersonJson } from "@/lib/astrologyApi";
import {
  normalizeChartPlanetsMap,
  SOUTH_INDIAN_CELL_RC,
  SOUTH_INDIAN_GRID_SIGNS,
} from "./southIndianChartLayout";

export interface SouthIndianChartGridProps {
  person: MatchChartPersonJson;
  /** e.g. matri id + Bride/Groom */
  headerLine?: string;
  className?: string;
}

export function SouthIndianChartGrid({
  person,
  headerLine,
  className,
}: SouthIndianChartGridProps) {
  const planets = normalizeChartPlanetsMap(person.planets);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-primary/20 bg-card p-2 sm:p-3 shadow-sm font-ml",
        className,
      )}
    >
      {headerLine ? (
        <p className="text-center text-[11px] font-mono text-muted-foreground truncate px-1">
          {headerLine}
        </p>
      ) : null}
      <div className="mx-auto w-full max-w-[min(100%,300px)] aspect-square">
        <div
          className="grid h-full w-full grid-cols-4 grid-rows-4 gap-px rounded-md border border-primary/25 bg-primary/15 p-px"
          style={{ gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 1fr)" }}
        >
          {SOUTH_INDIAN_GRID_SIGNS.map((sign, i) => {
            const rc = SOUTH_INDIAN_CELL_RC[i];
            const bodies = planets[sign] ?? [];
            return (
              <div
                key={sign}
                className="flex min-h-0 min-w-0 flex-col border border-primary/10 bg-background/95 p-0.5 sm:p-1"
                style={{ gridRow: rc.row, gridColumn: rc.col }}
              >
                <span className="text-[9px] font-semibold tracking-tight text-primary/80 leading-none truncate text-center">
                  {rasiNameMalayalam(sign)}
                </span>
                <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {bodies.length === 0 ? (
                    <span className="text-[8px] text-muted-foreground/50">—</span>
                  ) : (
                    bodies.map((label, bi) => (
                      <span
                        key={`${sign}-${bi}-${label}`}
                        className="text-[9px] sm:text-[10px] font-medium leading-tight text-foreground truncate"
                        title={label}
                      >
                        {label}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <div
            className="flex flex-col items-center justify-center gap-0.5 border border-primary/20 bg-muted/40 px-1 py-1 text-center"
            style={{ gridRow: "2 / 4", gridColumn: "2 / 4" }}
          >
            <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-2">
              {person.name?.trim() || "—"}
            </p>
            {person.date_of_birth?.trim() ? (
              <p className="text-[9px] text-muted-foreground leading-tight">
                {ml.dob}: {formatDateDdMmYyyy(person.date_of_birth)}
              </p>
            ) : null}
            {person.time_of_birth?.trim() ? (
              <p className="text-[9px] text-muted-foreground leading-tight">
                {ml.tob}: {formatTimeOfBirthDisplay(person.time_of_birth)}
              </p>
            ) : null}
            {person.place_of_birth?.trim() ? (
              <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2">
                {ml.pob}: {person.place_of_birth.trim()}
              </p>
            ) : null}
            {person.nakshatra ? (
              <p className="text-[9px] text-muted-foreground leading-tight">
                {nakshatraNameMalayalam(person.nakshatra)}
                {person.nakshatra_pada != null
                  ? ` · ${ml.padaLabel(person.nakshatra_pada)}`
                  : ""}
              </p>
            ) : null}
            {person.dasa_balance || person.dasa_lord ? (
              <p className="text-[9px] text-foreground leading-tight">
                {person.dasa_lord ? (
                  <span className="font-medium">
                    {ml.dasaLord}: {grahaNameMalayalam(person.dasa_lord)}
                  </span>
                ) : null}
                {person.dasa_balance ? (
                  <span className="block text-muted-foreground">
                    {ml.dasa}: {dasaDurationMalayalam(person.dasa_balance)}
                  </span>
                ) : null}
              </p>
            ) : null}
            {(person.lagna || person.rasi) && (
              <p className="text-[8px] text-muted-foreground leading-tight">
                {[
                  person.lagna
                    ? `${ml.lagna}: ${rasiNameMalayalam(person.lagna)}`
                    : null,
                  person.rasi
                    ? `${ml.rasiShort}: ${rasiNameMalayalam(person.rasi)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
