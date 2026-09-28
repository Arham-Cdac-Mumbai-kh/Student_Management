    package com.Student.Management.entity;

    import com.fasterxml.jackson.annotation.JsonIgnore;
    import jakarta.persistence.*;

    import java.util.List;

    @Entity
    public class Course {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String courseName;

        private String duration;

        @ManyToMany(mappedBy = "courses")
        @JsonIgnore
        private List<Student> students;

        public Course() {
        }

        public Long getId() {
            return id;
        }

        public String getCourseName() {
            return courseName;
        }

        public void setCourseName(String courseName) {
            this.courseName = courseName;
        }

        public String getDuration() {
            return duration;
        }

        public void setDuration(String duration) {
            this.duration = duration;
        }
    }