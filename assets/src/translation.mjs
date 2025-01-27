import { iterof } from "./utility.mjs";

const TRANSLATIONS_ROOT = import.meta.url.split("/").slice(0, -2).join("/") + "/translations";

/**
 * A flyweight class for fetching and applying translations,
 * onto the loaded page.
 */
export class TranslationMapping {
	static #__flyweight_token = Symbol();
	static #__flyweight_instances = new Map();

	/**
	 * @param {string} locale
	 * @param {string} page
	 * @returns {Promise<TranslationMapping>}
	 */
	static async get(locale, page) {
		const flyweight_id = `${page},${locale}`;
		if (this.#__flyweight_instances.has(flyweight_id)) return this.#__flyweight_instances.get(flyweight_id);
		else {
			let instance = new this(this.#__flyweight_token, locale, page);
			await instance.load();
			return instance;
		}
	}

	constructor(__token, locale, page) {
		if (__token !== TranslationMapping.#__flyweight_token)
			throw new TypeError("Flyweight instantiation not public. Use TranslationMapping.get(...).");
		/** @type {string} */
		this.locale = locale;
		/** @type {string} */
		this.page = page;
		/** @type {Document?} */
		this.dom = null;
		/** @type {Map<string, Element>} */
		this.submappings = new Map();
	}

	async load() {
		const where = `${TRANSLATIONS_ROOT}/${this.locale}/${this.page}.xml`,
			response = await fetch(where, { method: "GET" }),
			parser = new DOMParser();

		if (response.ok) {
			const dom = (this.dom = parser.parseFromString(await response.text(), "application/xml"));
			for (const element of dom.querySelector("mappings").children) {
				const target = element.getAttribute("for");
				if (typeof target !== "string") continue;

				this.submappings.set(target, element);
			}
		}
		return this;
	}

	apply() {
		const elements = document.querySelectorAll("[data-use]");
		for (const element of elements) {
			const id = element.dataset.use,
				submapping = this.submappings.get(id);
			if (submapping === undefined) continue;

			// NOTE: Probably not a good idea... maybe make a replacement later?
			//       because, this doesn't feel very safe.
			element.innerHTML = submapping.innerHTML;
		}
	}
}

export class TranslationManager {
	static #__singleton_token = Symbol();
	static #__singleton_instance = null;

	static get() {
		return (
			this.#__singleton_instance || (this.#__singleton_instance = new TranslationManager(this.#__singleton_token))
		);
	}

	#Locale;
	#Supported;
	#Manifest;
	#Overrides;

	constructor(__token) {
		if (__token !== TranslationManager.#__singleton_token)
			throw new TypeError("Singleton instantiation not public. Use TranslationManager.get(...).");
		this.#Locale = "fr";
		this.#Supported = new Set();
		this.#Overrides = new Map();
	}

	get locale() {
		return this.#Locale;
	}

	get supported() {
		return this.#Supported;
	}

	get manifest() {
		return this.#Manifest;
	}

	async set_locale(locale) {
		if (!this.#Supported.has(locale)) throw new TypeError("Unsupported locale.");
		const pathname = new URL(document.documentURI).pathname,
			target = this.#Overrides.has(pathname) ? this.#Overrides.get(pathname) : pathname,
			mapping = await TranslationMapping.get(locale, target);
		mapping.apply();
		this.#Locale = locale;
	}

	async initialize() {
		const response = await fetch(TRANSLATIONS_ROOT + "/manifest.json", { method: "GET" });

		if (response.ok) {
			const manifest = (this.#Manifest = await response.json());
			for (const { locale, display } of manifest.languages) this.#Supported.add(locale);

			if (typeof manifest.overrides === "object") this.#Overrides = new Map(Object.entries(manifest.overrides));
			if (typeof manifest.default === "string") this.set_locale(manifest.default);
		} else throw Error("Failed to load manifest (FIXME: this should not happen).");
	}
}
