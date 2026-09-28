package com.Student.Management.controller;


import com.Student.Management.entity.Student;
import com.Student.Management.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Student")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/save")
    public ResponseEntity<Student> saveStudent(@RequestBody Student student) {


        Student save = studentService.addStudent(student);
        return ResponseEntity.status(201).body(save);
    }
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/getbyid/{id}")
    public ResponseEntity<Student> getByid(@PathVariable Long id) {
        Student s = studentService.getStudentById(id);
        return ResponseEntity.ok(s);


    }

    @GetMapping("/getAll")
    public ResponseEntity<List<Student>> getALL() {
        List<Student> list = studentService.getAllStudent();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable long id, @RequestBody Student student) {
        Student updatedStudent = studentService.updateStudent(id, student);
        if (updatedStudent == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedStudent);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {

        Student student = studentService.getStudentById(id);

        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        studentService.deleteStudent(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/FindByCourse")
    public ResponseEntity<List<Student>> findByCourse(
            @RequestParam String courseName) {

        List<Student> students =
                studentService.getStudentBycourse(courseName);

        return ResponseEntity.ok(students);
    }
}


