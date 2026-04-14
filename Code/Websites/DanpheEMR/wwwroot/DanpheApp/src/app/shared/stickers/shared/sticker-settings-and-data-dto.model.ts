import { RegistrationStickerSettings_DTO } from "./registration-sticker-settings-dto.model";
import { StickerTemplates } from "./sticker-templates.dto";
import { VisitStickerData_DTO } from "./visit-sticker-data-dto.model";

export class StickerSettingsAndData {
    public RegistrationStickerSettings: RegistrationStickerSettings_DTO = new RegistrationStickerSettings_DTO()
    public VisitStickerData: VisitStickerData_DTO = new VisitStickerData_DTO();
    public StickerTemplates = new Array<StickerTemplates>();
}