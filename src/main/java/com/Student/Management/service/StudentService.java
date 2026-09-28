package com.Student.Management.service;

import com.Student.Management.entity.Student;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface StudentService {
    Student addStudent(Student student);
    List<Student> getAllStudent();
    Student getStudentById(Long id);
    Student updateStudent(Long id, Student student);
    void deleteStudent(Long id);
      List<Student> getStudentBycourse(String course);
}
