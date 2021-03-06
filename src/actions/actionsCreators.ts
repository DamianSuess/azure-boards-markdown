import * as Q from "q";

import { IWorkItemControlAdapter } from "../adapter";
import { MainStore } from "../store/store";

import { ConflictResolution, SizeMode, FormatAction } from "../model/model";

import { Markdown } from "../services/markdown";
import { Uploads } from "../services/uploads";

import { ActionsHub } from "./actions";

export class ActionsCreator {
    constructor(
        private _actionsHub: ActionsHub,
        private _store: MainStore,
        private _adapter: IWorkItemControlAdapter,
        private _uploads: Uploads) { }

    public setContentFromWorkItem(content: string) {
        this._actionsHub.setContentFromWorkItem.invoke(content);
    }

    public setMarkdownContent(markdownContent: string) {
        this._actionsHub.setMarkdownContent.invoke(markdownContent);
    }

    public save() {
        this._adapter.save().then(() => {
            // TODO
        });
    }

    public reset() {
        this._actionsHub.reset.invoke(null);
    }

    public toggleState() {
        this._actionsHub.toggleState.invoke(null);
    }

    public toggleSizeMode() {
        this._actionsHub.toggleSizeMode.invoke(null);

        if (this._store.getSizeMode() === SizeMode.Default) {
            this.resize(this._store.getMinHeight(), true);
        }
    }

    public setSizeMode(sizeMode: SizeMode) {
        this._actionsHub.setSizeMode.invoke(sizeMode);
    }

    public resolveConflict(resolution: ConflictResolution) {
        this._actionsHub.resolveConflict.invoke(resolution);
    }

    public upload(files: { fileName: string, filePath: string, file: any }[]) {
        this._actionsHub.setProgress.invoke(true);

        Q.all(files.map(file => this._uploads.startUpload(file.fileName, file.filePath, file.file))).then((results) => {
            for (let result of results) {
                this._actionsHub.insertToken.invoke(Markdown.imageToken(result.fileName, result.url));
            }

            this._actionsHub.setProgress.invoke(false);
        });
    }

    public resize(height: number, force?: boolean) {
        const oldHeight = this._store.getHeight();

        this._actionsHub.resize.invoke(height);

        if (force || oldHeight !== this._store.getHeight()) {
            VSS.resize(null, this._store.getHeight());
        }
    }

    public changeSelection(selectionStart: number, selectionEnd: number) {
        this._actionsHub.changeSelection.invoke({ selectionStart, selectionEnd });
    }

    public applyFormatting(formatAction: FormatAction) {
        const [selectionStart, selectionEnd] = this._store.getSelection();

        if (selectionStart != null && selectionEnd != null && selectionStart !== selectionEnd) {
            const oldMarkdown = this._store.getMarkdown();
            const newMarkdown = Markdown.applyFormatting(selectionStart, selectionEnd, formatAction, oldMarkdown);

            const diff = newMarkdown.length - oldMarkdown.length;

            this._actionsHub.setMarkdownContent.invoke(newMarkdown);
            this._actionsHub.changeSelection.invoke({
                selectionStart: selectionStart,
                selectionEnd: selectionEnd + diff
            });
        }
    }

    public openFullscreen() {
        this._actionsHub.openFullscreen.invoke(this._store.getHtmlContent());
    }
}