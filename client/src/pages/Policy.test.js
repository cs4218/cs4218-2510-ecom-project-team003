import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Policy from "./Policy";

jest.mock("../components/Layout", () => ({ title, children }) => (
    <div data-testid="layout">
        <h1 data-testid="title">{title}</h1>
        {children}
    </div>
));

describe("Policy Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderPolicy = () => render(
        <MemoryRouter>
            <Policy />
        </MemoryRouter>
    );

    it("Renders Layout with Title", () => {
        renderPolicy();
        const layout = screen.getByTestId("layout");
        const title = screen.getByTestId("title");

        expect(layout).toBeInTheDocument();
        expect(title).toHaveTextContent("Privacy Policy");
    });

    it("Renders Image", () => {
        renderPolicy();
        const img = screen.getByAltText("contactus");

        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
    });

    it("Renders Text", () => {
        renderPolicy();

        expect(screen.getByText("We collect only the data needed to manage your account and orders.")).toBeInTheDocument();
        expect(screen.getByText("Your information is stored securely and encrypted where possible.")).toBeInTheDocument();
        expect(screen.getByText("We never sell your personal data to third parties.")).toBeInTheDocument();
        expect(screen.getByText("We use cookies to improve the site and remember your preferences.")).toBeInTheDocument();
        expect(screen.getByText("You can access, update, or delete your data at any time.")).toBeInTheDocument();
        expect(screen.getByText("We share data only with trusted providers for payments and delivery.")).toBeInTheDocument();
        expect(screen.getByText("Contact us with any privacy questions or concerns.")).toBeInTheDocument();
    });
});