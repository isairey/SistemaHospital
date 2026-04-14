import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FocusedElementService } from './shared/focused-element.service';
@Directive({
    selector: '[appFocusTextbox]'
})
export class FocusTextboxDirective {
    constructor(
        private _focusedElementService: FocusedElementService,
        public ngControl: NgControl
    ) { }

    @HostListener('focus', ['$event.target'])
    /**
     * Host listener for the 'focus' event. When an input element is focused,
     * it sets the focused element in the FocusedElementService and updates the cursor position
     * @param target - The input element that is currently focused.
     */
    onFocus(target: HTMLInputElement) {
        // Set the focused element when the input is focused
        this._focusedElementService.SetFocusedElement(target, this.ngControl.control);
    }
}