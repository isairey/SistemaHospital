using DanpheEMR.Controllers.Clinical_New.DTO;
using DanpheEMR.Controllers.Settings.DTO;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.ClinicalModel_New;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.LabModels;
using DanpheEMR.Services.Clinical_New.DTOs;
using DanpheEMR.Services.NewClinical;
using DanpheEMR.Services.NewClinical.DTOs;

using Microsoft.EntityFrameworkCore.Storage;
using Newtonsoft.Json;
using Remotion.Linq.Clauses;
using Serilog;
//using OfficeOpenXml.FormulaParsing.Excel.Functions.Math;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;



namespace DanpheEMR.Services.Clinical_New
{
    public class ClinicalSettingService : IClinicalSettingService
    {
        public object GetClinicalFieldOption(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var fieldOptions = _clinicalSettingDbContext.ClinicalFieldOptions.ToList();
            return fieldOptions;
        }
        public object GetClinicalFieldsQuestionaryOption(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var questionaryOptions = _clinicalSettingDbContext.ClinicalFieldsQuestionaryOptions.ToList();
            return questionaryOptions;
        }

        public object GetClinicalFieldsQuestionary(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var fieldQuestionary = (from questionary in _clinicalSettingDbContext.ClinicalFieldsQuestionaries
                                    join field in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups on questionary.FieldId equals field.FieldId
                                    select new
                                    {
                                        QuestionId = questionary.QuestionId,
                                        Question = questionary.Question,
                                        AnswerType = questionary.AnswerType,
                                        IsActive = questionary.IsActive,
                                        FieldId = field.FieldId,
                                        FieldName = field.FieldName
                                    }).ToList();

            return fieldQuestionary;

        }


        public object PostClinicalFieldQuestionary(RbacUser currentUser, ClinicalHeadingFieldsQuestionary_DTO clinicalHeadingFieldsQuestionary_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try

                {

                    if (clinicalHeadingFieldsQuestionary_DTO == null)
                    {
                        Log.Error($"{nameof(clinicalHeadingFieldsQuestionary_DTO)} is null, cannot proceed further");
                        throw new ArgumentNullException($"{nameof(clinicalHeadingFieldsQuestionary_DTO)} is null, cannot proceed further");
                    }

                    var existingQuestionary = _clinicalSettingDbContext.ClinicalFieldsQuestionaries
                         .FirstOrDefault(q => q.QuestionId == clinicalHeadingFieldsQuestionary_DTO.QuestionId);



                    if (existingQuestionary != null)
                    {
                        existingQuestionary.Question = clinicalHeadingFieldsQuestionary_DTO.Question;
                        existingQuestionary.AnswerType = clinicalHeadingFieldsQuestionary_DTO.AnswerType;
                        existingQuestionary.FieldId = clinicalHeadingFieldsQuestionary_DTO.FieldId;

                        if (clinicalHeadingFieldsQuestionary_DTO.QuestionOptions != null)
                        {
                            foreach (var optionDTO in clinicalHeadingFieldsQuestionary_DTO.QuestionOptions)
                            {
                                optionDTO.QuestionId = existingQuestionary.QuestionId;
                                var existingOption = _clinicalSettingDbContext.ClinicalFieldsQuestionaryOptions
                                    .FirstOrDefault(o => o.QuestionOptionId == optionDTO.QuestionOptionId);

                                if (existingOption != null)
                                {
                                    existingOption.QuestionOption = optionDTO.QuestionOption;
                                    existingOption.ModifiedBy = currentUser.EmployeeId;
                                    existingOption.ModifiedOn = DateTime.Now;
                                }

                                else
                                {
                                    var newOption = new ClinicalFieldsQuestionaryOptionModel
                                    {
                                        QuestionId = (int)optionDTO.QuestionId,
                                        QuestionOption = optionDTO.QuestionOption,
                                        CreatedBy = currentUser.EmployeeId,
                                        CreatedOn = DateTime.Now,
                                        IsActive = true
                                    };
                                    if (existingQuestionary.QuestionOptions == null)
                                    {
                                        existingQuestionary.QuestionOptions = new List<ClinicalFieldsQuestionaryOptionModel> { newOption };

                                    }
                                    else
                                    {
                                        existingQuestionary.QuestionOptions.Add(newOption);
                                    }

                                }
                            }
                        }

                        existingQuestionary.ModifiedBy = currentUser.EmployeeId;
                        existingQuestionary.ModifiedOn = DateTime.Now;
                    }
                    else
                    {
                        var questionaryOption = _clinicalSettingDbContext.ClinicalFieldsQuestionaries
                        .FirstOrDefault(q =>
                        q.Question == clinicalHeadingFieldsQuestionary_DTO.Question &&
                        q.FieldId == clinicalHeadingFieldsQuestionary_DTO.FieldId &&
                        q.AnswerType == clinicalHeadingFieldsQuestionary_DTO.AnswerType);

                        if (questionaryOption != null && (questionaryOption.AnswerType != "Multiple Select" && questionaryOption.AnswerType != "Single Selection"))
                        {
                            Log.Error("A record with the same question, field ID, and answer type already exists in the database.");
                            throw new Exception("A record with the same question, field ID, and answer type already exists in the database.");
                        }

                        var newQuestionary = new ClinicalHeadingFieldsQuestionaryModel
                        {
                            Question = clinicalHeadingFieldsQuestionary_DTO.Question,
                            AnswerType = clinicalHeadingFieldsQuestionary_DTO.AnswerType,
                            CreatedBy = currentUser.EmployeeId,
                            CreatedOn = DateTime.Now,
                            IsActive = true,
                            FieldId = clinicalHeadingFieldsQuestionary_DTO.FieldId
                        };

                        if (clinicalHeadingFieldsQuestionary_DTO.QuestionOptions != null)
                        {
                            newQuestionary.QuestionOptions = clinicalHeadingFieldsQuestionary_DTO.QuestionOptions
                                .Select(optionDTO => new ClinicalFieldsQuestionaryOptionModel
                                {
                                    QuestionOption = optionDTO.QuestionOption,
                                    CreatedBy = currentUser.EmployeeId,
                                    CreatedOn = DateTime.Now,
                                    IsActive = true
                                }).ToList();
                        }

                        _clinicalSettingDbContext.ClinicalFieldsQuestionaries.Add(newQuestionary);
                    }

                    _clinicalSettingDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return clinicalHeadingFieldsQuestionary_DTO;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw ex;
                }
            }
        }
        /// <summary>
        /// Retrieves a list of active clinical phrases that are shared, along with the details of the employee who created them.
        /// </summary>
        /// <returns>Returns a list of shared clinical phrases, including information about the employee who created the phrase. If no employee is found, "No Employee" is displayed.</returns>

        public object GetClinicalSharedPhrases(ClinicalSettingDbContext clinicalSettingDbContext)
        {
            var clinicalSharedPhrases = (from phrases in clinicalSettingDbContext.ClinicalPreDefinedTemplates
                                         join employee in clinicalSettingDbContext.Employees
                                         on phrases.CreatedBy equals employee.EmployeeId into employeeJoin
                                         from emp in employeeJoin.DefaultIfEmpty()
                                         where phrases.IsActive && phrases.TemplateAccessibility == ENUM_PhrasesAccessibility.Shared
                                         select new
                                         {
                                             phrases.PredefinedTemplateId,
                                             phrases.TemplateName,
                                             phrases.TemplateCode,
                                             phrases.TemplateGroup,
                                             phrases.TemplateType,
                                             phrases.TemplateAccessibility,
                                             phrases.IsActive,
                                             phrases.CreatedBy,
                                             phrases.CreatedOn,
                                             phrases.ModifiedBy,
                                             phrases.ModifiedOn,
                                             phrases.TemplateContent,
                                             EmployeeName = emp != null ? emp.FullName : null
                                         }).ToList();
            return clinicalSharedPhrases;
        }
        public object GetClinicalPhrases(RbacUser currentUser, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            List<RbacRole> usrAllRoles = RBAC.GetUserAllRoles(currentUser.EmployeeId);
            bool isAdmin = usrAllRoles != null && usrAllRoles.Any(role => role.IsSysAdmin);

            var clinicalPhrases = clinicalSettingDbContext.ClinicalPreDefinedTemplates
            .Where(phrase => isAdmin || phrase.CreatedBy == currentUser.EmployeeId)
            .ToList();
            return clinicalPhrases;
        }

        /// <summary>
        /// Adds a new clinical phrase (predefined template) to the database after validating the input and checking for duplicates.
        /// </summary>
        /// <param name="currentUser">The user who is performing the operation, used to set created and modified details.</param>
        /// <param name="clinicalPhrases_DTO">The Data Transfer Object (DTO) containing the details of the clinical phrase to be added.</param>
        /// <returns>Returns the added clinical phrase DTO after successful insertion into the database.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the provided DTO is null or invalid.</exception>
        /// <exception cref="InvalidOperationException">Thrown when a clinical phrase with the same TemplateCode already exists.</exception>
        /// <exception cref="SqlException">Thrown in case of a SQL database error during the transaction.</exception>
        /// <exception cref="Exception">Thrown for any other general exceptions encountered during the operation.</exception>

        public object PostClinicalPhrases(RbacUser currentUser, ClinicalPhrases_DTO clinicalPhrases_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {

                    if (clinicalPhrases_DTO == null)
                    {
                        Log.Error($"Nothing to save as {nameof(clinicalPhrases_DTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(clinicalPhrases_DTO)} is null.");
                    }


                    if (_clinicalSettingDbContext.ClinicalPreDefinedTemplates.Any(t => t.TemplateCode.ToLower() == clinicalPhrases_DTO.TemplateCode.ToLower()))
                    {
                        Log.Error($"TemplateCode '{clinicalPhrases_DTO.TemplateCode}' already exists.");
                        throw new InvalidOperationException($"TemplateCode '{clinicalPhrases_DTO.TemplateCode}' already exists.");
                    }

                    if (_clinicalSettingDbContext.ClinicalPreDefinedTemplates.Any(t => t.TemplateName.ToLower() == clinicalPhrases_DTO.TemplateName.ToLower()))
                    {
                        Log.Error($"TemplateName '{clinicalPhrases_DTO.TemplateName}' already exists.");
                        throw new InvalidOperationException($"TemplateName '{clinicalPhrases_DTO.TemplateName}' already exists.");
                    }

                    var templateGroup = string.IsNullOrEmpty(clinicalPhrases_DTO.TemplateGroup) ? "NA" : clinicalPhrases_DTO.TemplateGroup;


                    var clinicalPreDefinedTemplatesModel = new ClinicalPreDefinedTemplatesModel()
                    {
                        TemplateCode = clinicalPhrases_DTO.TemplateCode,
                        TemplateName = clinicalPhrases_DTO.TemplateName,
                        TemplateAccessibility = clinicalPhrases_DTO.TemplateAccessibility,
                        TemplateType = clinicalPhrases_DTO.TemplateType,
                        TemplateContent = clinicalPhrases_DTO.TemplateContent,
                        TemplateGroup = templateGroup,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = DateTime.Now,
                        IsActive = true
                    };


                    _clinicalSettingDbContext.ClinicalPreDefinedTemplates.Add(clinicalPreDefinedTemplatesModel);
                    _clinicalSettingDbContext.SaveChanges();


                    dbContextTransaction.Commit();

                    return clinicalPhrases_DTO;
                }
                catch (SqlException sqlEx)
                {

                    dbContextTransaction.Rollback();
                    Log.Error($"A SQL error occurred while saving Clinical Phrases: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while saving Clinical Phrases: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {

                    dbContextTransaction.Rollback();
                    Log.Error($"An error occurred while saving the clinical phrase: {ex.Message}", ex);
                    throw new Exception($"An error occurred while saving the clinical phrase: {ex.Message}. Exception details: {ex}");
                }
            }
        }
        /// <summary>
        /// Updates an existing clinical phrase (predefined template) in the database after validating the input and checking for its existence.
        /// </summary>
        /// <param name="currentUser">The user performing the update operation, used to set modified details.</param>
        /// <param name="clinicalPhrases_DTO">The Data Transfer Object (DTO) containing the updated details of the clinical phrase.</param>
        /// <returns>Returns the updated clinical phrase DTO after successful modification in the database.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the provided DTO is null or when the PredefinedTemplateId is not provided.</exception>
        /// <exception cref="InvalidOperationException">Thrown when no clinical phrase is found for the given PredefinedTemplateId.</exception>
        /// <exception cref="SqlException">Thrown in case of a SQL database error during the transaction.</exception>
        /// <exception cref="Exception">Thrown for any other general exceptions encountered during the update operation.</exception>

        public object UpdateClinicalPhrases(RbacUser currentUser, ClinicalPhrases_DTO clinicalPhrases_DTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            using (var clinicalPhrasesTransaction = clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (clinicalPhrases_DTO == null)
                    {
                        Log.Error($"Nothing to update as {nameof(clinicalPhrases_DTO)} is null.");
                        throw new ArgumentNullException($"Nothing to update as {nameof(clinicalPhrases_DTO)} is null.");
                    }
                    if (clinicalPhrases_DTO.PredefinedTemplateId == 0)
                    {
                        Log.Error($"PredefinedTemplateId is not provided to update the Clinical phrase.");
                        throw new ArgumentNullException($"{nameof(clinicalPhrases_DTO.PredefinedTemplateId)} is not provided to update the Clinical phrase.");
                    }

                    var clinicalPhrases = clinicalSettingDbContext.ClinicalPreDefinedTemplates
                        .FirstOrDefault(x => x.PredefinedTemplateId == clinicalPhrases_DTO.PredefinedTemplateId);

                    if (clinicalPhrases == null)
                    {
                        Log.Error($"No clinical phrase found for {nameof(clinicalPhrases_DTO.PredefinedTemplateId)}");
                        throw new InvalidOperationException($"No clinical phrase found for {nameof(clinicalPhrases_DTO.PredefinedTemplateId)}.");
                    }
                    var existingTemplateName = clinicalSettingDbContext.ClinicalPreDefinedTemplates
                        .FirstOrDefault(x => x.TemplateName.ToLower() == clinicalPhrases_DTO.TemplateName.ToLower() &&
                                             x.PredefinedTemplateId != clinicalPhrases_DTO.PredefinedTemplateId);

                    var existingTemplateCode = clinicalSettingDbContext.ClinicalPreDefinedTemplates
                        .FirstOrDefault(x => x.TemplateCode.ToLower() == clinicalPhrases_DTO.TemplateCode.ToLower() &&
                                             x.PredefinedTemplateId != clinicalPhrases_DTO.PredefinedTemplateId);

                    if (existingTemplateCode != null)
                    {
                        Log.Error($"This TemplateCode '{clinicalPhrases_DTO.TemplateCode}' already exists in Clinical phrase.");
                        throw new InvalidOperationException($"This TemplateCode '{clinicalPhrases_DTO.TemplateCode}' already exists. Duplicates are not allowed.");
                    }
                    if (existingTemplateName != null)
                    {
                        Log.Error($"This TemplateName '{clinicalPhrases_DTO.TemplateName}' already exists in Clinical phrase.");
                        throw new InvalidOperationException($"This TemplateName '{clinicalPhrases_DTO.TemplateName}' already exists. Duplicates are not allowed.");
                    }

                    clinicalPhrases.ModifiedOn = DateTime.Now;
                    clinicalPhrases.ModifiedBy = currentUser.EmployeeId;
                    clinicalPhrases.IsActive = true;
                    clinicalPhrases.TemplateCode = clinicalPhrases_DTO.TemplateCode;
                    clinicalPhrases.TemplateName = clinicalPhrases_DTO.TemplateName;
                    clinicalPhrases.TemplateType = clinicalPhrases_DTO.TemplateType;
                    clinicalPhrases.TemplateGroup = clinicalPhrases_DTO.TemplateGroup;
                    clinicalPhrases.TemplateAccessibility = clinicalPhrases_DTO.TemplateAccessibility;
                    clinicalPhrases.TemplateContent = clinicalPhrases_DTO.TemplateContent;

                    clinicalSettingDbContext.Entry(clinicalPhrases).State = EntityState.Modified;
                    clinicalSettingDbContext.SaveChanges();

                    clinicalPhrasesTransaction.Commit();

                    return clinicalPhrases_DTO;
                }
                catch (SqlException sqlEx)
                {
                    clinicalPhrasesTransaction.Rollback();
                    Log.Error($"A SQL error occurred while updating Clinical Phrases: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while updating Clinical Phrases: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    clinicalPhrasesTransaction.Rollback();
                    Log.Error($"An error occurred while updating the clinical phrase: {ex.Message}", ex);
                    throw new Exception($"An error occurred while updating the clinical phrase: {ex.Message}. Exception details: {ex}");
                }
            }
        }

