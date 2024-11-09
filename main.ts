import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { createElement } from 'react';
import { Root, createRoot } from 'react-dom/client';

interface EmojiPickerPluginSetting {
	showEmojiButton: boolean;
}

const DEFAULT_SETTINGS: EmojiPickerPluginSetting = {
	showEmojiButton: true
}

export default class EmojiPickerPlugin extends Plugin {
	settings: EmojiPickerPluginSetting;
	emojiButton: HTMLElement;


	showEmojiPicker() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// Check if view is in editing mode
		if (markdownView && markdownView.getMode() === 'source') {
			const modal = new EmojiPickerModal(this.app);
			modal.open();
		} else {
			new Notice('Emoji picker can only be opened in editing mode.');
		}
	}

	addRibbonButton() {
		const ribbonIconEl = this.addRibbonIcon('smile', 'Open Emoji Picker', async (evt: MouseEvent) => {
			this.showEmojiPicker();
		});
		this.emojiButton = ribbonIconEl;
	}

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left to open a modal for the emoji picker.
		if (this.settings.showEmojiButton) {
			this.addRibbonButton();
		}

		this.addCommand({
			id: 'open-emoji-picker',
			name: 'Open Emoji Picker',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						this.showEmojiPicker();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new EmojiPickerSettingsTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class EmojiPickerModal extends Modal {

	root: Root;

	constructor(app: App) {
		super(app);

		// Remove the background and modal restrictions
		this.containerEl.id = 'emoji-picker-modal';
	}

	onOpen() {
		const picker = createElement(Picker, {
			data: data,
			onEmojiSelect: (emoji: any) => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				if (editor) {
					const cursor = editor.getCursor('from');

					// Insert emoji at the current cursor position
					editor.replaceRange(emoji.native, cursor, cursor);

					// Move the cursor to the position right after the inserted emoji
					const newCursor = {
						line: cursor.line,
						ch: cursor.ch + emoji.native.length
					};
					editor.setCursor(newCursor);

					editor.focus();
				}
				this.close();
			},
			skinTonePosition: 'search',
			autoFocus: true,
		});

		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			picker
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class EmojiPickerSettingsTab extends PluginSettingTab {
	plugin: EmojiPickerPlugin;

	constructor(app: App, plugin: EmojiPickerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Show emoji button')
			.setDesc('Show the emoji button in the left ribbon')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showEmojiButton)
				.onChange(async (value) => {
					if (value) {
						this.plugin.addRibbonButton();
					} else {
						this.plugin.emojiButton.remove();
					}
					this.plugin.settings.showEmojiButton = value;
					await this.plugin.saveSettings();
				}));
	}
}
