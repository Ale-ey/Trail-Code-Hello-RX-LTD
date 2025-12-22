const contact_fields = {
	name: { label: "Name" },
	position: { label: "Position" },
	email: { label: "Email", type: "email" },
	invoiceEmail: { label: "Invoice email (Optional)", type: "email", optional: true },
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

function bootstrap_inputs(fields, values) {
	return Object.entries(fields).reduce((a, [k, v]) => `${a}<div class="form-floating mb-3">
<input type="${v.type ?? 'text'}" class="form-control" id="${k}" name="${k}"
	${values? `value="${values instanceof Map? values.get(k) : values[k]}"`: ""}
	placeholder="${v.placeholder ?? ' '}"
	${v.pattern? `pattern="${v.pattern}"` : ""}
	${v.optional? "" : "required"}>
<label for="${k}" class="form-label">${v.label}</label>
</div>`, "");
}

customElements.define('business-application', class BusinessApplication extends HTMLElement {
	connectedCallback() {
		this.addEventListener("submit", this);
		this.addEventListener("click", this);
		this.addEventListener("keydown", this);
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
			const value = input.value.trim();
			if (!value) {
				input.focus();
				return;
			}
			this.querySelector("#pharmacies").innerHTML += `<pharmacy-ods-input ods="${value}"></pharmacy-ods-input>`;
			input.value = "";
			input.focus();
		}
		
		// Add keyboard shortcut: Enter key on ODS input adds pharmacy
		if (e.type === "keydown" && e.key === "Enter" && e.target.id === "ods") {
			e.preventDefault();
			this.querySelector('[name=add]').click();
		}

		if (e.type === "submit") {
			e.preventDefault();
			const id = this.getAttribute("k");
			const data = new FormData(e.target);
			if (id) data.id = id;
			
			const businessTypeValue = data.get("businessType");
			if(!businessTypeValue) {
				this.querySelector("[name=businessType]").focus();
				dispatchEvent(new CustomEvent("toast-error", { detail: { message: "Please select a business type", style: "text-bg-warning" } }));
				return;
			}
			
			if(!data.get("ods")) {
				this.querySelector("#ods").focus();
				dispatchEvent(new CustomEvent("toast-error", { detail: { message: "Please add at least one pharmacy", style: "text-bg-warning" } }));
				return;
			}
			const detail = { type: id? "business-accept" : "business-application", data };
			this.dispatchEvent(new CustomEvent("journal-post", { bubbles: true, detail }));
			
			// Temporary: Show success since there's no backend yet
			this.showSuccess();
		}
	}
	showSuccess() {
		this.innerHTML = `<div class="alert alert-success m-5" role="alert">
			<h4 class="alert-heading">Application Submitted!</h4>
			<p>Your application has been posted successfully. Our team will contact you with the next steps.</p>
			<hr>
			<p class="mb-0">Thank you for your interest in working with us.</p>
		</div>`;
		dispatchEvent(new CustomEvent("toast-success", { detail: { message: "Application submitted successfully!", style: "text-bg-success"  } }));
	}
	businessType(type, values) {
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
	<pharmacist-list-editor></pharmacist-list-editor>
	<legend>Pharmacies</legend>
	<fieldset id=pharmacies class="mb-3">
		${values?.ods?.reduce((a, v) => `${a}<pharmacy-ods-input ods="${v}"></pharmacy-ods-input>`, '') ?? ""}
	</fieldset>
	<div class="input-group mb-3">
		<input class="form-control" id="ods" form="" placeholder="ODS code" maxlength="6">
		<button type=button class="btn btn-primary" name=add>Add pharmacy</button>
	</div>
	<button type="submit" class="btn btn-primary btn-lg w-100">${values? "Accept" : "Apply"}</button>
</form>`;
		if(values) {
			this.businessType(values.businessType, values.business);
		}
	}
	result({ reply, error, target }) {
		if(!reply.length || error) {
			dispatchEvent(new CustomEvent("toast-error", { detail: { message: "Error", style: "text-bg-danger" } }));
			return;
		}
		this.innerHTML = `<div class="alert alert-success m-5" role="alert">Your application has been posted. Our team will contact you with the next steps</div>`;

		dispatchEvent(new CustomEvent("toast-success", { detail: { message: "Sent", style: "text-bg-success"  } }));
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
			input.setCustomValidity('Please correct the format: AB123');
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

customElements.define('pharmacist-item', class PharmacistItem extends HTMLElement {
	connectedCallback() {
		const gphc = this.getAttribute("gphc") ?? "";
		const fullName = this.getAttribute("fullname") ?? "";
		this.classList.add('input-group', 'mb-2');
		this.innerHTML = `<input type="text" class="form-control" name="pharmacist-gphc" value="${gphc}" 
			placeholder="GPHC Number" pattern="^\\d{7}$" maxlength="7" required 
			title="Must be exactly 7 digits">
		<input type="text" class="form-control" name="pharmacist-name" value="${fullName}" 
			placeholder="Full Name" required>
		<button type="button" class="btn btn-danger" name="remove-pharmacist" title="Remove pharmacist">&times;</button>`;
	}
})

customElements.define('pharmacist-list-editor', class PharmacistListEditor extends HTMLElement {
	connectedCallback() {
		this.addEventListener("click", this);
		this.addEventListener("keydown", this);
		const pharmacists = this.getAttribute("pharmacists");
		let items = "";
		if (pharmacists) {
			try {
				const list = JSON.parse(pharmacists);
				items = list.map(p => `<pharmacist-item gphc="${p.gphc}" fullname="${p.name}"></pharmacist-item>`).join("");
			} catch(e) {}
		}
		this.innerHTML = `<legend>Pharmacists</legend>
		<fieldset id="pharmacist-list" class="mb-3">
			${items}
		</fieldset>
		<div class="input-group mb-3">
			<input type="text" class="form-control" id="new-pharmacist-gphc" 
				placeholder="GPHC Number (7 digits)" pattern="^\\d{7}$" maxlength="7" 
				title="Must be exactly 7 digits" form="" autocomplete="off" 
				inputmode="numeric">
			<input type="text" class="form-control" id="new-pharmacist-name" 
				placeholder="Full Name" form="" autocomplete="off">
			<button type="button" class="btn btn-primary" name="add-pharmacist">Add Pharmacist</button>
		</div>`;
	}
	handleEvent(e) {
		if (e.target.name === "remove-pharmacist") {
			e.target.parentNode.remove();
			return;
		}
		
		// Add keyboard shortcut: Enter key adds pharmacist, Tab moves between fields
		if (e.type === "keydown" && e.key === "Enter") {
			const gphcInput = this.querySelector("#new-pharmacist-gphc");
			const nameInput = this.querySelector("#new-pharmacist-name");
			
			if (e.target === gphcInput && gphcInput.value.trim()) {
				e.preventDefault();
				nameInput.focus();
				return;
			}
			if (e.target === nameInput && nameInput.value.trim()) {
				e.preventDefault();
				this.querySelector('[name=add-pharmacist]').click();
				return;
			}
		}
		
		if (e.target.name === "add-pharmacist" || (e.type === "keydown" && e.key === "Enter")) {
			if (e.target.name !== "add-pharmacist") return; // Already handled above
			
			const gphcInput = this.querySelector("#new-pharmacist-gphc");
			const nameInput = this.querySelector("#new-pharmacist-name");
			const gphc = gphcInput.value.trim();
			const fullName = nameInput.value.trim();
			
			if (!/^\d{7}$/.test(gphc)) {
				gphcInput.setCustomValidity('GPHC number must be exactly 7 digits');
				gphcInput.reportValidity();
				return;
			}
			if (!fullName) {
				nameInput.setCustomValidity('Full name is required');
				nameInput.reportValidity();
				return;
			}
			
			this.querySelector("#pharmacist-list").innerHTML += `<pharmacist-item gphc="${gphc}" fullname="${fullName}"></pharmacist-item>`;
			gphcInput.value = "";
			nameInput.value = "";
			gphcInput.setCustomValidity('');
			nameInput.setCustomValidity('');
			gphcInput.focus();
		}
	}
	getData() {
		const items = this.querySelectorAll('pharmacist-item');
		const pharmacists = [];
		items.forEach(item => {
			const gphc = item.querySelector('[name="pharmacist-gphc"]').value;
			const name = item.querySelector('[name="pharmacist-name"]').value;
			if (gphc && name) {
				pharmacists.push({ gphc, name });
			}
		});
		return pharmacists;
	}
})