import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
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

    const renderPolicy = () => render(<Policy />);

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
        expect(img).toHaveStyle({ width: '100%' });
    });

    it("Renders Text", () => {
        renderPolicy();
        const paras = screen.getAllByText("add privacy policy");

        expect(paras).toHaveLength(7);
    });
});