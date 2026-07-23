package com.intellcap.service;

import com.intellcap.dto.ProjectDTO;
import com.intellcap.model.Task;
import com.intellcap.model.TimeEntry;
import com.intellcap.repository.TaskRepository;
import com.intellcap.repository.TimeEntryRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;

    public byte[] generateProjectsExcel() throws IOException {
        List<ProjectDTO> projects = projectService.getAllProjects();

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Projets");
            CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = wb.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"Projet", "Progression %", "Temps consomme (h)", "Budget (h)", "Echeance"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (ProjectDTO p : projects) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getName());
                row.createCell(1).setCellValue(p.getGlobalProgress());
                row.createCell(2).setCellValue(p.getTotalTimeSpentMinutes() != null ? Math.round(p.getTotalTimeSpentMinutes() / 60.0) : 0);
                row.createCell(3).setCellValue(p.getBudgetHours() != null ? p.getBudgetHours() : 0);
                row.createCell(4).setCellValue(p.getEndDate() != null ? p.getEndDate().toString() : "-");
            }

            // Tasks sheet
            Sheet taskSheet = wb.createSheet("Taches");
            String[] taskHeaders = {"Projet", "Tache", "Assignee", "Statut", "Progression %", "Temps (h)", "Estime (h)"};
            Row taskHeaderRow = taskSheet.createRow(0);
            for (int i = 0; i < taskHeaders.length; i++) {
                Cell cell = taskHeaderRow.createCell(i);
                cell.setCellValue(taskHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            List<Task> tasks = taskRepository.findAll();
            int tRowIdx = 1;
            for (Task t : tasks) {
                long minutes = timeEntryRepository.sumMinutesByTaskId(t.getId());
                Row row = taskSheet.createRow(tRowIdx++);
                row.createCell(0).setCellValue(t.getProject().getName());
                row.createCell(1).setCellValue(t.getName());
                row.createCell(2).setCellValue(t.getAssignee() != null ? t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName() : "-");
                row.createCell(3).setCellValue(t.getStatus().name());
                row.createCell(4).setCellValue(t.getProgressPercent());
                row.createCell(5).setCellValue(Math.round(minutes / 60.0));
                row.createCell(6).setCellValue(t.getEstimatedHours() != null ? t.getEstimatedHours() : 0);
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            for (int i = 0; i < taskHeaders.length; i++) taskSheet.autoSizeColumn(i);

            wb.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateProjectsPdf() {
        List<ProjectDTO> projects = projectService.getAllProjects();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(44, 62, 80));
        Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
        Font cellFont = new Font(Font.HELVETICA, 9, Font.NORMAL);

        Paragraph title = new Paragraph("Rapport INTELLCAP — Projets", titleFont);
        title.setSpacingAfter(20);
        doc.add(title);

        doc.add(new Paragraph("Genere le " + java.time.LocalDate.now(), new Font(Font.HELVETICA, 9, Font.ITALIC)));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 1.5f, 1.5f, 1.5f, 1.5f});

        String[] headers = {"Projet", "Progression", "Temps (h)", "Budget (h)", "Echeance"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new Color(41, 128, 185));
            cell.setPadding(6);
            table.addCell(cell);
        }

        for (ProjectDTO p : projects) {
            table.addCell(new Phrase(p.getName(), cellFont));
            table.addCell(new Phrase(p.getGlobalProgress() + "%", cellFont));
            long hours = p.getTotalTimeSpentMinutes() != null ? Math.round(p.getTotalTimeSpentMinutes() / 60.0) : 0;
            table.addCell(new Phrase(hours + "h", cellFont));
            table.addCell(new Phrase((p.getBudgetHours() != null ? p.getBudgetHours() : 0) + "h", cellFont));
            table.addCell(new Phrase(p.getEndDate() != null ? p.getEndDate().toString() : "-", cellFont));
        }

        doc.add(table);

        // Tasks table
        doc.add(new Paragraph(" "));
        Paragraph taskTitle = new Paragraph("Detail des taches", new Font(Font.HELVETICA, 14, Font.BOLD));
        taskTitle.setSpacingAfter(10);
        doc.add(taskTitle);

        PdfPTable taskTable = new PdfPTable(6);
        taskTable.setWidthPercentage(100);
        taskTable.setWidths(new float[]{2f, 2f, 2f, 1.2f, 1f, 1f});

        String[] taskHeaders = {"Projet", "Tache", "Assignee", "Statut", "Progr.", "Temps (h)"};
        for (String h : taskHeaders) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new Color(41, 128, 185));
            cell.setPadding(6);
            taskTable.addCell(cell);
        }

        List<Task> tasks = taskRepository.findAll();
        for (Task t : tasks) {
            long min = timeEntryRepository.sumMinutesByTaskId(t.getId());
            taskTable.addCell(new Phrase(t.getProject().getName(), cellFont));
            taskTable.addCell(new Phrase(t.getName(), cellFont));
            taskTable.addCell(new Phrase(t.getAssignee() != null ? t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName() : "-", cellFont));
            taskTable.addCell(new Phrase(t.getStatus().name(), cellFont));
            taskTable.addCell(new Phrase(t.getProgressPercent() + "%", cellFont));
            taskTable.addCell(new Phrase(Math.round(min / 60.0) + "h", cellFont));
        }

        doc.add(taskTable);
        doc.close();

        return out.toByteArray();
    }
}
