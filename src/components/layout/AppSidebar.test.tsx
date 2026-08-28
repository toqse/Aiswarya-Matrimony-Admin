import { render, screen } from "@testing-library/react";
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

  it("renders group labels and highlights the active master link", () => {
    renderSidebar("/caste");

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Profile masters")).toBeInTheDocument();
    expect(screen.getByText("Education and work")).toBeInTheDocument();

    const casteLink = screen.getByRole("link", { name: /caste/i });
    expect(casteLink).toHaveAttribute("href", "/caste");
    expect(casteLink.className).toContain("text-sidebar-primary");

    const countryLink = screen.getByRole("link", { name: /country/i });
    expect(countryLink.className).not.toContain("text-sidebar-primary");
  });
});
