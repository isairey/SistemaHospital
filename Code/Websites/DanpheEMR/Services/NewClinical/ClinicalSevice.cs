
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.ClinicalModel_New;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.ClinicalModels.BloodSugarMonitoring;
using DanpheEMR.ServerModel.ClinicalModels.ConsulationRequests;
using DanpheEMR.Services.Clinical_New.DTOs;
using DanpheEMR.Services.NewClinical.DTOs;
using DanpheEMR.Services.NewClinical.DTOs.UserWiseClinicalHeadingAndFields;
using DanpheEMR.Utilities;
using DanpheEMR.ViewModel.Clinical;
using Newtonsoft.Json;
using Serilog;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Migrations;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using DanpheEMR.ServerModel.ClinicalModel_New.ViewModels;

namespace DanpheEMR.Services.NewClinical
{
    public class ClinicalService : INewClinicalService
    {

        public async Task<object> GetICD10List(MasterDbContext _masterDbContext)
        {

            var icdLists = _masterDbContext.ICD10Code
                                           .Where(b => b.Active == true)
                                           .Select(a => new
                                           {
                                               ICD10Id = a.ICD10ID,
                                               ICD10Code = a.ICD10Code,
                                               icd10Description = a.ICD10Description,
                                               Active = a.Active,
                                               IcdVersion = a.IcdVersion
                                           }).ToList();
            return icdLists;
        }
        public async Task<object> GetDepartmentsListAsync(ClinicalDbContext _clinicalDbContext)
        {

            var allDepartmentList = _clinicalDbContext.Departments.ToList();

            return allDepartmentList;
        }
        public object GetBillingDetails(BillingDbContext billingDbContext, int PatientId, int PatientVisitId)
        {


            // var depositDetails = billingDbContext.BillingDeposits.Where(dep => dep.PatientId == PatientId && dep.PatientVisitId == PatientVisitId && dep.IsActive == true).Select(d => d).ToList();
            var depositDetails = billingDbContext.BillingDeposits.Where(dep => dep.PatientId == PatientId && dep.PatientVisitId == PatientVisitId && dep.IsActive).ToList();
            var TotalDepositAdded = depositDetails.Where(dep => dep.TransactionType.ToLower() == ENUM_DepositTransactionType.Deposit.ToLower()).Sum(dep => dep.InAmount);



            var TotalDepositReturned = depositDetails.Where(dep =>
                                dep.TransactionType.ToLower() == ENUM_DepositTransactionType.DepositDeduct.ToLower() || dep.TransactionType.ToLower() == ENUM_DepositTransactionType.ReturnDeposit.ToLower()
                                ).Sum(dep => dep.OutAmount);

            //var DepositTxns = depositDetails.Where(dep => dep.PatientId == PatientId && dep.PatientVisitId==PatientVisitId);
            var PendingBillAmount = billingDbContext.BillingTransactionItems.AsNoTracking().Where(bt =>
                                                                                bt.BillStatus == ENUM_BillingStatus.provisional && bt.PatientId == PatientId && bt.PatientVisitId == PatientVisitId
                                                                                && (bt.IsInsurance == false || bt.IsInsurance == null))
                                                                                .Sum(bt => bt.TotalAmount);

            var GrandTotalDeposit = TotalDepositAdded - TotalDepositReturned;
            var BillingDetails = new { TotalDepositAmount = GrandTotalDeposit, TotalPendingBillAmount = PendingBillAmount };



            return BillingDetails;
        }
        public object GetDischargedPatientsList(ClinicalDbContext _clinicalDbContext, DateTime? FromDate, DateTime? ToDate, string HospitalNumber, int DepartmentId, string FilterStatus, int WardId)

        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@FromDate", FromDate),
                new SqlParameter("@ToDate", ToDate),
                new SqlParameter("@HospitalNumber",HospitalNumber),
                new SqlParameter("@DepartmentId",DepartmentId),
                new SqlParameter("@FilterStatus",FilterStatus),
                new SqlParameter("@WardId",WardId)
            };
            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable dischargedPatientList = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetAllDischargedPatients", paramList, _clinicalDbContext);

