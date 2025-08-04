#!/usr/bin/env python3
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import SchoolData, TeacherData
from django.db import models

def check_lp_data():
    """Check the actual LP data values in the database"""
    
    print("=== LP Data Format Check ===\n")
    
    # Check SchoolData avg_lp_ratio values
    print("SchoolData avg_lp_ratio values (first 10 records):")
    print("-" * 60)
    school_data = SchoolData.objects.all()[:10]
    for school in school_data:
        print(f"School: {school.school_name}")
        print(f"Sector: {school.sector}")
        print(f"avg_lp_ratio: {school.avg_lp_ratio} (type: {type(school.avg_lp_ratio)})")
        print(f"avg_lp_ratio * 100: {school.avg_lp_ratio * 100}")
        print("-" * 30)
    
    # Check TeacherData lp_ratio values
    print("\nTeacherData lp_ratio values (first 10 records):")
    print("-" * 60)
    teacher_data = TeacherData.objects.all()[:10]
    for teacher in teacher_data:
        print(f"Teacher: {teacher.teacher}")
        print(f"School: {teacher.school}")
        print(f"lp_ratio: {teacher.lp_ratio} (type: {type(teacher.lp_ratio)})")
        print(f"lp_ratio * 100: {teacher.lp_ratio * 100}")
        print("-" * 30)
    
    # Check sector averages
    print("\nSector averages from SchoolData:")
    print("-" * 60)
    sectors = SchoolData.objects.values_list('sector', flat=True).distinct()
    for sector in sectors:
        sector_schools = SchoolData.objects.filter(sector=sector)
        avg_lp = sector_schools.aggregate(avg=models.Avg('avg_lp_ratio'))['avg']
        print(f"Sector: {sector}")
        print(f"Average LP: {avg_lp}")
        print(f"Average LP * 100: {avg_lp * 100 if avg_lp else 0}")
        print("-" * 30)

if __name__ == "__main__":
    check_lp_data() 