/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag  
 * @param {(element: HTMLElementTagNameMap[K]) => HTMLElementTagNameMap[K]} callback 
 * */
export function mkelement(tag, callback) {
	const element = document.createElement(tag);
	return callback(element), element;
}

/**
 * @param {URL} url 
 * @param {*} encoding 
 * @returns 
 */
export async function ldfile(url, encoding = "utf-8") {
	return new TextDecoder(encoding).decode(await (await fetch(url)).arrayBuffer());
}

export function iterof(iterable) {
	return iterable[Symbol.iterator]();
}