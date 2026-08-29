import { describe, expect, it } from "vitest";
import { formatDate, formatDateDdMmYyyyDash, formatDateTime } from "./format-date";

describe("formatDate", () => {
  it("keeps API DD-MM-YYYY as day-first (does not swap with US MM-DD)", () => {
    expect(formatDate("06-03-2000")).toBe("06/03/2000");
    expect(formatDate("11-06-2000")).toBe("11/06/2000");
    expect(formatDate("03-06-2000")).toBe("03/06/2000");
  });

  it("treats unpadded and slash DOB strings as dd/mm/yyyy", () => {
    expect(formatDate("6/3/2000")).toBe("06/03/2000");
    expect(formatDate("6-3-2000")).toBe("06/03/2000");
    expect(formatDate("06/03/2000")).toBe("06/03/2000");
  });

  it("converts ISO yyyy-mm-dd to dd/mm/yyyy without UTC shift", () => {
    expect(formatDate("2000-03-06")).toBe("06/03/2000");
    expect(formatDate("2000-06-11")).toBe("11/06/2000");
  });

  it("returns em dash for empty values", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("formatDateDdMmYyyyDash", () => {
  it("keeps day-first order with dashes", () => {
    expect(formatDateDdMmYyyyDash("06-03-2000")).toBe("06-03-2000");
    expect(formatDateDdMmYyyyDash("6/3/2000")).toBe("06-03-2000");
    expect(formatDateDdMmYyyyDash("2000-03-06")).toBe("06-03-2000");
  });
});

describe("formatDateTime", () => {
  it("does not invent a time or swap day/month for date-only DOB strings", () => {
    expect(formatDateTime("06-03-2000")).toBe("06/03/2000");
    expect(formatDateTime("6/3/2000")).toBe("06/03/2000");
  });
});
