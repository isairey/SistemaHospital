using iTextSharp.text.pdf.qrcode;
using NetBarcode;

namespace DanpheEMR.Utilities
{
    public class BarcodeQrCodeHelper
    {
        public string GenerateQrBarCode(string type, string codeValues)
        {
            string Base64Vaue = "";
            if (type == "QrCode")
            { 
              
            }
            else if (type == "BarCode")
            {
                var barCode = new Barcode(codeValues);
                Base64Vaue = barCode.GetBase64Image();
            }
            return Base64Vaue;
        }
    }
}
