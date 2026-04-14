import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ClinicalPhrase } from '../../../clinical-new/shared/dto/clinical-phrase.dto';
import { ENUM_GlobalSearchOptions } from '../../shared-enums';
import { IGlobalSearchKeyword } from './global-search-keyword.interface';
@Injectable({
    providedIn: 'root'
})
export class FocusedElementService {
    private _focusedElement: HTMLElement | null = null;
    private _focusedElementControl: AbstractControl | null = null;
    private _cursorPosition: number | null = null
    GlobalSearchKeywords: IGlobalSearchKeyword[] = [];
    GlobalSearchFeatureOptions: string[] = [];
    SelectedFeature: string = '';
    private _isSummerNote: boolean = false;
    private _summerNoteRef: any = null;
    constructor(

    ) {
        this.GlobalSearchFeatureOptions = Object.values(ENUM_GlobalSearchOptions);
    }
    /**
     * Sets the currently focused element in the service and marks it as not being a Summernote editor.
     * @param element - The HTML element that is currently focused.
     */
    SetFocusedElement(element: HTMLElement, control: AbstractControl): void {
        this._focusedElement = element;
        this._focusedElementControl = control;
        this._isSummerNote = false;
    }

    /**
     * Retrieves the currently focused element from the service.
     * @returns Te HTML element that is currently focused or null if no element is focused.
     */
    GetFocusedElement(): HTMLElement | null {
        return this._focusedElement;
    }
    /**
     * Clears the reference to the currently focused element, cursor position, and Summernote editor.
     */
    ClearFocusedElement() {
        this._focusedElement = null;
        this._cursorPosition = null;
        this._summerNoteRef = null;
    }

    /**
     * Sets the cursor position within the focused element.
     * @param position - The position of the cursor within the focused input element.
     */
    SetCursorPosition() {
        if (!this._isSummerNote && this._focusedElement) {
            this._cursorPosition = (this.GetFocusedElement() as HTMLInputElement | HTMLTextAreaElement).selectionStart || 0;
        }
    }

    /**
     * Retrieves the stored cursor position.
     * @returns The cursor position as a number or null if no position is stored.
     */
    GetCursorPosition(): number | null {
        return this._cursorPosition;
    }

    /**
     * Inserts text at the stored cursor position in the currently focused element.
     * If the focused element is a Summernote editor, thext is appended there; otherwise, it's inserted into a regular input element.
     * @param text - The text to be inserted at the cursor position.
     */
    InsertTextAtCursor(text: string) {
        if (this._isSummerNote) {
            this.AppendTextToSummerNote(text);
        }
        else {
            this.AddTextToInputElement(text);
        }
    }
    /**
     * Sets the reference to a Summernote editor and marks it as the active focused element.
     * @param ref - The reference to the Summernote editor instance.
     */
    SetSummernoteRef(ref: any) {
        this._summerNoteRef = ref;
        this._isSummerNote = true;
    }

    /**
     * Inserts text at the current cursor position in a regular HTML input or textarea element
     * @param text - The text to be inserted.
     */
    AddTextToInputElement(text: string) {
        const focusedElement = this.GetFocusedElement() as HTMLInputElement | HTMLTextAreaElement;
        const cursorPosition = this.GetCursorPosition();

        if (focusedElement && this._focusedElementControl && cursorPosition !== null) {
            const currentValue = focusedElement.value;
            const newValue = currentValue.substring(0, cursorPosition) + text + currentValue.substring(cursorPosition);
            this._focusedElementControl.setValue(newValue);
            focusedElement.selectionStart = focusedElement.selectionEnd = cursorPosition + text.length;
        }
    }

    /**
     * Appends the provided text to the content of a Summernote editor.
     * @param text - The text to append to the Summernote content.
     */
    AppendTextToSummerNote(text: string) {
        const currentContent = this._summerNoteRef.summernote('code');
        const updatedContent = currentContent + text;
        this._summerNoteRef.summernote('code', updatedContent);
    }

    /**
     * Handles any logic required when the selected option changes.
     */
    HandleFeatureChange(): void {
        switch (this.SelectedFeature) {
            case ENUM_GlobalSearchOptions.Phrases:
                break;
        }
    }

    /**
     * Handles the search operation based on the selected option.
     * @param searchValue - The value entered by the user for searching.
     */
    HandleSearch(SelectedObj: any): void {
        switch (this.SelectedFeature) {
            case ENUM_GlobalSearchOptions.Phrases:
                this.InsertTextAtCursor(SelectedObj.TemplateContent);
                break;
        }
    }

    /**
 * Converts an array of `ClinicalPhrase` objects into `IGlobalSearchKeyword` objects and sets them as the global search keywords.
 * - Maps each `ClinicalPhrase` to a corresponding `IGlobalSearchKeyword` by copying the `TemplateName` as `KeywordDisplayName` and retaining other properties of the `ClinicalPhrase`.
 *
 * @param {ClinicalPhrase[]} clinicalPhrases - The array of `ClinicalPhrase` objects to be transformed into global search keywords.
 */
    SetClinicalPhrases(clinicalPhrases: ClinicalPhrase[]) {
        if (Array.isArray(clinicalPhrases)) {
            this.GlobalSearchKeywords = clinicalPhrases.map<IGlobalSearchKeyword>((phrase: ClinicalPhrase) => {
                let gsKeyword: IGlobalSearchKeyword;
                gsKeyword = {
                    KeywordDisplayName: phrase.TemplateName,
                    ...phrase
                }
                return gsKeyword;
            });
        }

    }

}