        public object ActivateDeactivateClinicalPhrases(RbacUser currentUser, int PredefinedTemplateId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (PredefinedTemplateId == 0)
            {
                Log.Error($"{nameof(PredefinedTemplateId)} is not provided");
                throw new InvalidOperationException($"{nameof(PredefinedTemplateId)} is not provided");
            }
            var clinicalPhrase = _clinicalSettingDbContext.ClinicalPreDefinedTemplates.FirstOrDefault(r => r.PredefinedTemplateId == PredefinedTemplateId);
            if (clinicalPhrase == null)
            {
                Log.Error($"There is no Clinical Phrase to update with PredefinedTemplateId {PredefinedTemplateId}");
                throw new InvalidOperationException($"There is no Clinical Phrase to update with PredefinedTemplateId {PredefinedTemplateId}");
            }
            try
            {
                clinicalPhrase.IsActive = !clinicalPhrase.IsActive;
                clinicalPhrase.ModifiedBy = currentUser.EmployeeId;
                clinicalPhrase.ModifiedOn = DateTime.Now;

                _clinicalSettingDbContext.Entry(clinicalPhrase).State = EntityState.Modified;
                _clinicalSettingDbContext.SaveChanges();

                return clinicalPhrase;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Activate/Deactivate the clinical Phrase: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while Activate / Deactivate the clinical Phrase.{ex.Message}");
            }

        }

