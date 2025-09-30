import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Footer from "./Footer";

describe("Footer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderFooter = () =>
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

    it("Renders Footer Text", () => {
        renderFooter();
        expect(
            screen.getByText("All Rights Reserved © TestingComp")
        ).toBeInTheDocument();
    });

    /**
     * Verifies that the three-footer links are separated by (|).
     */
    it("Renders Separator Between Links", () => {
        renderFooter();

        const footerRegion = screen.getByTestId("footer");
        expect(footerRegion).toHaveTextContent(
            /About\s*\|\s*Contact\s*\|\s*Privacy\s*Policy/i
        );
    });

    /**
     * Verifies that the three labels are present and that there are exactly three links in the footer.
     */
    it("Renders Link Labels And Exact Count", () => {
        renderFooter();
        const footerRegion = screen.getByTestId("footer");

        expect(
            within(footerRegion).getByRole("link", { name: "About" })
        ).toBeInTheDocument();
        expect(
            within(footerRegion).getByRole("link", { name: "Contact" })
        ).toBeInTheDocument();
        expect(
            within(footerRegion).getByRole("link", { name: "Privacy Policy" })
        ).toBeInTheDocument();

        const linksInFooter = within(footerRegion).getAllByRole("link");
        expect(linksInFooter).toHaveLength(3);
    });
    
    it("Renders Correct Link URLs", () => {
        renderFooter();

        expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
            "href",
            "/about"
        );
        expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
            "href",
            "/contact"
        );
        expect(
            screen.getByRole("link", { name: "Privacy Policy" })
        ).toHaveAttribute("href", "/policy");
    });
});