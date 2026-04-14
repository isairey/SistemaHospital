import { Component, OnInit } from "@angular/core";
import { Field } from "../../../shared/dto/field.dto";
import { IDynamicElement } from "../dynamic-field.interface";

@Component({
    selector: "questionary-wrapper",
    templateUrl: "./questionary-wrapper.component.html"
})
export class QuestionaryWrapperComponent implements OnInit, IDynamicElement {
    Field: Field;
    Question: any;
    // FieldConfig: QuestionaryFieldConfig;
    QuestionaryFields: any[];
    ngOnInit(): void {
        this.QuestionaryFields = this.Field.QuestionaryConfig;
    }
}