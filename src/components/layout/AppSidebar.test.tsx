import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, adminGroups } from "@/components/layout/AppSidebar";

function renderSidebar(path = "/") {
  return render(
    <RoleProvider>
      <MemoryRouter initialEntries={[path]}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    </RoleProvider>,
  );
}

describe("AppSidebar admin groups", () => {
  it("groups location, profile, and education masters in order", () => {
    expect(adminGroups.map((g) => g.label)).toEqual([
      "Overview",
      "Organisation",
      "Billing",
      "Location",
      "Profile masters",
      "Education and work",
      "Insights",
      "System",
    ]);

    const byLabel = Object.fromEntries(adminGroups.map((g) => [g.label, g.items.map((i) => i.title)]));
    expect(byLabel.Location).toEqual(["Country", "State", "District", "City"]);
    expect(byLabel["Profile masters"]).toEqual(["Religion", "Caste", "Mother Tongue"]);
    expect(byLabel["Education and work"]).toEqual(["Education", "Education Subject", "Occupation"]);
  });

  it("opens the active group and highlights the current master link", () => {
    renderSidebar("/caste");

    expect(screen.getByRole("button", { name: /profile masters/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /^location$/i })).toHaveAttribute("aria-expanded", "false");

    const casteLink = screen.getByRole("link", { name: /caste/i });
    expect(casteLink).toHaveAttribute("href", "/caste");
    expect(casteLink.className).toContain("text-sidebar-primary");
  });

  it("toggles a group independently when its header is clicked", () => {
    renderSidebar("/caste");

    expect(screen.queryByRole("link", { name: /^country$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^location$/i }));

    expect(screen.getByRole("button", { name: /^location$/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /^country$/i })).toHaveAttribute("href", "/country");
    expect(screen.getByRole("link", { name: /caste/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^location$/i }));
    expect(screen.getByRole("button", { name: /^location$/i })).toHaveAttribute("aria-expanded", "false");
  });
});
