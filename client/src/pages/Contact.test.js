import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Contact from "./Contact";

jest.mock("../components/Layout", () => ({ children, title }) => (
    <div data-testid="layout">
        <h1 data-testid="title">{title}</h1>
        {children}
    </div>
));

jest.mock("react-icons/bi", () => ({
    BiMailSend: () => { return <span data-testid="icon-mail" /> },
    BiPhoneCall: () => { return <span data-testid="icon-phone" /> },
    BiSupport: () => { return <span data-testid="icon-support" /> },
}));

describe("Contact Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderContact = () =>
        render(
            <MemoryRouter>
                <Contact />
            </MemoryRouter>
        );

    it("Renders Layout with Title", () => {
        renderContact();
        const layout = screen.getByTestId("layout");
        const title = screen.getByTestId("title");

        expect(layout).toBeInTheDocument();
        expect(title).toHaveTextContent("Contact us");
    });

    it("Renders Image", () => {
        renderContact();
        const img = screen.getByAltText("contactus");

        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
    });

    it("Renders Heading", () => {
        renderContact();
        expect(screen.getByText("CONTACT US")).toBeInTheDocument();
    });

    it("Renders Introduction Text", () => {
        renderContact();
        expect(
            screen.getByText(/For any query or info about product, feel free to call anytime\. We are\s*available 24X7\./i)
        ).toBeInTheDocument();
    });

    it("Renders Contact Details", () => {
        renderContact();

        expect(screen.getByText(/www\.help@ecommerceapp\.com/i)).toBeInTheDocument();
        expect(screen.getByText(/012-3456789/)).toBeInTheDocument();
        expect(screen.getByText(/1800-0000-0000 \(toll free\)/i)).toBeInTheDocument();

        expect(screen.getByTestId("icon-mail")).toBeInTheDocument();
        expect(screen.getByTestId("icon-phone")).toBeInTheDocument();
        expect(screen.getByTestId("icon-support")).toBeInTheDocument();
    });
});