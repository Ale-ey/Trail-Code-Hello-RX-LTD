// Contact form field definitions
// Note: Using 'optional: true' consistently instead of 'required: false' to match bootstrap_inputs logic
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
<input type="${v.type}" class="form-control" id="${k}" name="${k}"
	${values? `value="${values instanceof Map? values.get(k) : values[k]}"`: ""}
	placeholder="${v.placeholder ?? ' '}"
	${v.pattern? "pattern=" + v.pattern : ""}
	${v.optional? "" : "required"}>
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
			if(!data.business || !data.business.size) {
				this.querySelector("[name=businessType]").focus();
				return;
			}
			if(!data.ods || data.ods.length == 0) {
				this.querySelector("#ods").focus();
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
	<button type="submit" class="btn btn-primary">${values? "Accept" : "Apply"}</button>
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

customElements.define('pharmacy-list-editor', class PharmacyListEditor extends HTMLElement { // TODO finish to use in busiess application
	connectedCallback() {
		this.addEventListener("click", this)
		this.innerHTML = `<fieldset data-id=list class="mb-3"></fieldset>
	<div class="input-group mb-3">
		<pharmacy-list-editor></pharmacy-list-editor>
		<button type=button class="btn btn-primary" name=add>Add pharmacy</button>
	</div>`
	}
	handleEvent(e) {
		if (e.target.name === "remove") {
			e.target.parentNode.remove();
			return;
		}
		if (e.target.name === "add") {
			const input = this.querySelector("#ods");
			this.querySelector("[data-id='list']").innerHTML += `<pharmacy-ods-input ods="${input.value}"></pharmacy-ods-input>`;
			input.value = ""
		}
	}
	reset() {
		this.querySelector("fieldset").replaceChildren();
	}
})