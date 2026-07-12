import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  EMPTY_SCHOOL_ADMIN_ENTRY,
  SchoolAdminEntryForm,
  schoolAdminEntryToPayload,
  validateSchoolAdminEntry,
  type SchoolAdminEntryValue,
} from "../../src/components/schools/SchoolAdminEntryForm";

const t = (key: string) => key;

function Harness(props: { initial?: Partial<SchoolAdminEntryValue> }) {
  const [value, setValue] = useState<SchoolAdminEntryValue>({
    ...EMPTY_SCHOOL_ADMIN_ENTRY,
    ...props.initial,
  });
  return (
    <SchoolAdminEntryForm
      value={value}
      onChange={setValue}
      t={t}
      title="Administrateur"
      testIDPrefix="admin-entry"
    />
  );
}

describe("SchoolAdminEntryForm", () => {
  it("defaults to email mode and shows the email field", () => {
    render(<Harness />);
    expect(screen.getByTestId("admin-entry-email")).toBeTruthy();
    expect(screen.queryByTestId("admin-entry-phone")).toBeNull();
  });

  it("switches to phone mode and shows phone + pin fields", () => {
    render(<Harness />);
    fireEvent.press(screen.getByTestId("admin-entry-mode-phone"));
    expect(screen.getByTestId("admin-entry-phone")).toBeTruthy();
    expect(screen.getByTestId("admin-entry-pin")).toBeTruthy();
    expect(screen.queryByTestId("admin-entry-email")).toBeNull();
  });

  it("normalizes phone input to digits only", () => {
    render(<Harness initial={{ mode: "phone" }} />);
    const phoneInput = screen.getByTestId("admin-entry-phone");
    fireEvent.changeText(phoneInput, "699-00 11.22");
    expect(phoneInput.props.value).toBe("699001122");
  });

  it("caps PIN input at 6 digits and strips non-digits", () => {
    render(<Harness initial={{ mode: "phone" }} />);
    const pinInput = screen.getByTestId("admin-entry-pin");
    fireEvent.changeText(pinInput, "12a3456789");
    expect(pinInput.props.value).toBe("123456");
  });

  it("calls onRemove when the remove button is pressed", () => {
    const onRemove = jest.fn();
    render(
      <SchoolAdminEntryForm
        value={EMPTY_SCHOOL_ADMIN_ENTRY}
        onChange={jest.fn()}
        t={t}
        title="Administrateur 2"
        onRemove={onRemove}
        testIDPrefix="admin-entry-2"
      />,
    );
    fireEvent.press(screen.getByTestId("admin-entry-2-remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render a remove button when onRemove is not provided", () => {
    render(<Harness />);
    expect(screen.queryByTestId("admin-entry-remove")).toBeNull();
  });

  it("displays field-level errors when provided", () => {
    render(
      <SchoolAdminEntryForm
        value={EMPTY_SCHOOL_ADMIN_ENTRY}
        onChange={jest.fn()}
        t={t}
        title="Administrateur"
        testIDPrefix="admin-entry"
        errors={{ email: "schoolsAdmin.form.errors.emailRequired" }}
      />,
    );
    expect(screen.getByTestId("admin-entry-email-error")).toBeTruthy();
  });
});

describe("schoolAdminEntryToPayload", () => {
  it("returns an email payload when mode is email and email is filled", () => {
    expect(
      schoolAdminEntryToPayload({
        mode: "email",
        email: " admin@school.cm ",
        phone: "",
        pin: "",
      }),
    ).toEqual({ email: "admin@school.cm" });
  });

  it("returns null when mode is email and email is blank", () => {
    expect(
      schoolAdminEntryToPayload({
        mode: "email",
        email: "  ",
        phone: "",
        pin: "",
      }),
    ).toBeNull();
  });

  it("returns a phone payload when mode is phone and both phone and pin are filled", () => {
    expect(
      schoolAdminEntryToPayload({
        mode: "phone",
        email: "",
        phone: "699001122",
        pin: "123456",
      }),
    ).toEqual({ phone: "699001122", pin: "123456" });
  });

  it("returns null when mode is phone and pin is missing", () => {
    expect(
      schoolAdminEntryToPayload({
        mode: "phone",
        email: "",
        phone: "699001122",
        pin: "",
      }),
    ).toBeNull();
  });
});

describe("validateSchoolAdminEntry", () => {
  it("flags a missing email in email mode", () => {
    const errors = validateSchoolAdminEntry(
      { mode: "email", email: "", phone: "", pin: "" },
      t,
    );
    expect(errors.email).toBe("schoolsAdmin.form.errors.emailRequired");
  });

  it("flags an invalid email in email mode", () => {
    const errors = validateSchoolAdminEntry(
      { mode: "email", email: "not-an-email", phone: "", pin: "" },
      t,
    );
    expect(errors.email).toBe("schoolsAdmin.form.errors.emailInvalid");
  });

  it("flags a missing phone and invalid pin in phone mode", () => {
    const errors = validateSchoolAdminEntry(
      { mode: "phone", email: "", phone: "", pin: "12" },
      t,
    );
    expect(errors.phone).toBe("schoolsAdmin.form.errors.phoneRequired");
    expect(errors.pin).toBe("schoolsAdmin.form.errors.pinInvalid");
  });

  it("returns no errors for a valid phone entry", () => {
    const errors = validateSchoolAdminEntry(
      { mode: "phone", email: "", phone: "699001122", pin: "123456" },
      t,
    );
    expect(errors).toEqual({});
  });

  it("returns no errors for a valid email entry", () => {
    const errors = validateSchoolAdminEntry(
      { mode: "email", email: "admin@school.cm", phone: "", pin: "" },
      t,
    );
    expect(errors).toEqual({});
  });
});
