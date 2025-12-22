const contact_fields = {
	name: { label: "Name" },
	position: { label: "Position" },
	email: { label: "Email", type: "email" },
	invoiceEmail: { label: "Invoice email (Optional)", type: "email", required: false },
	telephone: { label: "Telephone", type:"tel", pattern: "^(0|\\+?44)7\\d{9}$|^(0|\\+?44)1\\d{8,9}$" }
}

const address = { label: "Address", type: "address" }
const name = { label: "Name" }

const businessType = { 
	limitedCompany: {
		name: "Limited Company",
		fields: {
			name,
			number: { label: "Number", placeholder: "01234567" },
			address
		}
	},
	soleTrader: {
		name: "Sole Trader",
		fields: { name, address }
	},
	partnership: {
		name: "Partnership",
		fields: {
			name, address,
			partners: { label: "Partner names"}
		}
	}
 }

// Generates Bootstrap floating label inputs from field definitions
// Handles type defaults, pattern formatting, and required field validation
function bootstrap_inputs(fields, values) {
	return Object.entries(fields).reduce((a, [k, v]) => `${a}<div class="form-floating mb-3">
<input type="${v.type ?? 'text'}" class="form-control" id="${k}" name="${k}"
	${values? `value="${values instanceof Map? values.get(k) : values[k]}"`: ""}
	placeholder="${v.placeholder ?? ' '}"
	${v.pattern? `pattern="${v.pattern}"` : ""}
	${v.required === false? "" : "required"}>
<label for="${k}" class="form-label">${v.label}</label>
</div>`, "");
}

customElements.define('business-application', class BusinessApplication extends HTMLElement {
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
		if (e.target.name === "add") {
			const input = this.querySelector("#ods");
			this.querySelector("#pharmacies").innerHTML += `<pharmacy-ods-input ods="${input.value}"></pharmacy-ods-input>`;
			input.value = ""
		}

		if (e.type === "submit") {
			e.preventDefault();
			const id = this.getAttribute("k");
			const data = new FormData(e.target);
			if (id) data.id = id;
			
			// Validate business type selection with user feedback
			if(!data.business || !data.business.size) {
				const businessTypeInput = this.querySelector("[name=businessType]");
				businessTypeInput.focus();
				dispatchEvent(new CustomEvent("toast-error", { detail: { message: "Please select a business type", style: "text-bg-warning" } }));
				return;
			}
			
			// Validate at least one pharmacy added
			if(!data.ods || data.ods.length == 0) {
				const odsInput = this.querySelector("#ods");
				odsInput.focus();
				dispatchEvent(new CustomEvent("toast-error", { detail: { message: "Please add at least one pharmacy", style: "text-bg-warning" } }));
				return;
			}
			
			const detail = { type: id? "business-accept" : "business-application", data };
			this.dispatchEvent(new CustomEvent("journal-post", { bubbles: true, detail }));
		}
	}
	businessType(type, values) {
		if(values)
			this.querySelector("#business").innerHTML = bootstrap_inputs(businessType[type].fields, values);
	}
	viewChanged() {
		const values = {};
		this.innerHTML = `<form>
<div class="btn-group btn-group-toggle w-100 mb-3" data-bs-toggle="buttons">
		${Object.entries(businessType).reduce((a, [k, v]) => `${a}
<input type="radio" class="btn-check" name="businessType" id="${k}" value="${k}" required ${values?.businessType === k? "checked":""}>
<label class="btn btn-outline-primary btn-lg flex-fill" for="${k}">${v.name}</label>`, "")}
</div>
	<fieldset id=business name=business>
	</fieldset>
	<fieldset name=contact>
		<legend>Contact</legend>
		${bootstrap_inputs(contact_fields, values?.contact)}
	</fieldset>
	<legend>Pharmacies</legend>
	<fieldset id=pharmacies class="mb-3">
		${values?.ods?.reduce((a, v) => `${a}<pharmacy-ods-input ods="${v}"></pharmacy-ods-input>`, '') ?? ""}
	</fieldset>
	<div class="input-group mb-3">
		<input class="form-control" id="ods" form="" placeholder="ODS code">
		<button type=button class="btn btn-primary" name=add>Add pharmacy</button>
	</div>
	<legend>Pharmacists</legend>
	<pharmacist-list-editor id="pharmacistList"></pharmacist-list-editor>
	<button type="submit" class="btn btn-primary">${values? "Accept" : "Apply"}</button>
</form>`;
		if(values) {
			this.businessType(values.businessType, values.business);
		}
	}
	result({ reply, error, target }) {
		if(!reply.length || error) {
			dispatchEvent(new CustomEvent("toast-error", { detail: { message: "Error submitting application. Please try again.", style: "text-bg-danger" } }));
			return;
		}
		this.innerHTML = `<div class="alert alert-success m-5" role="alert">
			<h4 class="alert-heading">Application Submitted Successfully!</h4>
			<p>Your application has been posted. Our team will contact you with the next steps.</p>
		</div>`;

		dispatchEvent(new CustomEvent("toast-success", { detail: { message: "Application sent successfully", style: "text-bg-success"  } }));
		target.remove();
	}
})

