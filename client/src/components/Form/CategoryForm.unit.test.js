import CategoryForm from './CategoryForm';
import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from "@testing-library/user-event";


describe('CategoryForm', () => {
    const mockHandleSubmit = jest.fn();
    const mockSetValue = jest.fn();
    const initialValue = '';

    beforeEach(() => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
    });

    it("is empty initially", () => {
        const inputElement = screen.getByPlaceholderText("Enter new category");
        expect(inputElement.value).toBe('');
    })

    it("allows 5 characters input", () => {
        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: 'ABCDE' } });
        expect(mockSetValue).toHaveBeenCalledWith('ABCDE');
    });

    it("allows 29 characters input", () => {
        const testString = 'A'.repeat(29);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: testString } });
        expect(mockSetValue).toHaveBeenCalledWith(testString);
    });

    it("allows 30 characters input", () => {
        const testString = 'A'.repeat(30);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: testString } });
        expect(mockSetValue).toHaveBeenCalledWith(testString);
    });

    it("does not allow 31 characters input", () => {
        const testString = 'A'.repeat(31);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: testString } });
        expect(mockSetValue).toHaveBeenCalledWith('A'.repeat(30));
    });

});

describe("text counter tests", () => {
    function Wrapper() {
        const [val, setVal] = React.useState("");
        return (
            <CategoryForm
                handleSubmit={jest.fn()}
                value={val}
                setValue={setVal}
            />
        );
    }

    beforeEach(() => {
        render(<Wrapper />);
    })

    it("char count displays correctly for empty input", () => {
        const charCount = screen.getByText("0/30");
        expect(charCount).toBeInTheDocument();
    });

    it("shows 10/30 for a string of length 10", () => {
        const str = "a".repeat(10);
        render(<CategoryForm handleSubmit={jest.fn()} value={str} setValue={jest.fn()} />);
        expect(screen.getByText("10/30")).toBeInTheDocument();
    });

    it("shows 30/30 for a string of length 30", () => {
        const str = "a".repeat(30);
        render(<CategoryForm handleSubmit={jest.fn()} value={str} setValue={jest.fn()} />);
        expect(screen.getByText("30/30")).toBeInTheDocument();
    });

    it("caps display at 30/30 for attempted input string of length 31", () => {
        const str = "a".repeat(31);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        // apparently fireEvent.change would override the maxLength attribute on the input element.
        waitFor(() => userEvent.type(inputElement, str));
        expect(screen.getByText("30/30")).toBeInTheDocument();
    });
})

describe("Create Category Submission test", () => {
    const mockHandleSubmit = jest.fn();
    const mockSetValue = jest.fn();
    const initialValue = '';

    beforeEach(() => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
    });

    it("calls handleSubmit on form submission", () => {
        const inputElement = screen.getByPlaceholderText("Enter new category");
        const submitButton = screen.getByRole("button", { name: /Submit/i });
        fireEvent.change(inputElement, { target: { value: "NewCategory" } });
        fireEvent.submit(submitButton);
        expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });
})