package com.klu.service;

import java.io.File;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.klu.model.Order;
import com.klu.model.OrderItem;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class InvoiceService {
    private static final Logger logger = LoggerFactory.getLogger(InvoiceService.class);
    private static final String INVOICE_DIR = "invoices";

    public String generateInvoice(Order order) throws Exception {
        File dir = new File(INVOICE_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String fileName = "invoice_" + order.getOrderId() + ".pdf";
        File file = new File(dir, fileName);

        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        PdfWriter.getInstance(document, new FileOutputStream(file));
        document.open();

        // Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
        Paragraph title = new Paragraph("SMARTCART - TAX INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Paragraph sub = new Paragraph("Official Payment Receipt & Commercial Invoice", subFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        sub.setSpacingAfter(20);
        document.add(sub);

        // Order Details
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

        String customerName = order.getUser() != null ? order.getUser().getName() : "Valued Customer";
        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : "N/A";
        String dateStr = order.getCreatedAt() != null ?
                order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "N/A";

        Paragraph details = new Paragraph();
        details.add(new Chunk("Invoice / Order ID: ", boldFont));
        details.add(new Chunk("#" + order.getOrderId() + "\n", normalFont));
        details.add(new Chunk("Customer Name: ", boldFont));
        details.add(new Chunk(customerName + "\n", normalFont));
        details.add(new Chunk("Customer Email: ", boldFont));
        details.add(new Chunk(customerEmail + "\n", normalFont));
        details.add(new Chunk("Order Date: ", boldFont));
        details.add(new Chunk(dateStr + "\n", normalFont));
        details.add(new Chunk("Payment Status: ", boldFont));
        details.add(new Chunk("PAID\n", normalFont));
        details.add(new Chunk("Order Status: ", boldFont));
        details.add(new Chunk(order.getStatus() + "\n\n", normalFont));
        document.add(details);

        // Table
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4f, 1.5f, 2f, 2.5f});
        table.setSpacingBefore(10);
        table.setSpacingAfter(15);

        String[] headers = {"Product", "Quantity", "Price (INR)", "Subtotal (INR)"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, boldFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(8);
            table.addCell(cell);
        }

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String prodName = item.getProduct() != null ? item.getProduct().getProductName() : "Product";
                table.addCell(new Phrase(prodName, normalFont));

                PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), normalFont));
                qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(qtyCell);

                PdfPCell priceCell = new PdfPCell(new Phrase("₹" + item.getPrice(), normalFont));
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(priceCell);

                BigDecimal subtotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                PdfPCell subCell = new PdfPCell(new Phrase("₹" + subtotal, normalFont));
                subCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(subCell);
            }
        }

        document.add(table);

        // Total
        Paragraph totalPara = new Paragraph();
        totalPara.setAlignment(Element.ALIGN_RIGHT);
        totalPara.add(new Chunk("Total Amount Paid: ₹" + order.getTotalAmount(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
        totalPara.setSpacingAfter(25);
        document.add(totalPara);

        // Footer
        Paragraph footer = new Paragraph("Thank you for shopping with SmartCart! Keep this invoice for warranty and support.", subFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        logger.info("Invoice generated successfully: {}", file.getAbsolutePath());
        return "Invoice generated: " + fileName;
    }
}
