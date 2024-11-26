import { App, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { createElement } from 'react';
import { Root, createRoot } from 'react-dom/client';

export default class EmojiPickerPlugin extends Plugin {
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
		const ribbonIconEl = this.addRibbonIcon('smile', 'Open emoji picker', async (evt: MouseEvent) => {
			this.showEmojiPicker();
		});
		this.emojiButton = ribbonIconEl;
	}

	async onload() {

		this.addRibbonButton();

		this.addCommand({
			id: 'open-emoji-picker',
			name: 'Select and insert emoji',
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

	}

	onunload() {

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
		const theme = document.body.classList.contains('theme-dark')? 'dark' : 'light';
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
			emojiVersion: '15',
			theme: theme
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