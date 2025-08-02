#!/usr/bin/env python3
"""
Test script to check AdminDashboard API endpoints
"""

import requests
import json

# API base URL
API_BASE_URL = 'http://localhost:8000/api'

def test_admin_login():
    """Test admin login to get a token"""
    login_data = {
        'username': 'admin',
        'password': 'pass123'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=login_data)
    print(f"Admin login response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Admin login successful: {data}")
        return data.get('token')  # Changed from 'access' to 'token'
    else:
        print(f"Admin login failed: {response.text}")
        return None

def test_admin_dashboard(token):
    """Test the admin dashboard endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test without filters
    response = requests.get(f'{API_BASE_URL}/admin/dashboard/', headers=headers)
    print(f"\nAdmin dashboard response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Admin dashboard data summary:")
        print(f"- Stats: {data.get('stats', {})}")
        print(f"- Filter options: {list(data.get('filter_options', {}).keys())}")
        print(f"- Sector stats count: {len(data.get('sector_stats', []))}")
        print(f"- School stats count: {len(data.get('school_stats', []))}")
        print(f"- User activity count: {len(data.get('user_activity', []))}")
        print(f"- Recent messages count: {len(data.get('recent_messages', []))}")
        print(f"- Recent conversations count: {len(data.get('recent_conversations', []))}")
        return data
    else:
        print(f"Admin dashboard failed: {response.text}")
        return None

def test_admin_dashboard_with_filters(token):
    """Test the admin dashboard with filters"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test with filters
    filters = {
        'sector': 'Test Sector',
        'sort_by': 'school',
        'sort_order': 'asc'
    }
    
    params = '&'.join([f'{k}={v}' for k, v in filters.items()])
    response = requests.get(f'{API_BASE_URL}/admin/dashboard/?{params}', headers=headers)
    print(f"\nAdmin dashboard with filters response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Admin dashboard with filters data summary:")
        print(f"- Applied filters: {data.get('applied_filters', {})}")
        print(f"- Stats: {data.get('stats', {})}")
        return data
    else:
        print(f"Admin dashboard with filters failed: {response.text}")
        return None

def test_admin_detailed_data(token, data_type):
    """Test the admin detailed data endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(f'{API_BASE_URL}/admin/data/{data_type}/', headers=headers)
    print(f"\nAdmin detailed {data_type} data response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Admin detailed {data_type} data summary:")
        print(f"- Data count: {len(data.get('data', []))}")
        print(f"- Pagination: {data.get('pagination', {})}")
        print(f"- Filters: {data.get('filters', {})}")
        if data.get('data'):
            print(f"- Sample record: {data['data'][0]}")
        return data
    else:
        print(f"Admin detailed {data_type} data failed: {response.text}")
        return None

def test_non_admin_access():
    """Test that non-admin users cannot access admin endpoints"""
    # Create a regular user login
    login_data = {
        'username': 'principal_908',
        'password': 'JuepbRvR'
    }
    
    response = requests.post(f'{API_BASE_URL}/auth/login/', json=login_data)
    if response.status_code == 200:
        token = response.json().get('access')
        headers = {'Authorization': f'Bearer {token}'}
        
        # Try to access admin dashboard
        response = requests.get(f'{API_BASE_URL}/admin/dashboard/', headers=headers)
        print(f"\nNon-admin access test response status: {response.status_code}")
        
        if response.status_code == 403:
            print("✓ Non-admin access correctly blocked")
        else:
            print(f"✗ Non-admin access not blocked: {response.text}")
    else:
        print("Could not test non-admin access - login failed")

def main():
    print("Testing AdminDashboard API endpoints...")
    
    # Test admin login
    token = test_admin_login()
    if not token:
        print("Failed to get admin token, exiting...")
        return
    
    # Test admin dashboard
    dashboard_data = test_admin_dashboard(token)
    
    # Test admin dashboard with filters
    filtered_data = test_admin_dashboard_with_filters(token)
    
    # Test detailed data endpoints
    data_types = ['teachers', 'schools', 'conversations', 'messages', 'users']
    for data_type in data_types:
        test_admin_detailed_data(token, data_type)
    
    # Test non-admin access
    test_non_admin_access()
    
    print("\n" + "="*50)
    print("SUMMARY:")
    print(f"Admin token obtained: {'Yes' if token else 'No'}")
    print(f"Dashboard data obtained: {'Yes' if dashboard_data else 'No'}")
    print(f"Filtered data obtained: {'Yes' if filtered_data else 'No'}")
    print("Detailed data endpoints tested for:", data_types)

if __name__ == '__main__':
    main() 