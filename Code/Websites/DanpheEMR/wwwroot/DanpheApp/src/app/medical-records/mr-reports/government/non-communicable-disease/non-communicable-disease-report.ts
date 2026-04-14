import { Component } from "@angular/core";
import { CancerCases, InjuriesType, MentalHealthCases, NCDCases, NonCommunicableDisease, NoOfDeaths, TypeOfCases } from "./non-communicable-disease-report.model";

@Component({
    selector: 'app-non-communicable-disease-report',
    templateUrl: './non-communicable-disease-report.html',
    styleUrls: ['./non-communicable-disease-report.css']
})
export class NonCommunicableDiseaseReportComponent {
    OnFromToDateChange($event) {
    }
    Load() {
    }

    NonCommunicableDiseases: NonCommunicableDisease[] = [
        new NonCommunicableDisease('Hypertension', 120, 80, 100, 100, 10, 30, 130, 30),
        new NonCommunicableDisease('Cardiovascular Disease', 90, 60, 80, 70, 5, 15, 110, 20),
        new NonCommunicableDisease('Diabetes', 50, 40, 30, 70, 8, 18, 80, 40),
        new NonCommunicableDisease('Cancer', 80, 60, 40, 80, 5, 20, 90, 25),
        new NonCommunicableDisease('COPD'),
        new NonCommunicableDisease('Asthma'),
        new NonCommunicableDisease('CKD'),
        new NonCommunicableDisease('RHD'),
        new NonCommunicableDisease('Stroke'),
        new NonCommunicableDisease('Thyroid Diseases'),
        new NonCommunicableDisease('Congenital Heart Disease'),
        new NonCommunicableDisease('Sickle cell diseases and other haemoglobinopathies'),
        new NonCommunicableDisease('ALcohol Liver Diseases'),
        new NonCommunicableDisease('Obesity'),
        new NonCommunicableDisease('Other NCDs cases'),
    ];

    NCDCases: NCDCases[] = [
        new NCDCases('Cardiovascular Disease'),
        new NCDCases('Cancer'),
        new NCDCases('Diabetes'),
        new NCDCases('Chronic Respiratory Diseases'),
        new NCDCases('Suicide'),
        new NCDCases('Other NCDs'),

    ];

    MentalHealthCases: MentalHealthCases[] = [
        new MentalHealthCases('Depression'),
        new MentalHealthCases('Suicide Attempt'),
        new MentalHealthCases('Epilepsy'),
        new MentalHealthCases('Psychosis'),
        new MentalHealthCases('Anxiety Disorder'),
        new MentalHealthCases('Emotional and Behavioural Disorder of Children and Adolescents'),
        new MentalHealthCases('Dementia'),
        new MentalHealthCases('Conversion Disorder'),
        new MentalHealthCases('Bipolar Disorder'),
        new MentalHealthCases('Other Mental Disorder'),
        new MentalHealthCases('Alcohol Use Disorder'),
        new MentalHealthCases('Other Substance Use Disorders'),

    ];

    CancerCases: CancerCases[] = [
        new CancerCases('Cervical'),
        new CancerCases('Oral'),
        new CancerCases('Breast'),
        new CancerCases('Lungs'),
        new CancerCases('Others'),
    ];
    TypeOfCases: TypeOfCases[] = [
        new TypeOfCases('Total no of mental health case'),
        new TypeOfCases('Total no of mental health case on regular follow up'),
        new TypeOfCases('Total no. of cases reporting improvement'),

    ];

    InjuriesType: InjuriesType[] = [
        new InjuriesType('Road Traffic Injuries(RTI)'),
        new InjuriesType('Fall'),
        new InjuriesType('Burn'),
        new InjuriesType('Drowning'),
        new InjuriesType('Bites'),
        new InjuriesType('Occupational Injury'),
        new InjuriesType('Violence'),
        new InjuriesType('Self-Harm'),

    ];

    NoOfDeaths: NoOfDeaths[] = [
        new NoOfDeaths(),
        new NoOfDeaths(),
        new NoOfDeaths(),
        new NoOfDeaths(),
        new NoOfDeaths(),
        new NoOfDeaths(),
        new NoOfDeaths(),
        new NoOfDeaths(),
    ];

}