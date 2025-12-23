// Contact form field definitions
// Note: Using 'optional: true' consistently instead of 'required: false' to match bootstrap_inputs logic
const contact_fields = {
  name: {
    label: "Name",
    pattern: "^[a-zA-Z\\s'-]+$",
    title: "Name must contain only letters, spaces, hyphens and apostrophes",
  },
  position: {
    label: "Position",
    pattern: "^[a-zA-Z\\s'-]+$",
    title:
      "Position must contain only letters, spaces, hyphens and apostrophes",
  },
  email: { label: "Email", type: "email" },
  invoiceEmail: {
    label: "Invoice email (Optional)",
    type: "email",
    optional: true,
  },
  telephone: {
    label: "Telephone",
    type: "tel",
    pattern: "^(0|\\+?44)7\\d{9}$|^(0|\\+?44)1\\d{8,9}$",
    placeholder: "07123456789 or 01234567890",
    title: "UK mobile (07...) or landline (01...) number",
  },
};

const address = { label: "Address", type: "address" };
const name = {
  label: "Name",
  pattern: "^[a-zA-Z0-9\\s&'-\\.]+$",
  title:
    "Business name can contain letters, numbers, spaces, and common symbols",
};

const businessType = {
  limitedCompany: {
    name: "Limited Company",
    fields: {
      name,
      number: {
        label: "Number",
        placeholder: "01234567",
        pattern: "^[0-9]+$",
        title: "Company number must contain only digits",
      },
      address,
    },
  },
  soleTrader: {
    name: "Sole Trader",
    fields: { name, address },
  },
  partnership: {
    name: "Partnership",
    fields: {
      name,
      address,
      partners: { label: "Partner names" },
    },
  },
};

// Note: Using bootstrap_inputs function from spa.js to avoid code duplication

/**
 * PHARMACIST LIST EDITOR MODULE
 *
 * This module implements a dynamic pharmacist list editor with GPHC (General Pharmaceutical Council)
 * registration number validation. Each pharmacist entry requires:
 * - GPHC number: Exactly 7 digits (validated with regex pattern /^\d{7}$/)
 * - Full name: Text field for pharmacist's complete name
 *
 * HOW IT WORKS:
 * 1. User enters GPHC number (7 digits) and full name in input fields
 * 2. Click "Add Pharmacist" button triggers validation
 * 3. GPHC number is validated using regex pattern (must be exactly 7 digits)
 * 4. If valid, a new pharmacist-input component is created and added to the list
 * 5. Each entry displays as an input-group with GPHC number, name, and remove button
 * 6. Users can remove entries by clicking the trash icon button
 * 7. Form submission validates at least one pharmacist is in the list
 *
 * COMPONENTS:
 * - gphc-input: Validates and displays GPHC numbers (7 digits)
 * - pharmacist-input: Composite component combining GPHC input + name field + remove button
 * - List container (#pharmacists): Holds all pharmacist-input components
 *
 * VALIDATION RULES:
 * - GPHC must be exactly 7 digits (no letters, no spaces)
 * - Both GPHC and name fields are required before adding
 * - At least one pharmacist must be added before form submission
 * - Real-time validation with toast notifications for errors
 */

