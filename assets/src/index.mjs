import { TranslationManager } from "./translation.mjs";

document.addEventListener("DOMContentLoaded", async () => {
	const translation = TranslationManager.get();
	await translation.initialize();

	document.querySelectorAll(".dropdown.container").forEach((dropdown) => {
		const list = dropdown.querySelector(".dropdown.list"),
			button = dropdown.querySelector("button"),
			indicator = button.querySelector("#current"),
			languages = translation.manifest.languages;

		button.onclick = function (event) {
			dropdown.toggleAttribute("expanded");
		};

		for (const language of languages) {
			const element = document.createElement("div");
			element.dataset.locale = language.locale;
			element.textContent = language.display;
			list.append(element);

			element.onclick = async function (event) {
				await translation.set_locale(this.dataset.locale);
				indicator.textContent = translation.locale.toUpperCase();
				dropdown.removeAttribute("expanded");
			};
		}

		indicator.textContent = translation.locale.toUpperCase();
	});

	const form = document.getElementById("contact-form"),
		formerror = document.getElementById("contact-form-error"),
		formsuccess = document.getElementById("contact-form-success"); // <-- TODO: Replace this.

	form.querySelectorAll("input, select, textarea").forEach((element) =>
		element.addEventListener("input", function (event) {
			this.setAttribute("touched", "");
		})
	);

	form.addEventListener("submit", async function (event) {
		event.preventDefault();

		// This is very lazy...
		if (!form.checkValidity()) {
			console.error("Attempt to submit an invalid form");
			return;
		}

		// TODO: Add more verbose validation.
		// NOTE: This doesn't seem to be idempotent...

		try {
			const formData = new FormData(form);
			const response = await fetch("https://formspree.io/f/mvggakzr", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(Object.fromEntries(formData)),
			});

			if (response.ok) {
				form.reset();
				formerror.removeAttribute("show");
				formsuccess.setAttribute("show", "");
			} else {
				throw new Error("Form submission failed");
			}
		} catch (error) {
			formsuccess.removeAttribute("show");
			formerror.setAttribute("show", "");
			console.error(error);
		}
	});
});
