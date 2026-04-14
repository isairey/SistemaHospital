import { Component, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Component({
    selector: 'freetype-html-renderer',
    templateUrl: './freetype-html-renderer.component.html',
    styles: [`
    .html-container {
      width: 100%;
      height: 100%;
    }
  `]
})
export class FreeTypeHtmlRendererComponent implements OnChanges {
    @Input() htmlContent: string;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.htmlContent && this.htmlContent) {
            this.updateHtmlContent();
        }
    }

    private updateHtmlContent() {
        const container = this.el.nativeElement.querySelector('.html-container');
        this.renderer.setProperty(container, 'innerHTML', this.htmlContent);
    }
}
