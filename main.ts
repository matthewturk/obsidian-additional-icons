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

interface iconSets {
	name: string;
	description: string;
	prefix: string;
	contents: string;
}

const availableIcons: iconSets[] = [
	{
		name: "RPG Awesome",
		description:
			"The RPG Awesome Icon Set from https://nagoshiashumari.github.io/Rpg-Awesome/",
		prefix: "ra",
		contents: rpgAwesomeSvgStr,
	},
	{
		name: "GovIcons",
		description: "Government Icons from https://govicons.io/",
		prefix: "gi",
		contents: govIconsSvgStr,
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
		console.log(DEFAULT_SETTINGS);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AdditionalIconsSettingTab(this.app, this));

		availableIcons.forEach(async (iconSet) => {
			if (this.settings.useIconsets[iconSet.name]) {
				await this.addIconsToObsidian(iconSet.contents, iconSet.prefix);
			}
		});
	}

	async addIconsToObsidian(
		svgFontString: string,
		prefix: string
	): Promise<void> {
		const parser = new DOMParser();
		const svgDom = parser.parseFromString(svgFontString, "image/svg+xml");
		// Ultimately, the transform should be determined from the glyph
		// attributes like ascent and descent attributes.  For icons generated
		// with icomoon this should be sufficient for now.
		svgDom.querySelectorAll("glyph").forEach((el) => {
			addIcon(
				`${prefix}-${el.getAttribute("glyph-name")}`,
				`<path transform="matrix(0.09765625 0 0 -0.09765625 0, 99.2)" d="${el.getAttribute(
					"d"
				)}"/>`
			);
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