customElements.define('ods-input', class ODSInput extends HTMLElement {
	connectedCallback() {
		this.addEventListener('change', this);
		this.innerHTML = `<input class="form-control" name="ods" value="${this.getAttribute("ods") ?? ""}" size=6 maxlength="6" placeholder="ODS code">`;
		this.validate();
	}
	handleEvent(e) {
		this.validate();
	}
	validate() {
		const pattern = /^[a-zA-Z]{2,3}\d{2,3}$/;
		const input = this.querySelector("input");
		const ods = input.value;
		input.setCustomValidity('');
		if (!pattern.test(ods)) {
			input.setCustomValidity('ODS code format: 2-3 letters followed by 2-3 digits (e.g., AB123)');
			input.reportValidity();
			return;
		}
		this.dispatchEvent(new CustomEvent("ods", { detail: ods, bubbles: true }))
	}
})

customElements.define('pharmacy-ods-input', class PharmacyOdsInput extends HTMLElement {
	connectedCallback() {
		const ods = this.getAttribute("ods");
		this.addEventListener('change', this);
		this.classList.add('input-group');
		this.innerHTML = `<pharmacy-name class="input-group-text">
			<ods-input ods="${ods ?? ''}" placeholder="ODS code"></ods-input>
		</pharmacy-name>
		<button type=button class="btn btn-secondary" name="remove">-</button>`;
	}
})

// Pharmacist list editor: manages adding/removing pharmacists with GPHC validation
// Each pharmacist entry requires a 7-digit GPHC number and full name
customElements.define('pharmacist-list-editor', class PharmacistListEditor extends HTMLElement {
	connectedCallback() {
		this.addEventListener("click", this);
		this.addEventListener("input", this);
		this.innerHTML = `<fieldset id="pharmacistList" class="mb-3"></fieldset>
	<div class="input-group mb-3">
		<input type="text" class="form-control" id="gphcNumber" placeholder="GPHC Number (7 digits)" pattern="\\d{7}" maxlength="7" form="">
		<input type="text" class="form-control" id="pharmacistName" placeholder="Full Name" form="">
		<button type="button" class="btn btn-primary" name="addPharmacist" disabled>Add Pharmacist</button>
	</div>`;
	}
	handleEvent(e) {
		// Remove pharmacist entry when remove button clicked
		if (e.target.name === "removePharmacist") {
			e.target.closest('.input-group').remove();
			return;
		}
		// Add new pharmacist entry with validation
		if (e.target.name === "addPharmacist") {
			const gphcInput = this.querySelector("#gphcNumber");
			const nameInput = this.querySelector("#pharmacistName");
			const gphc = gphcInput.value.trim();
			const name = nameInput.value.trim();
			
			// Validate GPHC number format (exactly 7 digits)
			if (!/^\d{7}$/.test(gphc)) {
				gphcInput.setCustomValidity('GPHC number must be exactly 7 digits');
				gphcInput.reportValidity();
				return;
			}
			
			if (!name) {
				nameInput.setCustomValidity('Full name is required');
				nameInput.reportValidity();
				return;
			}
			
			// Create pharmacist entry with input elements for form submission
			this.querySelector("#pharmacistList").innerHTML += `
				<div class="input-group mb-2">
					<span class="input-group-text">GPHC: ${gphc}</span>
					<span class="input-group-text flex-fill">${name}</span>
					<input type="hidden" name="pharmacist_gphc" value="${gphc}">
					<input type="hidden" name="pharmacist_name" value="${name}">
					<button type="button" class="btn btn-danger" name="removePharmacist">Remove</button>
				</div>`;
			
			gphcInput.value = "";
			nameInput.value = "";
			this.querySelector('[name="addPharmacist"]').disabled = true;
		}
		// Enable/disable add button based on input validity
		if (e.type === "input") {
			const gphcInput = this.querySelector("#gphcNumber");
			const nameInput = this.querySelector("#pharmacistName");
			const addBtn = this.querySelector('[name="addPharmacist"]');
			
			const gphcValid = /^\d{7}$/.test(gphcInput.value.trim());
			const nameValid = nameInput.value.trim().length > 0;
			
			addBtn.disabled = !(gphcValid && nameValid);
		}
	}
	reset() {
		this.querySelector("#pharmacistList").replaceChildren();
	}
})