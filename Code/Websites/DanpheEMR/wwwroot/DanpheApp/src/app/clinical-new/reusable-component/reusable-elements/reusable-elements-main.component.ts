import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, Input, ViewChild, ViewContainerRef } from "@angular/core";

import { Field } from "../../shared/dto/field.dto";
import { QuestionaryConfig } from "../../shared/dto/questionary-config.dto";
import { IDynamicElement } from "./dynamic-field.interface";


@Component({
    selector: "clinical-reusable-elements",
    templateUrl: "./reusable-elements-main.component.html"
})
export class ReusableElementsMainComponent implements AfterViewInit {

    @Input()
    field: Field;

    @Input()
    question: QuestionaryConfig;

    // @Input('is-questionary')
    // IsQuestionary: boolean = false;

    @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;

    constructor(private cd: ChangeDetectorRef, private componentFactoryResolver: ComponentFactoryResolver) {

    }
    ngAfterViewInit(): void {

        if (this.question) {
            if (this.question.FieldConfig && this.question.FieldConfig.type) {
                const componentFactory = this.componentFactoryResolver
                    .resolveComponentFactory<IDynamicElement>(this.question.FieldConfig.type);
                const componentRef = this.container.createComponent(componentFactory);
                if (this.question.FieldConfig) {
                    componentRef.instance.Question = this.question;

                    this.cd.detectChanges();
                }
            }
        }
        else if (this.field) {
            if (this.field.FieldConfig && this.field.FieldConfig.type) {
                const componentFactory = this.componentFactoryResolver
                    .resolveComponentFactory<IDynamicElement>(this.field.FieldConfig.type);
                const componentRef = this.container.createComponent(componentFactory);
                if (this.field.FieldConfig) {
                    componentRef.instance.Field = this.field;
                    this.cd.detectChanges();
                }
            }
        }

    }

}