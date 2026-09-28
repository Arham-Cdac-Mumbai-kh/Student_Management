package com.Student.Management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentRequestDTO {


    @NotBlank(message = "name cannot be left empty")
    @Size(min=2,max = 50 ,message = "Name must be between 2 and 50 characters")
    private  String name;


    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Email must be a valid email format")
    private  String email;

    @NotBlank(message = "Course cannot be empty")
    private String course;



}
