// Contact form field definitions
// Note: Using 'optional: true' consistently instead of 'required: false' to match bootstrap_inputs logic
const contact_fields = {
  name: { label: "Name" },
  position: { label: "Position" },
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
const name = { label: "Name" };

const businessType = {
  limitedCompany: {
    name: "Limited Company",
    fields: {
      name,
      number: { label: "Number", placeholder: "01234567" },
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
      if (e.target.name === "add") {
        const input = this.querySelector("#ods");
        this.querySelector(
          "#pharmacies"
        ).innerHTML += `<pharmacy-ods-input ods="${input.value}"></pharmacy-ods-input>`;
        input.value = "";
        return;
      }
      // Handle adding new pharmacist to the list with GPHC number and name
      if (e.target.name === "add-pharmacist") {
        const gphcInput = this.querySelector("#gphc");
        const nameInput = this.querySelector("#pharmacist-name");
        if (gphcInput.value && nameInput.value) {
          this.querySelector(
            "#pharmacists"
          ).innerHTML += `<pharmacist-input gphc="${gphcInput.value}" name="${nameInput.value}"></pharmacist-input>`;
          gphcInput.value = "";
          nameInput.value = "";
        }
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
      }
    }
    businessType(type, values) {
      // Render business type fields when selected, with or without existing values
      const businessFieldset = this.querySelector("#business");
      businessFieldset.innerHTML = `<legend>Business Information</legend>${bootstrap_inputs(
        businessType[type].fields,
        values
      )}`;
    }
    viewChanged() {
      const values = {};
      this.innerHTML = `<form>
<div class="btn-group btn-group-toggle w-100 mb-3" data-bs-toggle="buttons">
		${Object.entries(businessType).reduce(
      (a, [k, v]) => `${a}
<input type="radio" class="btn-check" name="businessType" id="${k}" value="${k}" required ${
        values?.businessType === k ? "checked" : ""
      }>
<label class="btn btn-outline-primary btn-lg flex-fill" for="${k}">${
        v.name
      }</label>`,
      ""
    )}
</div>
	<fieldset id=business name=business>
		<legend>Business Information</legend>
	</fieldset>
	<fieldset name=contact>
		<legend>Contact</legend>
		${bootstrap_inputs(contact_fields, values?.contact)}
	</fieldset>
	<legend>Pharmacies</legend>
	<div class="text-muted small mb-2">Add the ODS codes for pharmacies in your network</div>
	<fieldset id=pharmacies class="mb-3">
		${
      values?.ods?.reduce(
        (a, v) => `${a}<pharmacy-ods-input ods="${v}"></pharmacy-ods-input>`,
        ""
      ) ?? ""
    }
	</fieldset>
	<div class="input-group mb-3">
		<input class="form-control" id="ods" form="" placeholder="ODS code (e.g., AB123)" title="5-6 character ODS code">
		<button type=button class="btn btn-primary" name=add><i class="bi bi-plus-circle"></i> Add pharmacy</button>
	</div>
	<legend>Pharmacists</legend>
	<div class="text-muted small mb-2">Add registered pharmacists with their GPHC registration numbers</div>
	<fieldset id=pharmacists class="mb-3">
		${
      values?.pharmacists?.reduce(
        (a, v) =>
          `${a}<pharmacist-input gphc="${v.gphc}" name="${v.name}"></pharmacist-input>`,
        ""
      ) ?? ""
    }
	</fieldset>
	<div class="input-group mb-3">
		<input class="form-control" id="gphc" form="" placeholder="GPHC number" pattern="\\d{7}" maxlength="7" size="7" title="7 digit GPHC number">
		<input class="form-control" id="pharmacist-name" form="" placeholder="Full name" title="Pharmacist's full name">
		<button type=button class="btn btn-primary" name=add-pharmacist><i class="bi bi-plus-circle"></i> Add pharmacist</button>
	</div>
	<button type="submit" class="btn btn-primary btn-lg w-100 mt-3"><i class="bi bi-send"></i> ${
    values ? "Accept" : "Apply"
  }</button>
</form>`;
      if (values) {
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

// GPHC input component for validating General Pharmaceutical Council numbers (7 digits)
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

// Pharmacist input component with GPHC number and full name
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
        <button type="button" class="btn btn-secondary" name="remove">-</button>`;
    }
  }
);

customElements.define(
  "pharmacy-ods-input",
  class PharmacyOdsInput extends HTMLElement {
    connectedCallback() {
      const ods = this.getAttribute("ods");
      this.addEventListener("change", this);
      this.classList.add("input-group");
      this.innerHTML = `<pharmacy-name class="input-group-text">
			<ods-input ods="${ods ?? ""}" placeholder="ODS code"></ods-input>
		</pharmacy-name>
		<button type=button class="btn btn-secondary" name="remove">-</button>`;
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
