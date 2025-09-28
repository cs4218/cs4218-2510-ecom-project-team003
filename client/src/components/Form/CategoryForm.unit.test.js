import CategoryForm from './CategoryForm';
import React from 'react';
import {render, screen, fireEvent, act} from '@testing-library/react';
import userEvent from "@testing-library/user-event";


describe('CategoryForm', () => {
    const mockHandleSubmit = jest.fn();
    const mockSetValue = jest.fn();
    const initialValue = '';
    it("is empty initially", () => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
        const inputElement = screen.getByPlaceholderText("Enter new category");
        expect(inputElement.value).toBe('');
    })

    it("allows 5 characters input", () => {render(
        <CategoryForm
            handleSubmit={mockHandleSubmit}
            value={initialValue}
            setValue={mockSetValue}
        />
    );

        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: 'ABCDE' } });
        expect(mockSetValue).toHaveBeenCalledWith('ABCDE');
    });

    it("allows 29 characters input", () => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
        const testString = 'A'.repeat(29);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: testString } });
        expect(mockSetValue).toHaveBeenCalledWith(testString);
    });

    it("allows 30 characters input", () => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
        const testString = 'A'.repeat(30);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(inputElement, { target: { value: testString } });
        expect(mockSetValue).toHaveBeenCalledWith(testString);
    });

    it("does not allow 31 characters input", () => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
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

    const originalError = console.error;
    beforeAll(() => {
        console.error = (...args) => {
            if (/not wrapped in act/.test(args[0])) return; // swallow unreasonable act warnings
            originalError.call(console, ...args);
        };
    });

    afterAll(() => {
        console.error = originalError;
    });

    it("char count displays correctly for empty input", () => {
        render(<Wrapper />);
        const charCount = screen.getByText("0/30");
        expect(charCount).toBeInTheDocument();
    });

    it("shows 10/30 for a string of length 10", () => {
        render(<Wrapper />);
        const str = "a".repeat(10);
        render(<CategoryForm handleSubmit={jest.fn()} value={str} setValue={jest.fn()} />);
        expect(screen.getByText("10/30")).toBeInTheDocument();
    });

    it("shows 30/30 for a string of length 30", () => {
        render(<Wrapper />);
        const str = "a".repeat(30);
        render(<CategoryForm handleSubmit={jest.fn()} value={str} setValue={jest.fn()} />);
        expect(screen.getByText("30/30")).toBeInTheDocument();
    });

    it("caps display at 30/30 for attempted input string of length 31", async () => {
        render(<Wrapper />);
        const str = "a".repeat(31);
        const inputElement = screen.getByPlaceholderText("Enter new category");
        // apparently fireEvent.change would override the maxLength attribute on the input element.
        await act(() => userEvent.type(inputElement, str));
        expect(screen.getByText("30/30")).toBeInTheDocument();
    });
})

describe("Create Category Submission test", () => {
    const mockHandleSubmit = jest.fn();
    const mockSetValue = jest.fn();
    const initialValue = '';

    it("calls handleSubmit on form submission", () => {
        render(
            <CategoryForm
                handleSubmit={mockHandleSubmit}
                value={initialValue}
                setValue={mockSetValue}
            />
        );
        const inputElement = screen.getByPlaceholderText("Enter new category");
        const submitButton = screen.getByRole("button", { name: /Submit/i });
        fireEvent.change(inputElement, { target: { value: "NewCategory" } });
        fireEvent.submit(submitButton);
        expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });
})