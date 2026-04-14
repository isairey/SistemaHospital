using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.PharmacyModels.Validators
{
    public class PHRMGoodReceiptValidator : AbstractValidator<PHRMGoodsReceiptModel>
    {
        public PHRMGoodReceiptValidator()
        {
            RuleFor(gr => gr.DiscountPercentage).GreaterThanOrEqualTo(0).WithMessage("Discount Percentage should be non negative value");
            RuleFor(gr => gr.DiscountPercentage).LessThanOrEqualTo(100).WithMessage("Discount Percentage cannot be greator than 100%");
            RuleFor(b => b.DiscountAmount)
                            .GreaterThanOrEqualTo(0)
                            .LessThanOrEqualTo(x => x.SubTotal)
                            .Must((model, discountAmount) => Math.Abs((model.SubTotal * (decimal)(model.DiscountPercentage / 100)) - discountAmount) <= (decimal)0.5)
                            .WithMessage("Calculated Discount Amount is not correct based on SubTotal and DiscountPercent");

            RuleFor(gr => gr.VATPercentage).GreaterThanOrEqualTo(0).WithMessage("VAT Percentage should be non negative value");
            RuleFor(gr => gr.VATPercentage).LessThanOrEqualTo(100).WithMessage("VAT Percentage cannot be greator than 100%");
            RuleFor(gr => gr.VATAmount)
                            .GreaterThanOrEqualTo(0)
                            .LessThanOrEqualTo(x => x.VATAmount)
                            .Must((model, vatAmount) => Math.Abs(((model.TaxableSubTotal - model.DiscountAmount) * (model.VATPercentage / 100)) - vatAmount) <= (decimal)0.5)
                            .WithMessage("Calculated VAT Amount is not correct based on VAT Percentage");

            RuleFor(gr => gr.TotalAmount)
                            .Must((model, totalAmount) => Math.Abs((model.SubTotal - (model.SubTotal * (decimal)(model.DiscountPercentage / 100))) + ((model.TaxableSubTotal - model.DiscountAmount) * (model.VATPercentage / 100)) + (decimal)model.CCAmount - totalAmount) <= (decimal)0.5)
                            .WithMessage("Calculated TotalAmount is not correct based on provided SubTotal and DiscountPercent");
            //RuleFor(gr => gr.GoodReceiptItem)
            //              .NotEmpty().WithMessage("GoodReceiptItems cannot be empty")
            //              .Custom((goodReceiptItems, context) =>
            //              {
            //                  decimal totalAmount = goodReceiptItems.Sum(item => item.TotalAmount);
            //                  var parentInstance = context.ParentContext.InstanceToValidate as PHRMGoodsReceiptModel;
            //                  if (parentInstance != null && Math.Abs(totalAmount - parentInstance.TotalAmount) > (decimal)0.5)
            //                  {
            //                      context.AddFailure("TotalAmount", $"Good Receipt TotalAmount does not match the sum of TotalAmount in GoodReceiptItems.");
            //                  }
            //              });
            //RuleFor(gr => gr.GoodReceiptItem)
            //   .Custom((goodReceiptItems, context) =>
            //   {
            //       decimal discountAmount = goodReceiptItems.Sum(item => item.DiscountAmount);
            //       var parentInstance = context.ParentContext.InstanceToValidate as PHRMGoodsReceiptModel;
            //       if (parentInstance != null && Math.Abs(discountAmount - parentInstance.DiscountAmount) > 1)
            //       {
            //           context.AddFailure("DiscountAmount", $"Good Receipt DiscountAmount does not match the sum of DiscountAmount in GoodReceiptItems.");
            //       }
            //   });
        }
    }
}
