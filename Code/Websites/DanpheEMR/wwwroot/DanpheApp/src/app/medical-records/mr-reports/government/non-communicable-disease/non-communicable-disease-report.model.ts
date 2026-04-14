// non-communicable-disease-report.model.ts

// Define NonCommunicableDisease class once
export class NonCommunicableDisease {
    disease: string;
    new: number | null;
    followUp: number | null;
    female: number | null;
    male: number | null;
    under20: number | null;
    age20To29: number | null;
    age30To69: number | null;
    age70AndAbove: number | null;

    // Constructor with optional parameters, using `null` as the default
    constructor(
        disease: string,
        newCases: number | null = null,
        followUp: number | null = null,
        female: number | null = null,
        male: number | null = null,
        under20: number | null = null,
        age20To29: number | null = null,
        age30To69: number | null = null,
        age70AndAbove: number | null = null
    ) {
        this.disease = disease;
        this.new = newCases;
        this.followUp = followUp;
        this.female = female;
        this.male = male;
        this.under20 = under20;
        this.age20To29 = age20To29;
        this.age30To69 = age30To69;
        this.age70AndAbove = age70AndAbove;
    }
}

// New Class for NCD Cases
export class NCDCases {
    disease: string;
    female: number | null;
    male: number | null;
    under20: number | null;
    age20To29: number | null;
    age30To69: number | null;
    age70AndAbove: number | null;
    referredOut: number | null;

    constructor(
        disease: string,
        female: number | null = null,
        male: number | null = null,
        under20: number | null = null,
        age20To29: number | null = null,
        age30To69: number | null = null,
        age70AndAbove: number | null = null,
        referredOut: number | null = null
    ) {
        this.disease = disease;
        this.female = female;
        this.male = male;
        this.under20 = under20;
        this.age20To29 = age20To29;
        this.age30To69 = age30To69;
        this.age70AndAbove = age70AndAbove;
        this.referredOut = referredOut;
    }
}


export class MentalHealthCases {
    disease: string;
    new: number | null;
    followUp: number | null;
    female: number | null;
    male: number | null;
    under20: number | null;
    age20To29: number | null;
    age30To69: number | null;
    age70AndAbove: number | null;

    // Constructor with optional parameters, using `null` as the default
    constructor(
        disease: string,
        newCases: number | null = null,
        followUp: number | null = null,
        female: number | null = null,
        male: number | null = null,
        under20: number | null = null,
        age20To29: number | null = null,
        age30To69: number | null = null,
        age70AndAbove: number | null = null
    ) {
        this.disease = disease;
        this.new = newCases;
        this.followUp = followUp;
        this.female = female;
        this.male = male;
        this.under20 = under20;
        this.age20To29 = age20To29;
        this.age30To69 = age30To69;
        this.age70AndAbove = age70AndAbove;
    }
}

export class CancerCases {
    disease: string;
    female: number | null;
    male: number | null;
    under20: number | null;
    age20To29: number | null;
    age30To69: number | null;
    age70AndAbove: number | null;
    referredOut: number | null;

    constructor(
        disease: string,
        female: number | null = null,
        male: number | null = null,
        under20: number | null = null,
        age20To29: number | null = null,
        age30To69: number | null = null,
        age70AndAbove: number | null = null,
        referredOut: number | null = null
    ) {
        this.disease = disease;
        this.female = female;
        this.male = male;
        this.under20 = under20;
        this.age20To29 = age20To29;
        this.age30To69 = age30To69;
        this.age70AndAbove = age70AndAbove;
        this.referredOut = referredOut;
    }

}
export class TypeOfCases {
    disease: string;
    new: number | null;
    followUp: number | null;


    // Constructor with optional parameters, using `null` as the default
    constructor(
        disease: string,
        newCases: number | null = null,
        followUp: number | null = null,

    ) {
        this.disease = disease;
        this.new = newCases;
        this.followUp = followUp;

    }
}

export class InjuriesType {
    disease: string;
    new: number | null;
    followUp: number | null;
    female: number | null;
    male: number | null;
    under20: number | null;
    age20To29: number | null;
    age30To69: number | null;
    age70AndAbove: number | null;

    // Constructor with optional parameters, using `null` as the default
    constructor(
        disease: string,
        newCases: number | null = null,
        followUp: number | null = null,
        female: number | null = null,
        male: number | null = null,
        under20: number | null = null,
        age20To29: number | null = null,
        age30To69: number | null = null,
        age70AndAbove: number | null = null
    ) {
        this.disease = disease;
        this.new = newCases;
        this.followUp = followUp;
        this.female = female;
        this.male = male;
        this.under20 = under20;
        this.age20To29 = age20To29;
        this.age30To69 = age30To69;
        this.age70AndAbove = age70AndAbove;
    }
}

export class NoOfDeaths {
    female: number | null;
    male: number | null;
    under20: number | 0;
    age20To29: number | null;
    age30To69: number | null;
    age70AndAbove: number | null;

    constructor(
        female: number | null = null,
        male: number | null = null,
        under20: number | 0 = 0,
        age20To29: number | null = null,
        age30To69: number | null = null,
        age70AndAbove: number | null = null,
    ) {
        this.female = female;
        this.male = male;
        this.under20 = under20;
        this.age20To29 = age20To29;
        this.age30To69 = age30To69;
        this.age70AndAbove = age70AndAbove;
    }

}