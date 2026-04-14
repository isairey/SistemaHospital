import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as $ from 'jquery';
import 'summernote/dist/summernote-lite.js';

@Component({
    selector: "danphe-summernote",
    templateUrl: "./danphe-summernote.html",
})
export class DanpheSummernoteComponent implements OnInit {

    @ViewChild('summernote') summernote: ElementRef;

    // Input for read-only property
    @Input("readonly") public IsReadOnly = true;

    // Input for setting the panel height
    @Input("panel-height") public PanelHeight: string = "480px"; // default height

    // Input for setting the initial HTML content
    @Input("set-html-content") public SummernoteContent: any = null;

    // Output to emit updated HTML content
    @Output("get-html-content") public GetEditorContent: EventEmitter<any> = new EventEmitter<any>();
    private isUpdatingFromEditor = false;
    private IsUpdatingFromForm = false;

    ngOnInit() {
        this.GetEditorContent.emit(this.SummernoteContent);
    }

    ngAfterViewInit() {
        const editor = $(this.summernote.nativeElement);

        editor.summernote({
            placeholder: '',
            minHeight: this.PanelHeight,
            maxHeight: null,
            disableDragAndDrop: true,
            toolbar: [
                ['misc', ['codeview', 'undo', 'redo', 'clear', 'help']],
                ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
                ['fontsize', ['fontname', 'fontsize', 'color']],
                ['insert', ['table', 'hr']],
                ['custom', ['saveBtn']],
                ['para', ['style', 'ul', 'ol', 'paragraph', 'height']]
            ]
        });

        editor.summernote('code', this.SummernoteContent || '');
        editor.summernote('justifyLeft');
        editor.summernote('bold', false);
        if (this.IsReadOnly) {
            editor.summernote('disable'); // Make editor read-only
        }

        this.BindEditorEvents(editor);
    }

    /**
     * Binds events to the Summernote editor to handle changes in the content
     * and capture keyboard shortcuts.
     */
    BindEditorEvents(editor) {
        const that = this;

        // Update content when editor changes
        editor.on('summernote.change', (we, contents) => {
            if (!that.IsUpdatingFromForm) {
                that.isUpdatingFromEditor = true;
                that.SummernoteContent = contents;
                that.GetEditorContent.emit(contents);
                that.isUpdatingFromEditor = false;
            }
        });

        editor.on('summernote.keyup', (e) => {
            if (e.key === 'Enter') {
                editor.summernote('justifyLeft');
            }
        });
    }


    // This method can be used to update the content from an external source.
    OnEditorChange(content: any) {
        this.SummernoteContent = content;
        this.GetEditorContent.emit(content);
    }
    ResetContent() {
        const editor = $(this.summernote.nativeElement);
        editor.summernote('code', '');
        this.SummernoteContent = '';
        this.GetEditorContent.emit('');
        editor.summernote('code', this.SummernoteContent || '');
        editor.summernote('justifyLeft');
        editor.summernote('bold', false);
    }
}
