using FluentValidation;
using System;
using System.Linq;

namespace DanpheEMR.ServerModel.BillingModels.POS.POSValidators
{
    public class BillingTransactionValidator: AbstractValidator<BillingTransactionModel>
    {
        public BillingTransactionValidator()
        {
            RuleFor(b => b.PatientId).NotNull().WithMessage("PatientId is required");
            RuleFor(b => b.DiscountPercent).GreaterThanOrEqualTo(0).WithMessage("Discount Percent should be non negative value");
            RuleFor(b => b.DiscountPercent).LessThanOrEqualTo(100).WithMessage("Discount Percent cannot be greator than 100%");
            RuleFor(b => b.DiscountAmount)
                            .GreaterThanOrEqualTo(0)
                            .LessThanOrEqualTo(x => x.SubTotal)
                            .Must((model, discountAmount) => Math.Abs((model.SubTotal * (model.DiscountPercent / 100)) - discountAmount) <= 1)
                            .WithMessage("Calculated Discount Amount is not correct based on SubTotal and DiscountPercent");
            RuleFor(b => b.TotalAmount)
                            .Must((model, totalAmount) => Math.Abs((model.SubTotal - (model.SubTotal * (model.DiscountPercent / 100))) - totalAmount) <= 1)
                            .WithMessage("Calculated TotalAmount is not correct based on provided SubTotal and DiscountPercent");
            RuleFor(b => b.BillingTransactionItems)
                          .NotEmpty().WithMessage("BillingTransactionItems cannot be empty")
                          .Custom((billingTransactionItems, context) =>
                          {
                              double totalAmount = billingTransactionItems.Sum(item => item.TotalAmount);
                              var parentInstance = context.ParentContext.InstanceToValidate as BillingTransactionModel;
                              if (parentInstance != null && Math.Abs(totalAmount - parentInstance.TotalAmount) > 1)
                              {
                                  context.AddFailure("TotalAmount", $"Invoice TotalAmount does not match the sum of TotalAmount in BillingTransactionItems.");
                              }
                          });
            RuleFor(b => b.BillingTransactionItems)
               .Custom((billingTransactionItems, context) =>
               {
                   double discountAmount = billingTransactionItems.Sum(item => item.DiscountAmount);
                   var parentInstance = context.ParentContext.InstanceToValidate as BillingTransactionModel;
                   if (parentInstance != null && Math.Abs(discountAmount - parentInstance.DiscountAmount) > 1)
                   {
                       context.AddFailure("DiscountAmount", $"Invoice DiscountAmount does not match the sum of DiscountAmount in BillingTransactionItems.");
                   }
               });
        }
    }
}
