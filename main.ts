import {
	getIconIds,
	addIcon,
	removeIcon,
	App,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import rpgAwesomeSvgStr from "./node_modules/rpg-awesome/fonts/rpgawesome-webfont.svg";
import govIconsSvgStr from "./node_modules/govicons/fonts/govicons-webfont.svg";
import weatherIconsSvgStr from "./node_modules/weather-icons/font/weathericons-regular-webfont.svg";

// Need to load in and use a regex like
// ^@([a-z-0-9]+)\s*:\s*"\\([0-9a-f]*)";/gm
// to get the less variables.

interface iconSets {
	name: string;
	description: string;
	prefix: string;
	contents: string;
	parseName: (element: Element) => string;
}

// https://www.npmjs.com/package/foundation-icon-fonts
// https://github.com/zurb/foundation-icon-fonts
// https://zurb.com/playground/foundation-icon-fonts-3

// https://www.npmjs.com/package/map-icons
// http://map-icons.com/o

import weatherIconsVariables from "./node_modules/weather-icons/weather-icons/variables.less";
const weatherIconsVariableRexexp = /^@([a-z-0-9]+)\s*:\s*"\\([0-9a-f]*)";/gm;
const unicodeCharToIconName = Object.fromEntries(
	Array.from(
		weatherIconsVariables.matchAll(weatherIconsVariableRexexp),
		(m) => [String.fromCharCode(parseInt(m[2], 16)), m[1]]
	)
);

function dereferenceWeatherIcons(element: Element): string {
	const iconUnicode = element.getAttribute("unicode") || "unknown";
	return unicodeCharToIconName[iconUnicode];
}

function glyphElement(element: Element): string {
	return element.getAttribute("glyph-name") || "";
}

const availableIcons: iconSets[] = [
	{
		name: "RPG Awesome",
		description:
			"The RPG Awesome Icon Set from https://nagoshiashumari.github.io/Rpg-Awesome/",
		prefix: "ra",
		contents: rpgAwesomeSvgStr,
		parseName: glyphElement,
	},
	{
		name: "GovIcons",
		description: "Government Icons from https://govicons.io/",
		prefix: "gi",
		contents: govIconsSvgStr,
		parseName: glyphElement,
	},
	{
		name: "Weather Icons",
		description:
			"Weather-related Icons from https://erikflowers.github.io/weather-icons/",
		prefix: "wi",
		contents: weatherIconsSvgStr,
		parseName: dereferenceWeatherIcons,
	},
];

interface AdditionalIconsPluginSettings {
	useIconsets: {
		[key: string]: boolean;
	};
}

const DEFAULT_SETTINGS: AdditionalIconsPluginSettings = {
	useIconsets: Object.fromEntries(availableIcons.map((k) => [k.name, true])),
};

export default class AdditionalIconsPlugin extends Plugin {
	settings: AdditionalIconsPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AdditionalIconsSettingTab(this.app, this));

		availableIcons.forEach(async (iconSet) => {
			if (this.settings.useIconsets[iconSet.name]) {
				await this.addIconsToObsidian(
					iconSet.contents,
					iconSet.prefix,
					iconSet.parseName
				);
			}
		});
	}

	async addIconsToObsidian(
		svgFontString: string,
		prefix: string,
		parseName: (element: Element) => string
	): Promise<void> {
		const parser = new DOMParser();
		const svgDom = parser.parseFromString(svgFontString, "image/svg+xml");
		const fontFace = svgDom.querySelector("font-face");
		const fontHorizAdvance = +(
			svgDom.querySelector("font")?.getAttribute("horiz-adv-x") || 1024
		);
		const fontAscent = +(fontFace?.getAttribute("ascent") || 960);
		const fontDescent = +(fontFace?.getAttribute("descent") || -64);
		// Ultimately, the transform should be determined from the glyph
		// attributes like ascent and descent attributes.  For icons generated
		// with icomoon this should be sufficient for now.
		svgDom.querySelectorAll("glyph").forEach((el) => {
			const horizAdvance = +(
				el.getAttribute("horiz-adv-x") || fontHorizAdvance
			);
			const xAspect = 100.0 / horizAdvance;
			const yAspect = 100 / (fontAscent - fontDescent);
			const aspectRatio = xAspect > yAspect ? yAspect : xAspect;
			const matrix = [
				aspectRatio,
				-aspectRatio,
				(fontAscent * 100) / (fontAscent - fontDescent),
			];
			addIcon(
				`${prefix}-${parseName(el)}`,
				`<path transform="matrix(${matrix[0]} 0 0 ${matrix[1]} 0 ${
					matrix[2]
				})" d="${el.getAttribute("d")}"/>`
			);
			// console.log(
			// 	"Adding",
			// 	`${prefix}-${parseName(el)} with transform ${matrix}`
			// );
		});
	}

	async onunload() {
		availableIcons.forEach(async (iconSet) => {
			if (this.settings.useIconsets[iconSet.name]) {
				await this.removePrefixedIcons(iconSet.prefix);
			}
		});
	}

	async removePrefixedIcons(prefix: string): Promise<void> {
		for (const iconName of getIconIds()) {
			if (iconName.startsWith(`${prefix}-`)) removeIcon(iconName);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AdditionalIconsSettingTab extends PluginSettingTab {
	plugin: AdditionalIconsPlugin;

	constructor(app: App, plugin: AdditionalIconsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		availableIcons.forEach((iconSet) => {
			new Setting(containerEl)
				.setName(iconSet.name)
				.setDesc(iconSet.description)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.useIconsets[iconSet.name]
						)
						.onChange(async (value) => {
							this.plugin.settings.useIconsets[iconSet.name] =
								value;
							await this.plugin.saveSettings();
						})
				);
		});
	}
}
