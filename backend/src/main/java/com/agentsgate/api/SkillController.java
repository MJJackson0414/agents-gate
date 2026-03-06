package com.agentsgate.api;

import com.agentsgate.domain.SkillType;
import com.agentsgate.dto.ApiResponse;
import com.agentsgate.dto.SkillDetailResponse;
import com.agentsgate.dto.SkillResponse;
import com.agentsgate.dto.SkillUploadRequest;
import com.agentsgate.service.SkillService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/skills")
public class SkillController {

        private static final Logger log = LoggerFactory.getLogger(SkillController.class);

        private final SkillService skillService;

        public SkillController(SkillService skillService) {
                this.skillService = skillService;
        }

        @GetMapping
        public ResponseEntity<ApiResponse<List<SkillResponse>>> listSkills() {
                return ResponseEntity.ok(ApiResponse.ok(skillService.listAll()));
        }

        @GetMapping("/lookup")
        public ResponseEntity<ApiResponse<SkillDetailResponse>> lookup(
                        @RequestParam String name,
                        @RequestParam SkillType type) {
                log.info("[Skill] Lookup name='{}' type={}", name, type);
                return skillService.lookupByNameAndType(name, type)
                                .map(dto -> ResponseEntity.ok(ApiResponse.ok(dto)))
                                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ApiResponse.error("找不到相同名稱的 " + type)));
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<SkillDetailResponse>> getSkill(@PathVariable UUID id) {
                return skillService.findById(id)
                                .map(skill -> ResponseEntity.ok(ApiResponse.ok(skill)))
                                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ApiResponse.error("找不到該 Skill")));
        }

        @GetMapping("/{id}/cli-package")
        public ResponseEntity<byte[]> downloadCliPackage(@PathVariable UUID id) {
                return skillService.findById(id).flatMap(skill -> skillService.getCliPackage(id).map(zipData -> {
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.parseMediaType("application/zip"));
                        headers.setContentDispositionFormData("attachment", skill.name() + ".zip");
                        return new ResponseEntity<>(zipData, headers, HttpStatus.OK);
                })).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
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
                                                (existing, replacement) -> existing));
                return ResponseEntity.badRequest().body(ApiResponse.validationError(fieldErrors));
        }
}