customElements.define(
  "business-application",
  class BusinessApplication extends HTMLElement {
    connectedCallback() {
      this.addEventListener("submit", this);
      this.addEventListener("click", this);
      this.viewChanged();
    }
    handleEvent(e) {
      if (e.target.name === "businessType") {
        this.businessType(e.target.value);
        return;
      }
      if (e.target.name === "remove") {
        e.target.parentNode.remove();
        return;
      }
      // Handle adding new pharmacy ODS code to the list
      const addButton = e.target.closest('button[name="add"]');
      if (addButton) {
        e.stopPropagation();
        const odsInput = this.querySelector("#ods");
        const nameInput = this.querySelector("#pharmacy-name");

        // Validate ODS format before adding (2-3 letters followed by 2-3 digits)
        const odsPattern = /^[a-zA-Z]{2,3}\d{2,3}$/;
        // Validate pharmacy name - letters, numbers, spaces, and common symbols
        const namePattern = /^[a-zA-Z0-9\s&'-\.]+$/;

        if (!odsInput.value || !nameInput.value) {
          if (!odsInput.value) odsInput.focus();
          else nameInput.focus();
          return;
        }

        if (!odsPattern.test(odsInput.value)) {
          odsInput.focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message: "Invalid ODS code format. Use format: AB123",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        if (!namePattern.test(nameInput.value)) {
          nameInput.focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message:
                  "Invalid pharmacy name. Use only letters, numbers, and common symbols",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        // ODS and name are valid, add the pharmacy
        this.querySelector(
          "#pharmacies"
        ).innerHTML += `<pharmacy-ods-input ods="${odsInput.value}" name="${nameInput.value}"></pharmacy-ods-input>`;
        odsInput.value = "";
        nameInput.value = "";
        return;
      }
      // Handle adding new pharmacist to the list with GPHC number and name
      // Uses e.target.closest() to properly detect button clicks even when clicking child elements (icon)
      // e.stopPropagation() prevents event bubbling and multiple handler triggers
      const addPharmacistButton = e.target.closest(
        'button[name="add-pharmacist"]'
      );
      if (addPharmacistButton) {
        e.stopPropagation();
        const gphcInput = this.querySelector("#gphc");
        const nameInput = this.querySelector("#pharmacist-name");

        // Validate GPHC format before adding (exactly 7 digits)
        // GPHC (General Pharmaceutical Council) registration numbers are always 7 digits
        const gphcPattern = /^\d{7}$/;
        // Validate pharmacist name - only letters, spaces, hyphens, and apostrophes
        const namePattern = /^[a-zA-Z\s'-]+$/;

        if (!gphcInput.value || !nameInput.value) {
          if (!gphcInput.value) gphcInput.focus();
          else nameInput.focus();
          return;
        }

        if (!gphcPattern.test(gphcInput.value)) {
          // Invalid GPHC number - show toast notification and focus input
          gphcInput.focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message: "Invalid GPHC number. Must be exactly 7 digits",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        if (!namePattern.test(nameInput.value)) {
          nameInput.focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message:
                  "Invalid name. Use only letters, spaces, hyphens and apostrophes",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        // GPHC and name are valid - create new pharmacist-input component and add to list
        // The component will render with GPHC input, name field, and remove button
        this.querySelector(
          "#pharmacists"
        ).innerHTML += `<pharmacist-input gphc="${gphcInput.value}" name="${nameInput.value}"></pharmacist-input>`;
        // Clear input fields for next entry
        gphcInput.value = "";
        nameInput.value = "";
        return;
      }

      if (e.type === "submit") {
        e.preventDefault();
        const id = this.getAttribute("k");
        const data = new FormData(e.target);
        if (id) data.id = id;

        // Validate business type is selected by checking if business fieldset has input elements
        if (!this.querySelector("#business input")) {
          this.querySelector("[name=businessType]").focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message: "Please select a business type",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        // Validate at least one pharmacy ODS code is added to the list
        const odsInputs = this.querySelectorAll(
          "#pharmacies input[name='ods']"
        );
        if (odsInputs.length === 0) {
          this.querySelector("#ods").focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message: "Please add at least one pharmacy ODS code",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        // Validate at least one pharmacist is added to the list
        const pharmacistInputs = this.querySelectorAll(
          "#pharmacists input[name='gphc']"
        );
        if (pharmacistInputs.length === 0) {
          this.querySelector("#gphc").focus();
          dispatchEvent(
            new CustomEvent("toast-error", {
              detail: {
                message: "Please add at least one registered pharmacist",
                style: "text-bg-warning",
              },
            })
          );
          return;
        }

        const detail = {
          type: id ? "business-accept" : "business-application",
          data,
        };
        this.dispatchEvent(
          new CustomEvent("journal-post", { bubbles: true, detail })
        );
        // Show success toast after form submission
        dispatchEvent(
          new CustomEvent("toast-success", {
            detail: {
              message: "Application submitted successfully!",
              style: "text-bg-success",
            },
          })
        );
        // Reset form to initial state for next submission
        this.viewChanged();
      }
    }
    businessType(type, values) {
      // Render business type fields when selected, with or without existing values
      const businessFieldset = this.querySelector("#business");
      businessFieldset.innerHTML = `<legend><i class="bi bi-briefcase"></i> Business Information</legend>${bootstrap_inputs(
        businessType[type].fields,
        values
      )}`;
    }
    viewChanged() {
      const values = {};
      this.innerHTML = `<form>
	<h4 class="text-center mb-4"><i class="bi bi-building"></i> Business Application</h4>
	<div class="btn-group btn-group-toggle w-100 mb-4" data-bs-toggle="buttons">
		${Object.entries(businessType).reduce(
      (a, [k, v]) => `${a}
	<input type="radio" class="btn-check" name="businessType" id="${k}" value="${k}" required ${
        values?.businessType === k ? "checked" : ""
      }>
	<label class="btn btn-outline-primary flex-fill" for="${k}">${v.name}</label>`,
      ""
    )}
	</div>
	<fieldset id=business name=business>
		<legend><i class="bi bi-briefcase"></i> Business Information</legend>
	</fieldset>
	<fieldset name=contact>
		<legend><i class="bi bi-person-badge"></i> Contact</legend>
		${bootstrap_inputs(contact_fields, values?.contact)}
	</fieldset>
	<legend><i class="bi bi-shop"></i> Pharmacies</legend>
	<div class="text-muted small mb-2">Add the ODS codes for pharmacies in your network</div>
	<fieldset id=pharmacies class="mb-2">
		${
      values?.ods?.reduce(
        (a, v) =>
          `${a}<pharmacy-ods-input ods="${v.ods}" name="${v.name}"></pharmacy-ods-input>`,
        ""
      ) ?? ""
    }
	</fieldset>
	<div class="input-group mb-3">
		<input class="form-control form-control-sm" id="ods" form="" placeholder="ODS code (e.g., AB123)" title="5-6 character ODS code">
		<input class="form-control form-control-sm" id="pharmacy-name" form="" placeholder="Pharmacy name" pattern="^[a-zA-Z0-9\\s&'-\\.]+$" title="Letters, numbers, spaces, and common symbols only">
		<button type=button class="btn btn-success btn-sm" name=add><i class="bi bi-plus-lg"></i></button>
	</div>
	<legend><i class="bi bi-heart-pulse"></i> Pharmacists</legend>
	<div class="text-muted small mb-2">Add registered pharmacists with their GPHC registration numbers</div>
	<fieldset id=pharmacists class="mb-2">
		${
      values?.pharmacists?.reduce(
        (a, v) =>
          `${a}<pharmacist-input gphc="${v.gphc}" name="${v.name}"></pharmacist-input>`,
        ""
      ) ?? ""
    }
	</fieldset>
	<div class="input-group mb-3">
		<input class="form-control form-control-sm" id="gphc" form="" placeholder="GPHC number" pattern="\\d{7}" maxlength="7" size="7" title="7 digit GPHC number">
		<input class="form-control form-control-sm" id="pharmacist-name" form="" placeholder="Full name" pattern="^[a-zA-Z\\s'-]+$" title="Letters, spaces, hyphens and apostrophes only">
		<button type=button class="btn btn-success btn-sm" name=add-pharmacist><i class="bi bi-plus-lg"></i></button>
	</div>
	<button type="submit" class="btn btn-primary btn-lg w-100 mt-4"><i class="bi bi-send-fill"></i> ${
    values ? "Accept" : "Submit Application"
  }</button>
</form>`;
      // Only restore business type fields if there's a valid businessType value
      if (values?.businessType) {
        this.businessType(values.businessType, values.business);
      }
    }
    result({ reply, error, target }) {
      if (!reply.length || error) {
        dispatchEvent(
          new CustomEvent("toast-error", {
            detail: { message: "Error", style: "text-bg-danger" },
          })
        );
        return;
      }
      this.innerHTML = `<div class="alert alert-success m-5" role="alert">Your application has been posted. Our team will contact you with the next steps</div>`;

      dispatchEvent(
        new CustomEvent("toast-success", {
          detail: { message: "Sent", style: "text-bg-success" },
        })
      );
      target.remove();
    }
  }
);

customElements.define(
  "ods-input",
  class ODSInput extends HTMLElement {
    connectedCallback() {
      this.addEventListener("change", this);
      this.innerHTML = `<input class="form-control" name="ods" value="${
        this.getAttribute("ods") ?? ""
      }" size=6 maxlength="6" placeholder="ODS code">`;
      this.validate();
    }
    handleEvent(e) {
      this.validate();
    }
    validate() {
      const pattern = /^[a-zA-Z]{2,3}\d{2,3}$/;
      const input = this.querySelector("input");
      const ods = input.value;
      input.setCustomValidity("");
      if (!pattern.test(ods)) {
        input.setCustomValidity("Please correct the format: AB123");
        input.reportValidity();
        return;
      }
      this.dispatchEvent(
        new CustomEvent("ods", { detail: ods, bubbles: true })
      );
    }
  }
);

/**
 * GPHC Input Component
 *
 * Custom web component for validating GPHC (General Pharmaceutical Council) registration numbers.
 * GPHC numbers are unique 7-digit identifiers assigned to registered pharmacists in the UK.
 *
 * Validation: Enforces exactly 7 digits using regex pattern /^\d{7}$/
 * Features: Real-time validation, custom validity messages, event dispatching
 */
customElements.define(
  "gphc-input",
  class GPHCInput extends HTMLElement {
    connectedCallback() {
      this.addEventListener("change", this);
      this.innerHTML = `<input class="form-control" name="gphc" value="${
        this.getAttribute("gphc") ?? ""
      }" size="7" maxlength="7" placeholder="GPHC number" pattern="\\d{7}" title="7 digit GPHC number" required>`;
      this.validate();
    }
    handleEvent(e) {
      this.validate();
    }
    validate() {
      // GPHC numbers must be exactly 7 digits
      const pattern = /^\d{7}$/;
      const input = this.querySelector("input");
      const gphc = input.value;
      input.setCustomValidity("");
      if (gphc && !pattern.test(gphc)) {
        input.setCustomValidity("GPHC number must be exactly 7 digits");
        input.reportValidity();
        return;
      }
      if (pattern.test(gphc)) {
        this.dispatchEvent(
          new CustomEvent("gphc", { detail: gphc, bubbles: true })
        );
      }
    }
  }
);

/**
 * Pharmacist Input Component
 *
 * Composite component that combines:
 * - gphc-input: For GPHC registration number (7 digits)
 * - name input: For pharmacist's full name
 * - remove button: To delete the pharmacist from the list
 *
 * This component is dynamically created when users add pharmacists to the list.
 * Each instance represents one registered pharmacist in the application.
 */
customElements.define(
  "pharmacist-input",
  class PharmacistInput extends HTMLElement {
    connectedCallback() {
      const gphc = this.getAttribute("gphc");
      const name = this.getAttribute("name");
      this.classList.add("input-group", "mb-2");
      this.innerHTML = `
        <gphc-input gphc="${gphc ?? ""}"></gphc-input>
        <input class="form-control" name="pharmacist-name" value="${
          name ?? ""
        }" placeholder="Full name" required>
        <button type="button" class="btn btn-danger" name="remove" title="Remove pharmacist"><i class="bi bi-trash"></i></button>`;
    }
  }
);

customElements.define(
  "pharmacy-ods-input",
  class PharmacyOdsInput extends HTMLElement {
    connectedCallback() {
      const ods = this.getAttribute("ods");
      const name = this.getAttribute("name");
      this.addEventListener("change", this);
      this.classList.add("input-group", "mb-2");
      this.innerHTML = `<ods-input ods="${
        ods ?? ""
      }" placeholder="ODS code"></ods-input>
		<input class="form-control" name="pharmacy-name" value="${
      name ?? ""
    }" placeholder="Pharmacy name" required>
		<button type=button class="btn btn-danger" name="remove" title="Remove pharmacy"><i class="bi bi-trash"></i></button>`;
    }
  }
);

customElements.define(
  "pharmacy-list-editor",
  class PharmacyListEditor extends HTMLElement {
    // TODO finish to use in busiess application
    connectedCallback() {
      this.addEventListener("click", this);
      this.innerHTML = `<fieldset data-id=list class="mb-3"></fieldset>
	<div class="input-group mb-3">
		<pharmacy-list-editor></pharmacy-list-editor>
		<button type=button class="btn btn-primary" name=add>Add pharmacy</button>
	</div>`;
    }
    handleEvent(e) {
      if (e.target.name === "remove") {
        e.target.parentNode.remove();
        return;
      }
      if (e.target.name === "add") {
        const input = this.querySelector("#ods");
        this.querySelector(
          "[data-id='list']"
        ).innerHTML += `<pharmacy-ods-input ods="${input.value}"></pharmacy-ods-input>`;
        input.value = "";
      }
    }
    reset() {
      this.querySelector("fieldset").replaceChildren();
    }
  }
);
