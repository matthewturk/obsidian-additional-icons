import {
	getIconIds,
	addIcon,
	removeIcon,
	App,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import rpgAwesomeSvgStr from "./node_modules/rpg-awesome/fonts/rpgawesome-webfont.svg";

// Remember to rename these classes and interfaces!

interface AdditionalIconsPluginSettings {
	useRpgAwesome: boolean;
}

const DEFAULT_SETTINGS: AdditionalIconsPluginSettings = {
	useRpgAwesome: true,
};

export default class AdditionalIconsPlugin extends Plugin {
	settings: AdditionalIconsPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AdditionalIconsSettingTab(this.app, this));

		await this.addIconsToObsidian(rpgAwesomeSvgStr, "ra");
	}

	async addIconsToObsidian(
		svgFontString: string,
		prefix: string
	): Promise<void> {
		const parser = new DOMParser();
		const svgDom = parser.parseFromString(svgFontString, "image/svg+xml");
		svgDom.querySelectorAll("glyph").forEach((el) => {
			addIcon(
				`${prefix}-${el.getAttribute("glyph-name")}`,
				`<path d=${el.getAttribute("d")}/>`
			);
			console.log("Adding", `${prefix}-${el.getAttribute("glyph-name")}`);
		});
	}

	async onunload() {
		await this.removePrefixedIcons("ra");
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

		new Setting(containerEl)
			.setName("RPG Awesome #1")
			.setDesc(
				"Use RPG Awesome Icon Set from https://nagoshiashumari.github.io/Rpg-Awesome/"
			)
			.addToggle((toggle) =>
				toggle.setValue(true).onChange(async (value) => {
					this.plugin.settings.useRpgAwesmme = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
