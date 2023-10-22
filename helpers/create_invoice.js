const fs = require("fs");
const PDFDocument = require("pdfkit");
var currentPosition = 0;

function createInvoice(invoice, path) {
  currentPosition = 0
  let doc = new PDFDocument({ size: "A4", margin: 50});
  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

function generateHeader(doc) {
  currentPosition = 57;
  doc
    .fillColor("#8f0303")
    .fontSize(20)
    .font("fonts/NotoSans-Bold.ttf")
    .text("Saranya Traders", 50, currentPosition)
    .fontSize(10)
    .font("fonts/NotoSans-Regular.ttf")
    .fillColor("#444444")
    .text("373/37 Ponmeni Main Road", 200, currentPosition, { align: "right" });
    currentPosition = currentPosition + 13;
    doc.text("Madurai - 625010", 200, currentPosition, { align: "right" });
    currentPosition = currentPosition + 13;
    doc.text("9788156057", 200, currentPosition, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  currentPosition = currentPosition + 20;
  doc
    .fillColor("#444444")
    .fontSize(20)
    .font("fonts/NotoSans-Regular.ttf")
    .text(invoice.is_estimation? "Estimation" :"Invoice", 50, currentPosition);

  currentPosition = currentPosition + 30;
  generateHr(doc, currentPosition);
  currentPosition = currentPosition + 10;
  doc.fontSize(10);
  doc.font("fonts/NotoSans-Bold.ttf");
  const nameCellHeight = doc.heightOfString(invoice.shipping.name, { width: 300 });
  const addressCellHeight = doc.heightOfString(invoice.shipping.address, { width: 300 });
  const itemCellHeight = doc.heightOfString(invoice.shipping.phone_no, { width: 300 });

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, currentPosition)
    .font("fonts/NotoSans-Bold.ttf")
    .text(invoice.invoice_nr, 150, currentPosition)
    .font("fonts/NotoSans-Bold.ttf")
    .text(invoice.shipping.name, 300, currentPosition)
    .font("fonts/NotoSans-Regular.ttf");
    currentPosition = currentPosition + nameCellHeight + 15;
    doc
    .text("Invoice Date:", 50, currentPosition)
    .text(formatDate(new Date()), 150, currentPosition)
    .font("fonts/NotoSans-Regular.ttf")
    .text(invoice.shipping.address, 300, currentPosition);


    currentPosition = currentPosition + addressCellHeight + 15;
    doc
    .text("Total items:", 50, currentPosition)
    .text(invoice.item_count, 150, currentPosition)
    .font("fonts/NotoSans-Regular.ttf")
    .text(invoice.shipping.phone_no, 300, currentPosition)
    .moveDown();

  currentPosition = currentPosition + itemCellHeight + 20;
  generateHr(doc, currentPosition);
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  currentPosition = (currentPosition+5);
  doc.font("fonts/NotoSans-Bold.ttf");
  generateTableRow(
    doc,
    currentPosition,
    "Item",
    "Description",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  currentPosition = (currentPosition+5);
  generateHr(doc,currentPosition);
  doc.font("fonts/NotoSans-Regular.ttf");
  
  for (i = 0; i < invoice.items.length; i++) {
    currentPosition = (currentPosition+5);
    const item = invoice.items[i];
    // Check if there's enough space for the current row on the current page.
    if (currentPosition > pageHeight) {
      // Not enough space, so start a new page.
      doc.addPage();
      currentPosition = doc.page.margins.top; // Reset the top position.
      doc.font("fonts/NotoSans-Bold.ttf");
      generateTableRow(
        doc,
        currentPosition,
        "Item",
        "Description",
        "Unit Cost",
        "Quantity",
        "Line Total"
      );
      currentPosition = (currentPosition+5);
      generateHr(doc,currentPosition);
    }
    doc.font("fonts/NotoSans-Regular.ttf");

    generateTableRow(
      doc,
      currentPosition,
      item.item,
      item.description,
      formatCurrency(item.amount / item.quantity),
      item.quantity,
      formatCurrency(item.amount)
    );

    currentPosition = (currentPosition+5);
    generateHr(doc,currentPosition);
  }

  currentPosition = currentPosition + 5;
  generateTableRow(
    doc,
    currentPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );
  if(invoice.cgst!='0.00' && invoice.sgst != '0.00'){
    currentPosition = (currentPosition+5);
    generateTableRow(
      doc,
      currentPosition,
      "",
      "",
      "CGST      9%",
      "",
      formatCurrency(invoice.cgst)
    );
    currentPosition = (currentPosition+5);
    generateTableRow(
      doc,
      currentPosition,
      "",
      "",
      "SGST      9%",
      "",
      formatCurrency(invoice.sgst)
    );
  }
  currentPosition = (currentPosition+5);
  doc.font("fonts/NotoSans-Bold.ttf");
  generateTableRow(
    doc,
    currentPosition,
    "",
    "",
    "Total",
    "",
    formatCurrency(invoice.paid.toFixed(2))
  );
  currentPosition = (currentPosition+5);
  generateTableRow(
    doc,
    currentPosition,
    "",
    "",
    "(Rounded off to nearest value)",
    "",
    formatCurrency(Math.round(invoice.paid))
  );
  doc.font("fonts/NotoSans-Regular.ttf");
}

function generateFooter(doc) {
  currentPosition = currentPosition + 20;
  doc
    .fontSize(10)
    .text(
      "Thankyou for your business",
      50,
      currentPosition,
      { align: "center", width: 500, height: 50 }
    );
    currentPosition = currentPosition + 20;
  doc
    .fontSize(8)
    .text(
      "Note: This is a computer generated invoice hence no signature needed.",
      50,
      currentPosition,
      { align: "left", width: 500,height: 50 }
    );
}

function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
  doc.fontSize(10);

  // Calculate the maximum height among all cells in this row
  const maxCellHeight = Math.max(
    doc.heightOfString(item, { width: 200 }),
    doc.heightOfString(description, { width: 90 }),
    doc.heightOfString(unitCost, { width: 90 }),
    doc.heightOfString(quantity, { width: 90 }),
    doc.heightOfString(lineTotal, { width: 90 })
  );

  // Draw each cell with the dynamic height
  doc.text(item, 50, y, { width: 200, height: maxCellHeight, align: "left" });
  // doc.text(description, 150, y, { width: 90, height: maxCellHeight, align: "left" });
  doc.text(unitCost, 280, y, { width: 90, height: maxCellHeight, align: "right" });
  doc.text(quantity, 370, y, { width: 90, height: maxCellHeight, align: "right" });
  doc.text(lineTotal, 450, y, { width: 90, height: maxCellHeight, align: "right" });
  currentPosition =  currentPosition + maxCellHeight;
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "₹" + (cents);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + " / " + month + " / " + year;
}

module.exports = {
  createInvoice
};