        public object GetClinicalTemplates(ClinicalSettingDbContext clinicalSettingDbContext)
        {
            var clinicalTemplates = clinicalSettingDbContext.ClinicalTemplates.OrderByDescending(a => a.CreatedOn).ToList();
            return clinicalTemplates;
        }
        public object PostClinicalTemplate(RbacUser currentUser, ClinicalTemplates_DTO clinicalTemplates_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (clinicalTemplates_DTO == null)
                    {
                        Log.Error($"Nothing to save as  {nameof(clinicalTemplates_DTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(clinicalTemplates_DTO)} is null.");
                    }
                    if (_clinicalSettingDbContext.ClinicalTemplates.Any(t => t.TemplateCode == clinicalTemplates_DTO.TemplateCode))
                    {
                        Log.Error($"TemplateCode '{clinicalTemplates_DTO.TemplateCode}' already exists.");
                        throw new InvalidOperationException($"TemplateCode '{clinicalTemplates_DTO.TemplateCode}' already exists.");
                    }
                    if (_clinicalSettingDbContext.ClinicalTemplates.Any(t => t.TemplateName == clinicalTemplates_DTO.TemplateName))
                    {
                        Log.Error($"TemplateName '{clinicalTemplates_DTO.TemplateName}' already exists.");
                        throw new InvalidOperationException($"TemplateName '{clinicalTemplates_DTO.TemplateName}' already exists.");
                    }

                    var clinicalTemplatesModel = new ClinicalTemplatesModel()
                    {
                        TemplateCode = clinicalTemplates_DTO.TemplateCode,
                        TemplateName = clinicalTemplates_DTO.TemplateName,
                        TemplateType = string.IsNullOrEmpty(clinicalTemplates_DTO.TemplateType) ? null : clinicalTemplates_DTO.TemplateType,
                        TemplateHTML = clinicalTemplates_DTO.TemplateHTML,
                        PrintHospitalHeader = clinicalTemplates_DTO.PrintHospitalHeader,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now,
                        EditorType = clinicalTemplates_DTO.EditorType
                    };
                    _clinicalSettingDbContext.ClinicalTemplates.Add(clinicalTemplatesModel);
                    _clinicalSettingDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return clinicalTemplates_DTO;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while saving the clinical template: {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the clinical template.{ex.Message}");

                }
            }
        }
        public object UpdateClinicalTemplate(RbacUser currentUser, ClinicalTemplates_DTO clinicalTemplates_DTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            if (clinicalTemplates_DTO == null)
            {
                Log.Error($"Nothing to update as  {nameof(clinicalTemplates_DTO)} is null.");
                throw new ArgumentNullException($"Nothing to update as{nameof(clinicalTemplates_DTO)} is null");
            }
            if (clinicalTemplates_DTO != null && clinicalTemplates_DTO.TemplateId == 0)
            {
                Log.Error($" {nameof(clinicalTemplates_DTO)} is not provided to update the Clinical Template.");
                throw new ArgumentNullException($"{nameof(clinicalTemplates_DTO.TemplateId)} is not provided to update the Clinical Template");
            }
            var clinicalTemplates = clinicalSettingDbContext.ClinicalTemplates.Where(x => x.TemplateId == clinicalTemplates_DTO.TemplateId).FirstOrDefault();
            if (clinicalTemplates == null)
            {
                Log.Error($"No clinical template is found for {nameof(clinicalTemplates_DTO.TemplateId)}");
                throw new InvalidOperationException($"No clinical template is found for {nameof(clinicalTemplates_DTO.TemplateId)}");
            }

            var existingTemplateName = clinicalSettingDbContext.ClinicalPreDefinedTemplates
                       .FirstOrDefault(x => x.TemplateName.ToLower() == clinicalTemplates_DTO.TemplateName.ToLower() &&
                                            x.PredefinedTemplateId != clinicalTemplates_DTO.TemplateId);

            var existingTemplateCode = clinicalSettingDbContext.ClinicalPreDefinedTemplates
                .FirstOrDefault(x => x.TemplateCode.ToLower() == clinicalTemplates_DTO.TemplateCode.ToLower() &&
                                     x.PredefinedTemplateId != clinicalTemplates_DTO.TemplateId);
            if (existingTemplateCode != null)
            {
                Log.Error($"This TemplateCode '{clinicalTemplates_DTO.TemplateCode}' already exists in Clinical Template.");
                throw new InvalidOperationException($"This TemplateCode '{clinicalTemplates_DTO.TemplateCode}' already exists. Duplicates are not allowed.");
            }
            if (existingTemplateName != null)
            {
                Log.Error($"This TemplateName '{clinicalTemplates_DTO.TemplateName}' already exists in Clinical Template.");
                throw new InvalidOperationException($"This TemplateName '{clinicalTemplates_DTO.TemplateName}' already exists. Duplicates are not allowed.");
            }
            clinicalTemplates.ModifiedOn = DateTime.Now;
            clinicalTemplates.ModifiedBy = currentUser.EmployeeId;
            clinicalTemplates.IsActive = true;
            clinicalTemplates.TemplateCode = clinicalTemplates_DTO.TemplateCode;
            clinicalTemplates.TemplateName = clinicalTemplates_DTO.TemplateName;
            clinicalTemplates.TemplateType = string.IsNullOrEmpty(clinicalTemplates_DTO.TemplateType) ? null : clinicalTemplates_DTO.TemplateType;
            clinicalTemplates.TemplateHTML = clinicalTemplates_DTO.TemplateHTML;
            clinicalTemplates.PrintHospitalHeader = clinicalTemplates_DTO.PrintHospitalHeader;
            clinicalTemplates.EditorType = clinicalTemplates_DTO.EditorType;

            clinicalSettingDbContext.Entry(clinicalTemplates).State = EntityState.Modified;
            clinicalSettingDbContext.SaveChanges();
            return clinicalTemplates_DTO;
        }
        public object ActivateDeactivateClinicalTemplate(RbacUser currentUser, int templateId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (templateId == 0)
            {
                Log.Error($"{nameof(templateId)} is not provided");
                throw new InvalidOperationException($"{nameof(templateId)} is not provided");
            }

            var clinicalTemplate = _clinicalSettingDbContext.ClinicalTemplates.FirstOrDefault(r => r.TemplateId == templateId);

            if (clinicalTemplate == null)
            {
                Log.Error($"There is no Clinical Template to update with FieldId {templateId}");
                throw new InvalidOperationException($"There is no Clinical Template to update with TemplateId {templateId}");
            }

            try
            {
                clinicalTemplate.IsActive = !clinicalTemplate.IsActive;
                clinicalTemplate.ModifiedBy = currentUser.EmployeeId;
                clinicalTemplate.ModifiedOn = DateTime.Now;

                _clinicalSettingDbContext.Entry(clinicalTemplate).State = EntityState.Modified;
                _clinicalSettingDbContext.SaveChanges();

                return clinicalTemplate;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Activate/Deactivate the clinical template: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while Activate / Deactivate the clinical template.{ex.Message}");
            }
        }

        public object ActivateDeactivateHeadingField(RbacUser currentUser, int fieldId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (fieldId == 0)
            {
                Log.Error($"{nameof(fieldId)} is not provided");
                throw new InvalidOperationException($"{nameof(fieldId)} is not provided");
            }

            var clnFieldSetUp = _clinicalSettingDbContext.ClinicalHeadingFieldsSetups.FirstOrDefault(r => r.FieldId == fieldId);

            if (clnFieldSetUp == null)
            {
                Log.Error($"There is no Clinical Heading Field to update with FieldId {fieldId}");
                throw new InvalidOperationException($"There is no Clinical Heading Field to update with FieldId {fieldId}");
            }

            try
            {
                clnFieldSetUp.IsActive = !clnFieldSetUp.IsActive;
                clnFieldSetUp.ModifiedBy = currentUser.EmployeeId;
                clnFieldSetUp.ModifiedOn = DateTime.Now;

                _clinicalSettingDbContext.Entry(clnFieldSetUp).State = EntityState.Modified;
                _clinicalSettingDbContext.SaveChanges();

                return clnFieldSetUp;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred: {ex.Message}");
                throw;
            }
        }

        public object GetClinicalHeading(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var clinicalHeadings = _clinicalSettingDbContext.ClinicalHeadings.OrderByDescending(a => a.CreatedOn).ToList();
            return clinicalHeadings;
        }
        public object GetChiefComplains(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var chiefComplains = _clinicalSettingDbContext.ChiefComplains.OrderByDescending(a => a.CreatedOn).ToList();
            return chiefComplains;
        }
        public object GetClinicalNote(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var clinicalNotes = _clinicalSettingDbContext.ClinicalNotes.OrderBy(a => a.DisplayOrder).ToList();
            return clinicalNotes;
        }


        public object GetClinicalParentHeading(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var parentHeadings = (from parentheading in _clinicalSettingDbContext.ClinicalHeadings
                                  where parentheading.ParentId == null && parentheading.IsActive
                                  select parentheading).ToList();
            return parentHeadings;
        }
        public object GetClinicalHeadingFields(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
 
            var headings = (from child in _clinicalSettingDbContext.ClinicalHeadings
                            join parent in _clinicalSettingDbContext.ClinicalHeadings
                                on child.ParentId equals parent.ClinicalHeadingId
                            where child.ParentId != null
                                  && child.IsActive
                                  && parent.IsActive
                            select child).ToList();

            return headings;
        }
        public object GetClinicalHeadingFieldSetup(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var clnheadfield = (from field in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups
                                join pretemplateOptions in _clinicalSettingDbContext.ClinicalFieldOptions
                                    on new { field.FieldId, field.InputType } equals new { pretemplateOptions.FieldId, InputType = ENUM_ClinicalField_InputType.SmartTemplate.ToLower() } into pretemplateOptionsGroup
                                from pretemplateOption in pretemplateOptionsGroup.DefaultIfEmpty()
                                join smartPrintableOptions in _clinicalSettingDbContext.ClinicalFieldOptions
                                    on new { field.FieldId, field.InputType } equals new { smartPrintableOptions.FieldId, InputType = ENUM_ClinicalField_InputType.SmartPrintableForm.ToLower() } into smartPrintableOptionsGroup
                                from smartPrintableOption in smartPrintableOptionsGroup.DefaultIfEmpty()
                                select new
                                {
                                    field.FieldId,
                                    field.FieldName,
                                    field.InputType,
                                    field.IsActive,
                                    field.IsIPD,
                                    field.IsOPD,
                                    field.IsEmergency,
                                    field.GroupName,
                                    field.CreatedOn,
                                    field.IsAcrossVisitAvailability,
                                    field.IsDisplayTitle,
                                    OptionValue = field.InputType.ToLower() == ENUM_ClinicalField_InputType.SmartTemplate.ToLower() ? (pretemplateOption == null ? null : pretemplateOption.Options) :
                                                  field.InputType.ToLower() == ENUM_ClinicalField_InputType.SmartPrintableForm.ToLower() ? (smartPrintableOption == null ? null : smartPrintableOption.Options) : null
                                }).OrderByDescending(field => field.CreatedOn).ToList();

            return clnheadfield;
        }



        public object GetBedList(ClinicalSettingDbContext _clinicalSettingDbContext, int WardId, int BedFeatureId)
        {
            var bedList = (from bd in _clinicalSettingDbContext.Beds
                           join bedfet in _clinicalSettingDbContext.BedFeaturesMaps
                           on bd.BedId equals bedfet.BedId
                           where bedfet.WardId == WardId && bedfet.BedFeatureId == BedFeatureId
                           orderby bd.BedId
                           select bd).ToList();

            return bedList;
        }


        public object GetReservedBedList(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var bedList = (from res in _clinicalSettingDbContext.BedReservation
                           join bed in _clinicalSettingDbContext.Beds
                           on res.BedId equals bed.BedId
                           join ward in _clinicalSettingDbContext.Wards
                           on bed.WardId equals ward.WardId
                           join bedft in _clinicalSettingDbContext.BedFeatures
                           on res.BedFeatureId equals bedft.BedFeatureId
                           where bed.IsReserved == true
                           select new
                           {
                               bed.BedCode,
                               bed.BedId,
                               bed.Ward,
                               ward.WardName,
                               ward.WardId,
                               bedft.BedFeatureId,
                               bedft.BedFeatureName,
                               res.PatientId,
                               res.PatientVisitId
                           }).ToList();
            return bedList;
        }
        public object GetLabItems(ClinicalSettingDbContext _clinicalSettingDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {

            var labItems = (from requisition in _clinicalSettingDbContext.Requisitions
                            join testComponent in _clinicalSettingDbContext.TestComponentResults
                            on requisition.RequisitionId equals testComponent.RequisitionId
                            join componentModel in _clinicalSettingDbContext.LabTestComponents
                            on testComponent.ComponentId equals componentModel.ComponentId
                            join test in _clinicalSettingDbContext.LabTests
                            on testComponent.LabTestId equals test.LabTestId
                            join category in _clinicalSettingDbContext.LabTestCategory
                            on test.LabTestCategoryId equals category.TestCategoryId
                            where (IsAcrossVisitAvailability
                                    ? requisition.PatientId == PatientId
                                    : requisition.PatientVisitId == PatientVisitId)
                            select new
                            {
                                testComponent.RequisitionId,
                                testComponent.ComponentName,
                                testComponent.Value,
                                testComponent.Unit,
                                testComponent.CreatedOn,
                                componentModel.ValueType,
                                componentModel.MaleRange,
                                componentModel.FemaleRange,
                                componentModel.ChildRange,
                                componentModel.Range,
                                componentModel.RangeDescription,
                                category.TestCategoryName,
                                test.LabTestName,
                                testComponent.IsAbnormal


                            }).ToList();


            return labItems.Count > 0 ? labItems : null;
        }
        public object GetRequestedItems(ClinicalSettingDbContext _clinicalSettingDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            var requestedItems = (from txn in _clinicalSettingDbContext.BillingTransactionItems
                                  join dep in _clinicalSettingDbContext.ServiceDepartment
                                  on txn.ServiceDepartmentId equals dep.ServiceDepartmentId
                                  join req in _clinicalSettingDbContext.Requisitions
                                  on txn.BillingTransactionItemId equals req.BillingTransactionItemId into requisitionGroup
                                  from req in requisitionGroup.DefaultIfEmpty() 
                                  join radiologyReq in _clinicalSettingDbContext.RadiologyImagingRequisitions
                                  on txn.BillingTransactionItemId equals radiologyReq.BillingTransactionItemId into radiologyGroup
                                  from radiology in radiologyGroup.DefaultIfEmpty() 
                                  where (IsAcrossVisitAvailability
                                         ? txn.PatientId == PatientId
                                         : txn.PatientVisitId == PatientVisitId)
                                  && (
                                      (dep.IntegrationName == "LAB" && req.IsActive == true) 
                                      || (dep.IntegrationName == "Radiology" && radiology.IsActive == true) 
                                  )
                                  select new RequestedItem_DTO
                                  {
                                      RequisitionId = dep.IntegrationName == "Lab" ? req.RequisitionId : radiology.ImagingRequisitionId, 
                                      TestName = txn.ItemName,
                                      OrderStatus = txn.OrderStatus,
                                      Type = dep.IntegrationName == "LAB" ? "Lab" :
                                             dep.IntegrationName == "Radiology" ? "Radiology" : "Others",
                                      RequisitionDate = txn.RequisitionDate,
                                      BillStatus= txn.BillStatus

                                  }).ToList();

            return requestedItems.Count > 0 ? requestedItems : null;
        }

        public object GetClinicalNoteAndAssessmentPlan(ClinicalSettingDbContext _clinicalSettingDbContext, int PatientId, int PatientVisitId)
        {
            var noteslist = (from cln in _clinicalSettingDbContext.ClinicalAssessmentAndPlan
                             join clNote in _clinicalSettingDbContext.ClinicalNotes
                             on cln.ClinicalNotesMasterId equals clNote.ClinicalNoteMasterId
                             where cln.PatientId == PatientId && cln.VisitId == PatientVisitId
                             select new
                             {
                                 ClinicalNotesMasterId = cln.ClinicalNotesMasterId,
                                 ClinicalNotesId = cln.ClinicalNotesId,
                                 DisplayName = clNote.DisplayName,
                                 PatientId = cln.PatientId,
                                 VisitId = cln.VisitId,
                                 NotesValues = cln.NotesValues,
                                 VerifiedBy = cln.VerifiedBy,
                                 VerifiedOn = cln.VerifiedOn,
                                 CreatedBy = cln.CreatedBy,
                                 CreatedOn = cln.CreatedOn,
                                 ModifiedBy = cln.ModifiedBy,
                                 ModifiedOn = cln.ModifiedOn,
                                 IsSystemDefault = clNote.IsSystemDefault,
                                 FieldName = clNote.FieldName

                             }).ToList();


            return noteslist.Count > 0 ? noteslist : null;
        }
        public object GetRequestedImagingItems(ClinicalSettingDbContext _clinicalSettingDbContext, int PatientId, int PatientVisitId)
        {
            var requestedImagingItems = (from imaging in _clinicalSettingDbContext.RadiologyImagingRequisitions
                                         where imaging.PatientId == PatientId && imaging.PatientVisitId == PatientVisitId
                                         select new
                                         {
                                             imaging.ImagingItemId,
                                             imaging.ImagingItemName,
                                         }).ToList();

            return requestedImagingItems.Count > 0 ? requestedImagingItems : null;
        }
        public object GetRequestedMedicationItems(ClinicalSettingDbContext _clinicalSettingDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            var requestedMedicationItems = (from medication in _clinicalSettingDbContext.PHRMPrescriptionItem
                                            .Where(a =>
                                                //a.PatientId == PatientId && a.PatientVisitId == PatientVisitId
                                                (IsAcrossVisitAvailability
                                                        ? a.PatientId == PatientId
                                                        : a.PatientVisitId == PatientVisitId) && a.IsActive == true
                                                )
                                            join phrmItem in _clinicalSettingDbContext.PHRMItemMaster
                                            on medication.ItemId equals phrmItem.ItemId into itemGroup
                                            from phrmItem in itemGroup.DefaultIfEmpty()
                                            join phrmGeneric in _clinicalSettingDbContext.PHRMGeneric
                                            on phrmItem.GenericId equals phrmGeneric.GenericId into genericGroup
                                            from phrmGeneric in genericGroup.DefaultIfEmpty()
                                            join visit in _clinicalSettingDbContext.Visits
                                            on medication.PatientVisitId equals visit.PatientVisitId
                                            into visitGroup
                                            from visit in visitGroup.DefaultIfEmpty()
                                            join admission in _clinicalSettingDbContext.Admissions
                                            on visit.PatientVisitId equals admission.PatientVisitId
                                            into admissionGroup
                                            from admission in admissionGroup.DefaultIfEmpty()
                                            join cardex in _clinicalSettingDbContext.CardexPlan
                                            on medication.PrescriptionItemId equals cardex.PrescriptionItemId into cardexGroup
                                            from cardex in cardexGroup.DefaultIfEmpty()
                                            select new RequestedMedicationItemView_DTO
                                            {
                                                PrescriptionItemId = medication.PrescriptionItemId,
                                                PrescriptionId = medication.PrescriptionId,
                                                PatientId = medication.PatientId,
                                                PatientVisitId = medication.PatientVisitId,
                                                PrescriberId = medication.PrescriberId,
                                                ItemId = medication.ItemId,
                                                Quantity = medication.Quantity,
                                                Frequency = medication.Frequency,
                                                StartingDate = medication.StartingDate,
                                                HowManyDays = medication.HowManyDays,
                                                FrequencyAbbreviation = medication.FrequencyAbbreviation,
                                                TimingOfMedicineTake = medication.TimingOfMedicineTake,
                                                IsPRN = medication.IsPRN,
                                                PRNNotes = medication.PRNNotes,
                                                Notes = medication.Notes,
                                                CreatedBy = medication.CreatedBy,
                                                CreatedOn = medication.CreatedOn,
                                                OrderStatus = medication.OrderStatus,
                                                Dosage = medication.Dosage,
                                                Strength = medication.Strength,
                                                GenericId = medication.GenericId,
                                                ModifiedBy = medication.ModifiedBy,
                                                ModifiedOn = medication.ModifiedOn,
                                                DiagnosisId = medication.DiagnosisId,
                                                Route = medication.Route,
                                                IsDischargeRequest = medication.IsDischargeRequest,
                                                ItemName = phrmItem != null ? phrmItem.ItemName : null,
                                                GenericName = phrmGeneric != null ? phrmGeneric.GenericName : null,
                                                PerformerId = (int)(admission != null ? admission.AdmittingDoctorId : (visit != null ? visit.PerformerId : 0)),
                                                IsAddedToPlan = cardex != null
                                            }).ToList();
            return requestedMedicationItems.Count > 0 ? requestedMedicationItems : null;
        }
        public object PostClinicalNote(RbacUser currentUser, ClinicalNote_DTO clinicalNotedto, ClinicalSettingDbContext _clinicalSettingDbContext)
        {

            ClinicalNoteModel clinicalNotes = JsonConvert.DeserializeObject<ClinicalNoteModel>(JsonConvert.SerializeObject(clinicalNotedto));
            clinicalNotes.CreatedOn = DateTime.Now;
            clinicalNotes.CreatedBy = currentUser.EmployeeId;
            _clinicalSettingDbContext.ClinicalNotes.Add(clinicalNotes);
            _clinicalSettingDbContext.SaveChanges();
            return clinicalNotes;
        }

        public object PostClinicalHeadingFieldSetup(RbacUser currentUser, PostClinicalHeadingFieldSetup_DTO clinicalHeadingFieldSetup_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            try
            {
                ClinicalHeadingFieldsSetupModel headingFeildSetup = JsonConvert.DeserializeObject<ClinicalHeadingFieldsSetupModel>(JsonConvert.SerializeObject(clinicalHeadingFieldSetup_DTO));
                if (clinicalHeadingFieldSetup_DTO == null)
                {
                    Log.Error($"Nothing to save as {nameof(clinicalHeadingFieldSetup_DTO)} is null.");
                    throw new ArgumentNullException($"Nothing to save as {nameof(clinicalHeadingFieldSetup_DTO)} is null.");
                }
                string trimmedFieldName = clinicalHeadingFieldSetup_DTO.FieldName.Trim();
                if (_clinicalSettingDbContext.ClinicalHeadingFieldsSetups.Any(t => t.FieldName == trimmedFieldName))
                {
                    Log.Error($"Component  '{trimmedFieldName}' is already exists.");
                    throw new InvalidOperationException($"Medical Component '{trimmedFieldName}'  already exists.");
                }
                headingFeildSetup.CreatedBy = currentUser.EmployeeId;
                headingFeildSetup.CreatedOn = DateTime.Now;
                headingFeildSetup.FieldCode = GenerateFieldCode(clinicalHeadingFieldSetup_DTO.FieldName);
                headingFeildSetup.FieldDisplayName = clinicalHeadingFieldSetup_DTO.DisplayName;
                headingFeildSetup.IsActive = true;
                headingFeildSetup.IsIPD = clinicalHeadingFieldSetup_DTO.IsIPD;
                headingFeildSetup.IsOPD = clinicalHeadingFieldSetup_DTO.IsOPD;
                headingFeildSetup.IsEmergency = clinicalHeadingFieldSetup_DTO.IsEmergency;
                headingFeildSetup.GroupName = clinicalHeadingFieldSetup_DTO.GroupName;
                headingFeildSetup.IsAcrossVisitAvailability = clinicalHeadingFieldSetup_DTO.IsAcrossVisitAvailability;
                headingFeildSetup.IsDisplayTitle = clinicalHeadingFieldSetup_DTO.IsDisplayTitle;

                _clinicalSettingDbContext.ClinicalHeadingFieldsSetups.Add(headingFeildSetup);
                _clinicalSettingDbContext.SaveChanges();
                int headingFieldSetupId = headingFeildSetup.FieldId; // Get the ID of the newly inserted record

                if (clinicalHeadingFieldSetup_DTO.OptionValue != null && clinicalHeadingFieldSetup_DTO.OptionValue != "")
                {
                    var clinicalFieldOption = new ClinicalFieldOptionModel
                    {
                        FieldId = headingFieldSetupId,
                        Options = clinicalHeadingFieldSetup_DTO.OptionValue,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = DateTime.Now
                    };
                    _clinicalSettingDbContext.ClinicalFieldOptions.Add(clinicalFieldOption);
                    _clinicalSettingDbContext.SaveChanges();
                }
                return headingFeildSetup;
            }
            catch (Exception ex)
            {
                Log.Error($" Failed to add new medical component {ex.Message}");
                throw new InvalidOperationException($".{ex.Message}");
            }
        }
        //public object ClinicalAssessmentAndPlan(RbacUser currentUser, List<ClinicalAssessmentAndPlan_DTO> clinicalAssessmentAndPlan_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        //{
        //    if (clinicalAssessmentAndPlan_DTO != null && clinicalAssessmentAndPlan_DTO.Count > 0)
        //    {
        //        var CurrentDateTime = DateTime.Now;
        //        var assessment = new List<ClinicalAssessmentAndPlanModel>();
        //        foreach (var assessmentDTO in clinicalAssessmentAndPlan_DTO)
        //        {
        //            assessment.Add(new ClinicalAssessmentAndPlanModel()
        //            {
        //                PatientId = assessmentDTO.PatientId,
        //                VisitId = assessmentDTO.VisitId,
        //                ClinicalNotesMasterId = assessmentDTO.ClinicalNotesMasterId,
        //                NotesValues = assessmentDTO.NotesValues,
        //                CreatedOn = CurrentDateTime,
        //                CreatedBy = currentUser.EmployeeId
        //            });
        //        }
        //        _clinicalSettingDbContext.ClinicalAssessmentAndPlan.AddRange(assessment);
        //        _clinicalSettingDbContext.SaveChanges();
        //    }

        //    return clinicalAssessmentAndPlan_DTO;
        //}
        public object PostChiefComplains(RbacUser currentUser, ChiefComplains_DTO chiefComplainsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (chiefComplainsDTO == null)
                    {
                        Log.Error($"Nothing to save as {nameof(chiefComplainsDTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(chiefComplainsDTO)} is null.");
                    }
                    string trimmedMedicalCode = chiefComplainsDTO.MedicalCode.Trim();
                    if (_clinicalSettingDbContext.ChiefComplains.Any(t => t.MedicalCode == trimmedMedicalCode))
                    {
                        Log.Error($"Chief Complaint with Code '{trimmedMedicalCode}' already exists.");
                        throw new InvalidOperationException($"Chief Complaint with Code '{trimmedMedicalCode}' already exists.");
                    }

                    var chiefComplaintsModel = new ChiefComplainsModel()
                    {
                        MedicalCode = chiefComplainsDTO.MedicalCode,
                        ChiefComplain = chiefComplainsDTO.ChiefComplain,
                        Remarks = chiefComplainsDTO.Remarks,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };
                    _clinicalSettingDbContext.ChiefComplains.Add(chiefComplaintsModel);
                    _clinicalSettingDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return chiefComplainsDTO;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }
        public object ClinicalAssessmentAndPlan(RbacUser currentUser, List<ClinicalAssessmentAndPlan_DTO> clinicalAssessmentAndPlan_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (clinicalAssessmentAndPlan_DTO != null && clinicalAssessmentAndPlan_DTO.Count > 0)
            {
                var CurrentDateTime = DateTime.Now;

                foreach (var assessmentDTO in clinicalAssessmentAndPlan_DTO)
                {
                    // Check if the record exists
                    var existingRecord = _clinicalSettingDbContext.ClinicalAssessmentAndPlan
                        .FirstOrDefault(a => a.PatientId == assessmentDTO.PatientId && a.VisitId == assessmentDTO.VisitId && a.ClinicalNotesMasterId == assessmentDTO.ClinicalNotesMasterId);

                    if (existingRecord != null)
                    {
                        // Update the existing record
                        existingRecord.NotesValues = assessmentDTO.NotesValues;
                        existingRecord.ModifiedBy = currentUser.EmployeeId;
                        existingRecord.ModifiedOn = CurrentDateTime;
                    }
                    else
                    {
                        // Add a new record to the database
                        var newRecord = new ClinicalAssessmentAndPlanModel()
                        {
                            PatientId = assessmentDTO.PatientId,
                            VisitId = assessmentDTO.VisitId,
                            ClinicalNotesMasterId = assessmentDTO.ClinicalNotesMasterId,
                            NotesValues = assessmentDTO.NotesValues,
                            CreatedOn = CurrentDateTime,
                            CreatedBy = currentUser.EmployeeId
                        };

                        _clinicalSettingDbContext.ClinicalAssessmentAndPlan.Add(newRecord);
                    }
                }

                _clinicalSettingDbContext.SaveChanges();
            }

            return clinicalAssessmentAndPlan_DTO;
        }

        public object UpdateClinicalNote(RbacUser currentUser, ClinicalNote_DTO clinicalNotedto, ClinicalSettingDbContext _clinicalSettingDbContext)
        {

            using (var clinicalTransactionScope = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {

                    var cln = _clinicalSettingDbContext.ClinicalNotes.FirstOrDefault(a => a.ClinicalNoteMasterId == clinicalNotedto.ClinicalNoteMasterId);
                    if (cln != null)
                    {
                        cln.DisplayName = clinicalNotedto.DisplayName;
                        cln.FieldName = clinicalNotedto.FieldName;
                        cln.DisplayOrder = clinicalNotedto.DisplayOrder;
                        cln.ModifiedBy = currentUser.EmployeeId;
                        cln.ModifiedOn = DateTime.Now;
                        _clinicalSettingDbContext.Entry(cln).Property(ent => ent.DisplayName).IsModified = true;
                        _clinicalSettingDbContext.Entry(cln).Property(ent => ent.FieldName).IsModified = true;
                        _clinicalSettingDbContext.Entry(cln).Property(ent => ent.DisplayOrder).IsModified = true;

                        _clinicalSettingDbContext.SaveChanges();
                    }
                    clinicalTransactionScope.Commit();
                    return cln;
                }
                catch (Exception ex)
                {
                    clinicalTransactionScope.Rollback();
                    throw ex;
                }
            }
        }

        public object UpdateClinicalHeadingFieldSetup(RbacUser currentUser, PutClinicalHeadingFieldSetup_DTO clinicalHeadingFieldsSetup, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            try
            {
                var existingField = _clinicalSettingDbContext.ClinicalHeadingFieldsSetups.FirstOrDefault(f => f.FieldId == clinicalHeadingFieldsSetup.FieldId);

                if (existingField != null)
                {
                    existingField.FieldName = clinicalHeadingFieldsSetup.FieldName;
                    existingField.FieldDisplayName = clinicalHeadingFieldsSetup.FieldName;
                    existingField.InputType = clinicalHeadingFieldsSetup.InputType;
                    existingField.ModifiedBy = currentUser.EmployeeId;
                    existingField.ModifiedOn = DateTime.Now;
                    existingField.IsIPD = clinicalHeadingFieldsSetup.IsIPD;
                    existingField.IsOPD = clinicalHeadingFieldsSetup.IsOPD;
                    existingField.IsEmergency = clinicalHeadingFieldsSetup.IsEmergency;
                    existingField.GroupName = clinicalHeadingFieldsSetup.GroupName;
                    existingField.IsAcrossVisitAvailability = clinicalHeadingFieldsSetup.IsAcrossVisitAvailability;
                    existingField.IsDisplayTitle = clinicalHeadingFieldsSetup.IsDisplayTitle;



                    if (existingField.InputType.Equals(ENUM_ClinicalField_InputType.SmartTemplate, StringComparison.OrdinalIgnoreCase) ||
                        existingField.InputType.Equals(ENUM_ClinicalField_InputType.SmartPrintableForm, StringComparison.OrdinalIgnoreCase))
                    {
                        var existingOption = _clinicalSettingDbContext.ClinicalFieldOptions.FirstOrDefault(o => o.FieldId == existingField.FieldId);

                        if (existingOption != null)
                        {
                            existingOption.Options = clinicalHeadingFieldsSetup.OptionValue;
                            existingOption.ModifiedBy = currentUser.EmployeeId;
                            existingOption.ModifiedOn = DateTime.Now;
                            existingOption.IsActive = true;
                        }
                        else
                        {
                            _clinicalSettingDbContext.ClinicalFieldOptions.Add(new ClinicalFieldOptionModel
                            {
                                FieldId = existingField.FieldId,
                                Options = clinicalHeadingFieldsSetup.OptionValue,
                                CreatedBy = currentUser.EmployeeId,
                                CreatedOn = DateTime.Now,
                                IsActive = true
                            });
                        }
                    }

                    _clinicalSettingDbContext.SaveChanges();
                    return clinicalHeadingFieldsSetup;
                }
                else
                {
                    return new { Message = "Field not found", Success = false };
                }
            }
            catch (Exception ex)
            {
                // Log the exception (ex) as needed
                return new { Message = "An error occurred while updating the clinical heading field setup.", Success = false, Error = ex.Message };
            }
        }



        public object SaveMedication(RbacUser currentUser, List<Medication_DTO> medication_dto, ClinicalSettingDbContext _clinicalSettingDbContext)
        {

            var CurrentDateTime = DateTime.Now;

            using (var clinicalTransactionScope = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (medication_dto != null && medication_dto.Count > 0)
                    {
                        var prescription = new PHRMPrescriptionModel();
                        prescription.PrescriberId = currentUser.EmployeeId;
                        prescription.PatientId = medication_dto[0].PatientId;
                        prescription.PatientVisitId = medication_dto[0].PatientVisitId;
                        prescription.PrescriptionStatus = ENUM_PrescriptionOrderStatus.Active;
                        prescription.PrescriptionNo = GetLatestPrescriptionNo(_clinicalSettingDbContext);
                        prescription.CreatedOn = CurrentDateTime;
                        prescription.CreatedBy = currentUser.EmployeeId;
                        _clinicalSettingDbContext.PHRMPrescription.Add(prescription);
                        _clinicalSettingDbContext.SaveChanges();

                        var med = new List<PHRMPrescriptionItemModel>();
                        foreach (var medication in medication_dto)
                        {
                            med.Add(new PHRMPrescriptionItemModel()
                            {
                                PatientId = medication.PatientId,
                                PatientVisitId = medication.PatientVisitId,
                                ItemId = medication.ItemId,
                                GenericId = medication.GenericId,
                                HowManyDays = medication.HowManyDays,
                                FrequencyAbbreviation = medication.FrequencyAbbreviation,
                                Dosage = medication.Dosage,
                                Strength = medication.Strength,
                                Notes = medication.Remarks,
                                IsPRN = medication.IsPRN,
                                PRNNotes = medication.PRNNotes,
                                TimingOfMedicineTake = medication.TimingOfMedicineTake,
                                Route = medication.Route,
                                IsDischargeRequest = medication.IsDischargeRequest,
                                OrderStatus = ENUM_PharmacyPurchaseOrderStatus.Active,
                                CreatedOn = CurrentDateTime,
                                CreatedBy = currentUser.EmployeeId,
                                PrescriptionId = prescription.PrescriptionId,
                                Quantity = 0,
                                SalesQuantity = 0,
                                IsActive = true
                            });
                        }
                        _clinicalSettingDbContext.PHRMPrescriptionItem.AddRange(med);
                        _clinicalSettingDbContext.SaveChanges();

                        clinicalTransactionScope.Commit();
                    }
                    return medication_dto;
                }
                catch (Exception ex)
                {
                    clinicalTransactionScope.Rollback();
                    throw ex;
                }

            }

        }

        public int GetLatestPrescriptionNo(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            int latestPrescriptionNo = (from pres in _clinicalSettingDbContext.PHRMPrescription
                                        select pres.PrescriptionNo).DefaultIfEmpty(0).Max();
            return latestPrescriptionNo + 1;
        }

        public object SaveAdmission(RbacUser currentUser, BookAdmission_DTO bookAdmission_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var clinicalTransactionScope = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    ADTBedReservation bedreservation = JsonConvert.DeserializeObject<ADTBedReservation>(JsonConvert.SerializeObject(bookAdmission_DTO));
                    bedreservation.CreatedOn = DateTime.Now;
                    bedreservation.CreatedBy = currentUser.EmployeeId;
                    bedreservation.IsActive = true;
                    bedreservation.BedFeatureId = bookAdmission_DTO.BedFeatureId;
                    bedreservation.BedId = bookAdmission_DTO.BedId;
                    bedreservation.WardId = bookAdmission_DTO.WardId;
                    bedreservation.AdmissionNotes = bookAdmission_DTO.AdmissionNotes;
                    bedreservation.AdmissionStartsOn = DateTime.Now;
                    bedreservation.ReservedOn = DateTime.Now;
                    bedreservation.ReservedBy = bookAdmission_DTO.AdmittingDoctorId;
                    bedreservation.IsAutoCancelled = false;
                    bedreservation.AutoCancelledOn = bookAdmission_DTO.AutoCancelledOn;
                    bedreservation.PatientId = bookAdmission_DTO.PatientId;
                    bedreservation.PatientVisitId = bookAdmission_DTO.PatientVisitId;
                    bedreservation.AdmissionCase = bookAdmission_DTO.Case;
                    bedreservation.RequestingDepartmentId = bookAdmission_DTO.DepartmentId;

                    if (bedreservation.BedId != null)
                    {
                        UpdateBed(bedreservation.BedId, _clinicalSettingDbContext);
                    }
                    _clinicalSettingDbContext.BedReservation.Add(bedreservation);
                    _clinicalSettingDbContext.SaveChanges();
                    clinicalTransactionScope.Commit();
                    return bookAdmission_DTO;
                }
                catch (Exception ex)
                {
                    clinicalTransactionScope.Rollback();
                    throw ex;
                }
            }
        }
        public object UpdateBed(int bedId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            BedModel bed = _clinicalSettingDbContext.Beds.Find(bedId);

            if (bed != null)
            {
                if (!bed.IsReserved)
                {
                    bed.ModifiedOn = DateTime.Now;
                    bed.IsReserved = true;

                    _clinicalSettingDbContext.Entry(bed).State = EntityState.Modified;
                    _clinicalSettingDbContext.Entry(bed).Property(x => x.CreatedOn).IsModified = false;
                    _clinicalSettingDbContext.SaveChanges();
                }
                else
                {
                    throw new Exception("Bed is already reserved. Please select another bed.");
                }
            }
            else
            {
                throw new Exception("Bed not found."); // You may want to handle this case differently
            }

            return bed;
        }


        public object GetDepartmentWardDoctorAndBedInfo(RbacUser currentUser, int patientId, ClinicalSettingDbContext _clinicalSettingDbContext, MasterDbContext _masterDbContext)
        {
            List<DepartmentModel> deptList = _clinicalSettingDbContext.Department.Where(d => d.IsActive == true).ToList();
            //int minTimeBeforeCancel = 15;
            //var timeFrmParam = (from param in _masterDbContext.CFGParameters
            //                    where param.ParameterName == "MinutesBeforeAutoCancelOfReservedBed"
            //                    && param.ParameterGroupName.ToLower() == "adt"
            //                    select param.ParameterValue).FirstOrDefault();

            //if (!String.IsNullOrEmpty(timeFrmParam))
            //{
            //    minTimeBeforeCancel = Int32.Parse(timeFrmParam);
            //}

            var filteredDeptList = (from d in deptList
                                    where d.IsAppointmentApplicable == true
                                    select new
                                    {
                                        Key = d.DepartmentId,
                                        Value = d.DepartmentName
                                    }).ToList();

            List<WardModel> wardList = (from ward in _clinicalSettingDbContext.Wards
                                        where ward.IsActive == true
                                        select ward).ToList();

            var visitDoctorList = (from emp in _clinicalSettingDbContext.Employees
                                   join dept in _clinicalSettingDbContext.Department on (int)emp.DepartmentId equals dept.DepartmentId
                                   where emp.DepartmentId.HasValue && emp.IsActive == true && emp.IsAppointmentApplicable.HasValue && emp.IsAppointmentApplicable == true
                                   select new
                                   {
                                       DepartmentId = dept.DepartmentId,
                                       DepartmentName = dept.DepartmentName,
                                       Key = emp.EmployeeId,
                                       Value = (string.IsNullOrEmpty(emp.Salutation) ? "" : emp.Salutation + ". ") + emp.FirstName + (string.IsNullOrEmpty(emp.MiddleName) ? " " : " " + emp.MiddleName + " ") + emp.LastName
                                   }).ToList();

            ADTBedReservation reservedBed = (from bedReserv in _clinicalSettingDbContext.BedReservation
                                             where bedReserv.PatientId == patientId
                                             && bedReserv.IsActive == true
                                             select bedReserv).FirstOrDefault();

            //if (reservedBed != null && reservedBed.ReservedBedInfoId > 0)
            //{
            //    reservedBed = ((reservedBed.AdmissionStartsOn).Subtract(System.DateTime.Now).TotalMinutes > minTimeBeforeCancel) ? reservedBed : null;
            //}
            return new { DoctorList = visitDoctorList, DepartmentList = filteredDeptList, WardList = wardList, BedReservedForCurrentPat = reservedBed };
        }
        public object GetAvailableBeds(RbacUser currentUser, int wardId, int bedFeatureId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            int minTimeBeforeCancel = 15;
            //var timeFrmParam = (from param in _billingDbContext.AdminParameters
            //                    where param.ParameterName == "MinutesBeforeAutoCancelOfReservedBed"
            //                    && param.ParameterGroupName.ToLower() == "adt"
            //                    select param.ParameterValue).FirstOrDefault();

            //if (!String.IsNullOrEmpty(timeFrmParam))
            //{
            //    minTimeBeforeCancel = Int32.Parse(timeFrmParam);
            //}

            DateTime currentDateTime = System.DateTime.Now;
            DateTime bufferTime = currentDateTime.AddMinutes(minTimeBeforeCancel);

            int timeInMinsBeforeCancel = 360;
            var parameter = (from param in _clinicalSettingDbContext.CFGParameters
                             where param.ParameterName == "AutoCancellationOfTransferReserveInMins"
                             select param.ParameterValue).AsNoTracking().FirstOrDefault();
            if (parameter != null)
            {
                timeInMinsBeforeCancel = Convert.ToInt32(parameter);
                //add 2 min more buffer
                timeInMinsBeforeCancel = timeInMinsBeforeCancel + 2;
            }

            var holdTimeBuffer = currentDateTime.AddMinutes((timeInMinsBeforeCancel * (-1)));

            var allPossibleAvailableBeds = (from bed in _clinicalSettingDbContext.Beds
                                            join bedFeatureMap in _clinicalSettingDbContext.BedFeaturesMaps on bed.BedId equals bedFeatureMap.BedId
                                            where (
                                               bedFeatureMap.WardId == wardId && bedFeatureMap.BedFeatureId == bedFeatureId
                                               && bedFeatureMap.IsActive == true
                                               && bed.IsActive == true
                                               && (
                                               (bed.IsOccupied == false && (bed.OnHold != true))
                                               || (bed.IsOccupied == true && (bed.OnHold == true)
                                               && (bed.HoldedOn.HasValue && bed.HoldedOn.Value < holdTimeBuffer))
                                                )
                                               )
                                            select new
                                            {
                                                BedId = bed.BedId,
                                                BedCode = bed.BedCode,
                                                BedNumber = bed.BedNumber,
                                                WardId = bed.WardId,
                                                IsOccupied = bed.IsOccupied,
                                                CreatedBy = bed.CreatedBy,
                                                IsActive = bed.IsActive,
                                                CreatedOn = bed.CreatedOn,
                                                OnHold = bed.OnHold,
                                                HoldedOn = bed.HoldedOn
                                            }).ToList();

            var reservationBedInfoList = (from resvd in _clinicalSettingDbContext.BedReservation
                                          join pat in _clinicalSettingDbContext.Patient on resvd.PatientId equals pat.PatientId
                                          where resvd.IsActive == true
                                          && resvd.AdmissionStartsOn > bufferTime
                                          select new
                                          {
                                              ShortName = pat.ShortName,
                                              BedId = resvd.BedId,
                                              ReservedBedInfoId = resvd.ReservedBedInfoId,
                                              AdmissionStartsOn = resvd.AdmissionStartsOn
                                          }).ToList();

            var availableBeds = (from bed in allPossibleAvailableBeds
                                 select new
                                 {
                                     BedId = bed.BedId,
                                     BedCode = bed.BedCode,
                                     BedNumber = bed.BedNumber,
                                     WardId = bed.WardId,
                                     IsOccupied = bed.IsOccupied,
                                     IsReserved = (from resvd in reservationBedInfoList
                                                   where resvd.BedId == bed.BedId
                                                   select resvd.ReservedBedInfoId).FirstOrDefault() > 0 ? true : false,
                                     CreatedBy = bed.CreatedBy,
                                     IsActive = bed.IsActive,
                                     CreatedOn = bed.CreatedOn,
                                     ReservedByPatient = (from resvd in reservationBedInfoList
                                                          where resvd.BedId == bed.BedId
                                                          select resvd.ShortName).FirstOrDefault(),
                                     ReservedForDate = (from resvd in reservationBedInfoList
                                                        where resvd.BedId == bed.BedId
                                                        select resvd.AdmissionStartsOn).FirstOrDefault(),
                                     OnHold = bed.OnHold,
                                     HoldedOn = bed.HoldedOn
                                 }).ToList();




            var bedFeature = _clinicalSettingDbContext.BedFeatures.Where(a => a.BedFeatureId == bedFeatureId).FirstOrDefault();

            var BedbillItm = (from bilItm in _clinicalSettingDbContext.BillServiceItems
                              join servDept in _clinicalSettingDbContext.ServiceDepartment on bilItm.ServiceDepartmentId equals servDept.ServiceDepartmentId
                              join serviceItemPriceCategoryMap in _clinicalSettingDbContext.BillPriceCategoryServiceItems on
                              new { bilItm.ServiceItemId, bilItm.ServiceDepartmentId } equals new { serviceItemPriceCategoryMap.ServiceItemId, serviceItemPriceCategoryMap.ServiceDepartmentId }
                              where bilItm.IntegrationItemId == bedFeatureId && servDept.IntegrationName == "Bed Charges "
                              select new
                              {
                                  bilItm.IntegrationItemId,
                                  bilItm.ItemName,
                                  Price = serviceItemPriceCategoryMap.Price,
                                  bilItm.IsTaxApplicable,
                                  bilItm.ServiceDepartmentId,
                                  servDept.ServiceDepartmentName,
                                  bilItm.ServiceItemId,
                                  bilItm.ItemCode,
                                  //bilItm.ProcedureCode
                              }).FirstOrDefault();
            return new { availableBeds, BedbillItm };
        }
        public object GetBedFeaturesByWard(RbacUser currentUser, int wardId, int priceCategoryId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var wardBedFeatures = (from bedFeature in _clinicalSettingDbContext.BedFeatures
                                   join bedFeaturesMap in _clinicalSettingDbContext.BedFeaturesMaps on bedFeature.BedFeatureId equals bedFeaturesMap.BedFeatureId
                                   join serviceItem in _clinicalSettingDbContext.BillServiceItems on bedFeature.BedFeatureId equals serviceItem.IntegrationItemId
                                   join serviceItemPriceCategoryMap in _clinicalSettingDbContext.BillPriceCategoryServiceItems on
                                   new { serviceItemId = serviceItem.ServiceItemId, priceCategoryId = priceCategoryId } equals new { serviceItemId = serviceItemPriceCategoryMap.ServiceItemId, priceCategoryId = serviceItemPriceCategoryMap.PriceCategoryId } into grp
                                   from priceCatServItm in grp.DefaultIfEmpty()
                                   where (bedFeaturesMap.WardId == wardId && bedFeaturesMap.IsActive == true && bedFeature.IsActive == true
                                   && serviceItem.IntegrationName == "Bed Charges")
                                   select new
                                   {
                                       BedFeatureId = bedFeature.BedFeatureId,
                                       ServiceDepartmentId = serviceItem.ServiceDepartmentId,
                                       BedFeatureName = bedFeature.BedFeatureName,
                                       BedFeatureFullName = bedFeature.BedFeatureFullName,
                                       BedFeatureCode = bedFeature.BedFeatureCode,
                                       BedPrice = priceCatServItm != null ? priceCatServItm.Price : 0,
                                       ServiceItemId = serviceItem.ServiceItemId,
                                       ItemCode = serviceItem.ItemCode
                                   }).Distinct().ToList();
            return wardBedFeatures;
        }
        public object GetClinicalFieldMappings(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var userFields = (from userField in _clinicalSettingDbContext.ClnicalUserFieldMApping
                              join clinicalHeading in _clinicalSettingDbContext.ClinicalHeadings
                              on userField.ClinicalHeadingId equals clinicalHeading.ClinicalHeadingId
                              join department in _clinicalSettingDbContext.Department
                              on userField.DepartmentId equals department.DepartmentId into departmentJoin
                              from dept in departmentJoin.DefaultIfEmpty()
                              join employee in _clinicalSettingDbContext.Employees
                              on userField.EmployeeId equals employee.EmployeeId into employeeJoin
                              from emp in employeeJoin.DefaultIfEmpty()
                              join parent in _clinicalSettingDbContext.ClinicalHeadings
                              on clinicalHeading.ParentId equals parent.ClinicalHeadingId into parentJoin
                              from parentRecord in parentJoin.DefaultIfEmpty()
                              group new { userField, dept, clinicalHeading, emp, parentRecord }
                              by new
                              {
                                  userField.DepartmentId,
                                  clinicalHeading.ClinicalHeadingId,
                                  clinicalHeading.ClinicalHeadingName,
                                  empFullName = emp.FullName,
                                  parentHeadingName = parentRecord.ClinicalHeadingName,
                                  parentHeadingId = parentRecord.ClinicalHeadingId
                              }
                              into grouped
                              select new ClinicalUserFieldMappingView_DTO
                              {
                                  DepartmentName = grouped.FirstOrDefault(g => g.dept != null) != null
                                                    ? grouped.FirstOrDefault(g => g.dept != null).dept.DepartmentName
                                                    : string.Empty,
                                  DepartmentId = grouped.Key.DepartmentId,
                                  ClinicalHeadingName = grouped.Key.ClinicalHeadingName,
                                  ClinicalHeadingId = grouped.Key.ClinicalHeadingId,
                                  EmployeeName = grouped.Key.empFullName ?? string.Empty,
                                  EmployeeId = grouped.FirstOrDefault(g => g.userField != null) != null
                                               ? grouped.FirstOrDefault(g => g.userField != null).userField.EmployeeId
                                               : (int?)null,
                                  ParentHeadingName = grouped.Key.parentHeadingName ?? string.Empty,
                                  ParentHeadingId = grouped.Key.parentHeadingId,
                                  CreatedOn = grouped.Max(g => g.userField.CreatedOn)
                              }).OrderByDescending(x => x.CreatedOn).ToList();
            return userFields;
        }

        public object SaveOrUpdateUserFieldMappings(RbacUser currentUser, AddUpdateClinicalUserFieldMappings_DTO userFieldMappingsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (userFieldMappingsDTO != null && userFieldMappingsDTO.FieldList != null && userFieldMappingsDTO.FieldList.Count > 0)
                    {
                        foreach (var clinicalField in userFieldMappingsDTO.FieldList)
                        {
                            if (MappingExists((int?)clinicalField.ClinicalUserFieldId, _clinicalSettingDbContext))
                            {
                                UpdateUserFieldMapping(currentUser, clinicalField, userFieldMappingsDTO, _clinicalSettingDbContext);
                            }
                            else
                            {
                                AddUserFieldMapping(currentUser, clinicalField, userFieldMappingsDTO, _clinicalSettingDbContext);
                            }
                        }

                        _clinicalSettingDbContext.SaveChanges();
                        dbContextTransaction.Commit();
                        return userFieldMappingsDTO;
                    }
                    else
                    {
                        Log.Error($"There is no any FieldList data associated with user Field Mappings");
                        throw new Exception($"There is no any FieldList data associated with user Field Mappings");
                    }
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"This transaction to save or update Field Mappings is being Rolled back with exceptions details {ex.ToString()}.");
                    throw new Exception($"This transaction to save or update Field Mappings is being Rolled back with exceptions details {ex.Message.ToString()}.");
                }
            }
        }

        private void UpdateUserFieldMapping(RbacUser currentUser, ClinicalFieldDTO clinicalField, AddUpdateClinicalUserFieldMappings_DTO userFieldMappingsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var existingUserFieldMapping = _clinicalSettingDbContext.ClnicalUserFieldMApping.FirstOrDefault(u => u.ClinicalUserFieldId == clinicalField.ClinicalUserFieldId);

            if (existingUserFieldMapping != null)
            {
                existingUserFieldMapping.ClinicalFieldId = clinicalField.FieldId;
                existingUserFieldMapping.ModifiedBy = currentUser.EmployeeId;
                existingUserFieldMapping.ModifiedOn = DateTime.Now;
                existingUserFieldMapping.IsActive = clinicalField.IsActive;
            }
        }

        private void AddUserFieldMapping(RbacUser currentUser, ClinicalFieldDTO clinicalField, AddUpdateClinicalUserFieldMappings_DTO userFieldMappingsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var CurrentDateTime = DateTime.Now;

            var sectionMapping = _clinicalSettingDbContext.SectionMappings
                       .FirstOrDefault(sm => sm.ClinicalHeadingId == userFieldMappingsDTO.ClinicalHeadingId
                                          && sm.ClinicalFieldId == clinicalField.FieldId);
            var displaySequence = sectionMapping.DisplaySequence;

            _clinicalSettingDbContext.ClnicalUserFieldMApping.Add(new ClnicalUserFieldMappingModel()
            {
                ClinicalFieldId = clinicalField.FieldId,
                ClinicalHeadingId = userFieldMappingsDTO.ClinicalHeadingId,
                DepartmentId = userFieldMappingsDTO.DepartmentId,
                EmployeeId = userFieldMappingsDTO.EmployeeId,
                CreatedBy = currentUser.EmployeeId,
                CreatedOn = CurrentDateTime,
                IsActive = clinicalField.IsActive,
                DisplaySequence = displaySequence
            });
        }

        private bool MappingExists(int? clinicalUserFieldId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            return _clinicalSettingDbContext.ClnicalUserFieldMApping.Any(u => u.ClinicalUserFieldId == clinicalUserFieldId);
        }


        public string GenerateFieldCode(string FieldName)
        {
            string initials = FieldName.Substring(0, Math.Min(FieldName.Length, 3)).ToUpper();
            Random random = new Random();
            int randomNumber = random.Next(1000, 10000);
            string fieldCode = initials + randomNumber.ToString();
            return fieldCode;
        }
        public object ActivateDeactivateChiefComplain(RbacUser currentUser, int chiefComplainId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (chiefComplainId == 0)
            {
                throw new InvalidOperationException($"{nameof(chiefComplainId)} is not provided");
            }

            var chiefComplain = _clinicalSettingDbContext.ChiefComplains.FirstOrDefault(r => r.ChiefComplainId == chiefComplainId);
            if (chiefComplain == null)
            {
                throw new InvalidOperationException($"There is no chiefComplain to update with CheifComplainId {nameof(chiefComplainId)}");
            }

            chiefComplain.IsActive = !chiefComplain.IsActive;
            chiefComplain.ModifiedBy = currentUser.EmployeeId;
            chiefComplain.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(chiefComplain).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return chiefComplain;
        }

        public object UpdateChiefComplains(RbacUser currentUser, ChiefComplains_DTO chiefComplainsDTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            if (chiefComplainsDTO == null)
            {
                throw new ArgumentNullException($"{nameof(chiefComplainsDTO)} is null");
            }
            if (chiefComplainsDTO != null && chiefComplainsDTO.ChiefComplainId == 0)
            {
                throw new ArgumentNullException($"{nameof(chiefComplainsDTO.ChiefComplainId)} is not provided to update the chief Complaint");
            }
            var chiefComplain = clinicalSettingDbContext.ChiefComplains.Where(x => x.ChiefComplainId == chiefComplainsDTO.ChiefComplainId).FirstOrDefault();
            if (chiefComplain == null)
            {
                throw new Exception($"No chief Complaint is found for {nameof(chiefComplainsDTO.ChiefComplainId)}");
            }

            chiefComplain.ModifiedOn = DateTime.Now;
            chiefComplain.ModifiedBy = currentUser.EmployeeId;
            chiefComplain.IsActive = true;
            chiefComplain.MedicalCode = chiefComplainsDTO.MedicalCode;
            chiefComplain.ChiefComplain = chiefComplainsDTO.ChiefComplain;
            chiefComplain.Remarks = chiefComplainsDTO.Remarks;

            clinicalSettingDbContext.Entry(chiefComplain).State = EntityState.Modified;
            clinicalSettingDbContext.SaveChanges();
            return chiefComplainsDTO;
        }

        public object ActivateDeactivateClinicalFieldQuestionary(RbacUser currentUser, int questionId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (questionId == 0)
            {
                Log.Error($"{nameof(questionId)} is not provided");
                throw new InvalidOperationException($"{nameof(questionId)} is not provided");
            }

            var clinicalQuestionry = _clinicalSettingDbContext.ClinicalFieldsQuestionaries.FirstOrDefault(r => r.QuestionId == questionId);
            if (clinicalQuestionry == null)
            {
                Log.Error($"There is no clinicalFieldQuestionry to update with QuestionId {questionId}");
                throw new InvalidOperationException($"There is no clinicalFieldQuestionry to update with QuestionId {nameof(questionId)}");
            }

            clinicalQuestionry.IsActive = !clinicalQuestionry.IsActive;
            clinicalQuestionry.ModifiedBy = currentUser.EmployeeId;
            clinicalQuestionry.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(clinicalQuestionry).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return clinicalQuestionry;
        }

        public object ActivateDeactivateClinicalFieldQuestionaryOption(RbacUser currentUser, int questionOptionId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (questionOptionId == 0)
            {
                Log.Error($"{nameof(questionOptionId)} is not provided");
                throw new InvalidOperationException($"{nameof(questionOptionId)} is not provided");
            }

            var clinicalQuestionry = _clinicalSettingDbContext.ClinicalFieldsQuestionaryOptions.FirstOrDefault(r => r.QuestionOptionId == questionOptionId);
            if (clinicalQuestionry == null)
            {
                Log.Error($"There is no clinicalFieldQuestionry to update with QuestionOptionId {questionOptionId}");
                throw new InvalidOperationException($"There is no clinicalFieldQuestionry to update with QuestionId {nameof(questionOptionId)}");
            }

            clinicalQuestionry.IsActive = !clinicalQuestionry.IsActive;
            clinicalQuestionry.ModifiedBy = currentUser.EmployeeId;
            clinicalQuestionry.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(clinicalQuestionry).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return clinicalQuestionry;
        }

        public object DepartmentList(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            List<DepartmentList_DTO> deptList = _clinicalSettingDbContext.Department
           .Where(d => d.IsActive == true)
           .Select(d => new DepartmentList_DTO
           {
               DepartmentId = d.DepartmentId,
               DepartmentName = d.DepartmentName
           })
           .ToList();

            return deptList;

        }

        public object EmployeeList(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            List<EmployeeList_DTO> empList = _clinicalSettingDbContext.Employees
           .Where(d => d.IsActive == true && d.IsExternal == false)
           .Select(d => new EmployeeList_DTO
           {
               EmployeeId = d.EmployeeId,
               EmployeeName = d.FullName,
               DepartmentId = d.DepartmentId.Value

           })
           .ToList();

            return empList;

        }

        public object GetUserFields(ClinicalSettingDbContext _clinicalSettingDbContext, int selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalHeadingId)
        {
            var userFieldsQuery = from f in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups
                                  join sectionMapping in _clinicalSettingDbContext.SectionMappings
                                      on f.FieldId equals sectionMapping.ClinicalFieldId
                                  where sectionMapping.ClinicalHeadingId == selectedClinicalHeadingId && f.IsActive && sectionMapping.IsActive
                                  join map in _clinicalSettingDbContext.ClnicalUserFieldMApping
                                      on new { FieldId = f.FieldId, DepartmentId = selectedDepartmentId == 0 ? (int?)null : selectedDepartmentId, EmployeeId = selectedEmployeeId == 0 ? (int?)null : selectedEmployeeId, ClinicalHeadingId = selectedClinicalHeadingId }
                                      equals new { FieldId = map.ClinicalFieldId, DepartmentId = map.DepartmentId, EmployeeId = map.EmployeeId, ClinicalHeadingId = map.ClinicalHeadingId }
                                  select new ClinicalUserField_DTO
                                  {
                                      FieldId = f.FieldId,
                                      FieldName = f.FieldName,
                                      ClinicalUserFieldId = map.ClinicalUserFieldId,
                                      IsActive = map.IsActive,
                                      DisplaySequence = sectionMapping.DisplaySequence
                                  };

            var result = userFieldsQuery.ToList();

            var mappedFieldIds = result.Select(r => r.FieldId).ToList();

            var additionalFieldsQuery = from f in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups
                                        join sectionMapping in _clinicalSettingDbContext.SectionMappings
                                            on f.FieldId equals sectionMapping.ClinicalFieldId
                                        where sectionMapping.ClinicalHeadingId == selectedClinicalHeadingId
                                          && sectionMapping.IsActive
                                          && f.IsActive
                                          && !mappedFieldIds.Contains(f.FieldId)
                                        select new ClinicalUserField_DTO
                                        {
                                            FieldId = f.FieldId,
                                            FieldName = f.FieldName,
                                            ClinicalUserFieldId = null,
                                            IsActive = false,
                                            DisplaySequence = sectionMapping.DisplaySequence
                                        };

            var additionalFields = additionalFieldsQuery.ToList();
            result.AddRange(additionalFields);

            return result;
        }




        public object ActivateDeactivateIntakeOutputVariable(RbacUser currentUser, int selectedIntakeOutputDataId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (selectedIntakeOutputDataId == 0)
            {
                Log.Error($"{nameof(selectedIntakeOutputDataId)} is not provided");
                throw new InvalidOperationException($"{nameof(selectedIntakeOutputDataId)} is not provided");

            }

            var selectedIntakeOutputData = _clinicalSettingDbContext.ClinicalIntakeOutputParameters.FirstOrDefault(r => r.IntakeOutputId == selectedIntakeOutputDataId);
            if (selectedIntakeOutputData == null)
            {
                Log.Error($"There is no selected IntakeOutputData to update with selectedIntakeOutputDataId {nameof(selectedIntakeOutputDataId)}");
                throw new InvalidOperationException($"There is no selected IntakeOutputData to update with selectedIntakeOutputDataId {nameof(selectedIntakeOutputDataId)}");
            }

            selectedIntakeOutputData.IsActive = !selectedIntakeOutputData.IsActive;
            selectedIntakeOutputData.ModifiedBy = currentUser.EmployeeId;
            selectedIntakeOutputData.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(selectedIntakeOutputData).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return selectedIntakeOutputData;
        }

        public object GetIntakeOutputTypeForGrid(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            DataTable clinicalIntakeOutputParameterList = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetIntakeOutputParameters", _clinicalSettingDbContext);
            return clinicalIntakeOutputParameterList;
        }

        public object GetIntakeOutputType(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            List<ClinicalIntakeOutputParameterModel> intakeOutputTypeList = _clinicalSettingDbContext.ClinicalIntakeOutputParameters.ToList();
            return intakeOutputTypeList;
        }
        public object GetIntakeTiming(ClinicalDbContext _clinicalDbContext)
        {
            try
            {
                var clinicalIntake = _clinicalDbContext.MedicationIntakes.ToList();
                return clinicalIntake;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting IntakeTiming list: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while getting IntakeTiming list.{ex.Message}");
            }
        }
        public object ActivateDeactivateIntakeTime(RbacUser currentUser, int selectedIntakeTimingId, ClinicalDbContext _clinicalDbContext)
        {
            if (selectedIntakeTimingId == 0)
            {
                Log.Error($"{nameof(selectedIntakeTimingId)} is not provided");
                throw new InvalidOperationException($"{nameof(selectedIntakeTimingId)} is not provided");

            }

            var selectedIntakeTimeData = _clinicalDbContext.MedicationIntakes.FirstOrDefault(r => r.MedicationIntakeId == selectedIntakeTimingId);
            if (selectedIntakeTimeData == null)
            {
                Log.Error($"There is no selected IntakeTime Data to update with selectedIntakeTimingId {nameof(selectedIntakeTimingId)}");
                throw new InvalidOperationException($"There is no selected IntakeTime data to update with selectedIntakeTimingId {nameof(selectedIntakeTimingId)}");
            }

            selectedIntakeTimeData.IsActive = !selectedIntakeTimeData.IsActive;
            selectedIntakeTimeData.ModifiedBy = currentUser.EmployeeId;
            selectedIntakeTimeData.ModifiedOn = DateTime.Now;

            _clinicalDbContext.Entry(selectedIntakeTimeData).State = EntityState.Modified;
            _clinicalDbContext.SaveChanges();
            return selectedIntakeTimeData;
        }

        public object PostIntakeTime(RbacUser currentUser, MedicationIntakeModel clinicalIntakeTime, ClinicalDbContext _clinicalDbContext)
        {
            if (clinicalIntakeTime == null)
            {
                Log.Error("Clinical IntakeTime value is not provided.");
                throw new InvalidOperationException("Null values cannot be added.");
            }

            clinicalIntakeTime.IntakeCode = clinicalIntakeTime.IntakeCode?.Trim();
            bool isIntakeCodeExists = _clinicalDbContext.MedicationIntakes
                .Any(m => m.IntakeCode == clinicalIntakeTime.IntakeCode);

            if (isIntakeCodeExists)
            {
                Log.Error($"Intakecode  '{clinicalIntakeTime.IntakeCode}' already exists.");
                throw new InvalidOperationException("IntakeCode Name already exists.");
            }


            clinicalIntakeTime.IntakeDisplayName = clinicalIntakeTime.IntakeDisplayName?.Trim();
            bool isDisplayNameExists = _clinicalDbContext.MedicationIntakes
                .Any(m => m.IntakeDisplayName == clinicalIntakeTime.IntakeDisplayName);

            if (isDisplayNameExists)
            {
                Log.Error($"IntakeDisplayName '{clinicalIntakeTime.IntakeDisplayName}' already exists.");
                throw new InvalidOperationException("Intake Display Name already exists.");
            }

            int latestIntakeNumber = _clinicalDbContext.MedicationIntakes
                .OrderByDescending(m => m.IntakeNumber)
                .Select(m => m.IntakeNumber)
                .FirstOrDefault(); // Get the highest IntakeNumber

            int newIntakeNumber = latestIntakeNumber + 1;

            MedicationIntakeModel medicationIntakeModel = new MedicationIntakeModel
            {
                IntakeCode = clinicalIntakeTime.IntakeCode,
                IntakeDisplayName = clinicalIntakeTime.IntakeDisplayName,
                IntakeNumber = newIntakeNumber,
                IsActive = true,
                CreatedBy = currentUser.EmployeeId,
                CreatedOn = DateTime.Now
            };

            // Add and save changes
            _clinicalDbContext.MedicationIntakes.Add(medicationIntakeModel);
            _clinicalDbContext.SaveChanges();

            return medicationIntakeModel;
        }

        public object UpdateIntakeTime(RbacUser currentUser, MedicationIntakeModel clinicalIntakeTime, ClinicalDbContext _clinicalDbContext)
        {
            if (clinicalIntakeTime == null)
            {
                Log.Error("Clinical IntakeTime value is not provided.");
                throw new Exception("Null values cannot be updated.");
            }
        

            // Trim IntakeDisplayName before checking and updating
            clinicalIntakeTime.IntakeDisplayName = clinicalIntakeTime.IntakeDisplayName?.Trim();

            // Fetch existing record
            MedicationIntakeModel existingData = _clinicalDbContext.MedicationIntakes
                .FirstOrDefault(x => x.MedicationIntakeId == clinicalIntakeTime.MedicationIntakeId);

            if (existingData == null)
            {
                Log.Error($"Intake record with ID {clinicalIntakeTime.MedicationIntakeId} not found.");
                throw new InvalidOperationException("Record not found.");
            }

           

            // Check if IntakeDisplayName already exists (excluding the current record)
            bool isDisplayNameExists = _clinicalDbContext.MedicationIntakes
                .Any(m => m.IntakeDisplayName == clinicalIntakeTime.IntakeDisplayName && m.MedicationIntakeId != clinicalIntakeTime.MedicationIntakeId);

            if (isDisplayNameExists)
            {
                Log.Error($"IntakeDisplayName '{clinicalIntakeTime.IntakeDisplayName}' already exists.");
                throw new InvalidOperationException("Intake Display Name already exists.");
            }

            
            // Update fields
            existingData.IntakeCode = clinicalIntakeTime.IntakeCode;
            existingData.IntakeDisplayName = clinicalIntakeTime.IntakeDisplayName;
            existingData.IntakeNumber = clinicalIntakeTime.IntakeNumber;
            existingData.ModifiedBy = currentUser.EmployeeId;
            existingData.ModifiedOn = DateTime.Now;

            _clinicalDbContext.SaveChanges();
            return existingData;
        }


        public object PostIntakeOutputVariable(RbacUser currentUser, ClinicalIntakeOutputParameterModel clinicalIntakeOutput, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel = new ClinicalIntakeOutputParameterModel();
            if (clinicalIntakeOutput == null)
            {
                Log.Error($"Clinical IntakeOutput Parameters are not provided");
                throw new Exception("Null values cannot be added");
            }
            clinicalIntakeOutputParameterModel.ParameterType = clinicalIntakeOutput.ParameterType;
            clinicalIntakeOutputParameterModel.ParameterValue = clinicalIntakeOutput.ParameterValue;
            if (clinicalIntakeOutput.ParameterMainId == 0)
            {
                var nonParentParameterValue = -1;
                clinicalIntakeOutputParameterModel.ParameterMainId = nonParentParameterValue;
            }
            else
            {
                clinicalIntakeOutputParameterModel.ParameterMainId = clinicalIntakeOutput.ParameterMainId;
            }
            clinicalIntakeOutputParameterModel.IsActive = true;
            clinicalIntakeOutputParameterModel.CreatedBy = currentUser.EmployeeId;
            clinicalIntakeOutputParameterModel.CreatedOn = DateTime.Now;
            _clinicalSettingDbContext.ClinicalIntakeOutputParameters.Add(clinicalIntakeOutputParameterModel);
            _clinicalSettingDbContext.SaveChanges();
            return clinicalIntakeOutputParameterModel;
        }
        public object UpdateIntakeOutputVariable(RbacUser currentUser, ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            ClinicalIntakeOutputParameterModel existingData = _clinicalSettingDbContext.ClinicalIntakeOutputParameters.FirstOrDefault(x => x.IntakeOutputId == clinicalIntakeOutputParameterModel.IntakeOutputId);
            if (existingData != null)
            {
                existingData.ParameterType = clinicalIntakeOutputParameterModel.ParameterType;
                existingData.ParameterValue = clinicalIntakeOutputParameterModel.ParameterValue;
                existingData.ParameterMainId = clinicalIntakeOutputParameterModel.ParameterMainId;
                existingData.ModifiedBy = currentUser.EmployeeId;
                existingData.ModifiedOn = DateTime.Now;
                _clinicalSettingDbContext.SaveChanges();
                return existingData;
            }
            else
            {
                Log.Error($"Clinical IntakeOutput Parameters are not provided");
                throw new Exception("Null Value is not Allowed");
            }
        }
        public object PostClinicalFieldOption(RbacUser currentUser, ClinicalFieldOption_DTO clinicalFieldOption_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (clinicalFieldOption_DTO == null)
                    {
                        Log.Error($"Nothing to save as  {nameof(clinicalFieldOption_DTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(clinicalFieldOption_DTO)} is null.");
                    }


                    var clinicalFieldOptionModel = new ClinicalFieldOptionModel()
                    {
                        Options = clinicalFieldOption_DTO.Options,
                        FieldId = clinicalFieldOption_DTO.FieldId,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };
                    _clinicalSettingDbContext.ClinicalFieldOptions.Add(clinicalFieldOptionModel);
                    _clinicalSettingDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return clinicalFieldOption_DTO;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while saving the Clinical field Options: {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the clinical field Options.{ex.Message}");

                }
            }
        }
        public object UpdateClinicalFieldOption(RbacUser currentUser, ClinicalFieldOption_DTO clinicalFieldOption_DTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            if (clinicalFieldOption_DTO == null)
            {
                Log.Error($"Nothing to update as  {nameof(clinicalFieldOption_DTO)} is null.");
                throw new ArgumentNullException($"Nothing to update as{nameof(clinicalFieldOption_DTO)} is null");
            }
            if (clinicalFieldOption_DTO != null && clinicalFieldOption_DTO.ClinicalOptionId == 0)
            {
                Log.Error($" {nameof(clinicalFieldOption_DTO)} is not provided to update the Clinical Field Option.");
                throw new ArgumentNullException($"{nameof(clinicalFieldOption_DTO.ClinicalOptionId)} is not provided to update the Clinical Field Option");
            }
            var clinicalOption = clinicalSettingDbContext.ClinicalFieldOptions.Where(x => x.ClinicalOptionId == clinicalFieldOption_DTO.ClinicalOptionId).FirstOrDefault();
            if (clinicalOption == null)
            {
                Log.Error($"No Clinical Field Option is found for {nameof(clinicalFieldOption_DTO.ClinicalOptionId)}");
                throw new InvalidOperationException($"No Clinical Field Option is found for {nameof(clinicalFieldOption_DTO.ClinicalOptionId)}");
            }

            clinicalOption.ModifiedOn = DateTime.Now;
            clinicalOption.ModifiedBy = currentUser.EmployeeId;
            clinicalOption.IsActive = true;
            clinicalOption.FieldId = clinicalFieldOption_DTO.FieldId;
            clinicalOption.Options = clinicalFieldOption_DTO.Options;

            clinicalSettingDbContext.Entry(clinicalOption).State = EntityState.Modified;
            clinicalSettingDbContext.SaveChanges();
            return clinicalFieldOption_DTO;
        }
        public object ActivateDeactivateClinicalFieldOption(RbacUser currentUser, int clinicalOptionId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (clinicalOptionId == 0)
            {
                Log.Error($"{nameof(clinicalOptionId)} is not provided");
                throw new InvalidOperationException($"{nameof(clinicalOptionId)} is not provided");

            }

            var clinicalOptionData = _clinicalSettingDbContext.ClinicalFieldOptions.FirstOrDefault(r => r.ClinicalOptionId == clinicalOptionId);
            if (clinicalOptionData == null)
            {
                Log.Error($"There is no selected ClinicalFieldOption to update with selectedClinicalOptionId {nameof(clinicalOptionId)}");
                throw new InvalidOperationException($"There is no selected ClinicalFieldOption  to update with selectedClinicalOptionId {nameof(clinicalOptionId)}");
            }

            clinicalOptionData.IsActive = !clinicalOptionData.IsActive;
            clinicalOptionData.ModifiedBy = currentUser.EmployeeId;
            clinicalOptionData.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(clinicalOptionData).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return clinicalOptionData;
        }

        /// <summary>
        /// The method is used for adding new ClinicalHeading.
        /// </summary>
        /// <param name="currentUser">Identity of user that performing Updataion</param>
        /// <param name="clinicalHeading_DTO">The DTO contain details of the ClinicalHeading part for mapping when API call for add new ClinicalHeading</param>
        /// <param name="_clinicalSettingDbContext">The database context to be used for the operation</param>
        /// <returns>The result of added ClinicalHeading name and id</returns>
        /// <exception cref="InvalidOperationException">Thrown when an error occurs during the update operation.</exception>
        public object PostClinicalHeading(RbacUser currentUser, ClinicalHeading_DTO clinicalHeading_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (clinicalHeading_DTO == null)
                    {
                        Log.Error($"Nothing to save as  {nameof(clinicalHeading_DTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(clinicalHeading_DTO)} is null.");
                    }
                    string trimmedName = clinicalHeading_DTO.ClinicalHeadingName.Trim();
                    if (_clinicalSettingDbContext.ClinicalHeadings.Any(t => t.ClinicalHeadingName == trimmedName && t.ParentId == clinicalHeading_DTO.ParentId && t.ParentId != null && clinicalHeading_DTO.ParentId != null))
                    {
                        Log.Error($"Section '{trimmedName}'  already exist for same Document name is");
                        throw new InvalidOperationException($"Section '{trimmedName}'  already exist for same Document.");
                    }
                    if (_clinicalSettingDbContext.ClinicalHeadings.Any(t => t.ClinicalHeadingName == trimmedName && clinicalHeading_DTO.ParentId == null))
                    {
                        Log.Error($"Document/Section name is '{trimmedName}' already exists.");
                        throw new InvalidOperationException($"Document Name '{trimmedName}' already exists.");
                    }

                    var clinicalHeadingModel = new ClinicalHeadingsModel()
                    {
                        ClinicalHeadingName = clinicalHeading_DTO.ClinicalHeadingName,
                        DisplayName = clinicalHeading_DTO.DisplayName,
                        DisplayOrder = clinicalHeading_DTO.DisplayOrder,
                        ParentId = clinicalHeading_DTO.ParentId,
                        IsDefault = clinicalHeading_DTO.IsDefault,
                        IsActive = clinicalHeading_DTO.IsActive,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };

                    _clinicalSettingDbContext.ClinicalHeadings.Add(clinicalHeadingModel);
                    _clinicalSettingDbContext.SaveChanges();

                    string generatedCode = $"{clinicalHeadingModel.ClinicalHeadingName.Substring(0, Math.Min(3, clinicalHeadingModel.ClinicalHeadingName.Length)).ToUpper()}{clinicalHeadingModel.ClinicalHeadingId:D4}";
                    clinicalHeadingModel.Code = generatedCode;

                    _clinicalSettingDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return clinicalHeadingModel;

                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while saving the Clinical Heading: {ex.Message}");
                    throw new InvalidOperationException($"{ex.Message}");

                }
            }
        }

        public object UpdateClinicalHeading(RbacUser currentUser, ClinicalHeading_DTO clinicalHeading_DTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            try
            {
                if (clinicalHeading_DTO == null)
                {
                    Log.Error($"Nothing to update as  {nameof(clinicalHeading_DTO)} is null.");
                    throw new ArgumentNullException($"Nothing to update as{nameof(clinicalHeading_DTO)} is null");
                }
                if (clinicalHeading_DTO != null && clinicalHeading_DTO.ClinicalHeadingId == 0)
                {
                    Log.Error($" {nameof(clinicalHeading_DTO)} is not provided to update the Clinical Heading.");
                    throw new ArgumentNullException($"{nameof(clinicalHeading_DTO.ClinicalHeadingId)} is not provided to update the Clinical Heading");
                }
                var clinicalHeading = clinicalSettingDbContext.ClinicalHeadings.Where(x => x.ClinicalHeadingId == clinicalHeading_DTO.ClinicalHeadingId).FirstOrDefault();
                if (clinicalHeading == null)
                {
                    Log.Error($"No Clinical Heading is found for {nameof(clinicalHeading_DTO.ClinicalHeadingId)}");
                    throw new InvalidOperationException($"No Clinical Heading is found for {nameof(clinicalHeading_DTO.ClinicalHeadingId)}");
                }
                var duplicateHeading = clinicalSettingDbContext.ClinicalHeadings
                 .Where(x => x.ClinicalHeadingName == clinicalHeading_DTO.ClinicalHeadingName && x.ParentId == null)
                 .FirstOrDefault();

                if (duplicateHeading != null && duplicateHeading.ClinicalHeadingId != clinicalHeading_DTO.ClinicalHeadingId)
                {
                    // Log and throw an exception if a duplicate heading is found
                    Log.Error($"Document Name '{clinicalHeading_DTO.ClinicalHeadingName}' already exists.");
                    throw new InvalidOperationException($"Document Name '{clinicalHeading_DTO.ClinicalHeadingName}' already exists.");
                }

                if (IsSectionAlreadyExistsInSameDocument(clinicalHeading_DTO, clinicalSettingDbContext))
                {
                    Log.Error($"Section '{clinicalHeading_DTO.ClinicalHeadingName}'  already exist for same Document name is");
                    throw new InvalidOperationException($"Section '{clinicalHeading_DTO.ClinicalHeadingName}'  already exist for same Document.");
                }
                clinicalHeading.ModifiedOn = DateTime.Now;
                clinicalHeading.ModifiedBy = currentUser.EmployeeId;
                clinicalHeading.IsActive = true;
                clinicalHeading.ClinicalHeadingName = clinicalHeading_DTO.ClinicalHeadingName;
                clinicalHeading.ParentId = clinicalHeading_DTO.ParentId;
                clinicalHeading.DisplayName = clinicalHeading_DTO.DisplayName;
                clinicalHeading.DisplayOrder = clinicalHeading_DTO.DisplayOrder;
                clinicalHeading.IsDefault = clinicalHeading_DTO.IsDefault;
                clinicalHeading.IsActive = clinicalHeading_DTO.IsActive;
                clinicalSettingDbContext.Entry(clinicalHeading).State = EntityState.Modified;
                clinicalSettingDbContext.SaveChanges();
                return clinicalHeading_DTO;
            }
            catch (Exception ex)
            {

                Log.Error($"An error occurred while updating the Clinical Heading: {ex.Message}");
                throw new InvalidOperationException($"{ex.Message}");

            }


        }

        /// <summary>
        /// Checks if a clinical section with the same name already exists within the same document and parent section.
        /// </summary>
        /// <param name="clinicalHeading_DTO">The clinical heading details to check.</param>
        /// <param name="clinicalSettingDbContext">The database context for accessing clinical headings data.</param>
        /// <returns>
        /// <c>true</c> if a duplicate section exists; otherwise, <c>false</c>.
        /// </returns>
        private bool IsSectionAlreadyExistsInSameDocument(ClinicalHeading_DTO clinicalHeading_DTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            string trimmedName = clinicalHeading_DTO.ClinicalHeadingName.Trim();

            var duplicateSectionHeading = clinicalSettingDbContext.ClinicalHeadings.Where(t => t.ClinicalHeadingName == trimmedName && t.ParentId == clinicalHeading_DTO.ParentId && t.ParentId != null && clinicalHeading_DTO.ParentId != null).FirstOrDefault();
            if (duplicateSectionHeading != null && duplicateSectionHeading.ClinicalHeadingId != clinicalHeading_DTO.ClinicalHeadingId)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public object ActivateDeactivateClinicalHeading(RbacUser currentUser, int clinicalHeadingId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (clinicalHeadingId == 0)
            {
                Log.Error($"{nameof(clinicalHeadingId)} is not provided");
                throw new InvalidOperationException($"{nameof(clinicalHeadingId)} is not provided");

            }

            var clinicalOptionData = _clinicalSettingDbContext.ClinicalHeadings.FirstOrDefault(r => r.ClinicalHeadingId == clinicalHeadingId);
            if (clinicalOptionData == null)
            {
                Log.Error($"There is no selected Clinical Heading to update with selectedClinicalHeadingId {nameof(clinicalHeadingId)}");
                throw new InvalidOperationException($"There is no selected Clinical Heading  to update with selectedClinicalHeadingId {nameof(clinicalHeadingId)}");
            }

            clinicalOptionData.IsActive = !clinicalOptionData.IsActive;
            clinicalOptionData.ModifiedBy = currentUser.EmployeeId;
            clinicalOptionData.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(clinicalOptionData).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return clinicalOptionData;
        }

        public object GetPreTemplateComponentList(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            List<PreDevelopedComponentList_DTO> PreTemplateComponentList = _clinicalSettingDbContext.PreDevelopedComponentList
            .Where(d => d.IsActive == true)
            .Select(d => new PreDevelopedComponentList_DTO
            {
                PreTemplateId = d.PreDevelopedComponentId,
                PreTemplateName = d.ComponentName,
                PreDevelopedTemplateSelector = d.ComponentSelector,
                KeyWord = d.KeyWord

            })
            .ToList();
            return PreTemplateComponentList;

        }
        public object GetSmartPrintableTemplates(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            List<ClinicalTemplates_DTO> PrintableTemplateList = _clinicalSettingDbContext.ClinicalTemplates
            .Where(p => p.IsActive == true)
            .Select(t => new ClinicalTemplates_DTO
            {
                TemplateId = t.TemplateId,
                TemplateName = t.TemplateName,
                TemplateHTML = t.TemplateHTML,
                TemplateCode = t.TemplateCode,
            })
            .ToList();
            return PrintableTemplateList;

        }
        /// <summary>
        /// Retrieves a list of clinical master notes from the database.
        /// </summary>
        /// <param name="_clinicalSettingDbContext">The database context used to access clinical master notes.</param>
        /// <returns>Returns a list of clinical master notes.</returns>
        public object GetClinicalNotes(ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var clinicalNotes = _clinicalSettingDbContext.ClinicalMasterNotes.OrderByDescending(a => a.CreatedOn).ToList();
            return clinicalNotes;
        }
        /// <summary>
        /// Adds a new clinical master note to the database.
        /// </summary>
        /// <param name="currentUser">The user performing the operation.</param>
        /// <param name="clinicalMasterNotes_DTO">Data transfer object containing the details of the clinical master note to add.</param>
        /// <param name="_clinicalSettingDbContext">The database context used to add the clinical master note.</param>
        /// <returns>Returns the added clinical master note DTO if successful.</returns>
        public object AddClinicalMasterNotes(RbacUser currentUser, ClinicalMasterNotes_DTO clinicalMasterNotes_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var clinicalNotesTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (clinicalMasterNotes_DTO is null)
                    {
                        Log.Error($"Nothing to save as {nameof(ClinicalMasterNotes_DTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(ClinicalMasterNotes_DTO)} is null.");
                    }
                    string trimmedMedicalCode = clinicalMasterNotes_DTO.ClinicalNotesCode.Trim();
                    if (_clinicalSettingDbContext.ClinicalMasterNotes.Any(t => t.ClinicalNotesCode == trimmedMedicalCode))
                    {
                        Log.Error($"Chief Complaint with Code '{trimmedMedicalCode}' already exists.");
                        throw new InvalidOperationException($"Chief Complaint with Code '{trimmedMedicalCode}' already exists.");
                    }

                    var clinicalMasterNotesModel = new ClinicalMasterNotesModel()
                    {
                        ClinicalNotesCode = clinicalMasterNotes_DTO.ClinicalNotesCode,
                        ClinicalNotesName = clinicalMasterNotes_DTO.ClinicalNotesName,
                        DisplaySequence = clinicalMasterNotes_DTO.DisplaySequence,
                        IsDefault = clinicalMasterNotes_DTO.IsDefault,

                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };
                    _clinicalSettingDbContext.ClinicalMasterNotes.Add(clinicalMasterNotesModel);
                    _clinicalSettingDbContext.SaveChanges();

                    clinicalNotesTransaction.Commit();
                    return clinicalMasterNotes_DTO;
                }
                catch (SqlException sqlEx)
                {
                    clinicalNotesTransaction.Rollback();
                    Log.Error($"A SQL error occurred while adding Clinical Notes: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while adding Clinical Notes: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    clinicalNotesTransaction.Rollback();
                    Log.Error($"An error occurred while adding Clinical Notes: {ex.Message}", ex);
                    throw new Exception($"An error occurred while adding Clinical Notes: {ex.Message}. Exception details: {ex}");
                }
            }
        }
        /// <summary>
        /// Updates an existing clinical master note in the database.
        /// </summary>
        /// <param name="currentUser">The user performing the update.</param>
        /// <param name="clinicalMasterNotes_DTO">Data transfer object containing the updated details of the clinical master note.</param>
        /// <param name="clinicalSettingDbContext">The database context used for updating the clinical master note.</param>
        /// <returns>Returns the updated clinical master note DTO if successful.</returns>
        public object UpdateClinicalMasterNotes(RbacUser currentUser, ClinicalMasterNotes_DTO clinicalMasterNotes_DTO, ClinicalSettingDbContext clinicalSettingDbContext)
        {
            if (clinicalMasterNotes_DTO is null)
            {
                Log.Error($"{nameof(clinicalMasterNotes_DTO.ClinicalNotesMasterId)} is null");
                throw new ArgumentNullException($"{nameof(clinicalMasterNotes_DTO)} is null");
            }
            if (clinicalMasterNotes_DTO != null && clinicalMasterNotes_DTO.ClinicalNotesMasterId == 0)
            {
                Log.Error($"{nameof(clinicalMasterNotes_DTO.ClinicalNotesMasterId)} is not provided to update the clinical Notes");
                throw new ArgumentNullException($"{nameof(clinicalMasterNotes_DTO.ClinicalNotesMasterId)} is not provided to update the clinical Notes");
            }
            var clinicalNotes = clinicalSettingDbContext.ClinicalMasterNotes.Where(x => x.ClinicalNotesMasterId == clinicalMasterNotes_DTO.ClinicalNotesMasterId).FirstOrDefault();
            if (clinicalNotes is null)
            {
                Log.Error($"No clinical Notes is found for {nameof(clinicalMasterNotes_DTO.ClinicalNotesMasterId)}");
                throw new Exception($"No clinical Notes is found for {nameof(clinicalMasterNotes_DTO.ClinicalNotesMasterId)}");
            }
            using (var clinicalNotesTransactionScope = clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {

                    clinicalNotes.ModifiedOn = DateTime.Now;
                    clinicalNotes.ModifiedBy = currentUser.EmployeeId;
                    clinicalNotes.IsActive = true;
                    clinicalNotes.ClinicalNotesCode = clinicalMasterNotes_DTO.ClinicalNotesCode;
                    clinicalNotes.ClinicalNotesName = clinicalMasterNotes_DTO.ClinicalNotesName;
                    clinicalNotes.DisplaySequence = clinicalMasterNotes_DTO.DisplaySequence;
                    clinicalNotes.IsDefault = clinicalMasterNotes_DTO.IsDefault;
                    clinicalSettingDbContext.Entry(clinicalNotes).State = EntityState.Modified;
                    clinicalSettingDbContext.SaveChanges();
                    clinicalNotesTransactionScope.Commit();
                    return clinicalMasterNotes_DTO;
                }
                catch (SqlException sqlEx)
                {
                    clinicalNotesTransactionScope.Rollback();
                    Log.Error($"A SQL error occurred while Updating Clinical Notes: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while Updating Clinical Notes: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    clinicalNotesTransactionScope.Rollback();
                    Log.Error($"An error occurred while Updating Clinical Notes: {ex.Message}", ex);
                    throw new Exception($"An error occurred while Updating Clinical Notes: {ex.Message}. Exception details: {ex}");
                }
            }
        }



        /// <summary>
        /// Retrieves a list of medical components based on employee, department, and clinical notes criteria.
        /// </summary>
        /// <param name="_clinicalSettingDbContext">The database context used for querying medical components.</param>
        /// <param name="selectedEmployeeId">ID of the selected employee.</param>
        /// <param name="selectedDepartmentId">ID of the selected department.</param>
        /// <param name="selectedClinicalNotesMasterId">ID of the selected clinical notes master.</param>
        /// <param name="childHeadingId">ID of the child heading.</param>
        /// <returns>A list of medical components that match the criteria.</returns>
        public object GetMedicalComponentList(ClinicalSettingDbContext _clinicalSettingDbContext, int? selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalNotesMasterId, int? childHeadingId, int? parentHeadingId)
        {
            var query =
            from field in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups.Where(f => f.IsActive)
            join sectionMapping in _clinicalSettingDbContext.SectionMappings.Where(s => s.IsActive)
             on field.FieldId equals sectionMapping.ClinicalFieldId into sectionMappingGroup
            from sectionMapping in sectionMappingGroup.DefaultIfEmpty()
            join sectionHeading in _clinicalSettingDbContext.ClinicalHeadings
                on sectionMapping.ClinicalHeadingId equals sectionHeading.ClinicalHeadingId into sectionHeadingGroup
            from sectionHeading in sectionHeadingGroup.DefaultIfEmpty()

            join map in _clinicalSettingDbContext.ClinicalMasterNotesMappings
                               on new { FieldId = field.FieldId, DepartmentId = selectedDepartmentId == 0 ? (int?)null : selectedDepartmentId, EmployeeId = selectedEmployeeId == 0 ? (int?)null : selectedEmployeeId, ClinicalNotesMasterId = selectedClinicalNotesMasterId }
                               equals new { FieldId = map.ClinicalFieldId, DepartmentId = map.DepartmentId, EmployeeId = map.EmployeeId, ClinicalNotesMasterId = map.ClinicalNotesMasterId }

            select new ReadMedicalComponent_DTO
            {

                FieldId = field.FieldId,
                FieldName = field.FieldName,
                InputType = field.InputType,
                ClinicalMapComponentId = map.ClinicalMapComponentId,
                DisplaySequence = map.DisplaySequence,
                IsActive = map.IsActive,
                ClinicalHeadingId = (sectionHeading != null ? sectionHeading.ClinicalHeadingId : (int?)null),
                ParentHeadingId = sectionHeading != null ? sectionHeading.ParentId : (int?)null,
            };

            // Group by FieldId and ParentHeadingId (if provided), else by FieldId with null ParentHeadingId
            // Select a result for each group based on the following priority:
            // 1. If childHeadingId is provided, find the first record where ClinicalHeadingId matches childHeadingId.
            // 2. If no matching childHeadingId record is found, check for a match with ParentHeadingId.
            // 3. If no matches are found, return the first record in the group.
            // 4. If childHeadingId is not provided, simply select the first record in each group.
            var result = query
             .GroupBy(r => parentHeadingId.HasValue
               ? new { r.FieldId, r.ParentHeadingId }
               : new { r.FieldId, ParentHeadingId = (int?)null })
             .Select(g => childHeadingId.HasValue
               ? g.FirstOrDefault(r => r.ClinicalHeadingId == childHeadingId.Value)
               ?? g.FirstOrDefault(r => r.ParentHeadingId == parentHeadingId)
               ?? g.FirstOrDefault()
               : g.FirstOrDefault())
            .ToList();

            var mappedFieldIds = result.Select(r => r.FieldId).ToList();

            var additionalFieldsQuery = from field in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups
                                                  .Where(f => f.IsActive && !mappedFieldIds.Contains(f.FieldId))
                                        join sectionMapping in _clinicalSettingDbContext.SectionMappings.Where(s => s.IsActive)
            on field.FieldId equals sectionMapping.ClinicalFieldId into sectionMappingGroup
                                        from sectionMapping in sectionMappingGroup.DefaultIfEmpty()
                                        join sectionHeading in _clinicalSettingDbContext.ClinicalHeadings
                                            on sectionMapping.ClinicalHeadingId equals sectionHeading.ClinicalHeadingId into sectionHeadingGroup
                                        from sectionHeading in sectionHeadingGroup.DefaultIfEmpty()

                                        select new ReadMedicalComponent_DTO
                                        {
                                            FieldId = field.FieldId,
                                            FieldName = field.FieldName,
                                            InputType = field.InputType,
                                            ClinicalMapComponentId = null,
                                            DisplaySequence = default(int),
                                            IsActive = false,
                                            ClinicalHeadingId = sectionHeading != null ? sectionHeading.ClinicalHeadingId : (int?)null,
                                            ParentHeadingId = sectionHeading != null ? sectionHeading.ParentId : (int?)null
                                        };

            // Group by FieldId and ParentHeadingId (if provided), else by FieldId with null ParentHeadingId
            // Select a result for each group based on the following priority:
            // 1. If childHeadingId is provided, find the first record where ClinicalHeadingId matches childHeadingId.
            // 2. If no matching childHeadingId record is found, check for a match with ParentHeadingId.
            // 3. If no matches are found, return the first record in the group.
            // 4. If childHeadingId is not provided, simply select the first record in each group.
            var additionalFields = additionalFieldsQuery
             .GroupBy(r => parentHeadingId.HasValue
               ? new { r.FieldId, r.ParentHeadingId }
               : new { r.FieldId, ParentHeadingId = (int?)null })
             .Select(g => childHeadingId.HasValue
               ? g.FirstOrDefault(r => r.ClinicalHeadingId == childHeadingId.Value)
               ?? g.FirstOrDefault(r => r.ParentHeadingId == parentHeadingId)
               ?? g.FirstOrDefault()
               : g.FirstOrDefault())
            .ToList();

            result.AddRange(additionalFields);
            result = result.OrderByDescending(r => r.IsActive).ThenBy(r => r.DisplaySequence).ToList();
            return result;

        }



        /// <summary>
        /// Retrieves a filtered list of medical components based on specified criteria including employee, department, clinical notes, parent heading, child heading, and field ID.
        /// </summary>
        /// <param name="clinicalSettingDbContext">The database context used for querying medical components.</param>
        /// <param name="selectedEmployeeId">ID of the selected employee.</param>
        /// <param name="selectedDepartmentId">ID of the selected department.</param>
        /// <param name="selectedClinicalNotesMasterId">ID of the selected clinical notes master.</param>
        /// <param name="parentHeadingId">ID of the parent heading for filtering.</param>
        /// <param name="childHeadingId">ID of the child heading for filtering (optional).</param>
        /// <param name="fieldId">ID of the field for filtering (optional).</param>
        /// <returns>A filtered list of medical components that match the criteria.</returns>
        public object GetFilteredMedicalComponentList(ClinicalSettingDbContext clinicalSettingDbContext, int? selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalNotesMasterId, int parentHeadingId, int? childHeadingId, int? fieldId)
        {
            var baseResult = GetMedicalComponentList(clinicalSettingDbContext, selectedEmployeeId, selectedDepartmentId, selectedClinicalNotesMasterId, childHeadingId, parentHeadingId) as IEnumerable<dynamic>;

            if (baseResult is null)
            {
                Log.Error($"Failed to retrieve medical component list. The result of {nameof(GetMedicalComponentList)} is null.");
                throw new InvalidOperationException($"The result of {nameof(GetMedicalComponentList)} cannot be null.");
            }
            if (parentHeadingId == 0 && !childHeadingId.HasValue && !fieldId.HasValue)
            {
                return baseResult;
            }

            var filteredResult = baseResult
                .Where(q => q.ParentHeadingId == parentHeadingId &&
                            (!childHeadingId.HasValue || q.ClinicalHeadingId == childHeadingId.Value) &&
                            (!fieldId.HasValue || q.FieldId == fieldId.Value))
                .ToList();

            if (childHeadingId.HasValue && filteredResult.Any())
            {
                filteredResult = filteredResult
                    .Where(q => q.ClinicalHeadingId == childHeadingId.Value)
                    .ToList();
            }

            if (!filteredResult.Any())
            {
                filteredResult = baseResult
                    .Where(q => q.ParentHeadingId == parentHeadingId)
                    .ToList();
            }

            return filteredResult;
        }
        /// <summary>
        /// Adds or updates clinical notes mappings based on the provided DTO. Updates existing mappings if they exist, otherwise adds new mappings.
        /// </summary>
        /// <param name="currentUser">The current user performing the operation.</param>
        /// <param name="userFieldMappingsDTO">The DTO containing field mappings to be added or updated.</param>
        /// <param name="_clinicalSettingDbContext">The database context used for the operation.</param>
        /// <returns>An object indicating the success and a message of the operation.</returns>
        public object ClinicalNotesMappings(RbacUser currentUser, ClinicalMasterNotesMapping_Dto userFieldMappingsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var dbContextTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (userFieldMappingsDTO != null && userFieldMappingsDTO.FieldList != null && userFieldMappingsDTO.FieldList.Count > 0)
                    {
                        foreach (var clinicalField in userFieldMappingsDTO.FieldList)
                        {
                            if (ClinicalNotesMappingExists((int?)clinicalField.ClinicalMapComponentId, _clinicalSettingDbContext))
                            {
                                UpdateClinicalNotesMapping(currentUser, clinicalField, userFieldMappingsDTO, _clinicalSettingDbContext);
                            }
                            else
                            {
                                AddClinicalNotesMapping(currentUser, clinicalField, userFieldMappingsDTO, _clinicalSettingDbContext);
                            }
                        }

                        _clinicalSettingDbContext.SaveChanges();
                        dbContextTransaction.Commit();
                        return userFieldMappingsDTO;
                    }
                    else
                    {
                        Log.Error($"There is no any FieldList data associated with user Field Mappings");
                        throw new Exception($"There is no any FieldList data associated with user Field Mappings");
                    }
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"This transaction to save or update Field Mappings is being Rolled back with exceptions details {ex.ToString()}.");
                    throw new Exception($"This transaction to save or update Field Mappings is being Rolled back with exceptions details {ex.Message.ToString()}.");
                }
            }
        }

        private void UpdateClinicalNotesMapping(RbacUser currentUser, ClinicalNotesFieldDTO clinicalField, ClinicalMasterNotesMapping_Dto userFieldMappingsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var existingUserFieldMapping = _clinicalSettingDbContext.ClinicalMasterNotesMappings.FirstOrDefault(u => u.ClinicalMapComponentId == clinicalField.ClinicalMapComponentId);

            if (existingUserFieldMapping != null)
            {
                existingUserFieldMapping.ClinicalFieldId = clinicalField.FieldId;
                existingUserFieldMapping.DisplaySequence = clinicalField.DisplaySequence;
                existingUserFieldMapping.ModifiedBy = currentUser.EmployeeId;
                existingUserFieldMapping.ModifiedOn = DateTime.Now;
                existingUserFieldMapping.IsActive = clinicalField.IsActive;
            }
        }

        private void AddClinicalNotesMapping(RbacUser currentUser, ClinicalNotesFieldDTO clinicalField, ClinicalMasterNotesMapping_Dto userFieldMappingsDTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            var CurrentDateTime = DateTime.Now;

            _clinicalSettingDbContext.ClinicalMasterNotesMappings.Add(new ClinicalMasterNotesMapping()
            {
                ClinicalFieldId = clinicalField.FieldId,
                DisplaySequence = clinicalField.DisplaySequence,
                ClinicalNotesMasterId = userFieldMappingsDTO.ClinicalNotesMasterId,
                DepartmentId = userFieldMappingsDTO.DepartmentId,
                EmployeeId = userFieldMappingsDTO.EmployeeId,
                CreatedBy = currentUser.EmployeeId,
                CreatedOn = CurrentDateTime,
                IsActive = clinicalField.IsActive,
            });
        }

        private bool ClinicalNotesMappingExists(int? clinicalMapComponentId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            return _clinicalSettingDbContext.ClinicalMasterNotesMappings.Any(u => u.ClinicalMapComponentId == clinicalMapComponentId);
        }

        /// <summary>
        /// Toggles the activation status of a clinical note based on its ID. Updates the note's status to active or inactive and records the modification details.
        /// </summary>
        /// <param name="currentUser">The current user performing the operation.</param>
        /// <param name="clinicalNotesMasterId">The ID of the clinical note to activate or deactivate.</param>
        /// <param name="_clinicalSettingDbContext">The database context used for the operation.</param>
        /// <returns>The updated clinical note.</returns>
        public object ActivateDeactivateClinicalNotes(RbacUser currentUser, int clinicalNotesMasterId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            if (clinicalNotesMasterId == 0)
            {
                Log.Error($"{nameof(clinicalNotesMasterId)} is not provided");
                throw new InvalidOperationException($"{nameof(clinicalNotesMasterId)} is not provided");
            }

            var clinicalNotes = _clinicalSettingDbContext.ClinicalMasterNotes.FirstOrDefault(r => r.ClinicalNotesMasterId == clinicalNotesMasterId);
            if (clinicalNotes is null)
            {
                Log.Error($"There is no clinicalFieldQuestionry to update with QuestionId {clinicalNotesMasterId}");
                throw new InvalidOperationException($"There is no clinicalFieldQuestionry to update with QuestionId {nameof(clinicalNotesMasterId)}");
            }

            clinicalNotes.IsActive = !clinicalNotes.IsActive;
            clinicalNotes.ModifiedBy = currentUser.EmployeeId;
            clinicalNotes.ModifiedOn = DateTime.Now;

            _clinicalSettingDbContext.Entry(clinicalNotes).State = EntityState.Modified;
            _clinicalSettingDbContext.SaveChanges();
            return clinicalNotes;
        }
        /// <summary>
        /// Adds or updates section mappings in the clinical setting database.
        /// </summary>
        /// <param name="currentUser">The user who is performing the operation, used for auditing.</param>
        /// <param name="sectionMapping">The DTO containing section mapping details to be added or updated.</param>
        /// <param name="_clinicalSettingDbContext">The database context used for accessing and modifying section mappings.</param>
        /// <returns>Returns an object indicating the success or failure of the operation, with a message.</returns>
        public object AddSectionMappings(RbacUser currentUser, SectionMapping_DTO sectionMapping, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            using (var clinicalNotesMappingTransaction = _clinicalSettingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (sectionMapping != null && sectionMapping.FieldList != null && sectionMapping.FieldList.Count > 0)
                    {

                        foreach (var clinicalField in sectionMapping.FieldList)
                        {

                            var userFieldMapping = _clinicalSettingDbContext.ClnicalUserFieldMApping
                                                .FirstOrDefault(m => m.ClinicalHeadingId == sectionMapping.ClinicalHeadingId
                                                 && m.ClinicalFieldId == clinicalField.ClinicalFieldId);

                            if (userFieldMapping != null)
                            {

                                userFieldMapping.DisplaySequence = clinicalField.DisplaySequence;
                                userFieldMapping.ModifiedOn = DateTime.Now;
                                userFieldMapping.ModifiedBy = currentUser.EmployeeId;
                                if (!clinicalField.IsActive)
                                {
                                    userFieldMapping.IsActive = false;
                                }

                            }

                            if (clinicalField.ClinicalDocumentHeadingMapId > 0)
                            {
                                var existingMapping = _clinicalSettingDbContext.SectionMappings
                                    .FirstOrDefault(m => m.ClinicalDocumentHeadingMapId == clinicalField.ClinicalDocumentHeadingMapId);

                                if (existingMapping != null)
                                {
                                    existingMapping.ClinicalFieldId = clinicalField.ClinicalFieldId;
                                    existingMapping.DisplaySequence = clinicalField.DisplaySequence;
                                    existingMapping.IsActive = clinicalField.IsActive;
                                    existingMapping.ModifiedOn = DateTime.Now;
                                    existingMapping.ModifiedBy = currentUser.EmployeeId;
                                }
                                else
                                {
                                    Log.Error($"Mapping with ClinicalDocumentHeadingMapId {clinicalField.ClinicalDocumentHeadingMapId} not found.");
                                    throw new Exception($"Mapping with ClinicalDocumentHeadingMapId {clinicalField.ClinicalDocumentHeadingMapId} not found.");
                                }
                            }
                            else
                            {
                                var newMapping = new SectionMappingModel
                                {
                                    ClinicalFieldId = clinicalField.ClinicalFieldId,
                                    ClinicalHeadingId = sectionMapping.ClinicalHeadingId,
                                    DisplaySequence = clinicalField.DisplaySequence,
                                    CreatedBy = currentUser.EmployeeId,
                                    CreatedOn = System.DateTime.Now,
                                    IsActive = clinicalField.IsActive
                                };
                                _clinicalSettingDbContext.SectionMappings.Add(newMapping);


                            }
                        }

                        _clinicalSettingDbContext.SaveChanges();

                        clinicalNotesMappingTransaction.Commit();
                        return new { Success = true, Message = "Clinical Section Mapping added Or Updated successfully." };

                    }
                    else
                    {
                        Log.Error($"FieldList {nameof(sectionMapping)} is either null or empty in the provided ");
                        throw new Exception("There is no any FieldList data associated with user Field Mappings");
                    }
                }
                catch (SqlException sqlEx)
                {
                    clinicalNotesMappingTransaction.Rollback();
                    Log.Error($"A SQL error occurred while adding or updating Clinical Section Mappings: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while adding or updating Clinical Section Mappings:: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    clinicalNotesMappingTransaction.Rollback();
                    Log.Error($"An error occurred while adding or updating Clinical Section Mappings: {ex.Message}", ex);
                    throw new Exception($"An error occurred while adding or updating Clinical Section Mappings: {ex.Message}. Exception details: {ex}");
                }
            }
        }
        /// <summary>
        /// Retrieves section mappings for a given clinical heading ID. If no mappings are found, retrieves active clinical field setups instead.
        /// </summary>
        /// <param name="_clinicalSettingDbContext">The database context used for accessing section mappings and field setups.</param>
        /// <param name="ClinicalHeadingId">The ID of the clinical heading for which section mappings are to be retrieved.</param>
        /// <returns>Returns a list of section mappings or active clinical field setups if no mappings are found.</returns>
        public object GetClinicalSectionMapping(ClinicalSettingDbContext _clinicalSettingDbContext, int ClinicalHeadingId)
        {
            try
            {
                var existingMappingsQuery = from fieldSetup in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups
                                            join mapping in _clinicalSettingDbContext.SectionMappings
                                                on fieldSetup.FieldId equals mapping.ClinicalFieldId
                                            where fieldSetup.IsActive && mapping.ClinicalHeadingId == ClinicalHeadingId
                                            select new ClinicalFieldsList_DTO
                                            {
                                                ClinicalDocumentHeadingMapId = mapping.ClinicalDocumentHeadingMapId,
                                                FieldId = fieldSetup.FieldId,
                                                DisplaySequence = mapping.DisplaySequence,
                                                IsMapped = mapping.IsActive,
                                                FieldName = fieldSetup.FieldName,
                                                InputType = fieldSetup.InputType,
                                                GroupName = fieldSetup.GroupName,
                                                ClinicalHeadingId = mapping.ClinicalHeadingId
                                            };

                var existingMappings = existingMappingsQuery.ToList();

                var mappedFieldIds = existingMappings.Select(f => f.FieldId).ToList();

                var additionalFieldsQuery = from fieldSetup in _clinicalSettingDbContext.ClinicalHeadingFieldsSetups
                                            where fieldSetup.IsActive
                                            && !_clinicalSettingDbContext.SectionMappings
                                               .Any(sm => sm.ClinicalFieldId == fieldSetup.FieldId && sm.ClinicalHeadingId == ClinicalHeadingId)
                                            select new ClinicalFieldsList_DTO
                                            {
                                                FieldId = fieldSetup.FieldId,
                                                DisplaySequence = 0,
                                                IsMapped = false,
                                                FieldName = fieldSetup.FieldName,
                                                InputType = fieldSetup.InputType,
                                                GroupName = fieldSetup.GroupName,
                                            };

                var additionalFields = additionalFieldsQuery.ToList();

                var result = existingMappings.Concat(additionalFields).OrderBy(field => field.DisplaySequence).ToList();

                return result;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while fetching Clinical Section Mappings for ClinicalHeadingId: {ClinicalHeadingId}. Error: {ex.Message}", ex);
                throw new Exception($"An error occurred while fetching Clinical Section Mappings: {ex.Message}. Exception details: {ex}");
            }
        }
        /// <summary>
        /// Retrieves and filters section mappings based on the provided criteria for a given clinical heading ID.
        /// </summary>
        /// <param name="_clinicalSettingDbContext">The database context used for accessing section mappings and field setups.</param>
        /// <param name="ClinicalHeadingId">The ID of the clinical heading for which section mappings are to be retrieved.</param>
        /// <param name="InputType">The type of input to filter the section mappings.</param>
        /// <param name="GroupName">The name of the group to filter the section mappings.</param>
        /// <returns>Returns a filtered list of section mappings based on the provided criteria.</returns>
        public object GetFilteredClinicalSectionMapping(ClinicalSettingDbContext _clinicalSettingDbContext, int ClinicalHeadingId, string InputType, string GroupName)
        {
            try
            {
                var sectionMappings = GetClinicalSectionMapping(_clinicalSettingDbContext, ClinicalHeadingId) as List<ClinicalFieldsList_DTO>;

                if (!string.IsNullOrEmpty(InputType) && !string.IsNullOrEmpty(GroupName))
                {
                    sectionMappings = sectionMappings.Where(mapping => mapping.InputType == InputType && mapping.GroupName == GroupName).ToList();
                }
                else if (!string.IsNullOrEmpty(InputType))
                {
                    sectionMappings = sectionMappings.Where(mapping => mapping.InputType == InputType).ToList();
                }
                else if (!string.IsNullOrEmpty(GroupName))
                {
                    sectionMappings = sectionMappings.Where(mapping => mapping.GroupName == GroupName).ToList();
                }

                return sectionMappings;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while filtering Clinical Section Mappings for ClinicalHeadingId: {ClinicalHeadingId}. Error: {ex.Message}", ex);
                throw new Exception($"An error occurred while filtering Clinical Section Mappings: {ex.Message}. Exception details: {ex}");
            }
        }

        public object UpdateMedication(RbacUser currentUser, Put_Medication_DTO putMedication_DTO, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            try
            {
                var existingMedicationItem = _clinicalSettingDbContext.PHRMPrescriptionItem.FirstOrDefault(a => a.PrescriptionItemId == putMedication_DTO.PrescriptionItemId);
                if(existingMedicationItem != null)
                {
                    existingMedicationItem.ItemId = putMedication_DTO.ItemId;
                    existingMedicationItem.GenericId = putMedication_DTO.GenericId;
                    existingMedicationItem.FrequencyAbbreviation = putMedication_DTO.FrequencyAbbreviation;
                    existingMedicationItem.HowManyDays = putMedication_DTO.HowManyDays;
                    existingMedicationItem.Notes = putMedication_DTO.Remarks;
                    existingMedicationItem.TimingOfMedicineTake = putMedication_DTO.TimingOfMedicineTake;
                    existingMedicationItem.IsPRN = putMedication_DTO.IsPRN;
                    existingMedicationItem.Strength = putMedication_DTO.Strength;
                    existingMedicationItem.Dosage = putMedication_DTO.Dosage;
                    existingMedicationItem.PRNNotes = putMedication_DTO.PRNNotes;
                    existingMedicationItem.Route = putMedication_DTO.Route;
                    existingMedicationItem.ModifiedOn = DateTime.Now;
                    existingMedicationItem.ModifiedBy = currentUser.EmployeeId;
                }
                _clinicalSettingDbContext.SaveChanges();
                return existingMedicationItem;

            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Updating the Medication Item. Error: {ex.Message}", ex);
                throw new Exception($"An error occurred while Updating the Medication Item: {ex.Message}. Exception details: {ex}");
            }
        }

        public object DeactivatePrescriptionItem(RbacUser currentUser, int prescriptionItemId, ClinicalSettingDbContext _clinicalSettingDbContext)
        {
            try
            {
                var existingMedicationItem = _clinicalSettingDbContext.PHRMPrescriptionItem.FirstOrDefault(a => a.PrescriptionItemId == prescriptionItemId);
                if (existingMedicationItem != null)
                {
                    existingMedicationItem.IsActive = false;
                    existingMedicationItem.ModifiedOn = DateTime.Now;
                    existingMedicationItem.ModifiedBy = currentUser.EmployeeId;
                }
                _clinicalSettingDbContext.SaveChanges();
                return existingMedicationItem;
            }
            catch(Exception ex)
            {
                Log.Error($"An error occurred while Removing the Medication Item. Error: {ex.Message}", ex);
                throw new Exception($"An error occurred while Removing the Medication Item: {ex.Message}. Exception details: {ex}");
            }
        }
    }
}


