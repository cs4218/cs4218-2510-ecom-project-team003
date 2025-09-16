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
        const footer = document.querySelector(".footer");
        expect(footer).toBeInTheDocument();

        const text = footer.textContent.replace(/\s+/g, "");
        expect(text).toMatch(/About\|Contact\|PrivacyPolicy/);
    });

    /**
     * Verifies that the three labels are present and that there are exactly three links in the footer.
     */
    it("Renders Link Labels And Exact Count", () => {
        renderFooter();

        expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Privacy Policy" })
        ).toBeInTheDocument();

        const footer = document.querySelector(".footer");
        const linksInFooter = within(footer).getAllByRole("link");
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