            return dischargedPatientList;
        }



        public object GetUserWiseCLinicalField(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, string visitType)
        {
            var DepartmentId = _clinicalDbContext.Employee.FirstOrDefault(p => p.EmployeeId == currentUser.EmployeeId)?.DepartmentId;

            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@EmployeeId", currentUser.EmployeeId),
                new SqlParameter("@DepartmentId",DepartmentId??0),
                new SqlParameter("@VisitType",visitType)


            };
            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable clinicalFields = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetUserWiseClinicalFields", paramList, _clinicalDbContext);
            var clinicalFiledList = ClinicalFieldMapVM.MapDataTableToSingleObject(clinicalFields);

            // Now you can use the parentHeadings list
            //Format Data before returning to the client..
            //Find all  Questions Option Here

            var questionOptions = clinicalFiledList.Where(q => q.QuestionOptionId != 0).GroupBy(qo => new { qo.QuestionId, qo.QuestionOptionId, qo.QuestionOption }).Select(questionoption => new QuestionOption
            {
                QuestionId = questionoption.Key.QuestionId,
                QuestionOptionId = questionoption.Key.QuestionOptionId,
                QuestionOptionText = questionoption.Key.QuestionOption
            }).ToList();

            var fieldOption = clinicalFiledList.Where(f => f.OptionId != 0).GroupBy(fo => new { fo.FieldId, fo.OptionId, fo.Option }).Select(filedOption =>
                new FieldOptions
                {
                    FieldId = filedOption.Key.FieldId,
                    ClinicalOptionId = filedOption.Key.OptionId,
                    Options = filedOption.Key.Option
                }).ToList();
            var questionaryConfig = clinicalFiledList.Where(q => q.QuestionId != 0).GroupBy(qc => new { qc.QuestionId, qc.FieldId, qc.Question, qc.AnswerType }).Select(question => new QuestionaryConfig
            {

                QuestionId = question.Key.QuestionId,
                FieldId = question.Key.FieldId,
                Question = question.Key.Question,
                AnswerType = question.Key.AnswerType,
                Options = questionOptions.Where(p => p.QuestionId == question.Key.QuestionId).ToList()
            }).ToList();

            var field = clinicalFiledList.GroupBy(gp => new { gp.FieldId, gp.FieldName, gp.FieldDisplayName, gp.FieldCode, gp.FieldInputType, gp.ChildHeadingId, gp.IsAcrossVisitAvailability, gp.IsDisplayTitle, gp.FieldDisplaySequence }).Select(fd => new Field
            {
                FieldId = fd.Key.FieldId,
                FieldName = fd.Key.FieldName,
                FieldDisplayName = fd.Key.FieldDisplayName,
                FieldCode = fd.Key.FieldCode,
                InputType = fd.Key.FieldInputType,
                IsAcrossVisitAvailability = fd.Key.IsAcrossVisitAvailability,
                IsDisplayTitle = fd.Key.IsDisplayTitle,
                ClinicalHeadingId = fd.Key.ChildHeadingId,
                FieldDisplaySequence = fd.Key.FieldDisplaySequence,
                Pretemplate = fd.Key.FieldInputType == ENUM_ClinicalField_InputType.SmartTemplate ? fieldOption.FirstOrDefault(p => p.FieldId == fd.Key.FieldId)?.Options : "",
                Options = fieldOption.Where(p => p.FieldId == fd.Key.FieldId).ToList(),
                QuestionaryConfig = questionaryConfig.Where(p => p.FieldId == fd.Key.FieldId).ToList()

            }).ToList();

            var clinicalSubHeading = clinicalFiledList.GroupBy(gp => new { gp.ChildHeadingId, gp.ChildHeading, gp.ChildHeadingDisplayName, gp.ChildHeadingDisplaySeq, gp.ParentClinicalHeadingId, gp.ChildHeadingIsDefault }).Select(cs => new ChildHeading
            {
                ClinicalHeadingId = cs.Key.ChildHeadingId,
                ClinicalHeadingName = cs.Key.ChildHeading,
                DisplayName = cs.Key.ChildHeadingDisplayName,
                DisplayOrder = cs.Key.ChildHeadingDisplaySeq,
                ParentId = cs.Key.ParentClinicalHeadingId,
                IsDefault = cs.Key.ChildHeadingIsDefault ?? false,
                Field = field.Where(p => p.ClinicalHeadingId == cs.Key.ChildHeadingId).OrderBy(p => p.FieldDisplaySequence).ToList()


            }).ToList();

            var parentheading = clinicalFiledList.Where(ph => ph.ParentClinicalHeadingId != null)
                .GroupBy(pg => new { pg.ParentHeading, pg.ParentClinicalHeadingId, pg.ParentHeadingDisplayName, pg.ParentHeadingDisplaySeq, pg.ParentHeadingIsDefault })
             .Select(parent => new ParentHeading_DTO()
             {
                 ClinicalHeadingId = parent.Key.ParentClinicalHeadingId,
                 ClinicalHeadingName = parent.Key.ParentHeading,
                 DisplayName = parent.Key.ParentHeadingDisplayName,
                 DisplayOrder = parent.Key.ParentHeadingDisplaySeq ?? 0,
                 ParentId = parent.Key.ParentClinicalHeadingId,
                 IsDefault = parent.Key.ParentHeadingIsDefault ?? false,
                 ChildHeading = clinicalSubHeading.Where(p => p.ParentId == parent.Key.ParentClinicalHeadingId).OrderBy(s => s.DisplayOrder).ToList(),
                 //Field = field.Where(p => p.ClinicalHeadingId == parent.Key.ClinicalHeadingId).ToList()

             }).OrderBy(p => p.DisplayOrder).ToList();
            return parentheading;
        }

        //Get Clinical Data of Patient by visitId
        public object GetPatientVisitData(RbacUser currentUser, int patientId, int VisitId, int? clinicalHeadingId, ClinicalDbContext _clinicalDbContext)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@PatientId", patientId),
                new SqlParameter("@VisitId", VisitId),
                new SqlParameter("@ClinicalHeadingId",clinicalHeadingId)
            };
            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataSet clinicalDataSet = DALFunctions.GetDatasetFromStoredProc("SP_CLN_GetClinicalData", paramList, _clinicalDbContext);
            DataTable clinicalData = clinicalDataSet.Tables[0];
            DataTable clinicalOption = clinicalDataSet.Tables[1];
            DataTable questions = clinicalDataSet.Tables[2];
            DataTable questionOptions = clinicalDataSet.Tables[3];

            var clinicalDataView = ClinicalDataVM.MapDataTableToJsonData<ClinicalInformationVM>(clinicalData);
            var clinicalOptionView = ClinicalDataVM.MapDataTableToJsonData<ClinicalOptions>(clinicalOption);
            var questionView = ClinicalDataVM.MapDataTableToJsonData<ClinicalQuestionAnswer>(questions);
            var questionOptionView = ClinicalDataVM.MapDataTableToJsonData<ClinicalQuestionOption>(questionOptions);


            var PatientsClinicalData = clinicalDataView.Select(data => new ClinicalData_DTO
            {
                ClinicalInformationId = data.ClinicalInformationId,
                ClinicalHeadingId = data.ClinicalHeadingId,
                FieldId = data.FieldId,
                InputType = data.InputType,
                FieldValue = data.FieldValue,
                Remarks = data.Remarks,
                ClinicalHeadingName = data.ClinicalHeadingName,
                ParentId = data.ParentId,
                HeadingDisplayName = data.HeadingDisplayName,
                FieldCode = data.FieldCode,
                FieldName = data.FieldName,
                FieldDisplayName = data.FieldName,
                CreatedBy = data.CreatedBy,
                CreatedOn = data.CreatedOn,
                EnteredBy = data.EnteredBy,
                PatientId = data.PatientId,
                ClinicalOptionsData = data.InputType == "Multiple Select" || data.InputType == "Single Selection" ? clinicalOptionView.Where(p => p.ClinicalInformationId == data.ClinicalInformationId && p.FieldId == data.FieldId)
                .Select(clno => new ClinicalOptions_DTO
                {
                    ClinicalInformationId = clno.ClinicalInformationId,
                    ClinicalOptionRecordId = clno.ClinicalOptionRecordId,
                    ParentHeadingId = clno.ParentHeadingId,
                    FieldId = clno.FieldId,
                    OptionId = clno.OptionId,
                    Options = clno.Options,
                    EnteredBy = clno.EnteredBy,
                    CreatedBy = data.CreatedBy,
                    CreatedOn = data.CreatedOn
                }).ToList() : null,
                ClinicalAnswerData = data.InputType == ENUM_ClinicalField_InputType.Questionnaire ? questionView.Where(p => p.ClinicalInformationId == data.ClinicalInformationId)
                .Select(ans => new ClinicalQuestionAnswer_DTO
                {
                    ClinicalQuestionAnswerId = ans.ClinicalQuestionAnswerId,
                    ClinicalInformationId = ans.ClinicalInformationId,
                    ClinicalHeadingId = ans.ClinicalHeadingId,
                    ParentHeadingId = ans.ParentHeadingId,
                    FieldId = ans.FieldId,
                    QuestionId = ans.QuestionId,
                    AnswerValue = ans.AnswerValue,
                    Remarks = ans.Remarks,
                    AnswerType = ans.AnswerType,
                    Question = ans.Question,
                    EnteredBy = ans.EnteredBy,
                    CreatedBy = data.CreatedBy,
                    CreatedOn = data.CreatedOn
                }).ToList() : null,

                ClinicalAnswerOptionData = data.InputType == ENUM_ClinicalField_InputType.Questionnaire ? questionOptionView.Where(p => p.ClinicalInformationId == data.ClinicalInformationId)
                .Select(qo => new ClinicalQuestionOption_DTO
                {
                    ClinicalAnswerOptionId = qo.ClinicalAnswerOptionId,
                    ClinicalInformationId = qo.ClinicalInformationId,
                    ClinicalHeadingId = qo.ClinicalHeadingId,
                    ParentHeadingId = qo.ParentHeadingId,
                    FieldId = qo.FieldId,
                    QuestionId = qo.QuestionId,
                    QuestionOptionId = qo.QuestionOptionId,
                    Remarks = qo.Remarks,
                    QuestionOption = qo.QuestionOption,
                    EnteredBy = qo.EnteredBy,
                    CreatedBy = data.CreatedBy,
                    CreatedOn = data.CreatedOn


                }).ToList() : null,


            }).ToList();
            if (PatientsClinicalData.Count > 0)
            {
                //var patientId = PatientsClinicalData[0].PatientId;
                //edit authorization
                if (patientId == 0)
                {
                    Log.Error($"{nameof(patientId)} is zero, unable to get patient visits!");
                    throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get patient visits!");
                }
                var patientVisits = _clinicalDbContext.Visit.Where(visit => visit.PatientId == patientId)
                    .OrderByDescending(visit => visit.VisitDate)
                    .Select(vi => new ClinicalDataVisitList_DTO
                    {
                        VisitCode = vi.VisitCode,
                        VisitDate = vi.VisitDate,
                        PatientVisitId = vi.PatientVisitId,
                        PatientId = vi.PatientId,
                        VisitStatus = vi.VisitStatus,
                        IsClinicalDataEditable = false
                    }).ToList();



                bool isAnyDataEditable = false;
                if (patientVisits.Count > 0)
                {
                    if (!patientVisits[0].VisitStatus.Equals("concluded") && VisitId == patientVisits[0].PatientVisitId)
                    {
                        isAnyDataEditable = true;
                        patientVisits[0].IsClinicalDataEditable = true;

                    }
                }


                if (isAnyDataEditable)//if current visit is latest visit and not concluded
                {
                    List<RbacRole> usrAllRoles = RBAC.GetUserAllRoles(currentUser.UserId);
                    bool isAdmin = usrAllRoles != null && usrAllRoles.Count == 1 && usrAllRoles.Single().IsSysAdmin;
                    if (isAdmin) //if admin then all data are editable
                    {
                        foreach (var data in PatientsClinicalData)
                            data.IsEditable = true;
                    }
                    else //else data created by current user only be editable
                    {
                        foreach (var data in PatientsClinicalData)
                        {
                            if (data.CreatedBy == currentUser.EmployeeId)
                            {
                                data.IsEditable = true;
                            }
                            else
                            {
                                data.IsEditable = false;
                            }
                        }
                    }
                }
                else //all fields are not editable
                {
                    foreach (var data in PatientsClinicalData)
                        data.IsEditable = false;
                }
            }

            return PatientsClinicalData;
        }

        public object PostFormFieldData(RbacUser currentUser, ClinicalDbContext clinicalDbContext, FormFieldData_DTO formFieldData)
        {
            if (formFieldData == null)
            {
                return null;
            }

            using (var transaction = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (formFieldData.textBoxFreeTypeNumber?.Count > 0)
                    {
                        ProcessTextBoxFreeTypeNumber(currentUser, clinicalDbContext, formFieldData.textBoxFreeTypeNumber);
                    }

                    if (formFieldData.singleSelectMultipleSelect?.Count > 0)
                    {
                        ProcessSingleSelectMultipleSelect(currentUser, clinicalDbContext, formFieldData.singleSelectMultipleSelect);
                    }

                    if (formFieldData.questionary?.Count > 0)
                    {
                        ProcessQuestionary(currentUser, clinicalDbContext, formFieldData.questionary);
                    }

                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw;
                }
            }

            return formFieldData;
        }

        private void ProcessTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<TextBoxFreeTypeNumber_DTO> textBoxFreeTypeNumbers)
        {
            foreach (var field in textBoxFreeTypeNumbers)
            {
                if (field.ClinicalInformationId == null || (field.ClinicalInformationId == 0 && !string.IsNullOrEmpty(field.FieldValue)))
                {
                    var clinicalInformation = CreateClinicalInformation(currentUser, field);
                    clinicalDbContext.ClinicalInformations.Add(clinicalInformation);
                    clinicalDbContext.SaveChanges();
                }
            }
        }

        private void ProcessSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<SingleSelectMultipleSelect_DTO> singleSelectMultipleSelects)
        {
            foreach (var field in singleSelectMultipleSelects)
            {
                if (field.ClinicalInformationId == null || field.ClinicalInformationId == 0)
                {
                    var clinicalInformation = CreateClinicalInformation(currentUser, field);
                    clinicalInformation.ClinicalOptionRecords = field.OptionAnswers?.Select(fieldOption => new ClinicalOptionRecordsModel
                    {
                        PatientId = field.PatientId,
                        PatientVisitId = field.PatientVisitId,
                        ClinicalHeadingId = field.ClinicalHeadingId,
                        ParentHeadingId = field.ParentHeadingId,
                        FieldId = field.FieldId,
                        OptionId = fieldOption.OptionId,
                        CreatedOn = DateTime.Now,
                        CreatedBy = currentUser.EmployeeId,
                        IsActive = true
                    }).ToList();

                    if (clinicalInformation.ClinicalOptionRecords?.Count > 0)
                    {
                        clinicalDbContext.ClinicalInformations.Add(clinicalInformation);
                        clinicalDbContext.SaveChanges();
                    }
                }
            }
        }

        private void ProcessQuestionary(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<Questionary_DTO> questionaries)
        {
            foreach (var questionary in questionaries)
            {
                var clinicalInformation = CreateClinicalInformation(currentUser, questionary);

                if (questionary.QuestionaryData.textBoxFreeTypeNumber?.Count > 0)
                {
                    clinicalInformation.ClinicalQuestionAnswers = questionary.QuestionaryData.textBoxFreeTypeNumber
                        .Where(answer => !string.IsNullOrEmpty(answer.AnswerValue))
                        .Select(answer => new ClinicalQuestionAnswersModel
                        {
                            PatientId = questionary.PatientId,
                            PatientVisitId = questionary.PatientVisitId,
                            ClinicalHeadingId = questionary.ClinicalHeadingId,
                            ParentHeadingId = questionary.ParentHeadingId,
                            FieldId = questionary.FieldId,
                            QuestionId = answer.QuestionId,
                            AnswerValue = answer.AnswerValue,
                            Remarks = answer.Remarks,
                            CreatedOn = DateTime.Now,
                            CreatedBy = currentUser.EmployeeId,
                            IsActive = true
                        }).ToList();

                }

                if (questionary.QuestionaryData.singleSelectMultipleSelect?.Count > 0)
                {
                    clinicalInformation.ClinicalAnswerOptions = questionary.QuestionaryData.singleSelectMultipleSelect
                        .SelectMany(option => option.OptionAnswers?.Select(answerOption => new ClinicalAnswerOptionsModel
                        {
                            PatientId = questionary.PatientId,
                            PatientVisitId = questionary.PatientVisitId,
                            ClinicalHeadingId = questionary.ClinicalHeadingId,
                            ParentHeadingId = questionary.ParentHeadingId,
                            FieldId = questionary.FieldId,
                            QuestionId = option.QuestionId,
                            QuestionOptionId = answerOption.QuestionOptionId,
                            Remarks = option.Remarks,
                            CreatedOn = DateTime.Now,
                            CreatedBy = currentUser.EmployeeId,
                            IsActive = true
                        })).ToList();

                }

                if (clinicalInformation.ClinicalQuestionAnswers?.Count > 0 || clinicalInformation.ClinicalAnswerOptions?.Count > 0)
                {
                    clinicalDbContext.ClinicalInformations.Add(clinicalInformation);
                    clinicalDbContext.SaveChanges();
                }
            }
        }

        private ClinicalInformationsModel CreateClinicalInformation(RbacUser currentUser, dynamic field)
        {
            return new ClinicalInformationsModel
            {
                PatientId = field.PatientId,
                PatientVisitId = field.PatientVisitId,
                ClinicalHeadingId = field.ClinicalHeadingId,
                ParentHeadingId = field.ParentHeadingId,
                FieldId = field.FieldId,
                InputType = field.InputType,
                FieldValue = field.FieldValue,
                Remarks = field.Remarks,
                CreatedOn = DateTime.Now,
                CreatedBy = currentUser.EmployeeId,
                IsActive = true
            };
        }

        public object PutFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PutTextBoxFreeTypeNumber_DTO field)
        {
            using (var transaction = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    var clinicalInformation = field.ClinicalInformationId != null && field.ClinicalInformationId > 0
                        ? clinicalDbContext.ClinicalInformations.Find(field.ClinicalInformationId)
                        : null;

                    if (clinicalInformation != null && !string.IsNullOrEmpty(field.FieldValue))
                    {
                        UpdateClinicalInformation(currentUser, clinicalInformation, field);
                        clinicalDbContext.SaveChanges();
                    }

                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw;
                }
            }

            return field;
        }

        public object DeleteFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, DeleteTextBoxFreeTypeNumber_DTO field)
        {
            using (var transaction = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    var clinicalInformation = field.ClinicalInformationId != null && field.ClinicalInformationId > 0
                        ? clinicalDbContext.ClinicalInformations.Find(field.ClinicalInformationId)
                        : null;

                    clinicalInformation.IsActive = false;
                    clinicalDbContext.SaveChanges();

                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw;
                }
            }

            return field;
        }


        public object PutFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PutSingleSelectMultipleSelect_DTO field)
        {
            List<ClinicalOptions_DTO> result = null;
            using (var transaction = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    var clinicalInformation = field.ClinicalInformationId != null && field.ClinicalInformationId > 0
                        ? clinicalDbContext.ClinicalInformations.Include(ci => ci.ClinicalOptionRecords).FirstOrDefault(ci => ci.ClinicalInformationId == field.ClinicalInformationId)
                        : null;

                    if (clinicalInformation != null)
                    {
                        UpdateClinicalInformation(currentUser, clinicalInformation, field);

                        // Detach existing ClinicalOptionRecords before clearing them
                        foreach (var record in clinicalInformation.ClinicalOptionRecords.ToList())
                        {
                            clinicalDbContext.Entry(record).State = EntityState.Deleted;
                        }


                        var optionRecords = field.OptionAnswers?.Select(fieldOption => new ClinicalOptionRecordsModel
                        {
                            PatientId = clinicalInformation.PatientId,
                            PatientVisitId = clinicalInformation.PatientVisitId,
                            ClinicalHeadingId = clinicalInformation.ClinicalHeadingId,
                            ParentHeadingId = clinicalInformation.ParentHeadingId,
                            FieldId = clinicalInformation.FieldId,
                            OptionId = fieldOption.OptionId,
                            CreatedOn = DateTime.Now,
                            CreatedBy = currentUser.EmployeeId,
                            IsActive = true
                        }).ToList();

                        // Add each record individually to the collection
                        foreach (var optionRecord in optionRecords)
                        {
                            clinicalInformation.ClinicalOptionRecords.Add(optionRecord);
                        }

                        clinicalDbContext.SaveChanges();

                        transaction.Commit();

                        result = optionRecords.Select(option => new ClinicalOptions_DTO()
                        {

                            ClinicalOptionRecordId = option.ClinicalOptionRecordId,
                            ClinicalInformationId = option.ClinicalInformationId,
                            ParentHeadingId = option.ParentHeadingId,
                            FieldId = option.FieldId,
                            OptionId = option.OptionId,
                            Options = null,

                            PatientId = option.PatientId,
                            PatientVisitId = option.PatientVisitId,
                            CreatedOn = option.CreatedOn,
                            CreatedBy = option.CreatedBy,
                            ModifiedOn = option.ModifiedOn,
                            ModifiedBy = option.ModifiedBy
                        }).ToList();
                    }
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw;
                }
            }

            return result;
        }


        public object DeleteFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<int> options)
        {
            List<ClinicalOptions_DTO> result = null;
            try
            {

                if (options == null || options?.Count < 1)
                    throw new ArgumentNullException();

                var records = clinicalDbContext
                    .ClinicalOptionRecords.Where(opt => options.Contains(opt.ClinicalOptionRecordId))
                    .ToList();

                foreach (var record in records)
                    record.IsActive = false;

                clinicalDbContext.SaveChanges();

            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred: {ex.Message}");
                throw;
            }


            return result;
        }



        public object PutQFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, QTextBoxFreeTypeNumber_DTO field)
        {


            using (var transaction = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    var clinicalInformation = field.ClinicalInformationId != null && field.ClinicalInformationId > 0
                        ? clinicalDbContext.ClinicalInformations.Include(ci => ci.ClinicalQuestionAnswers).FirstOrDefault(ci => ci.ClinicalInformationId == field.ClinicalInformationId)
                        : null;
                    var questionAnswer = clinicalInformation.ClinicalQuestionAnswers
                        .FirstOrDefault(ci => ci.ClinicalQuestionAnswerId == field.TextBoxFreeTypeNumberData.ClinicalQuestionAnswerId);
                    if (questionAnswer != null)
                    {
                        questionAnswer.ModifiedOn = DateTime.Now;
                        questionAnswer.ModifiedBy = currentUser.EmployeeId;
                        questionAnswer.Remarks = field.TextBoxFreeTypeNumberData.Remarks;
                        questionAnswer.AnswerValue = field.TextBoxFreeTypeNumberData.AnswerValue;
                    }
                    else
                    {
                        Log.Error($"No answers provided.");
                        throw new InvalidOperationException("No answers provided.");
                    }
                    clinicalDbContext.SaveChanges();

                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw;
                }
            }

            return field;


        }


        public object DeleteQFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, int id)
        {

            try
            {
                var questionAnswer = clinicalDbContext.ClinicalQuestionAnswers
                    .FirstOrDefault(ci => ci.ClinicalQuestionAnswerId == id);
                if (questionAnswer != null)
                {
                    questionAnswer.IsActive = false;
                }
                else
                {
                    Log.Error($"No answers exists.");
                    throw new InvalidOperationException("No answers exists.");
                }
                clinicalDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred: {ex.Message}");
                throw;
            }


            return id;


        }


        public object PutQFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, QSingleSelectMultipleSelect_DTO field)
        {
            List<ClinicalQuestionOption_DTO> result = null;
            using (var transaction = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    var clinicalInformation = field.ClinicalInformationId != null && field.ClinicalInformationId > 0
                        ? clinicalDbContext.ClinicalInformations.Include(ci => ci.ClinicalAnswerOptions).FirstOrDefault(ci => ci.ClinicalInformationId == field.ClinicalInformationId)
                        : null;

                    if (clinicalInformation != null)
                    {

                        var questionOptions = clinicalInformation.ClinicalAnswerOptions
                            .Where(ci => ci.QuestionId == field.QuestionarySingleSelectMultipleSelectData.QuestionId).ToList();


                        clinicalDbContext.ClinicalAnswerOptions.RemoveRange(questionOptions);

                        if (!(field.QuestionarySingleSelectMultipleSelectData.OptionAnswers.Count() > 0))
                        {
                            Log.Error($"No option answers provided.");
                            throw new InvalidOperationException("No option answers provided.");
                        }
                        var ansOpts = field.QuestionarySingleSelectMultipleSelectData.OptionAnswers?.Select(answerOption => new ClinicalAnswerOptionsModel
                        {
                            PatientId = clinicalInformation.PatientId,
                            PatientVisitId = clinicalInformation.PatientVisitId,
                            ClinicalHeadingId = clinicalInformation.ClinicalHeadingId,
                            ParentHeadingId = clinicalInformation.ParentHeadingId,
                            FieldId = clinicalInformation.FieldId,
                            QuestionId = field.QuestionarySingleSelectMultipleSelectData.QuestionId,
                            QuestionOptionId = answerOption.QuestionOptionId,
                            Remarks = field.QuestionarySingleSelectMultipleSelectData.Remarks,
                            CreatedOn = DateTime.Now,
                            CreatedBy = currentUser.EmployeeId,
                            IsActive = true
                        }).ToList();


                        foreach (var ansOpt in ansOpts)
                        {
                            clinicalInformation.ClinicalAnswerOptions.Add(ansOpt);
                        }

                        clinicalDbContext.SaveChanges();
                        transaction.Commit();

                        result = ansOpts.Select(option => new ClinicalQuestionOption_DTO()
                        {
                            PatientId = option.PatientId,
                            PatientVisitId = option.PatientVisitId,
                            CreatedOn = option.CreatedOn,
                            CreatedBy = option.CreatedBy,
                            ModifiedOn = option.ModifiedOn,
                            ModifiedBy = option.ModifiedBy,
                            ClinicalAnswerOptionId = option.ClinicalAnswerOptionId,
                            ClinicalInformationId = option.ClinicalInformationId,
                            ClinicalHeadingId = option.ClinicalHeadingId,
                            ParentHeadingId = option.ParentHeadingId,
                            FieldId = option.FieldId,
                            QuestionId = option.QuestionId,
                            QuestionOptionId = option.QuestionOptionId,
                            Remarks = option.Remarks,
                            QuestionOption = null,
                            EnteredBy = currentUser.UserName
                        }).ToList();

                    }
                    else
                    {
                        Log.Error($"Clinical Information not found or invalid Clinical Information Id");

                        throw new InvalidOperationException("Clinical Information not found or invalid Clinical Information Id.");
                    }
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    Log.Error($"An error occurred: {ex.Message}");
                    throw;
                }
            }

            return result;
        }


        public object DeleteQFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<int> options)
        {
            List<ClinicalOptions_DTO> result = null;
            try
            {

                if (options == null || options?.Count < 1)
                    throw new ArgumentNullException();

                var records = clinicalDbContext
                    .ClinicalAnswerOptions.Where(opt => options.Contains(opt.ClinicalAnswerOptionId))
                    .ToList();

                foreach (var record in records)
                    record.IsActive = false;

                clinicalDbContext.SaveChanges();

            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred: {ex.Message}");
                throw;
            }


            return result;

        }




        private void UpdateClinicalInformation(RbacUser currentUser, ClinicalInformationsModel clinicalInformation, dynamic field)
        {
            //clinicalInformation.PatientId = field.PatientId;
            //clinicalInformation.PatientVisitId = field.PatientVisitId;
            //clinicalInformation.ClinicalHeadingId = field.ClinicalHeadingId;
            //clinicalInformation.ParentHeadingId = field.ParentHeadingId;
            //clinicalInformation.FieldId = field.FieldId;
            //clinicalInformation.InputType = field.InputType;
            clinicalInformation.FieldValue = field.FieldValue;
            clinicalInformation.Remarks = field.Remarks;
            clinicalInformation.ModifiedOn = DateTime.Now;
            clinicalInformation.ModifiedBy = currentUser.EmployeeId;
            clinicalInformation.IsActive = true;
        }

        public object AddInputOutput(RbacUser currentUser, PostIntakeOutput_DTO inputOutputModelData, ClinicalDbContext _clinicalDbContext)
        {
            if (inputOutputModelData == null)
            {
                Log.Error($"Nothing to save as  {nameof(inputOutputModelData)} is null.");
                throw new ArgumentNullException($"Nothing to save as {nameof(inputOutputModelData)} is null.");
            }

            var inputOutput = new InputOutputModel
            {
                PatientVisitId = inputOutputModelData.PatientVisitId,
                InputOutputParameterMainId = inputOutputModelData.InputOutputParameterMainId,
                InputOutputParameterChildId = inputOutputModelData.InputOutputParameterChildId,
                IntakeOutputValue = inputOutputModelData.IntakeOutputValue,
                Unit = inputOutputModelData.Unit,
                IntakeOutputType = inputOutputModelData.IntakeOutputType,
                Contents = inputOutputModelData.Contents,
                Remarks = inputOutputModelData.Remarks,
                CreatedBy = currentUser.EmployeeId,
                CreatedOn = DateTime.Now,
                IsActive = true
            };

            _clinicalDbContext.InputOutput.Add(inputOutput);
            _clinicalDbContext.SaveChanges();

            return inputOutput;
        }

        List<IntakeOutputView_DTO> INewClinicalService.GetClinicalIntakeOutput(int patientVisitId, int patientId, bool isAcrossVisitAvailability, DateTime? fromDate, DateTime? toDate, ClinicalDbContext _clinicalDbContext)
        {
            if (!fromDate.HasValue && !toDate.HasValue)
            {
                fromDate = DateTime.Today;
                toDate = DateTime.Today.AddDays(1);
            }

            var ioQuery = (from io in _clinicalDbContext.InputOutput
                           join paramMain in _clinicalDbContext.ClinicalIntakeOutputParameters
                           on io.InputOutputParameterMainId equals paramMain.IntakeOutputId into mainGroup
                           from paramMain in mainGroup.DefaultIfEmpty()
                           join paramChild in _clinicalDbContext.ClinicalIntakeOutputParameters
                           on io.InputOutputParameterChildId equals paramChild.IntakeOutputId into childGroup
                           from paramChild in childGroup.DefaultIfEmpty()

                           join patientVisit in _clinicalDbContext.Visit
                           on io.PatientVisitId equals patientVisit.PatientVisitId

                           where io.IsActive == true && (isAcrossVisitAvailability
                                  ? patientVisit.PatientId == patientId
                                  : io.PatientVisitId == patientVisitId) &&
                                 DbFunctions.TruncateTime(io.CreatedOn) >= DbFunctions.TruncateTime(fromDate.Value) &&
                                 DbFunctions.TruncateTime(io.CreatedOn) < DbFunctions.AddDays(DbFunctions.TruncateTime(toDate.Value), 1)
                           select new IntakeOutputView_DTO
                           {
                               InputOutputId = io.InputOutputId,
                               PatientVisitId = io.PatientVisitId,
                               InputOutputParameterMainId = io.InputOutputParameterMainId,
                               InputOutputParameterChildId = io.InputOutputParameterChildId,
                               IntakeOutputValue = io.IntakeOutputValue,
                               Unit = io.Unit,
                               IntakeOutputType = io.IntakeOutputType,
                               CreatedBy = io.CreatedBy,
                               ModifiedBy = io.ModifiedBy,
                               CreatedOn = io.CreatedOn,
                               ModifiedOn = io.ModifiedOn,
                               Contents = io.Contents,
                               Remarks = io.Remarks,
                               // Include Parameter Values
                               ParameterMainValue = paramMain.ParameterValue,
                               ParameterChildValue = paramChild.ParameterValue
                           }).ToList();
            return ioQuery;
        }

        public List<ClinicalIntakeOutputParameterModel> GetClinicalIntakeOutputParameter(ClinicalDbContext _clinicalDbContext)
        {
            var parameterList = _clinicalDbContext.ClinicalIntakeOutputParameters
                                    .Where(p => p.IsActive)
                                    .ToList();

            return parameterList;
        }



        public object GetIsAppointmentApplicableDoctorsList(ClinicalDbContext _clinicalDbContext)
        {

            var apptDoctors = (from emp in _clinicalDbContext.Employee.Where(e => e.IsActive == true && e.IsAppointmentApplicable == true)
                               .OrderBy(e => e.FullName)
                               select new AdmittingDoctorDTO
                               {
                                   EmployeeId = emp.EmployeeId,
                                   FullName = emp.FullName,
                                   DepartmentId = emp.DepartmentId

                               }).ToList();

            return apptDoctors;
        }

        public object GetDepartmentsList(ClinicalDbContext _clinicalDbContext)
        {
            var departments = (from dept in _clinicalDbContext.Departments.Where(e => e.IsActive == true && e.IsAppointmentApplicable)
                               .OrderBy(e => e.DepartmentName)

                               select new DepartmentDTO
                               {
                                   DepartmentId = dept.DepartmentId,
                                   DepartmentName = dept.DepartmentName
                               });
            return departments;
        }

        public object GetAdmittedPatientsList(ClinicalDbContext _clinicalDbContext, int DepartmentId, int AdmittngDoctorId, int WardId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@DepartmentId", DepartmentId),
                new SqlParameter("@AdmittngDoctorId", AdmittngDoctorId),
                new SqlParameter("@WardId",WardId)
            };

            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable dischargedPatientList = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetAllAdmittedPatients", paramList, _clinicalDbContext);

            return dischargedPatientList;
        }

        public object GetPatientVisitsList(ClinicalDbContext _clinicalDbContext, string HospitalNumber, Boolean IsHospitalNoSearch, int? DepartmentId, int? DoctorId, DateTime? FromDate, DateTime? ToDate)
        {

            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@HospitalNumber", HospitalNumber),
                new SqlParameter("@IsHospitalNoSearch",IsHospitalNoSearch),
                new SqlParameter("@DepartmentId", DepartmentId),
                new SqlParameter("@DoctorId", DoctorId),
                new SqlParameter("@FromDate", FromDate),
                new SqlParameter("@ToDate", ToDate),

            };

            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable patientVisitsList = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetPatientVisits", paramList, _clinicalDbContext);

            return patientVisitsList;
        }




        #region Get

        public object GetMSTVitals(ClinicalDbContext _clinicalDbContext)
        {
            try
            {
                List<ClinicalVitalsModel> mstVitals = (from vital in _clinicalDbContext.VitalsNew
                                                       where vital.IsActive == true
                                                       select vital)
                                                       .ToList();
                return mstVitals;
            }
            catch (Exception ex)
            {
                Log.Error($"Unable to get mst vitals!");
                throw new InvalidOperationException($"Unable to get mst vitals!");
            }
        }

        public object GetVitals(int patientId, int patientVisitId, bool isAcrossVisitAvailability, ClinicalDbContext _clinicalDbContext)
        {
            if (patientId == 0 || patientVisitId == 0)
            {
                if (patientId == 0 && patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get vitals!");
                }
                else if (patientId == 0)
                {
                    Log.Error($"{nameof(patientId)} is zero, unable to get vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get vitals!");
                }
                else if (patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get vitals!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get vitals!");
                }
            }
            try
            {
                List<GetClicnicalTransaction_DTO> vitals = (from vital in _clinicalDbContext.VitalsTransactionNew
                                                            where (isAcrossVisitAvailability
                                                                ? vital.PatientId == patientId
                                                                : vital.PatientVisitId == patientVisitId)
                                                            join mstVital in _clinicalDbContext.VitalsNew on vital.VitalsId equals mstVital.VitalsId
                                                            where mstVital.IsActive == true
                                                            select new GetClicnicalTransaction_DTO
                                                            {
                                                                TxnVitalsId = vital.VitalsId,
                                                                PatientId = vital.PatientId,
                                                                PatientVisitId = vital.PatientVisitId,
                                                                VitalsId = vital.VitalsId,
                                                                VitalsValue = vital.VitalsValue,
                                                                Unit = vital.Unit,
                                                                OtherVariable = vital.OtherVariable,
                                                                Remarks = vital.Remarks,
                                                                CreatedBy = vital.CreatedBy,
                                                                CreatedOn = vital.CreatedOn,
                                                                ModifiedOn = vital.ModifiedOn,
                                                                ModifiedBy = vital.ModifiedBy,
                                                                IsActive = vital.IsActive,
                                                                VitalsGroup = mstVital.VitalsGroup,
                                                                DisplayOrder = mstVital.DisplayOrder,
                                                                VitalsType = mstVital.VitalsType,
                                                                InputType = mstVital.InputType,
                                                                VitalsName = mstVital.VitalsName
                                                            })
                                                               .ToList();
                return vitals;
            }
            catch (Exception ex)
            {
                Log.Error($"Unable to get vitals for the PatientId:{patientId} and PatientVisitId:{patientVisitId}!");
                throw new InvalidOperationException($"Unable to get vitals for the PatientId:{patientId} and PatientVisitId:{patientVisitId}!");
            }
        }

        public object GetPatientLatestVitals(int patientId, int patientVisitId, ClinicalDbContext _clinicalDbContext)
        {
            if (patientId == 0 || patientVisitId == 0)
            {
                if (patientId == 0 && patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get latest vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get latest vitals!");
                }
                else if (patientId == 0)
                {
                    Log.Error($"{nameof(patientId)} is zero, unable to get vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get latest vitals!");
                }
                else if (patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get vitals!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get latest vitals!");
                }
            }
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@PatientId", patientId),
                new SqlParameter("@PatientVisitId",patientVisitId)
            };
            DataTable patientLatesVitals = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetPatientLatestVitals", paramList, _clinicalDbContext);

            return patientLatesVitals;
        }

        public object GetPatientVitalsForTPRGraph(int patientId, int patientVisitId, bool isAcrossVisitAvailability, int noOfDays, ClinicalDbContext _clinicalDbContext)
        {
            if (patientId == 0 || patientVisitId == 0)
            {
                if (patientId == 0 && patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get patient vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get patient vitals!");
                }
                else if (patientId == 0)
                {
                    Log.Error($"{nameof(patientId)} is zero, unable to get patient vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get patient vitals!");
                }
                else if (patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get patient vitals!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get patient vitals!");
                }
            }
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@PatientId", patientId),
                new SqlParameter("@PatientVisitId", patientVisitId),
                new SqlParameter("@IsAcrossVisitAvailability", isAcrossVisitAvailability),
                new SqlParameter("@NoOfDays",noOfDays)
            };
            DataTable patientVitals = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetPatientVitalsForTPRGraph", paramList, _clinicalDbContext);

            return patientVitals;
        }
        public object GetOutputDetailsByPatientVisitId(int patientVisitId, int patientId, bool isAcrossVisitAvailability, int noOfDays, ClinicalDbContext _clinicalDbContext)
        {
            if (patientVisitId == 0)
            {
                Log.Error($"{nameof(patientVisitId)} is zero, unable to get patient output!");
                throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get patient output!");
            }
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@PatientVisitId",patientVisitId),
                new SqlParameter("@PatientId", patientId),
                new SqlParameter("@IsAcrossVisitAvailability", isAcrossVisitAvailability),
                new SqlParameter("@NoOfDays",noOfDays)
            };
            DataTable patientOutput = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetPatientOutput", paramList, _clinicalDbContext);

            return patientOutput;
        }

        public object GetTemplateByTemplateCode(string templateCode, int patientVisitId, int patientId, ClinicalDbContext _clinicalDbContext)
        {
            if (String.IsNullOrEmpty(templateCode) || patientVisitId == 0)
            {
                if (String.IsNullOrEmpty(templateCode) && patientVisitId == 0)
                {
                    Log.Error($"{nameof(templateCode)} is null & {nameof(patientVisitId)} is zero!");
                    throw new InvalidOperationException($"{nameof(templateCode)} is null & {nameof(patientVisitId)} is zero!");
                }
                else if (String.IsNullOrEmpty(templateCode))
                {
                    Log.Error($"{nameof(templateCode)} is null, unable to get template!");
                    throw new InvalidOperationException($"{nameof(templateCode)} is null, unable to get template!");
                }
                else if (patientVisitId == 0 && patientId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get SmartPrintableFormVariables!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get SmartPrintableFormVariables!");
                }
            }

            ClinicalTemplatesModel template = (from temp in _clinicalDbContext.ClinicalTemplates
                                               where temp.TemplateCode == templateCode && temp.IsActive == true
                                               select temp).FirstOrDefault();

            if (template != null)
            {
                List<SqlParameter> paramList = new List<SqlParameter>(){
            new SqlParameter("@PatientVisitId", patientVisitId),
            new SqlParameter("@PatientId", patientId),
        };
                //get first vital record
                if (templateCode == ENUM_ClinicalSmartPrintableCodes.FirstVitals)
                {
                    DataTable dtSmartPrintableFormVariables = DALFunctions.GetDataTableFromStoredProc("SP_CLN_Vitals_First_SmartPrintableFormVariables", paramList, _clinicalDbContext);
                    var smartPrintableVitalFormVariables = SmartPrintableFormVitalVariablesViewModel.MapDataTableToList(dtSmartPrintableFormVariables);
                    template.TemplateHTML = BuildVitalsTemplate(template.TemplateHTML, smartPrintableVitalFormVariables, templateCode);

                }
                //get last vitals record
                else if (templateCode == ENUM_ClinicalSmartPrintableCodes.LastVitals)
                {
                    DataTable dtSmartPrintableFormVariables = DALFunctions.GetDataTableFromStoredProc("SP_CLN_Vitals_Last_SmartPrintableFormVariables", paramList, _clinicalDbContext);
                    var smartPrintableVitalFormVariables = SmartPrintableFormVitalVariablesViewModel.MapDataTableToList(dtSmartPrintableFormVariables);
                    template.TemplateHTML = BuildVitalsTemplate(template.TemplateHTML, smartPrintableVitalFormVariables, templateCode);
                }
                //get all vitals records
                else if (templateCode == ENUM_ClinicalSmartPrintableCodes.AllVitals)
                {
                    DataTable dtSmartPrintableFormVariables = DALFunctions.GetDataTableFromStoredProc("SP_CLN_Vitals_SmartPrintableFormVariables", paramList, _clinicalDbContext);
                    var smartPrintableVitalFormVariables = SmartPrintableFormVitalVariablesViewModel.MapDataTableToList(dtSmartPrintableFormVariables);
                    template.TemplateHTML = BuildVitalsTemplate(template.TemplateHTML, smartPrintableVitalFormVariables, templateCode);
                }
                else
                {
                    DataTable dtSmartPrintableFormVariables = DALFunctions.GetDataTableFromStoredProc("SP_CLN_SmartPrintableFormVariables", paramList, _clinicalDbContext);
                    var smartPrintableFormVariables = SmartPrintableFormVariablesViewModel.MapDataTableToSingleObject(dtSmartPrintableFormVariables);
                    NepaliDateType nCurrentDate = DanpheDateConvertor.ConvertEngToNepDate(DateTime.Now);

                    if (nCurrentDate != null)
                    {
                        smartPrintableFormVariables.CurrentNepaliDate = $"{nCurrentDate.Year}-{nCurrentDate.Month}-{nCurrentDate.Day}";
                    }

                    UpdateSmartPrintableFormVariableDates(smartPrintableFormVariables);
                    //var parm = _clinicalDbContext.CFGParameters.Where(a => a.ParameterGroupName == "Patient" && a.ParameterName == "PatientFileLocationPath").FirstOrDefault();
                    var parm = _clinicalDbContext.CFGParameters.Where(a => a.ParameterGroupName == "Patient" && a.ParameterName == "PatientProfilePicImageUploadLocation").FirstOrDefault();
                    if(parm!=null)
                    {
                        var patientFilePath = parm.ParameterValue;
                        if (!string.IsNullOrEmpty(smartPrintableFormVariables.PatientFileName))
                        {
                            smartPrintableFormVariables.PatientFileName = SmartPrintableFormVariablesViewModel.ConvertToBase64Image(patientFilePath + '/' + smartPrintableFormVariables.PatientFileName);
                        }
                    }

                    template.TemplateHTML = BuildSmartTemplate(template.TemplateHTML, smartPrintableFormVariables);
                }

                return template;
            }
            else
            {
                throw new Exception("Template Not Found.");
            }
        }
        //Is used for create returnable vitals template
        private string BuildVitalsTemplate(string templateHtml, List<SmartPrintableFormVitalVariablesViewModel> smartPrintableVitalFormVariables, string code)
        {

            var stringBuilder = new StringBuilder(templateHtml);
            var tableRows = new StringBuilder();
            if (code == ENUM_ClinicalSmartPrintableCodes.FirstVitals || code == ENUM_ClinicalSmartPrintableCodes.LastVitals)
            {
                foreach (var vital in smartPrintableVitalFormVariables)
                {

                    if (vital.VitalsValue != null)
                    {
                        var repeatString = new StringBuilder(templateHtml);
                        repeatString.Replace("{VitalsType}", vital.VitalsType);
                        repeatString.Replace("{VitalsName}", vital.VitalsName);
                        repeatString.Replace("{Unit}", vital.Unit);
                        repeatString.Replace("{VitalsGroup}", vital.VitalsGroup);
                        repeatString.Replace("{VitalsValue}", vital.VitalsValue);
                        repeatString.Replace("{Remarks}", vital.Remarks);
                        tableRows.Append(repeatString);
                    }
                }
                stringBuilder = tableRows;
            }
            return stringBuilder.ToString();
        }
        private void UpdateSmartPrintableFormVariableDates(SmartPrintableFormVariablesViewModel smartPrintableFormVariables)
        {
            smartPrintableFormVariables.VisitNepaliDate = GetNepaliDate(smartPrintableFormVariables.VisitDate);
            smartPrintableFormVariables.AdmissionNepaliDate = GetNepaliDate(smartPrintableFormVariables.AdmissionDate);
            smartPrintableFormVariables.DischargeNepaliDate = GetNepaliDate(smartPrintableFormVariables.DischargeDate);
            smartPrintableFormVariables.DeathNepaliDate = GetNepaliDate(smartPrintableFormVariables.DeathDate);
        }

        private string GetNepaliDate(string date)
        {
            if (!String.IsNullOrEmpty(date))
            {
                NepaliDateType nepDate = DanpheDateConvertor.ConvertEngToNepDate(DateTime.Parse(date));
                if (nepDate != null)
                {
                    return $"{nepDate.Year}-{nepDate.Month}-{nepDate.Day}";
                }
            }
            return null;
        }

        public static string BuildSmartTemplate(string templateHtml, SmartPrintableFormVariablesViewModel smartPrintableFormVariables)
        {
            var stringBuilder = new StringBuilder(templateHtml);

            var properties = smartPrintableFormVariables.GetType().GetProperties();
            var barCodeData = "";
            var barCodeGenerator = new BarcodeQrCodeHelper();
            barCodeData = barCodeGenerator.GenerateQrBarCode("BarCode", smartPrintableFormVariables.PatientCode);
            foreach (var property in properties)
            {
                stringBuilder.Replace("{" + property.Name + "}", property.GetValue(smartPrintableFormVariables)?.ToString() ?? string.Empty);
            }
            stringBuilder.Replace("{QrBarCode}", $"src=data:image/png;base64,{barCodeData}");
            return stringBuilder.ToString();
        }

        #endregion



        #region Post

        public object AddVitals(List<ClinicalVitalsTransaction_DTO> vitals, RbacUser currentUser, ClinicalDbContext _clinicalDbContext)
        {
            if (vitals.Count == 0)
            {
                Log.Error($"{nameof(vitals)} is null, can't add vitals!");
                throw new InvalidOperationException($"Either {nameof(vitals)} is null, can't add vitals!");
            }
            using (DbContextTransaction dbContextTransaction = _clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    DateTime currentDateTime = DateTime.Now;
                    foreach (var vital in vitals)
                    {
                        _clinicalDbContext.VitalsTransactionNew.Add(new ClinicalVitalsTransactionModel
                        {
                            PatientId = vital.PatientId,
                            PatientVisitId = vital.PatientVisitId,
                            VitalsId = vital.VitalsId,
                            VitalsValue = !string.IsNullOrWhiteSpace(vital.VitalsValue) ? vital.VitalsValue : null,
                            Unit = vital.Unit,
                            OtherVariable = vital.OtherVariable,
                            Remarks = vital.Remarks,
                            IsActive = vital.IsActive,
                            CreatedBy = currentUser.EmployeeId,
                            CreatedOn = currentDateTime
                        });
                    }
                    _clinicalDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    Log.Information($"Commit successful. New vitals added!");
                    return ($"Commit successful. New vitals added!");
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"Rollback Successful. Unable to add vitals!");
                    throw new Exception($"Rollback Successful. Unable to add vitals!");
                }
            }
        }
        #endregion
        #region Put
        #endregion


        public object GetFrequencyDisplayName(ClinicalDbContext _clinicalDbContext)
        {
            var clinicalTemplates = _clinicalDbContext.MedicationFrequencyStandards
                                        .Where(standard => standard.IsActive)
                                        .ToList();
            return clinicalTemplates;
        }
        public object GetMedicationIntake(ClinicalDbContext _clinicalDbContext)
        {
            var clinicalIntake = _clinicalDbContext.MedicationIntakes
                .Where(standard=> standard.IsActive)
                .ToList();
            return clinicalIntake;
        }
        public object GetInvestigationResults(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, DateTime? fromDate, DateTime? toDate, string labTestIds, bool isAcrossVisitAvailability,int? TestCount)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                         new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                         new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                         new SqlParameter("@PatientId", patientId),
                         new SqlParameter("@PatientVisitId", patientVisitId),
                         new SqlParameter("@LabTestIds", labTestIds ?? (object)DBNull.Value),
                         new SqlParameter("@IsAcrossVisitAvailability", isAcrossVisitAvailability),
                         new SqlParameter("@TestCount", TestCount ?? (object)DBNull.Value)
                    };
            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable investigationResults = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetPatientInvestigationResults", paramList, clinicalDbContext);

            return investigationResults;
        }

        public object GetLabTestsList(ClinicalDbContext _clinicalDbContext)
        {
            var labtests = (from lab in _clinicalDbContext.LabTests.Where(e => e.IsActive == true)
                              .OrderBy(e => e.LabTestName)

                            select new LabTestDto
                            {
                                LabTestId = lab.LabTestId,
                                LabTestName = lab.LabTestName
                            });
            return labtests;
        }
        public object GetPatientBloodSugarInfo(ClinicalDbContext _clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            if (patientVisitId != 0)
            {
                var patientBloodSugarInfo = (from bs in _clinicalDbContext.BloodSugar
                                             join emp in _clinicalDbContext.Employee on bs.CreatedBy equals emp.EmployeeId
                                             //where bs.PatientVisitId == patientVisitId
                                             where bs.IsActive == true &&
                                                (isAcrossVisitAvailability
                                                    ? bs.PatientId == patientId
                                                    : bs.PatientVisitId == patientVisitId)
                                             select new
                                             {
                                                 BloodSugarMonitoringId = bs.BloodSugarMonitoringId,
                                                 PatientId = bs.PatientId,
                                                 PatientVisitId = bs.PatientVisitId,
                                                 EntryDateTime = bs.EntryDateTime,
                                                 RbsValue = bs.RbsValue,
                                                 Insulin = bs.Insulin,
                                                 EnteredBy = emp.FullName,
                                                 Remarks = bs.Remarks,
                                                 CreatedOn = bs.CreatedOn,
                                                 CreatedBy = bs.CreatedBy,
                                                 ModifiedOn = bs.ModifiedOn,
                                                 ModifiedBy = bs.ModifiedBy,
                                                 IsActive = bs.IsActive
                                             }).ToList();

                return patientBloodSugarInfo;
            }
            else
            {
                throw new ArgumentException("PatientVisitId is necessary");
            }
        }
        public object AddDiagnosis(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, List<DiagnosisAdd_DTO> diagnoses)
        {
            try
            {
                List<DiagnosisModel> newDiagnoses = new List<DiagnosisModel>();
                DateTime CurrentDateTime = DateTime.Now;

                foreach (var diagnosis in diagnoses)
                {


                    DiagnosisModel newDiagnosis = new DiagnosisModel
                    {
                        PatientId = diagnosis.PatientId,
                        PatientVisitId = diagnosis.PatientVisitId,
                        ICDId = diagnosis.ICDId,
                        DiagnosisCode = diagnosis.DiagnosisCode,
                        DiagnosisCodeDescription = diagnosis.DiagnosisCodeDescription,
                        DiagnosisType = diagnosis.DiagnosisType,
                        IsCauseOfDeath = diagnosis.IsCauseOfDeath,
                        Remarks = diagnosis.Remarks,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = CurrentDateTime,
                        IsActive = true,
                    };

                    newDiagnoses.Add(newDiagnosis);
                }

                _clinicalDbContext.cln_diagnosis.AddRange(newDiagnoses);
                _clinicalDbContext.SaveChanges();

                return newDiagnoses;
            }
            catch (Exception ex)
            {
                Log.Error($" Error occurred while save diagnosis data. {ex.Message}");
                throw new InvalidOperationException($".{ex.Message}");
            }
        }

        public object PostBloodSugar(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, BloodSugarModel bloodSugar)
        {
            try
            {
                _clinicalDbContext.BloodSugar.Add(bloodSugar);
                _clinicalDbContext.SaveChanges();
                return bloodSugar.BloodSugarMonitoringId;
            }
            catch (Exception ex)
            {
                Log.Error($"An error Occured: {ex.Message}");
                throw new Exception($"Unable to add bloodSugar! Please check Log for details.");
            }
        }
        public object GetRequestedImagingItems(ClinicalDbContext _clinicalDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            if (PatientId == 0)
            {
                throw new ArgumentException("PatientId is necessary");
            }

            if (PatientVisitId == 0)
            {
                throw new ArgumentException("PatientVisitId is necessary");
            }
            {
                var requestedImagingItems = (from imaging in _clinicalDbContext.ImagingReports
                                             where (IsAcrossVisitAvailability
                                                    ? imaging.PatientId == PatientId
                                                    : imaging.PatientVisitId == PatientVisitId)
                                             select new Imaging_DTO
                                             {
                                                 ImagingItemId = imaging.ImagingItemId,
                                                 ImagingItemName = imaging.ImagingItemName,
                                                 CreatedOn = imaging.CreatedOn,
                                                 ImagingRequisitionId = imaging.ImagingRequisitionId,
                                                 OrderStatus = imaging.OrderStatus
                                             });

                return requestedImagingItems;
            }

        }


        public object AddMedicationCardexPlan(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, PostMedicationCardexPlan_DTO medicationCardexPlan)
        {
            if (medicationCardexPlan == null)
            {
                Log.Error($"Nothing to save as {nameof(medicationCardexPlan)} is null.");
                throw new ArgumentNullException(nameof(medicationCardexPlan), $"Nothing to save as {nameof(medicationCardexPlan)} is null.");
            }
            try
            {
                var status = medicationCardexPlan.Status?.Trim();
                if (string.IsNullOrWhiteSpace(status))
                {
                    status = "Active";
                }
                var medCardexDetails = new TreatmentCardexPlanModel
                {

                    PatientId = medicationCardexPlan.PatientId,
                    PatientVisitId = medicationCardexPlan.PatientVisitId,
                    PrescriberId = medicationCardexPlan.PrescriberId,
                    MedicationItemId = medicationCardexPlan.ItemId,
                    PrescriptionItemId = medicationCardexPlan.PrescriptionItemId,
                    FrequencyAbbreviation = medicationCardexPlan.Frequency,
                    Doses = medicationCardexPlan.Doses,
                    Strength=medicationCardexPlan.Strength,
                    MedicationSchedule = medicationCardexPlan.MedicationSchedule,
                    Duration = medicationCardexPlan.Duration,
                    RouteOfAdministration = medicationCardexPlan.Route,
                    IsPRN = medicationCardexPlan.IsPRN,
                    PRNNotes = medicationCardexPlan.PRNNotes,
                    Status = status ?? "Active",
                    CardexNote = medicationCardexPlan.CardexNote,
                    AlternativeItemName = medicationCardexPlan.AlternateMedicine,
                    MedicationStartDate = medicationCardexPlan.MedicationStartDate,
                    MedicationEndDate = medicationCardexPlan.MedicationEndDate,
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = DateTime.Now,
                    IsActive = true
                };


                _clinicalDbContext.CardexPlan.Add(medCardexDetails);
                _clinicalDbContext.SaveChanges();

                Log.Information("Added medication cardex plan successfully.");

                return medicationCardexPlan;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while adding medication cardex plan.");
                throw new Exception("Failed to add medication cardex plan. Please try again later.", ex);
            }
        }
        public object GetMedicationCardexList(ClinicalDbContext _clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>()
                {
                   new SqlParameter("@PatientId", patientId),
                   new SqlParameter("@PatientVisitId", patientVisitId),
                   new SqlParameter("@IsAcrossVisitAvailability", isAcrossVisitAvailability),

                };
                DataTable medicationPlans = DALFunctions.GetDataTableFromStoredProc("SP_Get_Patient_MedicationCardexList", paramList, _clinicalDbContext);
                return medicationPlans;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while getting medication cardex plan list.");
                throw new Exception("Failed to get medication cardex plan list. Please try again later.", ex);
            }
        }
        public object GetDiagnoses(ClinicalDbContext _clinicalDbContext, int patientId, int patientVisitId, string DiagnosisType, bool isAcrossVisitAvailability)
        {

            try
            {
                var diagnosis = _clinicalDbContext.cln_diagnosis
                                    .Where(d =>
                                         (isAcrossVisitAvailability
                                            ? d.PatientId == patientId
                                            : d.PatientVisitId == patientVisitId) && d.DiagnosisType == DiagnosisType && d.IsActive == true)
                    .Select(d => new
                    {
                        d.DiagnosisId,
                        d.ICDId,
                        d.PatientId,
                        d.PatientVisitId,
                        d.DiagnosisCode,
                        d.DiagnosisCodeDescription,
                        d.DiagnosisType,
                        d.IsCauseOfDeath,
                        d.Remarks,
                        d.ModificationHistory,
                        d.CreatedBy,
                        d.ModifiedBy,
                        d.CreatedOn,
                        d.ModifiedOn,
                        d.IsActive
                    })
                    .ToList();

                if (diagnosis.Any())
                {
                    return diagnosis;
                }
                else
                {
                    Log.Information($"No {nameof(DiagnosisType)} found for the given patient and visit!");
                    return new List<object>(); // Return an empty list to indicate no data found.
                }
            }
            catch (Exception ex)
            {
                Log.Error($"Error occurred while getting {nameof(DiagnosisType)} data for patient: {ex.Message}");
                throw new InvalidOperationException("An unexpected error occurred. Please try again later."); // Generic message for unexpected errors.
            }
        }

        public object GetVitalsForNurseDailyRecord(ClinicalDbContext _clinicalDbContext, int patientId, int patientVisitId, DateTime? fromDate, DateTime? toDate, bool isAcrossVisitAvailability)
        {
            if (patientId == 0 || patientVisitId == 0)
            {
                if (patientId == 0 && patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get patient vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get patient vitals!");
                }
                else if (patientId == 0)
                {
                    Log.Error($"{nameof(patientId)} is zero, unable to get patient vitals!");
                    throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get patient vitals!");
                }
                else if (patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get patient vitals!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get patient vitals!");
                }
            }
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@PatientId", patientId),
                        new SqlParameter("@PatientVisitId", patientVisitId),
                        new SqlParameter("@IsAcrossVisitAvailability", isAcrossVisitAvailability)

                    };
            DataTable investigationResults = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetVitalsForNurseDailyRecord", paramList, _clinicalDbContext);
            return investigationResults;
        }

        public object ConsultationRequestsByPatientVisitId(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            if (PatientId <= 0)
            {
                Log.Error("PatientId is necessary and must be greater than zero.");
                throw new ArgumentException("PatientId is necessary and must be greater than zero.", nameof(PatientId));
            }
            if (PatientVisitId <= 0)
            {
                Log.Error("PatientVisitId is necessary and must be greater than zero.");
                throw new ArgumentException("PatientVisitId is necessary and must be greater than zero.", nameof(PatientVisitId));
            }

            try
            {
                var userId = currentUser.EmployeeId;
                List<RbacRole> usrAllRoles = RBAC.GetUserAllRoles(currentUser.UserId);
                bool isAdmin = usrAllRoles != null && usrAllRoles.Any(role => role.IsSysAdmin);

                var ConsultationRequests = (
                from cr in _clinicalDbContext.ConsultationRequest
                join pat in _clinicalDbContext.Patients on cr.PatientId equals pat.PatientId
                join visits in _clinicalDbContext.Visit on cr.PatientVisitId equals visits.PatientVisitId
                /*join bed in clinicalDbContext.Beds on cr.BedId equals bed.BedId*/
                join ward in _clinicalDbContext.Wards on cr.WardId equals ward.WardId into wardGroup
                from ward in wardGroup.DefaultIfEmpty()
                join reqEmp in _clinicalDbContext.Employee on cr.RequestingConsultantId equals reqEmp.EmployeeId
                join reqDept in _clinicalDbContext.Departments on cr.RequestingDepartmentId equals reqDept.DepartmentId
                join conEmp in _clinicalDbContext.Employee on cr.ConsultingDoctorId equals conEmp.EmployeeId into conEmpGroup
                from conEmp in conEmpGroup.DefaultIfEmpty()
                join conDept in _clinicalDbContext.Departments on cr.ConsultingDepartmentId equals conDept.DepartmentId into conDeptGroup
                from conDept in conDeptGroup.DefaultIfEmpty()
                where //cr.PatientVisitId == PatientVisitId
                       (IsAcrossVisitAvailability
                                ? cr.PatientId == PatientId
                                : cr.PatientVisitId == PatientVisitId)
                       && cr.IsActive == true
                       && (cr.RequestingConsultantId == userId || cr.ConsultingDoctorId == userId || isAdmin)

                select new ConsultationRequestForGetDTO
                {
                    ConsultationRequestId = cr.ConsultationRequestId,
                    PatientId = cr.PatientId,
                    PatientVisitId = cr.PatientVisitId,
                    WardId = cr.WardId.Value,
                    WardName = ward.WardName,
                    BedId = cr.BedId.Value,
                    RequestedOn = cr.RequestedOn,
                    RequestingConsultantId = cr.RequestingConsultantId,
                    RequestingConsultantName = reqEmp.FullName,
                    RequestingDepartmentId = cr.RequestingDepartmentId,
                    RequestingDepartmentName = reqDept.DepartmentName,
                    PurposeOfConsultation = cr.PurposeOfConsultation,
                    ConsultingDoctorId = cr.ConsultingDoctorId,
                    ConsultingDoctorName = conEmp.FullName,
                    ConsultingDepartmentId = cr.ConsultingDepartmentId,
                    ConsultingDepartmentName = conDept.DepartmentName,
                    ConsultantResponse = cr.ConsultantResponse,
                    ConsultedOn = cr.ConsultedOn,
                    Status = cr.Status,
                    IsActive = cr.IsActive
                }).OrderByDescending(a => a.ConsultationRequestId).ToList();
                return ConsultationRequests;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while retrieving consultation requests for PatientVisitId {PatientVisitId}: {ex.Message}", ex);
                throw new Exception($"An error occurred while retrieving consultation requests for PatientVisitId {PatientVisitId}: {ex.Message}", ex);
            }


        }
        public object AddNewConsultationRequest(RbacUser currentUser, ClinicalDbContext clinicalDbContext, ConsultationRequestDTO newConsultationRequest)
        {
            if (newConsultationRequest == null)
            {
                Log.Error($"Nothing to save as  {nameof(newConsultationRequest)} is null.");
                throw new ArgumentNullException($"Nothing to save as {nameof(newConsultationRequest)} is null.");
            }
            using (var consultationRequestTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    ConsultationRequestModel ConsultationRequest = new ConsultationRequestModel();
                    ConsultationRequest.PatientId = newConsultationRequest.PatientId;
                    ConsultationRequest.PatientVisitId = newConsultationRequest.PatientVisitId;
                    ConsultationRequest.WardId = newConsultationRequest.WardId;
                    ConsultationRequest.BedId = newConsultationRequest.BedId;
                    ConsultationRequest.RequestedOn = DateTime.Now;
                    ConsultationRequest.RequestingConsultantId = newConsultationRequest.RequestingConsultantId;
                    ConsultationRequest.RequestingDepartmentId = newConsultationRequest.RequestingDepartmentId;
                    ConsultationRequest.ConsultingDoctorId = newConsultationRequest.ConsultingDoctorId;
                    ConsultationRequest.ConsultingDepartmentId = newConsultationRequest.ConsultingDepartmentId;
                    ConsultationRequest.PurposeOfConsultation = newConsultationRequest.PurposeOfConsultation;
                    ConsultationRequest.Status = newConsultationRequest.Status;
                    ConsultationRequest.IsActive = newConsultationRequest.IsActive;
                    ConsultationRequest.CreatedOn = DateTime.Now;
                    ConsultationRequest.CreatedBy = currentUser.EmployeeId;
                    clinicalDbContext.ConsultationRequest.Add(ConsultationRequest);
                    clinicalDbContext.SaveChanges();
                    consultationRequestTransactionScope.Commit();
                    return ConsultationRequest.ConsultationRequestId;
                }
                catch (Exception ex)
                {
                    consultationRequestTransactionScope.Rollback();
                    Log.Error($"An error occurred while adding a new consultation request: {ex.Message}", ex);
                    throw new Exception($"An error occurred while adding a new consultation request: {ex.Message}. Exception details: {ex}");
                }
            }

        }
        public object ResponseConsultationRequest(RbacUser currentUser, ClinicalDbContext clinicalDbContext, ConsultationRequestDTO responseConsultationRequest)
        {
            if (responseConsultationRequest == null)
            {
                Log.Error($"Nothing to save as  {nameof(responseConsultationRequest)} is null.");
                throw new ArgumentNullException($"Nothing to save as {nameof(responseConsultationRequest)} is null.");
            }
            ConsultationRequestModel ConsultationRequest = clinicalDbContext.ConsultationRequest
                                                                                      .Where(x => x.ConsultationRequestId == responseConsultationRequest.ConsultationRequestId)
                                                                                      .FirstOrDefault();
            if (ConsultationRequest == null)
            {
                Log.Error($"ConsultationRequest with ID {responseConsultationRequest.ConsultationRequestId} not found.");
                throw new KeyNotFoundException($"ConsultationRequest with ID {responseConsultationRequest.ConsultationRequestId} not found.");
            }

            using (var consultationRequestTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    ConsultationRequest.ConsultingDoctorId = responseConsultationRequest.ConsultingDoctorId;
                    ConsultationRequest.ConsultingDepartmentId = responseConsultationRequest.ConsultingDepartmentId;
                    ConsultationRequest.ConsultantResponse = responseConsultationRequest.ConsultantResponse;
                    ConsultationRequest.ConsultedOn = DateTime.Now;
                    ConsultationRequest.Status = responseConsultationRequest.Status;
                    ConsultationRequest.ModifiedOn = DateTime.Now;
                    ConsultationRequest.ModifiedBy = currentUser.EmployeeId;
                    clinicalDbContext.Entry(ConsultationRequest).State = EntityState.Modified;
                    clinicalDbContext.SaveChanges();
                    consultationRequestTransactionScope.Commit();
                    return ConsultationRequest.ConsultationRequestId;
                }
                catch (Exception ex)
                {
                    consultationRequestTransactionScope.Rollback();
                    throw new Exception(ex.Message);
                }
            }

        }
        public object GetItemsWithTotalAvailableQuantity(ClinicalDbContext _clinicalDbContext)
        {
            var itemQuantities = from item in _clinicalDbContext.PHRMItemMaster where item.IsActive == true
                                 join stock in _clinicalDbContext.StoreStocks.Include(a => a.StockMaster)
                                 on item.ItemId equals stock.ItemId into stockGroup
                                 from stock in stockGroup.DefaultIfEmpty() 
                                 where stock == null || stock.StockMaster.ExpiryDate > DateTime.Now
                                 group stock by item into groupedStock
                                 select new
                                 {
                                     Item = groupedStock.Key,
                                     TotalAvailableQuantity = groupedStock.Sum(s => s != null ? s.AvailableQuantity : 0), 
                                 };

            return itemQuantities.ToList();
        }

        public object GetPatientVisitsByPatientId(int patientId, ClinicalDbContext _clinicalDbContext)
        {
            if (patientId == 0)
            {
                Log.Error($"{nameof(patientId)} is zero, unable to get patient visits!");
                throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get patient visits!");
            }
            var patientVisits = _clinicalDbContext.Visit.Where(visit => visit.PatientId == patientId && visit.VisitType != ENUM_VisitType.outdoor)
                .OrderByDescending(visit => visit.VisitDate)
                .Select(vi => new ClinicalDataVisitList_DTO
                {
                    VisitCode = vi.VisitCode,
                    VisitDate = vi.VisitDate,
                    PatientVisitId = vi.PatientVisitId,
                    PatientId = vi.PatientId,
                    VisitStatus = vi.VisitStatus,
                    IsClinicalDataEditable = false
                }).ToList();
            if (patientVisits.Count > 0)
            {
                if (!patientVisits[0].VisitStatus.Equals("concluded"))
                {
                    patientVisits[0].IsClinicalDataEditable = true;

                }
            }

            return patientVisits;
        }

        public async Task<object> UpdateMedicationCardexPlanAsync(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, PutMedicationCardexPlan_DTO medicationCardexPlan)
        {
            if (medicationCardexPlan == null)
            {
                Log.Error($"Nothing to save as {nameof(medicationCardexPlan)} is null.");
                throw new ArgumentNullException(nameof(medicationCardexPlan), $"Nothing to save as {nameof(medicationCardexPlan)} is null.");
            }

            try
            {
                var existingCardexPlan = await _clinicalDbContext.CardexPlan
                    .FirstOrDefaultAsync(cp => cp.CardexId == medicationCardexPlan.CardexId);

                if (existingCardexPlan != null)
                {
                    // Update existing record
                    existingCardexPlan.PrescriberId = medicationCardexPlan.PrescriberId;
                    existingCardexPlan.MedicationItemId = medicationCardexPlan.ItemId;
                    existingCardexPlan.PrescriptionItemId = medicationCardexPlan.PrescriptionItemId;
                    existingCardexPlan.FrequencyAbbreviation = medicationCardexPlan.Frequency;
                    existingCardexPlan.Doses = medicationCardexPlan.Doses;
                    existingCardexPlan.MedicationSchedule = medicationCardexPlan.MedicationSchedule;
                    existingCardexPlan.Duration = medicationCardexPlan.Duration;
                    existingCardexPlan.RouteOfAdministration = medicationCardexPlan.Route;
                    existingCardexPlan.IsPRN = medicationCardexPlan.IsPRN;
                    existingCardexPlan.PRNNotes = medicationCardexPlan.PRNNotes;
                    existingCardexPlan.Status = medicationCardexPlan.Status;
                    existingCardexPlan.CardexNote = medicationCardexPlan.CardexNote;
                    existingCardexPlan.AlternativeItemName = medicationCardexPlan.AlternateMedicine;
                    existingCardexPlan.MedicationStartDate = medicationCardexPlan.MedicationStartDate;
                    existingCardexPlan.MedicationEndDate = medicationCardexPlan.MedicationEndDate;
                    existingCardexPlan.ModifiedBy = currentUser.EmployeeId;
                    existingCardexPlan.ModifiedOn = DateTime.Now;
                    existingCardexPlan.IsActive = true;

                    _clinicalDbContext.CardexPlan.AddOrUpdate(existingCardexPlan);

                    await _clinicalDbContext.SaveChangesAsync();

                    Log.Information("Updated medication cardex plan successfully.");

                    return medicationCardexPlan;
                }
                else
                {
                    Log.Information("No existing medication cardex plan found with the provided CardexId.");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while updating medication cardex plan.");
                throw new Exception("Failed to update medication cardex plan. Please try again later.", ex);
            }
        }


        public object GetChiefComplaints(ClinicalDbContext _clinicalDbContext)
        {

            var chiefComplaints = (from complaints in _clinicalDbContext.ComplainsModels.Where(e => e.IsActive == true)
                                   select new ChiefComplaint_DTO
                                   {
                                       ChiefComplainId = complaints.ChiefComplainId,
                                       ChiefComplain = complaints.ChiefComplain
                                   }).ToList();

            return chiefComplaints;
        }
        public object AddPatientComplaints(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, PatientComplaints_DTO patientComplaints)
        {

            bool isAnyFieldFilled = patientComplaints.ChiefComplainId.HasValue ||
                              patientComplaints.Duration.HasValue ||
                              !string.IsNullOrEmpty(patientComplaints.Notes) ||
                              !string.IsNullOrEmpty(patientComplaints.DurationType);


            if (!isAnyFieldFilled)
            {
                Log.Error("No data to save as all fields are either null or empty.");
                throw new ArgumentException("At least one field should be filled to save the patient complaints.");
            }



            try
            {
                var patientComplaintsModel = new PatientComplaintsModel
                {
                    PatientId = patientComplaints.PatientId,
                    PatientVisitId = patientComplaints.PatientVisitId,
                    ChiefComplainId = patientComplaints.ChiefComplainId,
                    Duration = patientComplaints.Duration,
                    Notes = patientComplaints.Notes,
                    DurationType = patientComplaints.DurationType,
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = DateTime.Now,
                    IsActive = true,
                    IsLock = false,
                    IsSuspense = false
                };

                _clinicalDbContext.PatientComplaints.Add(patientComplaintsModel);
                _clinicalDbContext.SaveChanges();

                Log.Information("Added Patient Complaints successfully.");

                return patientComplaints;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while adding Patient Complaints.");
                throw new Exception("Failed to add Patient Complaints. Please try again later.", ex);
            }
        }
        public object GetPatientComplaints(int patientId, int patientVisitId, bool isAcrossVisitAvailability, ClinicalDbContext _clinicalDbContext)
        {
            if (patientId == 0 || patientVisitId == 0)
            {
                if (patientId == 0 && patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get PatientComplaints!");
                    throw new InvalidOperationException($"{nameof(patientId)} & {nameof(patientVisitId)} is zero, unable to get PatientComplaints!");
                }
                else if (patientId == 0)
                {
                    Log.Error($"{nameof(patientId)} is zero, unable to get PatientComplaints!");
                    throw new InvalidOperationException($"{nameof(patientId)} is zero, unable to get PatientComplaints!");
                }
                else if (patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get PatientComplaints!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get PatientComplaints!");
                }
            }
            var patientComplaints = (from patientComplaint in _clinicalDbContext.PatientComplaints
                                     where patientComplaint.IsActive &&
                                       (isAcrossVisitAvailability
                                       ? patientComplaint.PatientId == patientId
                                       : patientComplaint.PatientVisitId == patientVisitId)
                                     join chiefComplaint in _clinicalDbContext.ComplainsModels
                                     on patientComplaint.ChiefComplainId equals chiefComplaint.ChiefComplainId into complaintGroup
                                     from subComplaint in complaintGroup.DefaultIfEmpty()
                                     select new
                                     {
                                         ComplaintId = patientComplaint.ComplaintId,
                                         Duration = patientComplaint.Duration,
                                         DurationType = patientComplaint.DurationType,
                                         Notes = patientComplaint.Notes,
                                         ChiefComplainId = (int?)subComplaint.ChiefComplainId,
                                         ChiefComplain = subComplaint.ChiefComplain
                                     }).ToList();

            return patientComplaints;


        }
        public object UpdatePatientComplaints(RbacUser currentUser, PatientComplaints_DTO patientComplaints, ClinicalDbContext _clinicalDbContext)
        {
            if (patientComplaints == null)
            {
                Log.Error($"Nothing to update as  {nameof(patientComplaints)} is null.");
                throw new ArgumentNullException($"Nothing to update as{nameof(patientComplaints)} is null");
            }
            if (patientComplaints != null && patientComplaints.ComplaintId == 0)
            {
                Log.Error($" {nameof(patientComplaints)} is not provided to update the Patient complaint.");
                throw new ArgumentNullException($"{nameof(patientComplaints.ComplaintId)} is not provided to update the Patient complaint");
            }
            var complaints = _clinicalDbContext.PatientComplaints.Where(x => x.ComplaintId == patientComplaints.ComplaintId).FirstOrDefault();

            bool isAnyFieldFilled = patientComplaints.ChiefComplainId.HasValue ||
                    patientComplaints.Duration.HasValue ||
                    !string.IsNullOrEmpty(patientComplaints.Notes) ||
                    !string.IsNullOrEmpty(patientComplaints.DurationType);


            if (!isAnyFieldFilled)
            {
                Log.Error("No data to save as all fields are either null or empty.");
                throw new ArgumentException("At least one field should be filled to save the patient complaints.");
            }


            complaints.ModifiedOn = DateTime.Now;
            complaints.ModifiedBy = currentUser.EmployeeId;
            complaints.IsActive = true;
            complaints.IsSuspense = false;
            complaints.IsLock = false;
            complaints.ChiefComplainId = patientComplaints.ChiefComplainId;
            complaints.Duration = patientComplaints.Duration;
            complaints.DurationType = patientComplaints.DurationType;
            complaints.Notes = patientComplaints.Notes;

            _clinicalDbContext.Entry(complaints).State = EntityState.Modified;
            _clinicalDbContext.SaveChanges();
            return patientComplaints;
        }

        public object DeactivatePatientComplaint(RbacUser currentUser, int complaintId, ClinicalDbContext _clinicalDbContext)
        {
            if (complaintId == 0)
            {
                Log.Error($"{nameof(complaintId)} is not provided");
                throw new InvalidOperationException($"{nameof(complaintId)} is not provided");
            }

            var patientComplaint = _clinicalDbContext.PatientComplaints.FirstOrDefault(r => r.ComplaintId == complaintId);

            if (patientComplaint == null)
            {
                Log.Error($"There is no Patient Complaint to update with ComplaintId {complaintId}");
                throw new InvalidOperationException($"There is no Patient Complaint to update with ComplaintId {complaintId}");
            }

            try
            {
                patientComplaint.IsActive = false;
                patientComplaint.ModifiedBy = currentUser.EmployeeId;
                patientComplaint.ModifiedOn = DateTime.Now;

                _clinicalDbContext.Entry(patientComplaint).State = EntityState.Modified;
                _clinicalDbContext.SaveChanges();

                return patientComplaint;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Deactivate the Patient Complaint: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while  Deactivate the Patient Complaint.{ex.Message}");
            }
        }

        /// <summary>
        /// Adds or updates patient follow-up details for a specific patient visit. 
        /// This method retrieves the patient visit record from the `Visit` table based on the provided `PatientVisitId` 
        /// and updates the follow-up information, including follow-up days, start date, remarks, and modification details.
        /// </summary>
        /// <param name="patientFollowUpDTO">A `PatientFollowUp_DTO` object containing the follow-up details such as FollowUpDays, FollowUpRemark, and PatientVisitId.</param>
        /// <returns>The updated `PatientFollowUp_DTO` object with the latest follow-up details.</returns>

        public object AddPatientFollowUpDays(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PatientFollowUp_DTO patientFollowUpDTO)
        {
            if (patientFollowUpDTO == null)
            {
                Log.Error($"Nothing to save as {nameof(patientFollowUpDTO)} is null.");
                throw new ArgumentNullException(nameof(patientFollowUpDTO), $"Nothing to save as {nameof(patientFollowUpDTO)} is null.");
            }
            try
            {
                var patientVisit = clinicalDbContext.Visit.FirstOrDefault(pv => pv.PatientVisitId == patientFollowUpDTO.PatientVisitId);
                if (patientVisit == null)
                {
                    Log.Error($"Patient visit with ID {patientFollowUpDTO.PatientVisitId} not found.");
                    throw new Exception($"Patient visit with ID {patientFollowUpDTO.PatientVisitId} not found.");
                }
                if (patientFollowUpDTO.FollowUpDays == null)
                {
                    Log.Error("FollowUpDays cannot be null.");
                    throw new ArgumentException("FollowUpDays cannot be null.", nameof(patientFollowUpDTO.FollowUpDays));
                }
                var followUpStartDate = DateTime.Now;
                patientVisit.FollowUpDate = followUpStartDate.AddDays(patientFollowUpDTO.FollowUpDays);
                patientVisit.FollowUpRemarks = patientFollowUpDTO.FollowUpRemarks;
                patientVisit.FollowUpDays = patientFollowUpDTO.FollowUpDays;
                patientVisit.ModifiedOn = DateTime.Now;
                patientVisit.ModifiedBy = currentUser.EmployeeId;
                clinicalDbContext.Visit.AddOrUpdate(patientVisit);
                clinicalDbContext.SaveChanges();
                return patientFollowUpDTO;
            }
            catch (SqlException sqlEx)
            {
                Log.Error($"A SQL error occurred while Adding the Add Patient Follow Up Days: {sqlEx.Message}", sqlEx);
                throw new Exception($"A SQL error occurred while Adding the Add Patient Follow Up Days: {sqlEx.Message}.", sqlEx);
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while while Adding the Add Patient Follow Up Days: {ex.Message}", ex);
                throw new Exception($"An error occurred while Adding the Add Patient Follow Up Days: {ex.Message}.", ex);
            }

        }
        /// <summary>
        /// Retrieves follow-up details for a specific patient visit from the `Visit` table in the clinical database. 
        /// The method queries the database using the provided `PatientVisitId` to fetch follow-up days, remarks, and the visit ID.
        /// </summary>
        /// <param name="isAcrossVisitAvailability">To get all visit data or current visit data</param>
        /// <param name="patientVisitId">The ID of the patient visit for which follow-up details are to be retrieved.</param>
        /// <returns>An object containing a list of follow-up details including FollowUpDays, FollowUpRemark, and PatientVisitId; 
        /// returns an empty list if no matching records are found.</returns>
        public object GetPatientFollowUpDetails(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            try
            {
                var PatientFollowUpDetails = (from visits in clinicalDbContext.Visit
                                              where visits.PatientVisitId == patientVisitId
                                              select new
                                              {
                                                  FollowUpDays = visits.FollowUpDays,
                                                  FollowUpRemarks = visits.FollowUpRemarks,
                                                  PatientVisitId = visits.PatientVisitId,
                                                  FollowUpDate = visits.FollowUpDate
                                              }).ToList();

                return PatientFollowUpDetails;
            }
            catch (Exception ex)
            {
                Log.Error("An error occurred while fetching the Patient Follow Up Days:", ex);
                throw new Exception("An error occurred while fetchingthe Patient Follow Up Days:.", ex);

            }
        }

        public object GetPatientActiveMedications(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            try
            {
                var latestActivePatientMedications = (from cardexPlan in clinicalDbContext.CardexPlan
                                                       .Where(cp => (cp.Status == "Active" || cp.Status == "Hold")
                                                       && cp.IsActive
                                                       && (isAcrossVisitAvailability
                                                            ? cp.PatientId == patientId
                                                            : cp.PatientVisitId == patientVisitId))
                                                      join item in clinicalDbContext.PHRMItemMaster on cardexPlan.MedicationItemId equals item.ItemId
                                                      join genericItem in clinicalDbContext.PHRMGeneric on item.GenericId equals genericItem.GenericId
                                                      join patientMedication in clinicalDbContext.PatientMedications
                                                          .Where(pm => pm.IsActive)
                                                          on cardexPlan.CardexId equals patientMedication.CardexplanId into patientMedicationsGroup
                                                      from patientMedication in patientMedicationsGroup
                                                          .OrderByDescending(pm => pm.MedicationTakenDate)
                                                          .ThenByDescending(pm => pm.MedicationTakenTime)
                                                          .Take(1)
                                                          .DefaultIfEmpty()
                                                      select new PatientMedication_DTO
                                                      {
                                                          CardexId = cardexPlan.CardexId,
                                                          MedicationItemId = cardexPlan.MedicationItemId,
                                                          GenericName = genericItem.GenericName,
                                                          ItemName = item.ItemName,
                                                          ItemId = item.ItemId,
                                                          PatientId = cardexPlan.PatientId,
                                                          PatientVisitId = cardexPlan.PatientVisitId,
                                                          FrequencyAbbreviation = cardexPlan.FrequencyAbbreviation,
                                                          Duration = cardexPlan.Duration,
                                                          RouteOfAdministration = cardexPlan.RouteOfAdministration,
                                                          MedicationSchedule = cardexPlan.MedicationSchedule,
                                                          IsPRN = cardexPlan.IsPRN,
                                                          PRNNotes = cardexPlan.PRNNotes,
                                                          Doses = cardexPlan.Doses,
                                                          Strength=cardexPlan.Strength,
                                                          CardexNote = cardexPlan.CardexNote,
                                                          Status = cardexPlan.Status,
                                                          AlternativeItemName = cardexPlan.AlternativeItemName,
                                                          PrescriberId = cardexPlan.PrescriberId,
                                                          CreatedBy = cardexPlan.CreatedBy,
                                                          CreatedOn = cardexPlan.CreatedOn,
                                                          ModifiedBy = cardexPlan.ModifiedBy,
                                                          ModifiedOn = cardexPlan.ModifiedOn,
                                                          MedicationStartDate = cardexPlan.MedicationStartDate,
                                                          MedicationEndDate = cardexPlan.MedicationEndDate,
                                                          PatientMedicationId = patientMedication != null ? (int?)patientMedication.PatientMedicationId : null,
                                                          MedicationTakenDate = patientMedication != null ? (DateTime?)patientMedication.MedicationTakenDate : null,
                                                          MedicationTakenTime = patientMedication != null ? (TimeSpan?)patientMedication.MedicationTakenTime : null,
                                                          Comment = patientMedication != null ? patientMedication.Comment : null,
                                                          MedicationCreatedBy = patientMedication != null ? (int?)patientMedication.CreatedBy : null,
                                                          MedicationCreatedOn = patientMedication != null ? (DateTime?)patientMedication.CreatedOn : null,
                                                      }).ToList();
                return latestActivePatientMedications;
            }
            catch (Exception ex)
            {
                Log.Error("An error occurred while fetching patient active medications.", ex);
                throw new Exception("An error occurred while fetching patient active medications.", ex);

            }
        }

        public object AddMedicationEntry(RbacUser currentUser, ClinicalDbContext clinicalDbContext, MedicationEntry_DTO medicationEntry)
        {
            if (medicationEntry == null)
            {
                Log.Error($"Nothing to save as {nameof(medicationEntry)} is null.");
                throw new ArgumentNullException(nameof(medicationEntry), $"Nothing to save as {nameof(medicationEntry)} is null.");

            }
            using (var consultationRequestTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    PatientMedicationModel newMedicationEntry = new PatientMedicationModel();
                    newMedicationEntry.CardexplanId = medicationEntry.CardexplanId;
                    newMedicationEntry.Comment = medicationEntry.Comments;
                    newMedicationEntry.MedicationTakenDate = medicationEntry.MedicationTakenDate;
                    newMedicationEntry.MedicationTakenTime = medicationEntry.MedicationTakenTime;
                    newMedicationEntry.CreatedBy = currentUser.EmployeeId;
                    newMedicationEntry.CreatedOn = DateTime.Now;
                    newMedicationEntry.IsActive = true;
                    clinicalDbContext.PatientMedications.Add(newMedicationEntry);
                    clinicalDbContext.SaveChanges();
                    consultationRequestTransactionScope.Commit();
                    return newMedicationEntry.PatientMedicationId;
                }
                catch (Exception ex)
                {
                    consultationRequestTransactionScope.Rollback();
                    Log.Error($"An error occurred while adding a new Medication Entry: {ex.Message}", ex);
                    throw new Exception($"An error occurred while adding a new Medication entry: {ex.Message}. Exception details: {ex}");
                }
            }

        }

        public object GetSelectedMedicationHistoryLogs(ClinicalDbContext _clinicalDbContext, int cardexPlanId)
        {
            if (cardexPlanId == null)
            {
                Log.Error($"Unable to get the medication log History! Selected medication has null CardexplanId.");
                throw new ArgumentNullException("Unable to get the medication log History! Selected medication has null CardexplanId.");

            }
            var MedicationHistoryLogs = from medicationLog in _clinicalDbContext.PatientMedications
                                        where medicationLog.CardexplanId == cardexPlanId
                                        && medicationLog.IsActive == true
                                        select medicationLog;
            var result = MedicationHistoryLogs.ToList();
            return result;

        }
        public object GetAllMedicationLogList(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            try
            {
                var allPatientMedications = (from cardexPlan in clinicalDbContext.CardexPlan
                                               .Where(cp => cp.IsActive && (isAcrossVisitAvailability
                                                                                ? cp.PatientId == patientId
                                                                                : cp.PatientVisitId == patientVisitId))
                                             join item in clinicalDbContext.PHRMItemMaster on cardexPlan.MedicationItemId equals item.ItemId
                                             join genericItem in clinicalDbContext.PHRMGeneric on item.GenericId equals genericItem.GenericId
                                             join patientMedication in clinicalDbContext.PatientMedications
                                                 .Where(pm => pm.IsActive)
                                                 on cardexPlan.CardexId equals patientMedication.CardexplanId into patientMedicationsGroup
                                             from patientMedication in patientMedicationsGroup
                                             select new PatientMedication_DTO
                                             {
                                                 CardexId = cardexPlan.CardexId,
                                                 MedicationItemId = cardexPlan.MedicationItemId,
                                                 GenericName = genericItem.GenericName,
                                                 ItemName = item.ItemName,
                                                 PatientId = cardexPlan.PatientId,
                                                 PatientVisitId = cardexPlan.PatientVisitId,
                                                 FrequencyAbbreviation = cardexPlan.FrequencyAbbreviation,
                                                 Duration = cardexPlan.Duration,
                                                 RouteOfAdministration = cardexPlan.RouteOfAdministration,
                                                 MedicationSchedule = cardexPlan.MedicationSchedule,
                                                 IsPRN = cardexPlan.IsPRN,
                                                 PRNNotes = cardexPlan.PRNNotes,
                                                 Doses = cardexPlan.Doses,
                                                 CardexNote = cardexPlan.CardexNote,
                                                 Status = cardexPlan.Status,
                                                 AlternativeItemName = cardexPlan.AlternativeItemName,
                                                 PrescriberId = cardexPlan.PrescriberId,
                                                 CreatedBy = patientMedication.CreatedBy,
                                                 CreatedOn = cardexPlan.CreatedOn,
                                                 ModifiedBy = cardexPlan.ModifiedBy,
                                                 ModifiedOn = cardexPlan.ModifiedOn,
                                                 PatientMedicationId = patientMedication != null ? (int?)patientMedication.PatientMedicationId : null,
                                                 MedicationTakenDate = patientMedication != null ? (DateTime?)patientMedication.MedicationTakenDate : null,
                                                 MedicationTakenTime = patientMedication != null ? (TimeSpan?)patientMedication.MedicationTakenTime : null,
                                                 Comment = patientMedication != null ? patientMedication.Comment : null,
                                                 MedicationCreatedBy = patientMedication != null ? (int?)patientMedication.CreatedBy : null,
                                                 MedicationCreatedOn = patientMedication != null ? (DateTime?)patientMedication.CreatedOn : null,
                                             }).ToList();

                return allPatientMedications;
            }
            catch (Exception ex)
            {
                Log.Error("An error occurred while fetching all patient medications.", ex);
                throw new Exception("An error occurred while fetching all patient medications.", ex);
            }
        }

        public object GetSelectedPatientMedicationList(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            try
            {
                var CardexItemList = (from plans in clinicalDbContext.CardexPlan
                                      where (isAcrossVisitAvailability
                                        ? plans.PatientId == patientId
                                        : plans.PatientVisitId == patientVisitId) && plans.IsActive == true
                                      join items in clinicalDbContext.PHRMItemMaster on plans.MedicationItemId equals items.ItemId
                                      select new
                                      {
                                          ItemId = plans.MedicationItemId,
                                          ItemName = items.ItemName
                                      }).ToList();
                return CardexItemList;

            }
            catch (Exception ex)
            {
                Log.Error("An error occurred while fetching all patient CardexItemList.", ex);
                throw new Exception("An error occurred while fetching all patient CardexItemList.", ex);
            }

        }
        /// <summary>
        /// Retrieves a list of patient allergies from the database based on the clinicalDbContext, PatientID.
        /// </summary>
        /// <param name="_clinicalDbContext">The database context for clinical operations, used to interact with patient allergy data.</param>
        /// <param name="PatientId">The ID of the patient whose allergies are to be retrieved.</param>
        /// <returns>It returns list of allergy records associated with the specified patient.</returns>
        public object GetPatientAllergies(ClinicalDbContext _clinicalDbContext, int PatientId)
        {
            if (PatientId == 0)
            {
                Log.Error($"{nameof(PatientId)} is zero, unable to get patient Allergy!");
                throw new InvalidOperationException($"{nameof(PatientId)} is zero, unable to get patient Allergy!");
            }
            var patientAllergy = _clinicalDbContext.Allergy.Where(alrg => alrg.PatientId == PatientId && alrg.IsActive == true)
                               .OrderByDescending(alrg => alrg.CreatedOn).ToList();
            return patientAllergy;
        }
        /// <summary>
        /// Adds a new patient allergy to the database.
        /// </summary>
        /// <param name="currentUser">The user currently logged in who is adding the patient allergy.</param>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with patient allergy data.</param>
        /// <param name="patientAllergyDTO">The DTO object containing the details of the patient allergy to be added.</param>
        /// <returns>
        /// Returns an object indicating the success status and a message about the operation.
        /// </returns>
        public object AddPatientAllergy(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PatientAllergyDTO patientAllergyDTO)
        {
            if (patientAllergyDTO is null)
            {
                Log.Error($"Nothing to save as {nameof(patientAllergyDTO)} is null.");
                throw new ArgumentNullException(nameof(patientAllergyDTO), $"Nothing to save as {nameof(patientAllergyDTO)} is null.");

            }
            using (var patientAllergyTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    AllergyModel patientAllergy = new AllergyModel();
                    patientAllergy.PatientId = patientAllergyDTO.PatientId;
                    patientAllergy.AllergenAdvRecId = patientAllergyDTO.AllergenAdvRecId;
                    patientAllergy.AllergenAdvRecName = patientAllergyDTO.AllergenAdvRecName;
                    patientAllergy.AllergyType = patientAllergyDTO.AllergyType;
                    patientAllergy.Severity = patientAllergyDTO.Severity;
                    patientAllergy.Verified = patientAllergyDTO.Verified;
                    patientAllergy.Reaction = patientAllergyDTO.Reaction;
                    patientAllergy.Comments = patientAllergyDTO.Comments;
                    patientAllergy.CreatedBy = currentUser.EmployeeId;
                    patientAllergy.CreatedOn = DateTime.Now;
                    patientAllergy.IsActive = true;
                    clinicalDbContext.Allergy.Add(patientAllergy);
                    clinicalDbContext.SaveChanges();
                    patientAllergyTransactionScope.Commit();
                    return new { Success = true, Message = "Patient allergy added successfully." };

                }
                catch (SqlException sqlEx)
                {
                    patientAllergyTransactionScope.Rollback();
                    Log.Error($"A SQL error occurred while adding a new Patient Allergy: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while adding a new Patient Allergy: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    patientAllergyTransactionScope.Rollback();
                    Log.Error($"An error occurred while adding a new Patient Allergy: {ex.Message}", ex);
                    throw new Exception($"An error occurred while adding a new Patient Allergy: {ex.Message}. Exception details: {ex}");
                }
            }
        }

        /// <summary>
        /// Updates a patient allergy record in the database.
        /// </summary>
        /// <param name="currentUser">The user currently logged in who is updating the patient allergy.</param>
        /// <param name="patientAllergyDTO">The DTO (Data Transfer Object) containing updated allergy information.</param>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with patient allergy data.</param>
        /// <returns>An object indicating the success or failure of the operation.</returns>
        public object UpdatePatientAllergy(RbacUser currentUser, PatientAllergyDTO patientAllergyDTO, ClinicalDbContext clinicalDbContext)
        {
            if (patientAllergyDTO is null)
            {
                Log.Error($"Nothing to update as  {nameof(patientAllergyDTO)} is null.");
                throw new ArgumentNullException($"Nothing to update as{nameof(patientAllergyDTO)} is null");
            }
            if (patientAllergyDTO != null && patientAllergyDTO.PatientAllergyId == 0)
            {
                Log.Error($" {nameof(patientAllergyDTO)} is not provided to update the Patient Allergy.");
                throw new ArgumentNullException($"{nameof(patientAllergyDTO.PatientAllergyId)} is not provided to update the Patient Allergy");
            }
            var patientAllergy = clinicalDbContext.Allergy.Where(x => x.PatientAllergyId == patientAllergyDTO.PatientAllergyId).FirstOrDefault();
            if (patientAllergy is null)
            {
                Log.Error($"No Patient Allergy is found for {nameof(patientAllergyDTO.PatientAllergyId)}");
                throw new InvalidOperationException($"No Patient Allergy is found for {nameof(patientAllergyDTO.PatientAllergyId)}");
            }
            using (var patientAllergyTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    patientAllergy.ModifiedOn = DateTime.Now;
                    patientAllergy.ModifiedBy = currentUser.EmployeeId;
                    patientAllergy.AllergenAdvRecId = patientAllergyDTO.AllergenAdvRecId;
                    patientAllergy.AllergenAdvRecName = patientAllergyDTO.AllergenAdvRecName;
                    patientAllergy.AllergyType = patientAllergyDTO.AllergyType;
                    patientAllergy.Severity = patientAllergyDTO.Severity;
                    patientAllergy.Verified = patientAllergyDTO.Verified;
                    patientAllergy.Reaction = patientAllergyDTO.Reaction;
                    patientAllergy.Comments = patientAllergyDTO.Comments;
                    clinicalDbContext.Entry(patientAllergy).State = EntityState.Modified;
                    clinicalDbContext.SaveChanges();
                    patientAllergyTransactionScope.Commit();
                    return new { Success = true, Message = "Patient allergy Updated successfully." };
                }
                catch (SqlException sqlEx)
                {
                    patientAllergyTransactionScope.Rollback();
                    Log.Error($"A SQL error occurred while Updating a new Patient Allergy: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while Updating a new Patient Allergy: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    patientAllergyTransactionScope.Rollback();
                    Log.Error($"An error occurred while Updating a new Patient Allergy: {ex.Message}", ex);
                    throw new Exception($"An error occurred while Updating a new Patient Allergy: {ex.Message}. Exception details: {ex}");
                }
            }
        }
        /// <summary>
        /// Retrieves a list of babyBirth Details from the database based on the clinicalDbContext, patientVisitId.
        /// </summary>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with baby birth data.</param>
        /// <param name="PatientId">The ID of the patient for which birth details are retrieved.</param>
        /// <param name="patientVisitId">The ID of the patient visit for which birth details are retrieved.</param>
        /// <param name="isAcrossVisitAvailability">To get all visit data or current visit data</param>
        /// <returns>An object representing the list of birth details associated with the specified patient visit ID.</returns>
        public object GetBirthList(ClinicalDbContext clinicalDbContext, int PatientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            var birthList = (from brth in clinicalDbContext.BabyBirthRecord
                             join pat in clinicalDbContext.Patients on brth.PatientId equals pat.PatientId

                             where brth.IsActive == true
                             //&& brth.PatientVisitId == patientVisitId
                             && (isAcrossVisitAvailability
                                ? brth.PatientId == PatientId
                                : brth.PatientVisitId == patientVisitId)
                             select new BabyBirthDetails_DTO
                             {
                                 BabyBirthDetailsId = brth.BabyBirthDetailsId,
                                 CertificateNumber = brth.CertificateNumber,
                                 Gender = brth.Gender,
                                 FathersName = brth.FathersName,
                                 WeightOfBaby = brth.WeightOfBaby,
                                 BirthDate = brth.BirthDate,
                                 BirthTime = brth.BirthTime,
                                 NumberOfBabies = 1,
                                 PatientId = brth.PatientId,
                                 PatientVisitId = brth.PatientVisitId,
                                 CreatedOn = brth.CreatedOn,
                                 IssuedBy = brth.IssuedBy,
                                 FiscalYearId = brth.FiscalYear.FiscalYearId,
                                 CertifiedBy = brth.CertifiedBy,
                                 ShortName = pat.ShortName,
                                 BirthConditionId = brth.BirthConditionId,
                                 BirthNumberType = brth.BirthNumberType,
                                 BirthType = brth.BirthType
                             }).ToList().OrderByDescending(o => o.CreatedOn);
            return birthList;
        }
        /// <summary>
        /// Retrieves a list of babyBirth Details from the database based on the clinicalDbContext, patientId.
        /// </summary>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with baby birth data.</param>
        /// <param name="patientId">The ID of the patientId for which birth details are retrieved.</param>
        /// <returns>An object representing the list of birth details associated with the specified patientId.</returns>
        public object GetBabyDetailsByPatientId(ClinicalDbContext clinicalDbContext, int patientId)
        {
            var birthList = (from mother in clinicalDbContext.BabyBirthRecord
                             join con in clinicalDbContext.BabyBirthCondition on mother.BirthConditionId equals con.BabyBirthConditionId
                             where mother.IsActive == true && mother.PatientId == patientId
                             select new BabyBirthDetails_DTO
                             {
                                 PatientId = mother.PatientId,
                                 BabyBirthDetailsId = mother.BabyBirthDetailsId,
                                 CertificateNumber = mother.CertificateNumber,
                                 Gender = mother.Gender,
                                 WeightOfBaby = mother.WeightOfBaby,
                                 FathersName = mother.FathersName,
                                 IssuedBy = mother.IssuedBy,
                                 CertifiedBy = mother.CertifiedBy,
                                 BirthType = mother.BirthType,
                                 BirthDate = mother.BirthDate,
                                 BirthTime = mother.BirthTime,
                                 BirthConditionId = con.BabyBirthConditionId,
                                 BirthNumberType = mother.BirthNumberType
                             }).ToList();

            return birthList;
        }
        /// <summary>
        /// Updates the details of a baby birth record in the database.
        /// </summary>
        /// <param name="currentUser">The user currently logged in who is updating the baby birth deatils.</param>
        /// <param name="babyBirthDetails_DTO">DTO containing the updated details of the baby birth record.</param>
        /// <param name="clinicalDbContext">The ClinicalDbContext instance for accessing the database context.</param>
        /// <returns>An object indicating the success of the update operation.</returns>
        public object UpdateBirthDetails(RbacUser currentUser, BabyBirthDetails_DTO babyBirthDetails_DTO, ClinicalDbContext clinicalDbContext)
        {
            if (babyBirthDetails_DTO is null)
            {
                Log.Error($"Nothing to update as  {nameof(babyBirthDetails_DTO)} is null.");
                throw new ArgumentNullException($"{nameof(babyBirthDetails_DTO)} is null");
            }
            if (babyBirthDetails_DTO != null && babyBirthDetails_DTO.BabyBirthDetailsId == 0)
            {
                Log.Error($" {nameof(babyBirthDetails_DTO)} is not provided to update the birth details.");
                throw new ArgumentNullException($"{nameof(babyBirthDetails_DTO.BabyBirthDetailsId)} is not provided to update the birth details");
            }
            var babyBirthDetails = clinicalDbContext.BabyBirthRecord.Where(x => x.BabyBirthDetailsId == babyBirthDetails_DTO.BabyBirthDetailsId).FirstOrDefault();
            if (babyBirthDetails is null)
            {
                Log.Error($"No birth details is found for {nameof(babyBirthDetails_DTO.BabyBirthDetailsId)}");
                throw new Exception($"No birth details is found for {nameof(babyBirthDetails_DTO.BabyBirthDetailsId)}");
            }
            var fiscalYearId = clinicalDbContext.ClinicalFiscalYear
                         .Where(fsc => fsc.StartYear <= babyBirthDetails_DTO.BirthDate && fsc.EndYear >= babyBirthDetails_DTO.BirthDate)
                        .Select(fsc => fsc.FiscalYearId)
                         .FirstOrDefault();
            using (var birthDetailsTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    babyBirthDetails.ModifiedOn = DateTime.Now;
                    babyBirthDetails.ModifiedBy = currentUser.EmployeeId;
                    babyBirthDetails.IsActive = true;
                    babyBirthDetails.CertificateNumber = babyBirthDetails_DTO.CertificateNumber;
                    babyBirthDetails.Gender = babyBirthDetails_DTO.Gender;
                    babyBirthDetails.FathersName = babyBirthDetails_DTO.FathersName;
                    babyBirthDetails.WeightOfBaby = babyBirthDetails_DTO.WeightOfBaby;
                    babyBirthDetails.BirthDate = babyBirthDetails_DTO.BirthDate;
                    babyBirthDetails.BirthTime = babyBirthDetails_DTO.BirthTime;
                    babyBirthDetails.BirthType = babyBirthDetails_DTO.BirthType;
                    babyBirthDetails.BirthNumberType = babyBirthDetails_DTO.BirthNumberType;
                    babyBirthDetails.BirthConditionId = babyBirthDetails_DTO.BirthConditionId;
                    babyBirthDetails.IssuedBy = babyBirthDetails_DTO.IssuedBy;
                    babyBirthDetails.CertifiedBy = babyBirthDetails_DTO.CertifiedBy;
                    babyBirthDetails.FiscalYearId = fiscalYearId;
                    clinicalDbContext.Entry(babyBirthDetails).State = EntityState.Modified;
                    clinicalDbContext.SaveChanges();
                    birthDetailsTransactionScope.Commit();
                    return new { Success = true, Message = "birthDetails Updated successfully." };
                }
                catch (SqlException sqlEx)
                {
                    birthDetailsTransactionScope.Rollback();
                    Log.Error($"A SQL error occurred while Updating a new birth Details: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while Updating a new birth Details: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    birthDetailsTransactionScope.Rollback();
                    Log.Error($"An error occurred while Updating a new birth Details: {ex.Message}", ex);
                    throw new Exception($"An error occurred while Updating a birth Details: {ex.Message}. Exception details: {ex}");
                }
            }
        }
        /// <summary>
        /// Retrieves a list of baby birth conditions from the database.
        /// </summary>
        /// <param name="_clinicalDbContext">The ClinicalDbContext instance for accessing the database context.</param>
        /// <returns>A list of baby birth conditions.</returns>
        public object GetBabyBirthCondition(ClinicalDbContext _clinicalDbContext)
        {
            var birthConditionList = _clinicalDbContext.BabyBirthCondition.ToList();
            return birthConditionList;
        }
        /// <summary>
        /// Retrieves a list of unique birth certificate numbers from active baby birth records in the database.
        /// </summary>
        /// <param name="_clinicalDbContext">The ClinicalDbContext instance for accessing the database context.</param>
        /// <returns>A list of unique birth certificate numbers along with corresponding baby birth details IDs.</returns>
        public object GetBirthCertificateNumbers(ClinicalDbContext _clinicalDbContext)
        {

            var birthCertificate = (from brthc in _clinicalDbContext.BabyBirthRecord
                                    where brthc.IsActive == true && brthc.CertificateNumber != null
                                    select new BirthCertificateNumber_DTO
                                    {
                                        CertificateNumber = (int)brthc.CertificateNumber,
                                        BabyBirthDetailsId = brthc.BabyBirthDetailsId
                                    }).Distinct().ToList();
            return birthCertificate;
        }

        /// <summary>
        /// Adds one or multiple baby birth details to the database.
        /// </summary>
        /// <param name="currentUser">The user currently logged in who is adding the baby birth details.</param>
        /// <param name="clinicalDbContext">The ClinicalDbContext instance for accessing the database context.</param>
        /// <param name="babyBirthDetails_DTOs">A list of BabyBirthDetails_DTO objects containing birth details to be added.</param>
        /// <returns>An object indicating the success status and a message after adding the birth details.</returns>
        public object AddBirthDetails(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<BabyBirthDetails_DTO> babyBirthDetails_DTOs)
        {
            if (babyBirthDetails_DTOs is null)
            {
                Log.Error("Nothing to save as babyBirthDetails_DTOs is null or empty.");
                throw new ArgumentNullException(nameof(babyBirthDetails_DTOs), "Nothing to save as babyBirthDetails_DTOs is null or empty.");
            }

            using (var birthDetailsTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    var babyBirthDate = babyBirthDetails_DTOs.First().BirthDate;

                    var fiscalYearId = clinicalDbContext.ClinicalFiscalYear
                        .Where(fsc => fsc.StartYear <= babyBirthDate && fsc.EndYear >= babyBirthDate)
                        .Select(fsc => fsc.FiscalYearId)
                        .FirstOrDefault();
                    foreach (var babyBirthDetails_DTO in babyBirthDetails_DTOs)
                    {
                        BabyBirthRecordModel babyBirthRecordModel = new BabyBirthRecordModel
                        {
                            PatientId = babyBirthDetails_DTO.PatientId,
                            CertificateNumber = babyBirthDetails_DTO.CertificateNumber,
                            Gender = babyBirthDetails_DTO.Gender,
                            FathersName = babyBirthDetails_DTO.FathersName,
                            WeightOfBaby = babyBirthDetails_DTO.WeightOfBaby,
                            BirthDate = babyBirthDetails_DTO.BirthDate,
                            BirthTime = babyBirthDetails_DTO.BirthTime,
                            IssuedBy = babyBirthDetails_DTO.IssuedBy,
                            CertifiedBy = babyBirthDetails_DTO.CertifiedBy,
                            BirthType = babyBirthDetails_DTO.BirthType,
                            BirthNumberType = babyBirthDetails_DTO.BirthNumberType,
                            PatientVisitId = babyBirthDetails_DTO.PatientVisitId,
                            BirthConditionId = babyBirthDetails_DTO.BirthConditionId,
                            CreatedBy = currentUser.EmployeeId,
                            CreatedOn = DateTime.Now,
                            FiscalYearId = fiscalYearId,

                            IsActive = true
                        };

                        clinicalDbContext.BabyBirthRecord.Add(babyBirthRecordModel);
                    }

                    clinicalDbContext.SaveChanges();
                    birthDetailsTransactionScope.Commit();
                    return new { Success = true, Message = "Birth Details added successfully." };
                }
                catch (SqlException sqlEx)
                {
                    birthDetailsTransactionScope.Rollback();
                    Log.Error($"A SQL error occurred while adding new Birth Details: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while adding new Birth Details: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    birthDetailsTransactionScope.Rollback();
                    Log.Error($"An error occurred while adding new Birth Details: {ex.Message}", ex);
                    throw new Exception($"An error occurred while adding new Birth Details: {ex.Message}. Exception details: {ex}");
                }
            }
        }
        /// <summary>
        /// Retrieves a list of consultant doctors for a specific patient visit from the clinical database.
        /// Filters the consultants by the specified patient visit ID and active status.
        /// Joins the consultant data with employee and department information.
        /// </summary>
        /// <param name="clinicalDbContext">The clinical database context used to access the data.</param>
        /// <param name="patientVisitId">The ID of the patient visit to fetch consultants for.</param>
        /// <returns>
        /// An object containing a list of ClinicalPatientVisitConsultantsView_DTO objects, 
        /// each representing a consultant doctor for the specified patient visit.
        /// </returns>
        public object GetPatientVisitConsultantDoctors(ClinicalDbContext clinicalDbContext, int patientVisitId)
        {
            var consultants = (from cons in clinicalDbContext.PatientVisitConsultants.Where(c => c.PatientVisitId == patientVisitId && c.IsActive == true)
                               join emp in clinicalDbContext.Employee on cons.ConsultantId equals emp.EmployeeId
                               join dep in clinicalDbContext.Departments on emp.DepartmentId equals dep.DepartmentId
                               select new ClinicalPatientVisitConsultantsView_DTO
                               {
                                   PatientVisitConsultantId = cons.PatientVisitConsultantId,
                                   PatientVisitId = cons.PatientVisitId,
                                   PatientId = cons.PatientId,
                                   VisitType = cons.VisitType,
                                   ConsultantId = cons.ConsultantId,
                                   ConsultantName = emp.FullName,
                                   DepartmentName = dep.DepartmentName,
                                   IsActive = cons.IsActive,
                                   IsChargeApplicable = cons.IsChargeApplicable,
                                   IsPrimaryConsultant = cons.IsPrimaryConsultant,
                                   PatientBedInfoId = cons.PatientBedInfoId
                               }).ToList();
            return consultants;
        }

        /// <summary>
        /// Retrieves user-specific clinical notes from the database.
        /// </summary>
        /// <param name="currentUser">The current user's information.</param>
        /// <param name="_clinicalDbContext">The clinical database context.</param>
        /// <returns>A list of clinical notes with associated fields and questions, specific to the user.</returns>
        public object GetUserWiseNotes(RbacUser currentUser, ClinicalDbContext _clinicalDbContext)
        {
            var DepartmentId = _clinicalDbContext.Employee.FirstOrDefault(p => p.EmployeeId == currentUser.EmployeeId)?.DepartmentId;

            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@EmployeeId", currentUser.EmployeeId),
                new SqlParameter("@DepartmentId",DepartmentId??0),

            };
            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable clinicalNotes = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetUserWiseNotes", paramList, _clinicalDbContext);
            var clinicalNoteList = ClinicalNoteMapVM.MapDataTableToSingleObject(clinicalNotes);


            var questions = clinicalNoteList.GroupBy(gp => new { gp.ClinicalFieldId, gp.QuestionId, gp.Question, gp.AnswerType }).Select(qt => new NoteQuestionary
            {
                ClinicalFieldId = qt.Key.ClinicalFieldId,
                QuestionId = qt.Key.QuestionId,
                Question = qt.Key.Question,
                AnswerType = qt.Key.AnswerType,
            }).ToList();

            var fields = clinicalNoteList.GroupBy(gp => new { gp.ClinicalNotesMasterId, gp.ClinicalFieldId, gp.FieldCode, gp.FieldName, gp.InputType, gp.FieldDisplayName, gp.FieldDisplaySequence, gp.SmartTemplate, gp.IsAcrossVisitAvailability,gp.IsDisplayTitle }).Select(fd => new NoteField
            {
                ClinicalNotesMasterId = fd.Key.ClinicalNotesMasterId,
                ClinicalFieldId = fd.Key.ClinicalFieldId,
                FieldCode = fd.Key.FieldCode,
                FieldName = fd.Key.FieldName,
                InputType = fd.Key.InputType,
                FieldDisplayName = fd.Key.FieldDisplayName,
                FieldDisplaySequence = fd.Key.FieldDisplaySequence,
                SmartTemplate = fd.Key.SmartTemplate,
                IsAcrossVisitAvailability = fd.Key.IsAcrossVisitAvailability,
                IsDisplayTitle=fd.Key.IsDisplayTitle,
                Questions = questions.Where(q => q.ClinicalFieldId == fd.Key.ClinicalFieldId && q.QuestionId != null).ToList()
            }).ToList();

            var notes = clinicalNoteList.GroupBy(gp => new { gp.ClinicalNotesMasterId, gp.ClinicalNotesCode, gp.ClinicalNotesName, gp.NoteDisplaySequence, gp.IsDefault }).Select(nt => new Note
            {
                ClinicalNotesMasterId = nt.Key.ClinicalNotesMasterId,
                ClinicalNotesCode = nt.Key.ClinicalNotesCode,
                ClinicalNotesName = nt.Key.ClinicalNotesName,
                NoteDisplaySequence = nt.Key.NoteDisplaySequence,
				IsDefault = nt.Key.IsDefault,
				Fields = fields.Where(f => f.ClinicalNotesMasterId == nt.Key.ClinicalNotesMasterId).OrderBy(f => f.FieldDisplaySequence).ToList()
            }).OrderBy(n => n.NoteDisplaySequence).ToList();
            return notes;

        }
        /// <summary>
        /// Retrieves a list of active internal doctors with specific roles 
        /// (Doctor, M.O, Senior MO/Hospital Director), excluding external employees.
        /// </summary>
        /// <param name="_clinicalDbContext">
        /// The clinical database context used to query the employee and employee role data.
        /// </param>
        /// <returns>
        /// A list of `EmployeeList_DTO` objects representing doctors who match the specified criteria.
        /// </returns>
        public async Task<object> GetDoctorSignatoriesListAsync(ClinicalDbContext _clinicalDbContext)
        {
            var includedRoles = new List<string>
        {
            ENUM_DoctorRoles.Doctor,
            ENUM_DoctorRoles.MO,
            ENUM_DoctorRoles.SeniorMOHospitalDirector
        };

            var roleIds = await _clinicalDbContext.EmployeeRole
                .Where(er => includedRoles.Contains(er.EmployeeRoleName))
                .Select(er => er.EmployeeRoleId)
                .ToListAsync();

            var empList = await _clinicalDbContext.Employee
                .Where(e => e.IsActive == true && e.IsExternal == false &&
                            e.EmployeeRoleId.HasValue && roleIds.Contains(e.EmployeeRoleId.Value))
                .Select(e => new EmployeeList_DTO
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeName = e.FullName,
                    MedCertificationNo = e.MedCertificationNo,
                    EmployeeRoleId = e.EmployeeRoleId.Value,
                    IsSelected = false,
                })
                .ToListAsync();

            return empList;
        }

        /// <summary>
        /// Retrieves a list of active nurses and related roles from the database.
        /// </summary>
        /// <param name="_clinicalDbContext">The clinical database context used to query the database.</param>
        /// <returns>A list of EmployeeList_DTO objects representing the active nurses and related roles.</returns>
        public async Task<object> GetNurseSignatoriesListAsync(ClinicalDbContext _clinicalDbContext)
        {
            var includedRoles = new List<string>
        {
            ENUM_NurseRoles.Nurse,
            ENUM_NurseRoles.StaffNurseIncharge,
            ENUM_NurseRoles.StaffNurse,
            ENUM_NurseRoles.SeniorStaffNurseIncharge,
            ENUM_NurseRoles.NursingOfficer,
            ENUM_NurseRoles.NursingOfficerIncharge,
            ENUM_NurseRoles.CMA,
            ENUM_NurseRoles.CMAIncharge,
            ENUM_NurseRoles.ANM,
            ENUM_NurseRoles.ANMIncharge
        };

            var roleIds = await _clinicalDbContext.EmployeeRole
                .Where(er => includedRoles.Contains(er.EmployeeRoleName))
                .Select(er => er.EmployeeRoleId)
                .ToListAsync();

            var empList = await _clinicalDbContext.Employee
                .Where(e => e.IsActive == true && e.IsExternal == false &&
                            e.EmployeeRoleId.HasValue && roleIds.Contains(e.EmployeeRoleId.Value))
                .Select(e => new EmployeeList_DTO
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeName = e.FullName,
                    EmployeeRoleId = e.EmployeeRoleId.Value
                })
                .ToListAsync();

            return empList;
        }
        /// <summary>
        /// Retrieves a list of active anaesthetists from the clinical database.
        /// This method queries the `EmployeeRole` table to find the role ID associated with "Anaesthetist". 
        /// It then retrieves a list of active employees (who are not external) with that role ID, mapping the results to `EmployeeList_DTO` objects. 
        /// <param name="_clinicalDbContext">The `ClinicalDbContext` instance used to interact with the database.</param>
        /// <returns>A list of `EmployeeList_DTO` objects representing the anaesthetists. Each object includes the employee ID, name, and role ID.</returns>
        public async Task<object> GetAnaesthetistAsync(ClinicalDbContext _clinicalDbContext)
        {
            var anaesthetistRoleId = await _clinicalDbContext.EmployeeRole
                .Where(er => er.EmployeeRoleName == "Anaesthetist")
                .Select(er => er.EmployeeRoleId)
                .FirstOrDefaultAsync();

            var empList = await _clinicalDbContext.Employee
                .Where(e => e.IsActive == true && e.IsExternal == false &&
                            e.EmployeeRoleId == anaesthetistRoleId)
                .Select(e => new EmployeeList_DTO
                {
                    EmployeeId = e.EmployeeId,
                    EmployeeName = e.FullName,
                    EmployeeRoleId = e.EmployeeRoleId.Value
                })
                .ToListAsync();

            return empList;
        }
        /// <summary>
        /// Retrieves a list of active discharge types from the clinical database. 
        /// This method queries the `DischargeType` table in the `ClinicalDbContext` and returns only those records where the `IsActive` property is `true`.
        /// <param name="_clinicalDbContext">The `ClinicalDbContext` instance used to access the database.</param>
        /// <returns>An `object` containing a list of active discharge types.</returns>
        public async Task<object> GetDischargeTypeAsync(ClinicalDbContext _clinicalDbContext)
        {
            var dischargeType = await _clinicalDbContext.DischargeType
                                        .Where(dt => dt.IsActive)
                                        .ToListAsync();
            return dischargeType;
        }


        /// <summary>
        /// Retrieves a list of all operation types from the clinical database.
        /// This method queries the `OperationTypes` table in the `ClinicalDbContext` and returns all records without filtering.
        /// <param name="_clinicalDbContext">The `ClinicalDbContext` instance used to access the database.</param>
        /// <returns>An `object` containing a list of all operation types.</returns>
        public async Task<object> GetOperationTypeAsync(ClinicalDbContext _clinicalDbContext)
        {
            var operationType = await _clinicalDbContext.OperationTypes.ToListAsync();
            return operationType;
        }
        /// <summary>
        /// Retrieves a list of all discharge condition types from the clinical database. 
        /// This method queries the `DischargeConditionTypes` table in the `ClinicalDbContext` and returns all records. 
        /// <param name="_clinicalDbContext">The `ClinicalDbContext` instance used to access the database.</param>
        /// <returns>An `object` containing a list of all discharge condition types.</returns>
        public async Task<object> GetDischargeConditionTypeAsync(ClinicalDbContext _clinicalDbContext)
        {
            var dischargeConditionType = await _clinicalDbContext.DischargeConditionTypes.ToListAsync();
            return dischargeConditionType;
        }
        /// <summary>
        /// Adds or updates discharge information for a patient visit in the clinical database.
        /// This method checks if discharge information already exists for the specified patient visit. 
        /// If it exists and the provided DTO indicates a new record, it throws an exception. 
        /// Otherwise, it updates the existing record or adds a new one based on the provided `DischargeInformation_DTO`.
        /// <param name="currentUser">The user performing the operation, used to set the `CreatedBy` field.</param>
        /// <param name="clinicalDbContext">The `ClinicalDbContext` instance used to interact with the database.</param>
        /// <param name="dischargeInformation_DTO">The DTO containing discharge information to be added or updated.</param>
        /// <returns>An anonymous object with a `Success` flag and a `Message` indicating the result of the operation.</returns>

        public async Task<object> AddDischargeInformationAsync(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, DischargeInformation_DTO dischargeInformation_DTO)
        {
            if (dischargeInformation_DTO == null)
            {
                Log.Error($"Nothing to save as {nameof(dischargeInformation_DTO)} is null.");
                throw new ArgumentNullException(nameof(dischargeInformation_DTO), $"Nothing to save as {nameof(dischargeInformation_DTO)} is null.");
            }

            try
            {

                var existingDischargeInfo = await _clinicalDbContext.DischargeInformation
                    .FirstOrDefaultAsync(di => di.PatientVisitId == dischargeInformation_DTO.PatientVisitId && di.IsActive);

                if (existingDischargeInfo != null && dischargeInformation_DTO.DischargeInformationId == 0)
                {
                    Log.Error("Discharge information already exists for this visit and cannot add a new one.");
                    throw new Exception("Discharge information already exists for this visit and cannot add a new one.");
                }

                DischargeInformationModel dischargeInformation;

                if (existingDischargeInfo != null && dischargeInformation_DTO.DischargeInformationId > 0)
                {
                    dischargeInformation = existingDischargeInfo;
                    dischargeInformation.DischargeTypeId = dischargeInformation_DTO.DischargeTypeId;
                    dischargeInformation.SubDischargeTypeId = dischargeInformation_DTO.SubDischargeTypeId;
                    dischargeInformation.CheckdById = dischargeInformation_DTO.CheckdById;
                    dischargeInformation.DoctorInchargeId = dischargeInformation_DTO.DoctorInchargeId;
                    dischargeInformation.ResidentDrId = dischargeInformation_DTO.ResidentDrId;
                    dischargeInformation.DischargeNurseId = dischargeInformation_DTO.DischargeNurseId;
                    dischargeInformation.IsOtPatient = dischargeInformation_DTO.IsOtPatient;
                    dischargeInformation.OperationType = dischargeInformation_DTO.OperationType;
                    dischargeInformation.OperationDate = dischargeInformation_DTO.OperationDate;
                    dischargeInformation.AnaesthetistId = dischargeInformation_DTO.AnaesthetistId;

                    dischargeInformation.CreatedBy = currentUser.EmployeeId;
                    dischargeInformation.CreatedOn = DateTime.Now;

                    var consultantData = new { consultants = dischargeInformation_DTO.SelectedConsultants };
                    dischargeInformation.Consultant = JsonConvert.SerializeObject(consultantData);

                    _clinicalDbContext.DischargeInformation.AddOrUpdate(dischargeInformation);
                }
                else
                {
                    var consultantData = new { consultants = dischargeInformation_DTO.SelectedConsultants };
                    string consultantJson = JsonConvert.SerializeObject(consultantData);

                    dischargeInformation = new DischargeInformationModel
                    {
                        PatientId = dischargeInformation_DTO.PatientId,
                        PatientVisitId = dischargeInformation_DTO.PatientVisitId,
                        DischargeTypeId = dischargeInformation_DTO.DischargeTypeId,
                        SubDischargeTypeId = dischargeInformation_DTO.SubDischargeTypeId,
                        CheckdById = dischargeInformation_DTO.CheckdById,
                        DoctorInchargeId = dischargeInformation_DTO.DoctorInchargeId,
                        ResidentDrId = dischargeInformation_DTO.ResidentDrId,
                        DischargeNurseId = dischargeInformation_DTO.DischargeNurseId,
                        IsOtPatient = dischargeInformation_DTO.IsOtPatient,
                        OperationType = dischargeInformation_DTO.OperationType,
                        OperationDate = dischargeInformation_DTO.OperationDate,
                        AnaesthetistId = dischargeInformation_DTO.AnaesthetistId,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = DateTime.Now,
                        IsActive = true,
                        Consultant = consultantJson
                    };

                    _clinicalDbContext.DischargeInformation.AddOrUpdate(dischargeInformation);
                }

                await _clinicalDbContext.SaveChangesAsync();

                return new { Success = true, Message = existingDischargeInfo != null ? "Discharge information updated successfully." : "Discharge information added successfully." };
            }
            catch (SqlException sqlEx)
            {
                Log.Error($"A SQL error occurred while saving discharge information: {sqlEx.Message}", sqlEx);
                throw new Exception($"A SQL error occurred while saving discharge information: {sqlEx.Message}. Exception details: {sqlEx}");
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while saving discharge information: {ex.Message}", ex);
                throw new Exception($"An error occurred while saving discharge information: {ex.Message}. Exception details: {ex}");
            }
        }


        /// <summary>
        /// Retrieves active discharge information for a patient or specific visit based on the given parameters.
        /// Queries the `DischargeInformation` table and maps the result to a `DischargeInformation_DTO`.
        /// </summary>
        /// <param name="_clinicalDbContext">The database context for clinical data.</param>
        /// <param name="patientId">The ID of the patient.</param>
        /// <param name="patientVisitId">The ID of the patient visit.</param>
        /// <param name="isAcrossVisitAvailability">
        /// Indicates whether to fetch discharge details across all visits (`true`) or for a specific visit (`false`).
        /// </param>
        /// <returns>A `DischargeInformation_DTO` object with discharge details, or `null` if no data is found.</returns>
        public async Task<object> GetDischargeInformationAsync(ClinicalDbContext _clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
          
            if (patientVisitId <= 0 || patientId <= 0)
            {
                Log.Error($"Invalid parameters: patientVisitId: {patientVisitId}, patientId: {patientId}");
                throw new ArgumentException("Both patientVisitId and patientId must be greater than zero.");
            }
            try
            {
                var dischargeInfo = await _clinicalDbContext.DischargeInformation
                      .Where(di => di.IsActive &&
                         (isAcrossVisitAvailability ? di.PatientId == patientId : di.PatientVisitId == patientVisitId))
                      .Select(di => new DischargeInformation_DTO

                      {
                          DischargeInformationId = di.DischargeInformationId,
                          PatientId = di.PatientId,
                          PatientVisitId = di.PatientVisitId,
                          DischargeTypeId = di.DischargeTypeId,
                          SubDischargeTypeId = di.SubDischargeTypeId,
                          CheckdById = di.CheckdById,
                          DoctorInchargeId = di.DoctorInchargeId,
                          ResidentDrId = di.ResidentDrId,
                          DischargeNurseId = di.DischargeNurseId,
                          IsOtPatient = di.IsOtPatient,
                          OperationType = di.OperationType,
                          OperationDate = di.OperationDate,
                          AnaesthetistId = di.AnaesthetistId,
                          Consultant = di.Consultant
                      })
                    .FirstOrDefaultAsync();

                return dischargeInfo;
            }
            catch (SqlException sqlEx)
            {
                Log.Error($"A SQL error occurred while fetching discharge information: {sqlEx.Message}", sqlEx);
                throw new Exception($"A SQL error occurred while fetching discharge information: {sqlEx.Message}.", sqlEx);
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while fetching discharge information: {ex.Message}", ex);
                throw new Exception($"An error occurred while fetching discharge information: {ex.Message}.", ex);
            }
        }


        /// <summary>
        /// Retrieves the vitals template by template code and patient visit ID, and processes the smart printable form variables.
        /// </summary>
        /// <param name="templateCode">The code used to identify the specific vitals template.</param>
        /// <param name="patientVisitId">The ID of the patient visit for which the vitals template is to be retrieved.</param>
        /// <param name="_clinicalDbContext">The database context used for accessing clinical data.</param>
        /// <returns>Returns the processed clinical template with updated template HTML based on the provided template code and patient visit ID.</returns>
        /// <exception cref="InvalidOperationException">
        /// Thrown when the template code is null or empty, or when the patient visit ID is zero.
        /// </exception>
        /// <exception cref="Exception">Thrown when the template is not found.</exception>
        public object GetVitalsTemplateByTemplateCode(string templateCode, int patientVisitId, ClinicalDbContext _clinicalDbContext)
        {
            if (String.IsNullOrEmpty(templateCode) || patientVisitId == 0)
            {
                if (String.IsNullOrEmpty(templateCode) && patientVisitId == 0)
                {
                    Log.Error($"{nameof(templateCode)} is null & {nameof(patientVisitId)} is zero!");
                    throw new InvalidOperationException($"{nameof(templateCode)} is null & {nameof(patientVisitId)} is zero!");
                }
                else if (String.IsNullOrEmpty(templateCode))
                {
                    Log.Error($"{nameof(templateCode)} is null, unable to get template!");
                    throw new InvalidOperationException($"{nameof(templateCode)} is null, unable to get template!");
                }
                else if (patientVisitId == 0)
                {
                    Log.Error($"{nameof(patientVisitId)} is zero, unable to get SmartPrintableFormVariables!");
                    throw new InvalidOperationException($"{nameof(patientVisitId)} is zero, unable to get SmartPrintableFormVariables!");
                }
            }
            ClinicalTemplatesModel template = (from temp in _clinicalDbContext.ClinicalTemplates
                                               where temp.TemplateCode == templateCode && temp.IsActive == true
                                               select temp).FirstOrDefault();

            if (template != null)
            {
                List<SqlParameter> paramList = new List<SqlParameter>(){
            new SqlParameter("@PatientVisitId", patientVisitId),
           };
                DataTable dtSmartPrintableFormVariables = DALFunctions.GetDataTableFromStoredProc("SP_CLN_Vitals_SmartPrintableFormVariables", paramList, _clinicalDbContext);
                var smartPrintableVitalFormVariables = SmartPrintableFormVitalVariablesViewModel.MapDataTableToList(dtSmartPrintableFormVariables);

                template.TemplateHTML = BuildVitalSmartTemplate(template.TemplateHTML, smartPrintableVitalFormVariables);
                return template;
            }
            else
            {
                throw new Exception("Template Not Found.");
            }

        }

        /// <summary>
        /// Builds and updates the vitals smart template HTML by replacing placeholder values with the provided vitals data.
        /// </summary>
        /// <param name="templateHtml">The original HTML of the vitals template containing placeholders.</param>
        /// <param name="smartPrintableVitalFormVariables">A list of vitals data that will populate the template.</param>
        /// <returns>Returns the updated template HTML with vitals data inserted into the appropriate placeholders.</returns>
        public static string BuildVitalSmartTemplate(string templateHtml, List<SmartPrintableFormVitalVariablesViewModel> smartPrintableVitalFormVariables)
        {
            var stringBuilder = new StringBuilder(templateHtml);
            var tableRows = new StringBuilder();

            foreach (var vital in smartPrintableVitalFormVariables)
            {
                tableRows.Append("<tr>");
                tableRows.Append($"<td>{vital.VitalsType}</td>");
                tableRows.Append($"<td>{vital.VitalsName}</td>");
                tableRows.Append($"<td>{vital.Unit}</td>");
                tableRows.Append($"<td>{vital.VitalsGroup}</td>");
                tableRows.Append($"<td>{vital.VitalsValue}</td>");
                tableRows.Append($"<td>{vital.Remarks}</td>");
                tableRows.Append("</tr>");
            }
            stringBuilder.Replace("{VitalsTableRows}", tableRows.ToString());

            return stringBuilder.ToString();
        }
		/// <summary>
		/// Asynchronously retrieves clinical phrases based on the accessibility and ownership of the templates.
		/// </summary>
		/// <param name="currentUser">The user for whom the clinical phrases are being retrieved.</param>
		/// <param name="_clinicalDbContext">The database context for accessing clinical data.</param>
		/// <returns>A task that represents the asynchronous operation. The task result contains a list of clinical phrases.</returns>
		public async Task<object>  GetClinicalPhrases(RbacUser currentUser, ClinicalDbContext _clinicalDbContext)
        {
            var pharases = await (from template in _clinicalDbContext.ClinicalPreDefinedTemplatesModel
                                  where (template.CreatedBy == currentUser.EmployeeId
                                        || template.TemplateAccessibility.Equals(ENUM_PhrasesAccessibility.Shared))
                                        && template.IsActive
                                  select new GetClinicalPharse_DTO
								  {
									  PredefinedTemplateId = template.PredefinedTemplateId,
									  TemplateName = template.TemplateName,
									  TemplateCode = template.TemplateCode,
									  TemplateGroup = template.TemplateGroup,
									  TemplateType = template.TemplateType,
									  TemplateContent = template.TemplateContent,
								  }
                                  ).ToListAsync();
            return pharases;
        }

        /// <summary>
        /// Disables active Diagnosis for provide dignosis id's
        /// </summary>
        /// <param name="currentUser">User who does this operation</param>
        /// <param name="clinicalDbContext">The database context for accessing clinical data</param>
        /// <param name="idList">List of diagnosis id's to deactivate</param>
        /// <returns>List of deactivated diagnosis id's</returns>
	    public object DeactivateDiagnosis(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<int> idList)
        {
			if (idList == null || !idList.Any())
			{
				Log.Error($"{nameof(idList)} is null or empty!");
				throw new InvalidOperationException($"{nameof(idList)} is null or empty!");
			}

			var diagnosesToUpdate = clinicalDbContext.cln_diagnosis
							   .Where(d => idList.Contains(d.DiagnosisId) && d.IsActive)
							   .ToList();
			if (!diagnosesToUpdate.Any())
			{
				Log.Error("No active diagnoses found for the provided IDs.");
				throw new InvalidOperationException("No active diagnoses found for the provided IDs");
			}
			foreach (var diagnosis in diagnosesToUpdate)
			{
				diagnosis.IsActive = false;
			}

			clinicalDbContext.SaveChanges();
			Log.Information($"{diagnosesToUpdate.Count} diagnoses deactivated.");

			return idList;
        }


        public object GetERPatientVisits(ClinicalDbContext _clinicalDbContext, int? DoctorId, DateTime? FromDate, DateTime? ToDate,String FilterBy)
        {

            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@DoctorId", DoctorId),
                new SqlParameter("@FromDate", FromDate),
                new SqlParameter("@ToDate", ToDate),
                new SqlParameter("@FilterBy",FilterBy),

            };

            foreach (SqlParameter parameter in paramList)
            {
                if (parameter.Value == null)
                {
                    parameter.Value = DBNull.Value;
                }
            }
            DataTable emergencypatientList = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetEmergencyPatientVisits", paramList, _clinicalDbContext);

            return emergencypatientList;
        }
        public object GetWardList(RbacUser currentUser,ClinicalDbContext _clinicalDbContext)
        {
            var wards = _clinicalDbContext.Wards.Where(e => e.IsActive == true)
                               .OrderBy(e => e.WardName);
            return wards;
        }
  

        public object UpadteBloodSugar(RbacUser currentUser, ClinicalDbContext clinicalDbContext, BloodSugarModel bloodSugar)
        {
            if (bloodSugar is null)
            {
                Log.Error($"Nothing to update as  {nameof(bloodSugar)} is null.");
                throw new ArgumentNullException($"Nothing to update as{nameof(bloodSugar)} is null");
            }
            if (bloodSugar != null && bloodSugar.BloodSugarMonitoringId == 0)
            {
                Log.Error($" {nameof(bloodSugar)} is not provided to update the Patient Blood Sugar.");
                throw new ArgumentNullException($"{nameof(bloodSugar.BloodSugarMonitoringId)} is not provided to update the Patient Blood Sugar.");
            }
            var patientBloodSugar = clinicalDbContext.BloodSugar.Where(x => x.BloodSugarMonitoringId == bloodSugar.BloodSugarMonitoringId).FirstOrDefault();
            if (patientBloodSugar is null)
            {
                Log.Error($"No Patient Blood Sugar is found for {nameof(bloodSugar.BloodSugarMonitoringId)}");
                throw new InvalidOperationException($"No Patient Blood Sugar is found for {nameof(bloodSugar.BloodSugarMonitoringId)}");
            }
            using (var patientBloodSugarTransactionScope = clinicalDbContext.Database.BeginTransaction())
            {
                try
                {
                    patientBloodSugar.ModifiedOn = DateTime.Now;
                    patientBloodSugar.ModifiedBy = currentUser.EmployeeId;
                    patientBloodSugar.RbsValue = bloodSugar.RbsValue;
                    patientBloodSugar.Insulin = bloodSugar.Insulin;
                    patientBloodSugar.Remarks = bloodSugar.Remarks;
                    clinicalDbContext.Entry(patientBloodSugar).State = EntityState.Modified;
                    clinicalDbContext.SaveChanges();
                    patientBloodSugarTransactionScope.Commit();
                    return new { Success = true, Message = "Patient Blood Sugar Updated successfully." };
                }
                catch (SqlException sqlEx)
                {
                    patientBloodSugarTransactionScope.Rollback();
                    Log.Error($"A SQL error occurred while Updating a new Patient  Blood Sugar: {sqlEx.Message}", sqlEx);
                    throw new Exception($"A SQL error occurred while Updating a new Patient  Blood Sugar: {sqlEx.Message}. Exception details: {sqlEx}");
                }
                catch (Exception ex)
                {
                    patientBloodSugarTransactionScope.Rollback();
                    Log.Error($"An error occurred while Updating a new Patient  Blood Sugar: {ex.Message}", ex);
                    throw new Exception($"An error occurred while Updating a new Patient  Blood Sugar: {ex.Message}. Exception details: {ex}");
                }
            }
        }

        public object DeactivatePatientBloodSugar(RbacUser currentUser, int BloodSugarMonitoringId, ClinicalDbContext _clinicalDbContext)
        {
            if (BloodSugarMonitoringId == 0)
            {
                Log.Error($"{nameof(BloodSugarMonitoringId)} is not provided");
                throw new InvalidOperationException($"{nameof(BloodSugarMonitoringId)} is not provided");
            }

            var patientBloodSugar = _clinicalDbContext.BloodSugar.FirstOrDefault(r => r.BloodSugarMonitoringId == BloodSugarMonitoringId);

            if (patientBloodSugar == null)
            {
                Log.Error($"There is no Patient Blood Sugar to update with BloodSugarMonitoringId {BloodSugarMonitoringId}");
                throw new InvalidOperationException($"There is no Patient  Blood Sugar to update with BloodSugarMonitoringId {BloodSugarMonitoringId}");
            }

            try
            {
                patientBloodSugar.IsActive = false;
                patientBloodSugar.ModifiedBy = currentUser.EmployeeId;
                patientBloodSugar.ModifiedOn = DateTime.Now;

                _clinicalDbContext.Entry(patientBloodSugar).State = EntityState.Modified;
                _clinicalDbContext.SaveChanges();

                return patientBloodSugar;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Deactivate the Patient Blood Sugar: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while  Deactivate the Patient Blood Sugar.{ex.Message}");
            }
        }


        public object DeactivatePatientAllergy(RbacUser currentUser, int patientId, int patientAllergyId, ClinicalDbContext _clinicalDbContext)
        {
            if (patientAllergyId == 0)
            {
                Log.Error($"{nameof(patientAllergyId)} is not provided");
                throw new InvalidOperationException($"{nameof(patientAllergyId)} is not provided");
            }

            var patientAllergy = _clinicalDbContext.Allergy.FirstOrDefault(r => r.PatientAllergyId == patientAllergyId && r.PatientId == patientId);

            if (patientAllergy == null)
            {
                Log.Error($"There is no Patient Allergy to update with PatientAllergyId {patientAllergyId}");
                throw new InvalidOperationException($"There is no Patient Allergy to update with PatientAllergyId {patientAllergyId}");
            }

            try
            {
                patientAllergy.IsActive = false;
                patientAllergy.ModifiedBy = currentUser.EmployeeId;
                patientAllergy.ModifiedOn = DateTime.Now;

                _clinicalDbContext.Entry(patientAllergy).State = EntityState.Modified;
                _clinicalDbContext.SaveChanges();

                return patientAllergy;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Deactivate the Patient Allergy: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while  Deactivate the Patient Allergy.{ex.Message}");
            }
        }


        public object PutIntakeOutput(RbacUser currentUser, PostIntakeOutput_DTO PutInputOutputData, ClinicalDbContext _clinicalDbContext)
        {
            if (PutInputOutputData == null)
            {
                Log.Error($"Nothing to update as  {nameof(PutInputOutputData)} is null.");
                throw new ArgumentNullException($"Nothing to update as{nameof(PutInputOutputData)} is null");
            }
            if (PutInputOutputData != null && PutInputOutputData.InputOutputId == 0)
            {
                Log.Error($" {nameof(PutInputOutputData)} is not provided to update the Patient Intake/Output.");
                throw new ArgumentNullException($"{nameof(PutInputOutputData.InputOutputId)} is not provided to update the Patient Intake/Output");
            }
            var intakeOutput = _clinicalDbContext.InputOutput.Where(x => x.InputOutputId == PutInputOutputData.InputOutputId && x.PatientVisitId == PutInputOutputData.PatientVisitId).FirstOrDefault();

            intakeOutput.ModifiedOn = DateTime.Now;
            intakeOutput.ModifiedBy = currentUser.EmployeeId;
            intakeOutput.IsActive = true;
            intakeOutput.Unit = PutInputOutputData.Unit;
            intakeOutput.Remarks = PutInputOutputData.Remarks;
            intakeOutput.IntakeOutputType = PutInputOutputData.IntakeOutputType;
            intakeOutput.InputOutputParameterMainId = PutInputOutputData.InputOutputParameterMainId;
            intakeOutput.IntakeOutputValue = PutInputOutputData.IntakeOutputValue;
            intakeOutput.Contents = PutInputOutputData.Contents;
            _clinicalDbContext.Entry(intakeOutput).State = EntityState.Modified;
            _clinicalDbContext.SaveChanges();
            return intakeOutput;
        }
        public object DeactivatePatientIntakeOutput(RbacUser currentUser, int inputOutputId, ClinicalDbContext _clinicalDbContext)
        {
            if (inputOutputId == 0)
            {
                Log.Error($"{nameof(inputOutputId)} is not provided");
                throw new InvalidOperationException($"{nameof(inputOutputId)} is not provided");
            }

            var patientInputoutput = _clinicalDbContext.InputOutput.FirstOrDefault(r => r.InputOutputId == inputOutputId);

            if (patientInputoutput == null)
            {
                Log.Error($"There is no Patient Intake/Output to update with inputOutputId {inputOutputId}");
                throw new InvalidOperationException($"There is no Patient Intake/Output to update with inputOutputId {inputOutputId}");
            }

            try
            {
                patientInputoutput.IsActive = false;
                patientInputoutput.ModifiedBy = currentUser.EmployeeId;
                patientInputoutput.ModifiedOn = DateTime.Now;

                _clinicalDbContext.Entry(patientInputoutput).State = EntityState.Modified;
                _clinicalDbContext.SaveChanges();

                return patientInputoutput;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Deactivate the Patient Intake/Output: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while  Deactivate the Patient Intake/Output.{ex.Message}");
            }
        }

        public object CancelRequestedItem(RbacUser currentUser,int PatientId, int PatientVisitId,int RequisitionId,string Type,ClinicalDbContext clinicalDbContext)
        {
            try
            {
                if (PatientId <= 0 || PatientVisitId <= 0 || RequisitionId <= 0 || string.IsNullOrWhiteSpace(Type))
                {
                    Log.Error($"Invalid input. PatientId: {PatientId}, PatientVisitId: {PatientVisitId}, RequisitionId: {RequisitionId}, Type: {Type}");
                    throw new InvalidOperationException($"Invalid input. PatientId: {PatientId}, PatientVisitId: {PatientVisitId}, RequisitionId: {RequisitionId}, Type: {Type}");
                }

                int? billingTransactionItemId = null;

                if (Type.ToUpper() == ENUM_IntegrationNames.LAB)
                {
                    var labRequisition = clinicalDbContext.LabRequisitions
                        .FirstOrDefault(r =>
                            r.RequisitionId == RequisitionId &&
                            r.PatientId == PatientId &&
                            r.PatientVisitId == PatientVisitId);

                    if (labRequisition != null)
                    {
                        labRequisition.IsActive = false;
                        billingTransactionItemId = labRequisition.BillingTransactionItemId;
                    }
                }
                else if (Type.ToUpper() == ENUM_IntegrationNames.Radiology)
                {
                    var radiologyRequisition = clinicalDbContext.ImagingRequisitions
                        .FirstOrDefault(r =>
                            r.ImagingRequisitionId == RequisitionId &&
                            r.PatientId == PatientId &&
                            r.PatientVisitId == PatientVisitId);

                    if (radiologyRequisition != null)
                    {
                        radiologyRequisition.IsActive = false;
                        billingTransactionItemId = radiologyRequisition.BillingTransactionItemId;
                    }
                }
                if (billingTransactionItemId.HasValue)
                {
                    var billingItem = clinicalDbContext.BillingTransactionItems
                        .FirstOrDefault(b => b.BillingTransactionItemId == billingTransactionItemId.Value);

                    if (billingItem != null)
                    {
                        billingItem.BillStatus = ENUM_BillingStatus.cancel;
                        billingItem.CancelledBy = currentUser.EmployeeId;
                        billingItem.CancelledOn = DateTime.Now;
                        clinicalDbContext.SaveChanges();
                        return new { Message = "Successfully cancelled.", RequisitionId };
                    }
                }
                return new { Status = ENUM_DanpheHttpResponseText.Failed, Message = "Requisition not found or failed to cancel.", RequisitionId };
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while cancelling the requisition. Exception: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while cancelling the requisition: {ex.Message}");
            }
        }


    }

}






