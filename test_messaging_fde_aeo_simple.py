#!/usr/bin/env python3
"""
Simplified FDE and AEO Messaging Test
Tests core messaging functionality with the provided credentials
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"

# Test users with provided credentials
TEST_USERS = {
    'fde': {'username': 'fde', 'password': 'Pass@1234'},
    'aeo': {'username': 'Nilore', 'password': 'Pass@123'}
}

class SimpleFDEAEOTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def authenticate_user(self, username, password):
        """Authenticate a user and return token"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login/", json={
                'username': username,
                'password': password
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token') or data.get('access')
                if token:
                    self.token = token
                    self.session.headers.update({'Authorization': f'Bearer {token}'})
                    self.log(f"✅ Authenticated {username}")
                    return True
                else:
                    self.log(f"❌ No token received for {username}", "ERROR")
                    return False
            else:
                self.log(f"❌ Authentication failed for {username}: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication error for {username}: {e}", "ERROR")
            return False
    
    def test_principal_details(self, school_name):
        """Test getting principal details for a school"""
        try:
            response = self.session.get(f"{BASE_URL}/principals/detail/?schoolName={school_name}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Principal details for {school_name}: {data.get('username', 'Unknown')} (ID: {data.get('id', 'Unknown')})")
                return data
            else:
                self.log(f"❌ Failed to get principal details for {school_name}: {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Principal details error for {school_name}: {e}", "ERROR")
            return None
    
    def test_send_message(self, school_name, message_text, receiver_id):
        """Test sending a message"""
        try:
            response = self.session.post(f"{BASE_URL}/messages/", json={
                'school_name': school_name,
                'message_text': message_text,
                'receiverId': receiver_id
            })
            
            if response.status_code == 201:
                data = response.json()
                self.log(f"✅ Message sent successfully: {data.get('id', 'Unknown')}")
                return data
            else:
                self.log(f"❌ Failed to send message: {response.status_code} - {response.text}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Send message error: {e}", "ERROR")
            return None
    
    def test_get_conversations(self):
        """Test getting user conversations"""
        try:
            response = self.session.get(f"{BASE_URL}/conversations/")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Retrieved {len(data)} conversations")
                return data
            else:
                self.log(f"❌ Failed to get conversations: {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Get conversations error: {e}", "ERROR")
            return None
    
    def test_unread_count(self):
        """Test getting unread message count"""
        try:
            response = self.session.get(f"{BASE_URL}/messages/unread-count/")
            
            if response.status_code == 200:
                data = response.json()
                count = data.get('unread_count', 0)
                self.log(f"✅ Unread message count: {count}")
                return count
            else:
                self.log(f"❌ Failed to get unread count: {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Unread count error: {e}", "ERROR")
            return None
    
    def test_fde_user(self):
        """Test FDE user messaging"""
        self.log("\n🚀 Testing FDE User (fde / Pass@1234)")
        self.log("=" * 50)
        
        # Test 1: FDE Authentication
        if not self.authenticate_user('fde', 'Pass@1234'):
            return False
        
        # Test 2: Principal Details (using a known school)
        principal_data = self.test_principal_details("IMSG(I-X) NEW SHAKRIAL")
        if not principal_data:
            return False
        
        # Test 3: Send Message (FDE to Principal)
        message_text = f"Test message from FDE at {datetime.now().strftime('%H:%M:%S')}"
        message_result = self.test_send_message(
            "IMSG(I-X) NEW SHAKRIAL",
            message_text,
            principal_data['id']
        )
        if not message_result:
            return False
        
        # Test 4: Get Conversations
        conversations = self.test_get_conversations()
        if conversations is None:
            return False
        
        # Test 5: Unread Count
        unread_count = self.test_unread_count()
        if unread_count is None:
            return False
        
        self.log("✅ FDE messaging test completed successfully!")
        return True
    
    def test_aeo_user(self):
        """Test AEO user messaging"""
        self.log("\n🚀 Testing AEO User (Nilore / Pass@123)")
        self.log("=" * 50)
        
        # Reset session for AEO test
        self.session = requests.Session()
        self.token = None
        
        # Test 1: AEO Authentication
        if not self.authenticate_user('Nilore', 'Pass@123'):
            return False
        
        # Test 2: Principal Details (using a known school)
        principal_data = self.test_principal_details("IMSG(I-X) NEW SHAKRIAL")
        if not principal_data:
            return False
        
        # Test 3: Send Message (AEO to Principal)
        message_text = f"Test message from AEO at {datetime.now().strftime('%H:%M:%S')}"
        message_result = self.test_send_message(
            "IMSG(I-X) NEW SHAKRIAL",
            message_text,
            principal_data['id']
        )
        if not message_result:
            return False
        
        # Test 4: Get Conversations
        conversations = self.test_get_conversations()
        if conversations is None:
            return False
        
        # Test 5: Unread Count
        unread_count = self.test_unread_count()
        if unread_count is None:
            return False
        
        self.log("✅ AEO messaging test completed successfully!")
        return True
    
    def run_comprehensive_test(self):
        """Run comprehensive FDE and AEO messaging test"""
        self.log("🚀 Starting FDE and AEO Messaging System Test")
        self.log("=" * 60)
        
        # Test FDE functionality
        fde_success = self.test_fde_user()
        
        # Test AEO functionality
        aeo_success = self.test_aeo_user()
        
        if fde_success and aeo_success:
            self.log("\n✅ All FDE and AEO messaging tests completed successfully!")
            self.log("=" * 60)
            return True
        else:
            self.log("\n❌ Some tests failed!")
            self.log("=" * 60)
            return False

def main():
    """Main test function"""
    tester = SimpleFDEAEOTester()
    
    try:
        success = tester.run_comprehensive_test()
        if success:
            print("\n🎉 FDE AND AEO MESSAGING SYSTEM IS WORKING PROPERLY!")
            print("\n📊 Summary:")
            print("✅ FDE Authentication: fde / Pass@1234")
            print("✅ AEO Authentication: Nilore / Pass@123")
            print("✅ Message sending is functional")
            print("✅ Conversation management is working")
            print("✅ Principal lookup is working")
            print("✅ Unread count is working")
            print("\n🔐 Working Credentials:")
            print("   FDE: username=fde, password=Pass@1234")
            print("   AEO: username=Nilore, password=Pass@123")
        else:
            print("\n❌ FDE AND AEO MESSAGING SYSTEM HAS ISSUES!")
            print("Please check the logs above for specific problems.")
            
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with unexpected error: {e}")

if __name__ == "__main__":
    main() 