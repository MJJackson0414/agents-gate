package com.agentsgate.api;

import com.agentsgate.dto.ApiResponse;
import com.agentsgate.dto.SkillResponse;
import com.agentsgate.dto.SkillUploadRequest;
import com.agentsgate.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/skills")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SkillResponse>>> listSkills() {
        return ResponseEntity.ok(ApiResponse.ok(skillService.listAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SkillResponse>> uploadSkill(
            @Valid @RequestBody SkillUploadRequest request) {
        SkillResponse response = skillService.uploadSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() != null
                                ? fieldError.getDefaultMessage()
                                : "無效的值",
                        (existing, replacement) -> existing
                ));
        return ResponseEntity.badRequest().body(ApiResponse.validationError(fieldErrors));
    }
}
