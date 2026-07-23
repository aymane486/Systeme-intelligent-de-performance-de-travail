package com.intellcap.controller;

import com.intellcap.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RESPONSABLE_TECHNIQUE', 'DIRECTION', 'ADMIN')")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel() throws Exception {
        byte[] data = exportService.generateProjectsExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport-intellcap.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf() {
        byte[] data = exportService.generateProjectsPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport-intellcap.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
